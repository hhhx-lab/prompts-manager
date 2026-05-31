import { AssetSlot, AssetType, PromptAsset } from '../types';

export const DEFAULT_ASSET_SLOTS: Omit<AssetSlot, 'assetIds' | 'warnings'>[] = [
  {
    id: 'task-frame',
    name: '任务骨架',
    description: '定义角色、任务、输出格式和基础结构。',
    acceptedTypes: ['prompt', 'template'],
    required: true
  },
  {
    id: 'work-method',
    name: '工作方法',
    description: '定义执行步骤、质量门和多轮协作方式。',
    acceptedTypes: ['skill', 'workflow', 'agent'],
    required: false
  },
  {
    id: 'knowledge',
    name: '领域上下文',
    description: '提供资料、规范、术语、长期偏好和示例。',
    acceptedTypes: ['reference', 'memory', 'dataset', 'parser'],
    required: false
  },
  {
    id: 'tooling',
    name: '工具能力',
    description: '提供 MCP、SDK、Tool、Connector 等工具上下文。',
    acceptedTypes: ['mcp', 'sdk', 'tool', 'connector'],
    required: false
  },
  {
    id: 'guardrail',
    name: '边界与评估',
    description: '定义安全规则、验收标准、回归和质量评分。',
    acceptedTypes: ['policy', 'evaluator', 'benchmark'],
    required: false
  }
];

export const buildAssetSlots = (assets: PromptAsset[], suggestedTypes: AssetType[] = []): AssetSlot[] => {
  const conflicts = analyzeAssetConflicts(assets);
  return DEFAULT_ASSET_SLOTS.map(slot => {
    const matchedAssets = assets.filter(asset => slot.acceptedTypes.includes(asset.type));
    const warnings = [];
    if (slot.required && matchedAssets.length === 0) warnings.push('建议至少选择一个 Prompt 或 Template 作为任务骨架。');
    if (suggestedTypes.some(type => slot.acceptedTypes.includes(type)) && matchedAssets.length === 0) {
      warnings.push('任务模型建议补充该类资产。');
    }
    if (matchedAssets.length > 4) warnings.push('该插槽资产较多，编译时会压缩注入。');
    warnings.push(...conflicts.filter(conflict => conflict.slotId === slot.id).map(conflict => conflict.message));
    return {
      ...slot,
      assetIds: matchedAssets.map(asset => asset.id),
      warnings
    };
  });
};

export const resolveSlotId = (type: AssetType) => {
  if (['prompt', 'template'].includes(type)) return 'task-frame';
  if (['skill', 'workflow', 'agent'].includes(type)) return 'work-method';
  if (['reference', 'memory', 'dataset', 'parser'].includes(type)) return 'knowledge';
  if (['mcp', 'sdk', 'tool', 'connector'].includes(type)) return 'tooling';
  return 'guardrail';
};

export const resolveAppliedSections = (type: AssetType) => {
  if (['prompt', 'template'].includes(type)) return ['role', 'task', 'outputFormat'];
  if (['skill', 'workflow', 'agent'].includes(type)) return ['process', 'fallback'];
  if (['reference', 'memory', 'dataset', 'parser'].includes(type)) return ['context', 'inputs'];
  if (['mcp', 'sdk', 'tool', 'connector'].includes(type)) return ['toolRules', 'constraints'];
  return ['constraints', 'evaluationCriteria'];
};

export const rankAssetsForSlots = (assets: PromptAsset[], suggestedTypes: AssetType[] = []) => {
  return [...assets].sort((a, b) => {
    const aSuggested = suggestedTypes.includes(a.type) ? 1 : 0;
    const bSuggested = suggestedTypes.includes(b.type) ? 1 : 0;
    if (aSuggested !== bSuggested) return bSuggested - aSuggested;
    return b.updatedAt - a.updatedAt;
  });
};

export const analyzeAssetConflicts = (assets: PromptAsset[]) => {
  const warnings: { slotId: string; message: string }[] = [];
  const toolAssets = assets.filter(asset => ['mcp', 'sdk', 'tool', 'connector'].includes(asset.type));
  const hasPolicy = assets.some(asset => asset.type === 'policy');
  const hasEvaluator = assets.some(asset => asset.type === 'evaluator' || asset.type === 'benchmark');
  const hasTemplate = assets.some(asset => asset.type === 'template');

  if (toolAssets.length >= 2 && !hasPolicy) {
    warnings.push({
      slotId: 'tooling',
      message: '工具上下文较多，建议补充 Policy 约束权限、数据边界和降级规则。'
    });
  }
  if (assets.some(asset => asset.type === 'workflow' || asset.type === 'agent') && !hasEvaluator) {
    warnings.push({
      slotId: 'guardrail',
      message: '多阶段执行资产建议绑定 Evaluator 或 Benchmark，避免流程不可验收。'
    });
  }
  if (assets.length >= 6 && !hasTemplate) {
    warnings.push({
      slotId: 'task-frame',
      message: '注入资产较多但缺少 Template，最终输出格式可能不稳定。'
    });
  }
  return warnings;
};
