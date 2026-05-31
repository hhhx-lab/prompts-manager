import { AssetPatch, FeedbackEvent, FeedbackInsights } from '../types';

export const buildFeedbackInsights = (events: FeedbackEvent[], patches: AssetPatch[]): FeedbackInsights => {
  const patchTypes = patches.reduce<Record<string, number>>((acc, patch) => {
    acc[patch.suggestedAssetType] = (acc[patch.suggestedAssetType] || 0) + 1;
    return acc;
  }, {});
  const text = events.map(event => `${event.type} ${event.label} ${JSON.stringify(event.payload)}`).join(' ');
  const topSignals = [
    containsAny(text, ['表格', '格式', '结构']) ? '输出格式反复被用户纠正' : '',
    containsAny(text, ['来源', '编造', '资料', '不确定']) ? '事实边界和资料来源需要加强' : '',
    events.some(event => event.type === 'regenerate') ? '用户触发重新生成，可能缺少验收标准' : '',
    events.some(event => event.type === 'add_attachment') ? '用户补充资料，任务可能需要 Parser/Skill 化' : '',
    events.some(event => event.type === 'mark_reusable') ? '用户显式表达复用意图，可沉淀为 Prompt/Template/Skill' : ''
  ].filter(Boolean);

  return {
    totalEvents: events.length,
    patchCount: patches.length,
    patchTypes,
    topSignals: topSignals.length ? topSignals : ['反馈信号较弱，建议继续观察。'],
    nextActions: buildNextActions(patches),
    riskNotes: [
      'AssetPatch 只应作为待确认建议，不能自动覆盖稳定资产。',
      '单次行为可能过拟合，建议结合多次运行和 Benchmark 证据。'
    ],
    createdAt: Date.now()
  };
};

export const mergeAssetPatches = (current: AssetPatch[], incoming: AssetPatch[]) => {
  const byId = new Map(current.map(patch => [patch.id, patch]));
  incoming.forEach(patch => byId.set(patch.id, patch));
  return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
};

const buildNextActions = (patches: AssetPatch[]) => {
  const actions = [
    patches.some(patch => patch.suggestedAssetType === 'template') ? '审查 Template 输出字段、排序规则和空值处理。' : '',
    patches.some(patch => patch.suggestedAssetType === 'policy') ? '补充 Policy：来源、不确定性、禁止编造和降级规则。' : '',
    patches.some(patch => patch.suggestedAssetType === 'skill') ? '评估是否升级为 Skill：触发条件、资料解析、执行步骤和质量门。' : '',
    patches.some(patch => patch.suggestedAssetType === 'evaluator') ? '新增 Evaluator：完整性、可执行性、事实边界和格式评分。' : '',
    patches.some(patch => patch.suggestedAssetType === 'memory') ? '先记录为 Memory，等待更多运行证据。' : ''
  ].filter(Boolean);
  return actions.length ? actions : ['继续积累反馈事件，暂不改动稳定资产。'];
};

const containsAny = (text: string, keywords: string[]) => keywords.some(keyword => text.includes(keyword));
