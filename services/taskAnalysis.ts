import { AssetType, OptimizationDirection, PromptAsset, ScenarioType, TaskModel } from '../types';

const HIGH_RISK_KEYWORDS = ['合同', '法律', '法务', '医疗', '诊断', '金融', '投资', '隐私', '密钥', '合规', '删除', '支付', '生产环境'];
const TOOL_KEYWORDS = ['工具', 'mcp', 'sdk', 'api', '接口', '调用', '自动化', '脚本', '数据库', 'github'];
const DOC_KEYWORDS = ['文档', '资料', '论文', '报告', '规范', '附件', '表格', 'excel', 'word', 'pdf'];
const WORKFLOW_KEYWORDS = ['流程', '多步', '审批', '生成报告', '批量', '持续', '迭代', '工作流', 'pipeline'];
const EVALUATION_KEYWORDS = ['评估', '打分', '验收', '测试', 'ab', 'a/b', '回归', '质量'];

export const analyzeTaskLocally = (
  rawInput: string,
  assets: PromptAsset[] = [],
  directions: OptimizationDirection[] = [],
  scenario: ScenarioType | string = ScenarioType.GENERAL
): TaskModel => {
  const input = rawInput.trim();
  const normalized = input.toLowerCase();
  const riskLevel = HIGH_RISK_KEYWORDS.some(keyword => normalized.includes(keyword.toLowerCase())) ? 'high' : input.length > 240 ? 'medium' : 'low';
  const suggestedAssetTypes = inferSuggestedAssetTypes(normalized, riskLevel);
  const goal = inferGoal(input);
  const expectedOutputs = inferExpectedOutputs(normalized, directions);
  const constraints = inferConstraints(normalized, riskLevel);
  const missingInfo = inferMissingInfo(normalized, suggestedAssetTypes);

  return {
    id: createId('task'),
    rawInput: input,
    goal,
    audience: inferAudience(normalized),
    scenario: String(scenario),
    inputMaterials: inferInputMaterials(normalized),
    expectedOutputs,
    constraints,
    risks: inferRisks(normalized, riskLevel),
    missingInfo,
    suggestedAssetTypes,
    riskLevel,
    confidence: inferConfidence(input, assets, suggestedAssetTypes, missingInfo),
    createdAt: Date.now()
  };
};

const inferGoal = (input: string) => {
  if (!input) return '把模糊需求封装为可执行提示词';
  const firstSentence = input.split(/[。！？\n]/).map(item => item.trim()).find(Boolean);
  return (firstSentence || input).slice(0, 80);
};

const inferAudience = (input: string) => {
  if (input.includes('开发') || input.includes('代码') || input.includes('api')) return '开发者或技术执行者';
  if (input.includes('团队') || input.includes('管理')) return '团队成员或项目负责人';
  if (input.includes('客户') || input.includes('用户')) return '最终用户或业务客户';
  if (input.includes('法务') || input.includes('合同')) return '业务审核人员或专业审阅者';
  return '需要借助 AI 完成任务的人';
};

const inferInputMaterials = (input: string) => {
  const materials = ['用户原始需求'];
  if (DOC_KEYWORDS.some(keyword => input.includes(keyword))) materials.push('上传资料或外部参考文档');
  if (TOOL_KEYWORDS.some(keyword => input.includes(keyword))) materials.push('工具、接口或 SDK 能力说明');
  if (input.includes('历史') || input.includes('反馈') || input.includes('迭代')) materials.push('历史版本和用户反馈行为');
  return materials;
};

const inferExpectedOutputs = (input: string, directions: OptimizationDirection[]) => {
  const outputs = ['结构化 Prompt'];
  if (input.includes('skill') || input.includes('技能')) outputs.push('Skill 草稿');
  if (input.includes('workflow') || input.includes('流程')) outputs.push('Workflow 流程草稿');
  if (TOOL_KEYWORDS.some(keyword => input.includes(keyword))) outputs.push('工具调用上下文');
  if (EVALUATION_KEYWORDS.some(keyword => input.includes(keyword))) outputs.push('评估标准和质量门');
  if (directions.some(direction => direction.id === 'evaluation')) outputs.push('验收标准');
  return Array.from(new Set(outputs));
};

const inferConstraints = (input: string, riskLevel: TaskModel['riskLevel']) => {
  const constraints = ['必须明确角色、任务、输入、约束、输出格式和验收标准'];
  if (riskLevel === 'high') constraints.push('高风险内容必须标注不确定性，并避免替代专业意见');
  if (DOC_KEYWORDS.some(keyword => input.includes(keyword))) constraints.push('只基于资料能支持的事实输出，不确定时标注证据缺口');
  if (TOOL_KEYWORDS.some(keyword => input.includes(keyword))) constraints.push('不得声称已经真实调用未连接的 MCP、SDK 或外部工具');
  constraints.push('输出应便于人工审核、修改和复用');
  return constraints;
};

const inferRisks = (input: string, riskLevel: TaskModel['riskLevel']) => {
  const risks = [];
  if (riskLevel === 'high') risks.push('可能涉及高风险业务、合规或安全边界');
  if (TOOL_KEYWORDS.some(keyword => input.includes(keyword))) risks.push('工具调用上下文可能被误解为真实执行能力');
  if (DOC_KEYWORDS.some(keyword => input.includes(keyword))) risks.push('资料不足或冲突时可能产生编造内容');
  if (risks.length === 0) risks.push('需求过于模糊时可能导致输出不可执行');
  return risks;
};

const inferMissingInfo = (input: string, suggestedTypes: AssetType[]) => {
  const missing = [];
  if (!input) missing.push('原始任务目标');
  if (!input.includes('输出') && !input.includes('格式')) missing.push('期望输出格式');
  if (!input.includes('给') && !input.includes('用户') && !input.includes('受众')) missing.push('目标受众或使用场景');
  if (suggestedTypes.includes('reference') && !input.includes('资料')) missing.push('可引用资料或事实来源');
  if (suggestedTypes.includes('evaluator') && !input.includes('验收')) missing.push('验收标准或评分维度');
  return missing.slice(0, 4);
};

const inferSuggestedAssetTypes = (input: string, riskLevel: TaskModel['riskLevel']): AssetType[] => {
  const types = new Set<AssetType>(['prompt', 'template']);
  if (DOC_KEYWORDS.some(keyword => input.includes(keyword))) {
    types.add('reference');
    types.add('parser');
  }
  if (TOOL_KEYWORDS.some(keyword => input.includes(keyword))) {
    types.add('tool');
    types.add('mcp');
    types.add('sdk');
    types.add('connector');
  }
  if (WORKFLOW_KEYWORDS.some(keyword => input.includes(keyword))) {
    types.add('workflow');
    types.add('skill');
  }
  if (EVALUATION_KEYWORDS.some(keyword => input.includes(keyword))) {
    types.add('evaluator');
    types.add('benchmark');
    types.add('dataset');
  }
  if (riskLevel === 'high') types.add('policy');
  if (input.includes('偏好') || input.includes('默认')) types.add('memory');
  return Array.from(types).slice(0, 8);
};

const inferConfidence = (input: string, assets: PromptAsset[], suggestedTypes: AssetType[], missingInfo: string[]) => {
  const lengthScore = Math.min(input.length / 240, 1) * 0.35;
  const assetScore = suggestedTypes.some(type => assets.some(asset => asset.type === type)) ? 0.25 : 0;
  const missingPenalty = Math.min(missingInfo.length * 0.08, 0.32);
  return Math.max(0.35, Math.min(0.92, 0.55 + lengthScore + assetScore - missingPenalty));
};

const createId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
