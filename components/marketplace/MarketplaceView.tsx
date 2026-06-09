import React, { useMemo, useState } from 'react';
import { Download, PackagePlus, Search, Store, Trash2, Upload, X } from 'lucide-react';
import {
  CapabilityPack,
  CapabilityStatus,
  MarketCategory,
  MarketConflictStrategy,
  MarketInstallResult,
  MarketItem,
  MarketItemType,
  PromptAsset
} from '../../types';
import {
  createMarketItemFromAsset,
  createMarketItemFromPack,
  MARKET_CATEGORIES,
  MARKET_ITEM_TYPES,
  normalizeImportedMarketItem
} from '../../services/marketplace';
import { ASSET_TYPE_LABELS } from '../../services/library';
import { getPackAssetIds } from '../../services/capabilityPacks';
import { Badge, Button, EmptyState, Field, MetricCard, PageHeader, Panel, StatusPill } from '../ui/DesignSystem';

interface MarketplaceViewProps {
  assets: PromptAsset[];
  packs: CapabilityPack[];
  marketItems: MarketItem[];
  backendReady: boolean;
  backendError: string;
  onSaveMarketItem: (item: MarketItem) => void;
  onSaveMarketItems: (items: MarketItem[]) => void;
  onDeleteMarketItem: (id: string) => void;
  onInstallMarketItem: (item: MarketItem, strategy: MarketConflictStrategy) => MarketInstallResult;
}

const statusOptions: Array<CapabilityStatus | 'all'> = ['all', 'context_only', 'schema_ready', 'testable', 'connected', 'executable'];

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  assets,
  packs,
  marketItems,
  backendReady,
  backendError,
  onSaveMarketItem,
  onSaveMarketItems,
  onDeleteMarketItem,
  onInstallMarketItem
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MarketCategory | 'all'>('all');
  const [itemType, setItemType] = useState<MarketItemType | 'all'>('all');
  const [status, setStatus] = useState<CapabilityStatus | 'all'>('all');
  const [author, setAuthor] = useState('Local User');
  const [publishAssetId, setPublishAssetId] = useState(assets[0]?.id || '');
  const [publishPackId, setPublishPackId] = useState(packs[0]?.id || '');
  const [activeItemId, setActiveItemId] = useState(marketItems[0]?.id || '');
  const [conflictStrategy, setConflictStrategy] = useState<MarketConflictStrategy>('duplicate');
  const [notice, setNotice] = useState('');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return marketItems
      .filter(item => category === 'all' || item.category === category)
      .filter(item => itemType === 'all' || item.itemType === itemType)
      .filter(item => status === 'all' || item.capabilityStatus === status)
      .filter(item => {
        if (!q) return true;
        return [
          item.title,
          item.summary,
          item.author,
          item.scenario,
          item.tags.join(' '),
          item.assetTypes.join(' ')
        ].join(' ').toLowerCase().includes(q);
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [category, itemType, marketItems, query, status]);

  const activeItem = marketItems.find(item => item.id === activeItemId) || filteredItems[0] || marketItems[0];
  const publishAsset = assets.find(asset => asset.id === publishAssetId);
  const publishPack = packs.find(pack => pack.id === publishPackId);
  const assetDraft = publishAsset ? createMarketItemFromAsset(publishAsset, author) : null;
  const packDraft = publishPack ? createMarketItemFromPack(publishPack, assets, author) : null;

  const handlePublishAsset = () => {
    if (!assetDraft) return;
    onSaveMarketItem(assetDraft);
    setActiveItemId(assetDraft.id);
    setNotice(`已发布资产市场条目：${assetDraft.title}`);
  };

  const handlePublishPack = () => {
    if (!packDraft) return;
    onSaveMarketItem(packDraft);
    setActiveItemId(packDraft.id);
    setNotice(`已发布能力包市场条目：${packDraft.title}`);
  };

  const handleInstall = (item: MarketItem) => {
    const result = onInstallMarketItem(item, conflictStrategy);
    setNotice(result.message || '安装流程已完成。');
  };

  const handleExportAll = () => {
    downloadJson({ version: 1, kind: 'market-items', items: marketItems }, `market-items-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleExportOne = (item: MarketItem) => {
    downloadJson({ version: 1, kind: 'market-item', item }, `market-item-${safeName(item.title)}.json`);
  };

  const handleImport = async (files: FileList | null) => {
    if (!files?.length) return;
    const imported: MarketItem[] = [];
    for (const file of Array.from(files)) {
      const parsed = JSON.parse(await file.text());
      if (Array.isArray(parsed.items)) imported.push(...parsed.items.map(normalizeImportedMarketItem));
      else if (Array.isArray(parsed.marketItems)) imported.push(...parsed.marketItems.map(normalizeImportedMarketItem));
      else if (parsed.item) imported.push(normalizeImportedMarketItem(parsed.item));
      else if (parsed.title || parsed.payload) imported.push(normalizeImportedMarketItem(parsed));
    }
    onSaveMarketItems(imported);
    if (imported[0]) setActiveItemId(imported[0].id);
    setNotice(`已导入 ${imported.length} 个市场条目。`);
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 custom-scrollbar">
      <PageHeader
        eyebrow="Marketplace"
        title="市场"
        description="本阶段是本地市场模式：你可以发布、浏览、安装和导出资产/能力包，但不会连接远程账号、审核、支付或真实执行工具。"
        actions={
          <>
            <StatusPill status={backendReady ? 'schema_ready' : 'preview_only'} />
            <input id="market-import" type="file" className="hidden" multiple accept=".json,application/json" onChange={(event) => handleImport(event.target.files)} />
            <label htmlFor="market-import" className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800">
              <Upload size={16} /> 导入
            </label>
            <Button onClick={handleExportAll} disabled={marketItems.length === 0} icon={<Download size={16} />}>导出市场</Button>
          </>
        }
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 lg:p-5 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="space-y-4">
          {notice && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-teal-900/60 bg-teal-950/30 px-3 py-2 text-xs text-teal-100">
              <span>{notice}</span>
              <button onClick={() => setNotice('')}><X size={14} /></button>
            </div>
          )}

          <Panel title="本地市场状态" eyebrow="Mode" icon={<Store size={16} className="text-zinc-400" />}>
            <div className="space-y-2 text-xs leading-relaxed text-zinc-500">
              <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
                {backendReady ? '后端 JSON state 已启用，marketItems 会持久化到本地数据文件。' : `当前使用 localStorage 缓存兜底：${backendError || '后端不可用'}`}
              </div>
              <div className="rounded-md border border-amber-900/60 bg-amber-950/15 p-3 text-amber-100/80">
                市场下载的 MCP/SDK/Tool/Connector 默认只是上下文资产，不会自动获得执行权限。
              </div>
            </div>
          </Panel>

          <Panel title="筛选" eyebrow="Browse" icon={<Search size={16} className="text-zinc-400" />}>
            <div className="space-y-3">
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="field-input" placeholder="搜索标题、作者、标签、场景..." />
              <select value={category} onChange={(event) => setCategory(event.target.value as MarketCategory | 'all')} className="field-input">
                {MARKET_CATEGORIES.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
              <select value={itemType} onChange={(event) => setItemType(event.target.value as MarketItemType | 'all')} className="field-input">
                {MARKET_ITEM_TYPES.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
              <select value={status} onChange={(event) => setStatus(event.target.value as CapabilityStatus | 'all')} className="field-input">
                {statusOptions.map(option => <option key={option} value={option}>{option === 'all' ? '全部能力状态' : option}</option>)}
              </select>
            </div>
          </Panel>

          <Panel title="上传到市场" eyebrow="Publish">
            <div className="space-y-4">
              <Field label="作者">
                <input value={author} onChange={(event) => setAuthor(event.target.value)} className="field-input" />
              </Field>
              <Field label="发布资产">
                <select value={publishAssetId} onChange={(event) => setPublishAssetId(event.target.value)} className="field-input">
                  <option value="">选择资产...</option>
                  {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.title || '未命名资产'} · {ASSET_TYPE_LABELS[asset.type]}</option>)}
                </select>
              </Field>
              {assetDraft && <SafetyPreview notes={assetDraft.safetyNotes} />}
              <Button onClick={handlePublishAsset} disabled={!assetDraft} icon={<PackagePlus size={16} />}>发布资产</Button>

              <div className="border-t border-zinc-900 pt-4">
                <Field label="发布能力包">
                  <select value={publishPackId} onChange={(event) => setPublishPackId(event.target.value)} className="field-input">
                    <option value="">选择能力包...</option>
                    {packs.map(pack => <option key={pack.id} value={pack.id}>{pack.name} · {getPackAssetIds(pack).length} assets</option>)}
                  </select>
                </Field>
                {packDraft && <SafetyPreview notes={packDraft.safetyNotes} />}
                <Button className="mt-3" onClick={handlePublishPack} disabled={!packDraft} icon={<PackagePlus size={16} />}>发布能力包</Button>
              </div>
            </div>
          </Panel>
        </aside>

        <main className="min-w-0 space-y-4">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="市场条目" value={`${marketItems.length}`} detail="local marketItems" />
            <MetricCard label="筛选结果" value={`${filteredItems.length}`} detail="当前可见" />
            <MetricCard label="能力包" value={`${marketItems.filter(item => item.itemType === 'capability_pack').length}`} detail="pack snapshots" />
            <MetricCard label="下载量" value={`${marketItems.reduce((sum, item) => sum + (item.downloads || 0), 0)}`} detail="local count" />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <Panel title="市场条目" eyebrow="Items" actions={<Badge tone="neutral">{filteredItems.length}</Badge>}>
              {filteredItems.length === 0 ? (
                <EmptyState title="没有市场条目" description="调整筛选，或先从本地资产/能力包发布一个条目。" />
              ) : (
                <div className="max-h-[720px] space-y-2 overflow-auto pr-1 custom-scrollbar">
                  {filteredItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveItemId(item.id)}
                      className={`w-full rounded-md border p-3 text-left transition-colors ${activeItem?.id === item.id ? 'border-teal-800 bg-teal-950/30' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-100">{item.title}</div>
                          <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{item.summary}</p>
                        </div>
                        <StatusPill status={item.capabilityStatus} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Badge tone="neutral">{item.itemType === 'capability_pack' ? '能力包' : '资产'}</Badge>
                        {item.assetTypes.slice(0, 3).map(type => <Badge key={type} tone="muted">{ASSET_TYPE_LABELS[type]}</Badge>)}
                        <Badge tone="muted">{item.downloads} downloads</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="详情与安装"
              eyebrow="Install"
              actions={activeItem && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleExportOne(activeItem)} icon={<Download size={16} />}>导出</Button>
                  <Button variant="danger" onClick={() => onDeleteMarketItem(activeItem.id)} icon={<Trash2 size={16} />}>删除</Button>
                </div>
              )}
            >
              {!activeItem ? (
                <EmptyState title="请选择市场条目" description="选择后可查看详情、安全说明和安装策略。" />
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="accent">{activeItem.category}</Badge>
                      <StatusPill status={activeItem.capabilityStatus} />
                      <Badge tone="muted">v{activeItem.version}</Badge>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-zinc-50">{activeItem.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">{activeItem.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <InfoBox label="作者" value={activeItem.author} />
                    <InfoBox label="场景" value={activeItem.scenario} />
                    <InfoBox label="评分/下载" value={`${activeItem.rating.toFixed(1)} / ${activeItem.downloads}`} />
                    <InfoBox label="包含资产" value={`${activeItem.includedAssetIds.length}`} />
                    <InfoBox label="更新时间" value={new Date(activeItem.updatedAt).toLocaleString()} />
                    <InfoBox label="类型" value={activeItem.itemType === 'capability_pack' ? '能力包' : '资产'} />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {activeItem.tags.map(tag => <Badge key={tag} tone="muted">{tag}</Badge>)}
                  </div>

                  <SafetyPreview notes={activeItem.safetyNotes} />

                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">安装策略</div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                      <select value={conflictStrategy} onChange={(event) => setConflictStrategy(event.target.value as MarketConflictStrategy)} className="field-input">
                        <option value="duplicate">冲突时保留两份</option>
                        <option value="overwrite">冲突时覆盖本地</option>
                        <option value="skip">冲突时跳过</option>
                      </select>
                      <Button variant="primary" onClick={() => handleInstall(activeItem)} icon={<Download size={16} />}>下载到本地</Button>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                      安装资产会写入资产库；安装能力包会写入能力包列表，并按策略同步关联资产快照。
                    </p>
                  </div>

                  <PayloadPreview item={activeItem} />
                </div>
              )}
            </Panel>
          </section>
        </main>
      </div>
    </div>
  );
};

const SafetyPreview: React.FC<{ notes: string[] }> = ({ notes }) => (
  <div className="rounded-md border border-amber-900/60 bg-amber-950/15 p-3">
    <div className="text-xs font-semibold text-amber-100">安全检查</div>
    <div className="mt-2 space-y-1">
      {notes.map(note => <div key={note} className="text-xs leading-relaxed text-amber-100/80">- {note}</div>)}
    </div>
  </div>
);

const InfoBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">{label}</div>
    <div className="mt-1 truncate text-xs text-zinc-300">{value}</div>
  </div>
);

const PayloadPreview: React.FC<{ item: MarketItem }> = ({ item }) => {
  const asset = item.payload.asset;
  const pack = item.payload.pack;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Payload 预览</div>
      {asset && (
        <div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-3">
          <div className="text-sm font-semibold text-zinc-100">{asset.title}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge tone="neutral">{ASSET_TYPE_LABELS[asset.type]}</Badge>
            <StatusPill status={asset.status || 'context_only'} />
          </div>
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-500">{asset.summary || asset.content}</p>
        </div>
      )}
      {pack && (
        <div className="space-y-3">
          <div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-3">
            <div className="text-sm font-semibold text-zinc-100">{pack.name}</div>
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-500">{pack.summary}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {(item.payload.assets || []).slice(0, 6).map(assetItem => (
              <div key={assetItem.id} className="rounded-md border border-zinc-800 bg-zinc-950/70 p-3">
                <div className="truncate text-xs font-semibold text-zinc-200">{assetItem.title}</div>
                <Badge className="mt-2" tone="neutral">{ASSET_TYPE_LABELS[assetItem.type]}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const downloadJson = (payload: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const safeName = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') || 'item';
