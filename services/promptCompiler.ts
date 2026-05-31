import {
  CompileMode,
  OptimizationDirection,
  PromptAsset,
  PromptCompilation,
  PromptIR,
  TaskModel
} from '../types';
import { ASSET_TYPE_LABELS, formatAssetForModel } from './library';
import { resolveAppliedSections, resolveSlotId } from './assetSlots';

export const compilePrompt = (
  task: TaskModel,
  selectedAssets: PromptAsset[],
  directions: OptimizationDirection[] = [],
  mode: CompileMode = 'strict'
): PromptCompilation => {
  const promptIR = buildPromptIR(task, selectedAssets, directions, mode);
  const compiledPrompt = formatPromptIR(promptIR, mode);
  return {
    id: createId('compilation'),
    taskId: task.id,
    mode,
    promptIR,
    compiledPrompt,
    assetIds: selectedAssets.map(asset => asset.id),
    warnings: buildCompilationWarnings(task, selectedAssets, promptIR),
    createdAt: Date.now()
  };
};

export const buildPromptIR = (
  task: TaskModel,
  selectedAssets: PromptAsset[],
  directions: OptimizationDirection[] = [],
  mode: CompileMode = 'strict'
): PromptIR => {
  const assetsBySlot = groupAssetsBySlot(selectedAssets);
  const directionLines = directions.map(direction => `${direction.name}: ${direction.description}`);
  const toolAssets = assetsBySlot.tooling || [];
  const policyAssets = selectedAssets.filter(asset => asset.type === 'policy');
  const evaluatorAssets = selectedAssets.filter(asset => asset.type === 'evaluator' || asset.type === 'benchmark');

  return {
    task,
    sections: {
      role: buildRole(task, mode),
      context: [
        `任务目标: ${task.goal}`,
        `使用场景: ${task.scenario}`,
        `目标受众: ${task.audience}`,
        ...assetSummaries(selectedAssets.filter(asset => ['reference', 'memory', 'dataset'].includes(asset.type))),
        ...directionLines.map(line => `优化方向: ${line}`)
      ],
      inputs: task.inputMaterials,
      process: buildProcess(task, selectedAssets, mode),
      toolRules: toolAssets.length ? [
        '以下工具、MCP、SDK 或 Connector 仅作为可引用工程上下文；除非真实运行环境已连接，否则不得声称已经调用。',
        ...toolAssets.map(asset => `${asset.title}: ${asset.integration.capabilities.join('；') || asset.summary}`)
      ] : ['本次未注入真实工具上下文，如需要工具执行应先补充 Tool/MCP/SDK/Connector 资产。'],
      constraints: [
        ...task.constraints,
        ...policyAssets.flatMap(asset => asset.integration.constraints.length ? asset.integration.constraints : [asset.summary]).filter(Boolean)
      ],
      outputFormat: buildOutputFormat(task, selectedAssets, mode),
      evaluationCriteria: [
        ...task.expectedOutputs.map(output => `必须产出: ${output}`),
        ...evaluatorAssets.flatMap(asset => asset.integration.capabilities.length ? asset.integration.capabilities : [asset.summary]).filter(Boolean),
        '交付前检查是否覆盖目标、输入、约束、输出格式和不确定事项。'
      ],
      fallback: [
        '如果缺少会改变结果的关键信息，先列出最多 3 个澄清问题。',
        '如果资料不足，明确标注无法确认的部分，不要编造。',
        '如果工具不可用，输出降级方案和需要人工补充的信息。'
      ]
    },
    assetBindings: selectedAssets.map((asset, index) => ({
      assetId: asset.id,
      assetTitle: asset.title,
      slot: resolveSlotId(asset.type),
      appliedToSections: resolveAppliedSections(asset.type),
      priority: index + 1
    })),
    risks: task.risks,
    assumptions: task.missingInfo.length ? task.missingInfo.map(item => `待确认: ${item}`) : ['用户需求中的核心目标已足够进入初版编译。']
  };
};

export const formatPromptIR = (promptIR: PromptIR, mode: CompileMode = 'strict') => {
  const { task, sections, assetBindings, risks, assumptions } = promptIR;
  const modeLabel = {
    readable: '可读版',
    strict: '强约束版',
    'tool-ready': '工具适配版',
    'agent-ready': 'Agent 适配版',
    'eval-ready': '评估适配版'
  }[mode];

  return [
    `# ${modeLabel} Prompt`,
    '',
    '## Role',
    sections.role,
    '',
    '## Task',
    task.goal,
    '',
    '## Context',
    toBulletList(sections.context),
    '',
    '## Inputs',
    toBulletList(sections.inputs),
    '',
    '## Process',
    toNumberedList(sections.process),
    '',
    '## Tool Rules',
    toBulletList(sections.toolRules),
    '',
    '## Constraints',
    toBulletList(sections.constraints),
    '',
    '## Output Format',
    sections.outputFormat,
    '',
    '## Evaluation Criteria',
    toBulletList(sections.evaluationCriteria),
    '',
    '## Fallback',
    toBulletList(sections.fallback),
    '',
    '## Asset Bindings',
    assetBindings.length ? toBulletList(assetBindings.map(binding => `${binding.assetTitle} -> ${binding.slot} -> ${binding.appliedToSections.join(', ')}`)) : '- 未注入资产',
    '',
    '## Risks And Assumptions',
    toBulletList([...risks, ...assumptions])
  ].join('\n');
};

export const summarizeAssetForCompiler = (asset: PromptAsset) => {
  const formatted = formatAssetForModel(asset);
  return formatted.length > 1200 ? `${formatted.slice(0, 1200)}\n...` : formatted;
};

const buildRole = (task: TaskModel, mode: CompileMode) => {
  if (mode === 'agent-ready') return `你是面向 ${task.audience} 的 AI 任务执行 Agent，负责把用户需求封装、执行、检查并在必要时请求澄清。`;
  if (mode === 'tool-ready') return `你是面向 ${task.audience} 的工具增强型提示词执行助手，必须区分工具上下文、模型推断和人工确认事项。`;
  return `你是面向 ${task.audience} 的提示词工程助手，负责把模糊需求封装为可执行、可审核、可迭代的 Prompt。`;
};

const buildProcess = (task: TaskModel, selectedAssets: PromptAsset[], mode: CompileMode) => {
  const steps = [
    '先复述并结构化任务目标、输入、输出和约束。',
    '检查是否需要引用已注入资产，并说明每个资产的作用。',
    '基于任务生成可执行内容，不确定时标注缺口。',
    '按评估标准自检后再输出最终结果。'
  ];
  if (selectedAssets.some(asset => asset.type === 'skill' || asset.type === 'workflow')) steps.splice(2, 0, '遵循已注入 Skill 或 Workflow 的阶段、边界和质量门。');
  if (mode === 'eval-ready') steps.push('输出后附带评分维度、失败风险和建议测试输入。');
  if (task.riskLevel === 'high') steps.splice(1, 0, '高风险内容必须先识别安全、合规或专业边界。');
  return steps;
};

const buildOutputFormat = (task: TaskModel, selectedAssets: PromptAsset[], mode: CompileMode) => {
  const templateAsset = selectedAssets.find(asset => asset.type === 'template');
  if (templateAsset?.content.trim()) return `优先采用模板资产“${templateAsset.title}”的结构：\n${templateAsset.content.slice(0, 900)}`;
  if (mode === 'eval-ready') return '使用 Markdown 输出：最终 Prompt、资产融合说明、评估标准、测试样例、风险提示。';
  if (mode === 'agent-ready') return '使用 Markdown 输出：Agent 目标、可用上下文、执行步骤、停止条件、失败处理、最终交付格式。';
  return `使用 Markdown 输出，至少包含：${task.expectedOutputs.join('、')}。`;
};

const buildCompilationWarnings = (task: TaskModel, selectedAssets: PromptAsset[], promptIR: PromptIR) => {
  const warnings = [];
  if (selectedAssets.length === 0) warnings.push('未注入资产，当前编译结果主要依赖任务理解。');
  if (task.missingInfo.length > 0) warnings.push(`存在待确认信息：${task.missingInfo.join('、')}`);
  if (promptIR.sections.toolRules.length > 3 && !selectedAssets.some(asset => asset.type === 'policy')) warnings.push('工具上下文较多，建议补充 Policy 资产约束权限和数据边界。');
  return warnings;
};

const groupAssetsBySlot = (assets: PromptAsset[]) => {
  return assets.reduce<Record<string, PromptAsset[]>>((groups, asset) => {
    const slot = resolveSlotId(asset.type);
    groups[slot] = [...(groups[slot] || []), asset];
    return groups;
  }, {});
};

const assetSummaries = (assets: PromptAsset[]) => assets.slice(0, 4).map(asset => `${ASSET_TYPE_LABELS[asset.type]} ${asset.title}: ${asset.summary || asset.integration.usageNotes || asset.content.slice(0, 120)}`);

const toBulletList = (items: string[]) => items.length ? items.map(item => `- ${item}`).join('\n') : '- 无';
const toNumberedList = (items: string[]) => items.length ? items.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. 无';
const createId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
