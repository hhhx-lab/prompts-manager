import { AssetType, CapabilityPack, CapabilityPackSlot, CapabilityPackSlotKey, PromptAsset } from '../types';

export const CAPABILITY_PACK_SLOTS: CapabilityPackSlot[] = [
  { key: 'prompt', label: '核心 Prompt', acceptedTypes: ['prompt'], assetIds: [], role: '定义主任务和输出结构', required: true },
  { key: 'skill', label: 'Skill', acceptedTypes: ['skill', 'agent'], assetIds: [], role: '封装可复用执行方法', required: false },
  { key: 'workflow', label: 'Workflow', acceptedTypes: ['workflow'], assetIds: [], role: '拆解多阶段流程和质量门', required: false },
  { key: 'reference', label: 'Reference', acceptedTypes: ['reference', 'memory', 'parser'], assetIds: [], role: '提供事实、术语和资料上下文', required: true },
  { key: 'policy', label: 'Policy', acceptedTypes: ['policy'], assetIds: [], role: '约束安全、合规和降级边界', required: true },
  { key: 'evaluator', label: 'Evaluator', acceptedTypes: ['evaluator'], assetIds: [], role: '定义验收标准和评分维度', required: true },
  { key: 'tooling', label: 'MCP / SDK / Tool', acceptedTypes: ['mcp', 'sdk', 'tool', 'connector'], assetIds: [], role: '提供工具接口说明，仅上下文注入', required: false },
  { key: 'template', label: 'Template', acceptedTypes: ['template'], assetIds: [], role: '沉淀输出模板和变量槽位', required: false },
  { key: 'dataset', label: 'Dataset', acceptedTypes: ['dataset'], assetIds: [], role: '提供样例和反例', required: false },
  { key: 'benchmark', label: 'Benchmark', acceptedTypes: ['benchmark'], assetIds: [], role: '记录回归测试集', required: false }
];

export const createCapabilityPackDraft = (input: string, assets: PromptAsset[]): CapabilityPack => {
  const now = Date.now();
  const query = input.toLowerCase();
  const slots = CAPABILITY_PACK_SLOTS.map(slot => ({
    ...slot,
    assetIds: assets
      .filter(asset => slot.acceptedTypes.includes(asset.type))
      .filter(asset => [asset.title, asset.summary, asset.tags.join(' '), asset.useCases.join(' ')].join(' ').toLowerCase().includes(query) || slot.required)
      .slice(0, slot.required ? 2 : 1)
      .map(asset => asset.id)
  }));
  const pack: CapabilityPack = {
    id: `pack_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.trim().slice(0, 36) || '新能力包',
    summary: `围绕“${input.trim() || '通用提示词工程任务'}”组合 Prompt、Skill、Reference、Policy、Evaluator 等资产。`,
    scenario: input.trim() || '通用提示词工程场景',
    tags: ['capability-pack', ...inferPackTags(input)],
    typicalInputs: ['用户提示词内容', '参考资料', '业务约束'],
    expectedOutputs: ['优化后的提示词', '质量检查清单', '可迭代版本'],
    slots,
    missingSlots: calculateMissingSlots(slots),
    qualityScore: calculatePackQuality(slots),
    usageCount: 0,
    source: 'agent',
    version: 1,
    createdAt: now,
    updatedAt: now
  };
  return pack;
};

export const calculateMissingSlots = (slots: CapabilityPackSlot[]): CapabilityPackSlotKey[] =>
  slots.filter(slot => slot.required && slot.assetIds.length === 0).map(slot => slot.key);

export const calculatePackQuality = (slots: CapabilityPackSlot[]): number => {
  const required = slots.filter(slot => slot.required);
  const filledRequired = required.filter(slot => slot.assetIds.length > 0).length;
  const filledOptional = slots.filter(slot => !slot.required && slot.assetIds.length > 0).length;
  return Math.min(96, Math.round(35 + (filledRequired / Math.max(required.length, 1)) * 45 + filledOptional * 3));
};

export const refreshCapabilityPackQuality = (pack: CapabilityPack): CapabilityPack => {
  const missingSlots = calculateMissingSlots(pack.slots);
  return {
    ...pack,
    missingSlots,
    qualityScore: calculatePackQuality(pack.slots),
    updatedAt: Date.now()
  };
};

export const getPackAssetIds = (pack: CapabilityPack): string[] =>
  Array.from(new Set(pack.slots.flatMap(slot => slot.assetIds)));

export const exportCapabilityPack = (pack: CapabilityPack, assets: PromptAsset[]) => ({
  version: 1,
  kind: 'capability-pack',
  pack,
  assets: assets.filter(asset => getPackAssetIds(pack).includes(asset.id))
});

const inferPackTags = (input: string): string[] => {
  const tags: string[] = [];
  if (/合同|法务|合规/.test(input)) tags.push('legal');
  if (/报告|文档|资料/.test(input)) tags.push('document');
  if (/mcp|sdk|api|工具/i.test(input)) tags.push('tooling');
  if (/评估|测试|benchmark/i.test(input)) tags.push('evaluation');
  return tags;
};

export const slotAcceptsType = (slot: CapabilityPackSlot, type: AssetType) => slot.acceptedTypes.includes(type);
