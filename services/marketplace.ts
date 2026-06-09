import {
  AssetType,
  CapabilityPack,
  CapabilityStatus,
  MarketCategory,
  MarketConflictStrategy,
  MarketInstallResult,
  MarketItem,
  PromptAsset
} from '../types';
import { getPackAssetIds, refreshCapabilityPackQuality } from './capabilityPacks';

export const MARKET_CATEGORIES: Array<{ id: MarketCategory | 'all'; label: string }> = [
  { id: 'all', label: '全部分类' },
  { id: 'prompting', label: '提示词' },
  { id: 'skill', label: 'Skill' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'tooling', label: '工具上下文' },
  { id: 'evaluation', label: '评估测试' },
  { id: 'policy', label: 'Policy' },
  { id: 'reference', label: 'Reference' },
  { id: 'productivity', label: '效率场景' },
  { id: 'local', label: '本地精选' }
];

export const MARKET_ITEM_TYPES = [
  { id: 'all', label: '全部类型' },
  { id: 'asset', label: '资产' },
  { id: 'capability_pack', label: '能力包' },
  { id: 'bundle', label: '合集' }
] as const;

const runtimeAssetTypes = new Set<AssetType>(['mcp', 'sdk', 'tool', 'connector']);

export const createMarketItemFromAsset = (asset: PromptAsset, author = 'Local User'): MarketItem => {
  const now = Date.now();
  const safetyNotes = scanSafetyText([asset.title, asset.summary, asset.content, asset.integration.usageNotes].join('\n'));
  return {
    id: createId('market'),
    itemType: 'asset',
    category: inferCategory([asset.type]),
    title: asset.title || '未命名资产',
    summary: asset.summary || asset.integration.usageNotes || '本地资产市场条目',
    author,
    scenario: asset.useCases[0] || asset.integration.entryName || '通用场景',
    tags: Array.from(new Set(['market', asset.type, ...asset.tags])).slice(0, 12),
    assetTypes: [asset.type],
    capabilityStatus: safeMarketStatus(asset.type, asset.status),
    includedAssetIds: [asset.id],
    payload: { asset },
    safetyNotes,
    downloads: 0,
    rating: estimateRating(safetyNotes, asset.qualityScore),
    version: asset.version || 1,
    source: 'local',
    createdAt: now,
    updatedAt: now
  };
};

export const createMarketItemFromPack = (pack: CapabilityPack, assets: PromptAsset[], author = 'Local User'): MarketItem => {
  const now = Date.now();
  const assetIds = getPackAssetIds(pack);
  const relatedAssets = assets.filter(asset => assetIds.includes(asset.id));
  const missingIds = assetIds.filter(id => !relatedAssets.some(asset => asset.id === id));
  const assetTypes = Array.from(new Set(relatedAssets.map(asset => asset.type)));
  const safetyNotes = [
    ...scanSafetyText([pack.name, pack.summary, pack.scenario].join('\n')),
    ...missingIds.map(id => `能力包引用的资产 ${id} 当前不在本地资产库，市场条目只会保留引用。`),
    ...relatedAssets.flatMap(asset => scanSafetyText([asset.title, asset.summary, asset.content].join('\n'))).slice(0, 8)
  ];
  return {
    id: createId('market'),
    itemType: 'capability_pack',
    category: inferCategory(assetTypes.length ? assetTypes : ['prompt']),
    title: pack.name || '未命名能力包',
    summary: pack.summary || '本地能力包市场条目',
    author,
    scenario: pack.scenario || '通用场景',
    tags: Array.from(new Set(['market', 'capability-pack', ...pack.tags])).slice(0, 12),
    assetTypes,
    capabilityStatus: relatedAssets.some(asset => runtimeAssetTypes.has(asset.type)) ? 'context_only' : 'schema_ready',
    includedAssetIds: assetIds,
    payload: { pack, assets: relatedAssets },
    safetyNotes,
    downloads: 0,
    rating: estimateRating(safetyNotes, pack.qualityScore),
    version: pack.version || 1,
    source: 'local',
    createdAt: now,
    updatedAt: now
  };
};

export const installMarketItem = (
  item: MarketItem,
  currentAssets: PromptAsset[],
  currentPacks: CapabilityPack[],
  strategy: MarketConflictStrategy
): { assets: PromptAsset[]; packs: CapabilityPack[]; item: MarketItem; result: MarketInstallResult } => {
  let nextAssets = [...currentAssets];
  let nextPacks = [...currentPacks];
  const result: MarketInstallResult = {
    ok: true,
    installedAssetIds: [],
    installedPackIds: [],
    overwrittenIds: [],
    duplicatedIds: [],
    skippedIds: [],
    warnings: [...item.safetyNotes],
    message: ''
  };

  if (item.payload.asset) {
    const applied = applyAssetSnapshot(nextAssets, item.payload.asset, strategy);
    nextAssets = applied.assets;
    mergeResult(result, applied.result);
  }

  if (item.payload.pack) {
    const idMap = new Map<string, string>();
    for (const asset of item.payload.assets || []) {
      const applied = applyAssetSnapshot(nextAssets, asset, strategy);
      nextAssets = applied.assets;
      idMap.set(asset.id, applied.finalId);
      mergeResult(result, applied.result);
    }
    const mappedPack = mapPackAssetIds(item.payload.pack, idMap);
    const appliedPack = applyPackSnapshot(nextPacks, mappedPack, strategy);
    nextPacks = appliedPack.packs;
    mergeResult(result, appliedPack.result);
  }

  const updatedItem = { ...item, downloads: (item.downloads || 0) + 1, updatedAt: Date.now() };
  result.ok = result.installedAssetIds.length + result.installedPackIds.length + result.overwrittenIds.length + result.duplicatedIds.length > 0 || result.skippedIds.length > 0;
  result.message = buildInstallMessage(result);
  return { assets: nextAssets, packs: nextPacks, item: updatedItem, result };
};

export const normalizeImportedMarketItem = (item: Partial<MarketItem>): MarketItem => {
  const now = Date.now();
  return {
    id: item.id || createId('market'),
    itemType: item.itemType || (item.payload?.pack ? 'capability_pack' : 'asset'),
    category: item.category || inferCategory(item.assetTypes || []),
    title: item.title || item.payload?.asset?.title || item.payload?.pack?.name || '导入市场条目',
    summary: item.summary || item.payload?.asset?.summary || item.payload?.pack?.summary || '',
    author: item.author || 'Imported',
    scenario: item.scenario || item.payload?.pack?.scenario || item.payload?.asset?.useCases?.[0] || '通用场景',
    tags: Array.isArray(item.tags) ? item.tags : ['market'],
    assetTypes: Array.isArray(item.assetTypes) ? item.assetTypes : inferAssetTypes(item),
    capabilityStatus: item.capabilityStatus || 'context_only',
    includedAssetIds: Array.isArray(item.includedAssetIds) ? item.includedAssetIds : [],
    payload: item.payload || {},
    safetyNotes: Array.isArray(item.safetyNotes) ? item.safetyNotes : ['导入条目需人工复核来源和权限。'],
    downloads: item.downloads || 0,
    rating: item.rating || 4.5,
    version: item.version || 1,
    source: item.source || 'import',
    createdAt: item.createdAt || now,
    updatedAt: now
  };
};

export const safeMarketStatus = (type: AssetType, status?: CapabilityStatus): CapabilityStatus => {
  if (runtimeAssetTypes.has(type)) return 'context_only';
  return status === 'executable' || status === 'connected' ? 'schema_ready' : (status || 'schema_ready');
};

export const scanSafetyText = (text: string): string[] => {
  const notes: string[] = [];
  if (/(api[_-]?key|token|secret|password|bearer\s+[a-z0-9._-]+)/i.test(text)) notes.push('检测到疑似 key/token/secret 字段，发布前请确认已脱敏。');
  if (/(sk-[a-z0-9]{12,}|ghp_[a-z0-9]{12,}|xox[baprs]-)/i.test(text)) notes.push('检测到疑似服务访问令牌格式，建议删除后再发布。');
  if (/\/Users\/|C:\\Users\\|\.env|id_rsa/i.test(text)) notes.push('检测到疑似本机路径或环境文件引用，发布前请清理私密信息。');
  return notes.length ? Array.from(new Set(notes)) : ['未发现明显密钥或本机私密路径，但仍建议人工复核。'];
};

const applyAssetSnapshot = (
  currentAssets: PromptAsset[],
  asset: PromptAsset,
  strategy: MarketConflictStrategy
): { assets: PromptAsset[]; finalId: string; result: Partial<MarketInstallResult> } => {
  const conflict = findAssetConflict(currentAssets, asset);
  const sanitized = sanitizeMarketAsset(asset);
  if (!conflict) {
    return {
      assets: [sanitized, ...currentAssets],
      finalId: sanitized.id,
      result: { installedAssetIds: [sanitized.id] }
    };
  }
  if (strategy === 'skip') {
    return { assets: currentAssets, finalId: conflict.id, result: { skippedIds: [conflict.id] } };
  }
  if (strategy === 'duplicate') {
    const duplicate = { ...sanitized, id: createId('asset'), title: `${sanitized.title}（市场副本）`, createdAt: Date.now(), updatedAt: Date.now() };
    return {
      assets: [duplicate, ...currentAssets],
      finalId: duplicate.id,
      result: { duplicatedIds: [duplicate.id] }
    };
  }
  const overwritten = { ...sanitized, id: conflict.id, title: sanitized.title || conflict.title, updatedAt: Date.now() };
  return {
    assets: currentAssets.map(assetItem => assetItem.id === conflict.id ? overwritten : assetItem),
    finalId: overwritten.id,
    result: { overwrittenIds: [overwritten.id] }
  };
};

const applyPackSnapshot = (
  currentPacks: CapabilityPack[],
  pack: CapabilityPack,
  strategy: MarketConflictStrategy
): { packs: CapabilityPack[]; result: Partial<MarketInstallResult> } => {
  const conflict = findPackConflict(currentPacks, pack);
  const sanitized = sanitizeMarketPack(pack);
  if (!conflict) {
    return { packs: [sanitized, ...currentPacks], result: { installedPackIds: [sanitized.id] } };
  }
  if (strategy === 'skip') return { packs: currentPacks, result: { skippedIds: [conflict.id] } };
  if (strategy === 'duplicate') {
    const duplicate = { ...sanitized, id: createId('pack'), name: `${sanitized.name}（市场副本）`, createdAt: Date.now(), updatedAt: Date.now() };
    return { packs: [duplicate, ...currentPacks], result: { duplicatedIds: [duplicate.id] } };
  }
  const overwritten = { ...sanitized, id: conflict.id, name: sanitized.name || conflict.name, updatedAt: Date.now() };
  return { packs: currentPacks.map(packItem => packItem.id === conflict.id ? overwritten : packItem), result: { overwrittenIds: [overwritten.id] } };
};

const sanitizeMarketAsset = (asset: PromptAsset): PromptAsset => ({
  ...asset,
  source: 'market',
  status: safeMarketStatus(asset.type, asset.status),
  updatedAt: Date.now()
});

const sanitizeMarketPack = (pack: CapabilityPack): CapabilityPack => refreshCapabilityPackQuality({
  ...pack,
  source: 'market',
  updatedAt: Date.now()
});

const mapPackAssetIds = (pack: CapabilityPack, idMap: Map<string, string>): CapabilityPack => ({
  ...pack,
  slots: pack.slots.map(slot => ({
    ...slot,
    assetIds: slot.assetIds.map(id => idMap.get(id) || id)
  }))
});

const mergeResult = (target: MarketInstallResult, patch: Partial<MarketInstallResult>) => {
  target.installedAssetIds.push(...(patch.installedAssetIds || []));
  target.installedPackIds.push(...(patch.installedPackIds || []));
  target.overwrittenIds.push(...(patch.overwrittenIds || []));
  target.duplicatedIds.push(...(patch.duplicatedIds || []));
  target.skippedIds.push(...(patch.skippedIds || []));
  target.warnings.push(...(patch.warnings || []));
};

const buildInstallMessage = (result: MarketInstallResult) => [
  result.installedAssetIds.length ? `新增资产 ${result.installedAssetIds.length} 个` : '',
  result.installedPackIds.length ? `新增能力包 ${result.installedPackIds.length} 个` : '',
  result.overwrittenIds.length ? `覆盖 ${result.overwrittenIds.length} 项` : '',
  result.duplicatedIds.length ? `保留副本 ${result.duplicatedIds.length} 项` : '',
  result.skippedIds.length ? `跳过 ${result.skippedIds.length} 项` : ''
].filter(Boolean).join('，') || '没有写入新内容。';

const findAssetConflict = (assets: PromptAsset[], asset: PromptAsset) =>
  assets.find(item => item.id === asset.id || normalizeName(item.title) === normalizeName(asset.title));

const findPackConflict = (packs: CapabilityPack[], pack: CapabilityPack) =>
  packs.find(item => item.id === pack.id || normalizeName(item.name) === normalizeName(pack.name));

const inferAssetTypes = (item: Partial<MarketItem>): AssetType[] => {
  if (item.payload?.asset?.type) return [item.payload.asset.type];
  if (Array.isArray(item.payload?.assets)) return Array.from(new Set(item.payload.assets.map(asset => asset.type)));
  return [];
};

const inferCategory = (types: AssetType[]): MarketCategory => {
  if (types.some(type => type === 'skill' || type === 'agent')) return 'skill';
  if (types.some(type => type === 'workflow')) return 'workflow';
  if (types.some(type => runtimeAssetTypes.has(type))) return 'tooling';
  if (types.some(type => type === 'evaluator' || type === 'benchmark' || type === 'dataset')) return 'evaluation';
  if (types.some(type => type === 'policy')) return 'policy';
  if (types.some(type => type === 'reference' || type === 'memory' || type === 'parser')) return 'reference';
  return 'prompting';
};

const estimateRating = (safetyNotes: string[], qualityScore?: number) => {
  const base = qualityScore ? Math.min(5, Math.max(3.5, qualityScore / 20)) : 4.6;
  const penalty = safetyNotes.some(note => /疑似|检测到/.test(note)) ? 0.4 : 0;
  return Number((base - penalty).toFixed(1));
};

const normalizeName = (value: string) => value.trim().toLowerCase();
const createId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
