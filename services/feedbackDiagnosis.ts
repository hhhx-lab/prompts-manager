import { AssetPatch, FeedbackEvent, PromptCompilation, PromptRun } from '../types';

export const diagnoseFeedback = (
  events: FeedbackEvent[],
  compilation?: PromptCompilation,
  run?: PromptRun
): AssetPatch[] => {
  const patches: AssetPatch[] = [];
  const eventLabels = events.map(event => event.label || event.type);
  const targetAssetId = compilation?.assetIds[0];

  if (hasEvent(events, 'manual_edit') || hasEventWithKeyword(events, ['表格', '格式', '结构'])) {
    patches.push(createPatch({
      targetAssetId,
      suggestedAssetType: 'template',
      reason: '用户修改或强调了输出结构，说明当前 Prompt 的输出格式约束不足。',
      evidenceEvents: eventLabels,
      fieldPath: 'schema.outputFormat',
      before: '仅描述输出要求',
      after: '补充表格字段、排序规则、必填项和空值处理',
      expectedImpact: '减少用户反复要求“用表格/更结构化”的后续修改。',
      risk: '过度固定格式可能降低开放任务的灵活性。'
    }));
  }

  if (hasEventWithKeyword(events, ['不要编造', '来源', '资料', '不确定', '删除'])) {
    patches.push(createPatch({
      targetAssetId,
      suggestedAssetType: 'policy',
      reason: '用户行为显示对事实来源和不确定性敏感，需要增强资料边界。',
      evidenceEvents: eventLabels,
      fieldPath: 'schema.rules',
      before: '未明确事实来源规则',
      after: '只基于资料输出；无法确认时标注不确定；不得编造来源、数据或工具结果',
      expectedImpact: '降低编造事实和无来源输出风险。',
      risk: '可能让输出更保守，需要配合 Reference 资产使用。'
    }));
  }

  if (hasEvent(events, 'add_attachment') || hasEventWithKeyword(events, ['每次上传', '同类资料', '重复任务'])) {
    patches.push(createPatch({
      targetAssetId,
      suggestedAssetType: 'skill',
      reason: '任务反复依赖同类资料，已经具备 Skill 化或 Parser 化特征。',
      evidenceEvents: eventLabels,
      fieldPath: 'schema.workflow',
      before: '单次 Prompt 处理',
      after: '升级为包含触发条件、资料解析、执行步骤和质量门的 Skill',
      expectedImpact: '把重复资料处理沉淀为稳定能力包。',
      risk: 'Skill 化前需要确认触发条件，避免误用于不同任务。'
    }));
  }

  if (hasEvent(events, 'regenerate') || hasEventWithKeyword(events, ['更具体', '不是这个意思', '重新生成'])) {
    patches.push(createPatch({
      targetAssetId,
      suggestedAssetType: 'evaluator',
      reason: '用户反复要求重试或更具体，说明验收标准和颗粒度要求不足。',
      evidenceEvents: eventLabels,
      fieldPath: 'schema.evaluationCriteria',
      before: '缺少可检查的质量标准',
      after: '补充完整性、可执行性、具体程度、格式合规和事实边界评分',
      expectedImpact: '让 Prompt 在输出前自检，减少无效重试。',
      risk: '评估标准过多会增加 Prompt 长度。'
    }));
  }

  if (patches.length === 0) {
    patches.push(createPatch({
      targetAssetId,
      suggestedAssetType: 'memory',
      reason: '当前反馈信号较弱，建议先记录为观察，不直接改 Prompt。',
      evidenceEvents: eventLabels.length ? eventLabels : ['暂无事件'],
      fieldPath: 'schema.qualityNotes',
      before: '未记录行为观察',
      after: run?.output ? `记录本次输出使用情况：${run.output.slice(0, 120)}` : '记录本次运行行为，等待更多证据',
      expectedImpact: '避免过早根据单次行为修改稳定资产。',
      risk: '需要更多运行数据才能形成可靠结论。'
    }));
  }

  return patches;
};

const hasEvent = (events: FeedbackEvent[], type: FeedbackEvent['type']) => events.some(event => event.type === type);

const hasEventWithKeyword = (events: FeedbackEvent[], keywords: string[]) => {
  return events.some(event => {
    const text = `${event.label} ${JSON.stringify(event.payload)}`;
    return keywords.some(keyword => text.includes(keyword));
  });
};

const createPatch = (options: {
  targetAssetId?: string;
  suggestedAssetType: AssetPatch['suggestedAssetType'];
  reason: string;
  evidenceEvents: string[];
  fieldPath: string;
  before: string;
  after: string;
  expectedImpact: string;
  risk: string;
}): AssetPatch => ({
  id: `patch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  targetAssetId: options.targetAssetId,
  suggestedAssetType: options.suggestedAssetType,
  reason: options.reason,
  evidenceEvents: options.evidenceEvents,
  changes: [
    {
      fieldPath: options.fieldPath,
      before: options.before,
      after: options.after
    }
  ],
  expectedImpact: options.expectedImpact,
  risk: options.risk,
  createdAt: Date.now()
});
