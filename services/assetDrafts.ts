import { AssetBuilderDraft, AssetType, PromptAsset, TaskModel } from '../types';
import { ASSET_TYPE_FORMATS, ASSET_TYPE_LABELS, applyAssetFormatTemplate, createBlankAsset } from './library';

export const ALL_ASSET_TYPES = Object.keys(ASSET_TYPE_LABELS) as AssetType[];

export const buildLocalAssetDraft = (
  assetType: AssetType,
  task?: TaskModel,
  input = ''
): AssetBuilderDraft => {
  const goal = task?.goal || input.trim() || '可复用提示词工程资产';
  const format = ASSET_TYPE_FORMATS[assetType];
  const label = ASSET_TYPE_LABELS[assetType];
  return {
    id: `asset_draft_${Date.now().toString(36)}`,
    assetType,
    title: `${label}：${goal}`.slice(0, 80),
    summary: `围绕“${goal}”生成的 ${label} 资产草稿，用于沉淀可复用任务方法、工程上下文或评估规则。`,
    content: buildDraftContent(assetType, goal, input),
    integration: {
      entryName: `${assetType}.${slugify(goal)}`,
      capabilities: buildCapabilities(assetType),
      inputs: buildInputs(assetType),
      outputs: buildOutputs(assetType),
      constraints: buildConstraints(assetType),
      usageNotes: assetType === 'mcp' || assetType === 'sdk' || assetType === 'connector' || assetType === 'tool'
        ? '当前仅作为工程上下文参与提示词编译，不代表已经真实连接、授权或执行。'
        : '保存前应补齐正例、反例、边界和验收标准。'
    },
    schemaPreview: format.formatBullets,
    nextSteps: buildNextSteps(assetType),
    warnings: buildWarnings(assetType),
    createdAt: Date.now()
  };
};

export const assetBuilderDraftToPromptAsset = (draft: AssetBuilderDraft): PromptAsset => {
  const base = createBlankAsset(draft.assetType);
  const now = Date.now();
  return applyAssetFormatTemplate({
    ...base,
    title: draft.title,
    summary: draft.summary,
    content: draft.content,
    tags: ['builder', draft.assetType],
    useCases: draft.nextSteps,
    integration: draft.integration,
    examples: draft.warnings,
    createdAt: now,
    updatedAt: now
  }, draft.assetType);
};

const buildCapabilities = (type: AssetType): string[] => {
  const map: Record<AssetType, string[]> = {
    prompt: ['任务封装', '结构化输出', '约束和自检'],
    skill: ['触发判断', '资源渐进加载', '流程执行', '质量验证'],
    mcp: ['MCP tool/resource/prompt 描述', '权限边界', '错误处理'],
    sdk: ['初始化说明', '核心方法映射', '错误处理和测试'],
    workflow: ['多阶段编排', '状态流转', '质量门'],
    reference: ['事实上下文', '术语说明', '引用边界'],
    agent: ['身份目标', '工具使用策略', '停止条件'],
    tool: ['参数契约', '返回契约', '失败回退'],
    template: ['结构骨架', '变量槽位', '输出格式'],
    evaluator: ['评分维度', '阈值判断', '失败归因'],
    dataset: ['正反例样本', '标签体系', '回归样例'],
    policy: ['安全边界', '触发条件', '执行和升级策略'],
    memory: ['长期事实', '用户偏好', '失效规则'],
    connector: ['外部服务连接', '认证说明', '数据边界'],
    parser: ['字段抽取', '清洗规则', '校验和失败处理'],
    benchmark: ['任务输入集', '指标记录', '版本回归']
  };
  return map[type];
};

const buildInputs = (type: AssetType): string[] => {
  const common = ['用户目标', '输入材料', '约束', '验收标准'];
  if (['mcp', 'sdk', 'tool', 'connector'].includes(type)) return [...common, '接口/工具 schema', '认证和权限'];
  if (['dataset', 'benchmark', 'evaluator'].includes(type)) return [...common, '样例', '指标', '失败案例'];
  if (type === 'parser') return [...common, '文件类型', '字段清单', '清洗规则'];
  if (type === 'skill' || type === 'workflow' || type === 'agent') return [...common, '触发条件', '步骤', '停止条件'];
  return common;
};

const buildOutputs = (type: AssetType): string[] => {
  const map: Partial<Record<AssetType, string[]>> = {
    prompt: ['可执行 Prompt', '变量说明', '评估清单'],
    skill: ['SKILL.md 草稿', '资源目录建议', 'validation checklist'],
    mcp: ['MCP server 规格', 'tool/resource/prompt 列表', 'security notes'],
    sdk: ['SDK 接入说明', '最小示例', '测试建议'],
    workflow: ['阶段流程', '质量门', '最终交付物'],
    evaluator: ['评分规则', '通过阈值', '评估报告格式'],
    dataset: ['样例结构', '正例/反例', '标签体系'],
    benchmark: ['测试任务集', '期望输出', '回归指标']
  };
  return map[type] || ['结构化资产说明', '可注入上下文', '使用边界'];
};

const buildConstraints = (type: AssetType): string[] => {
  const base = ['必须说明适用范围和不适用场景', '必须包含失败处理或人工确认点'];
  if (['mcp', 'sdk', 'tool', 'connector'].includes(type)) {
    return [...base, '未真实连接时不得声称已经调用外部工具或接口', '不得保存密钥或隐式扩大权限'];
  }
  if (['policy', 'evaluator', 'benchmark'].includes(type)) {
    return [...base, '评估和治理规则必须展示证据来源，避免单次行为过拟合'];
  }
  return base;
};

const buildNextSteps = (type: AssetType): string[] => {
  const base = ['确认标题、摘要和适用场景', '补充至少 1 个正例和 1 个反例', '绑定 Evaluator 或 Benchmark 做回归'];
  if (type === 'skill') return ['补齐 SKILL.md 触发规则', '整理 references/scripts/assets/mcp 目录', ...base];
  if (type === 'mcp') return ['补齐 transport/auth/runtime', '为每个 tool 写 input/output schema', ...base];
  if (type === 'sdk') return ['确认包名、版本和安装命令', '补齐认证、核心方法和错误处理', ...base];
  if (type === 'workflow') return ['拆分阶段和质量门', '定义状态、失败回退和最终交付物', ...base];
  if (type === 'policy') return ['补充触发条件', '补充执行/拒答/升级策略', ...base];
  return base;
};

const buildWarnings = (type: AssetType): string[] => {
  if (['mcp', 'sdk', 'tool', 'connector'].includes(type)) {
    return ['工具类资产当前只参与提示词上下文，不真实执行。', '真实接入前需要 Connector、环境变量、权限和人工确认。'];
  }
  if (['policy', 'evaluator', 'benchmark'].includes(type)) {
    return ['治理和评估资产会影响输出边界，保存前建议人工复核。'];
  }
  return ['草稿只是起点，建议补齐边界、示例和失败处理。'];
};

const buildDraftContent = (type: AssetType, goal: string, input: string): string => {
  const seed = input.trim() ? `\n\n## 原始需求\n${input.trim()}` : '';
  if (type === 'skill') {
    return `# Skill 草稿\n\n## Trigger\n当用户需要“${goal}”并且任务会重复出现、涉及资料/工具/质量门时使用。\n\n## Resources\n- SKILL.md\n- references/\n- scripts/\n- assets/\n- mcp/\n\n## Workflow\n1. 判断触发条件和不适用场景。\n2. 读取必要 references/scripts/assets。\n3. 分阶段执行并在关键节点自检。\n4. 输出结果、风险和后续建议。\n\n## Validation\n- 覆盖目标。\n- 遵守边界。\n- 留下可复用资产。${seed}`;
  }
  if (type === 'mcp') {
    return `# MCP 规格草稿\n\n## Server Goal\n${goal}\n\n## Tools\n- tool_name: 描述用途、输入 schema、输出 schema、错误处理。\n\n## Resources\n- resource_uri: 描述可读资料和访问限制。\n\n## Security\n- 默认只读。\n- 写操作需要人工确认。\n- 不保存密钥。${seed}`;
  }
  if (type === 'sdk') {
    return `# SDK 接入草稿\n\n## Goal\n${goal}\n\n## Install\n- npm / pip / uv 命令待补充。\n\n## Initialization\n- 从环境变量读取密钥。\n- 声明超时、重试和错误处理。\n\n## Examples\n- 最小可运行示例。\n- 常见失败用例。${seed}`;
  }
  if (type === 'workflow') {
    return `# Workflow 草稿\n\n## Goal\n${goal}\n\n## Stages\n1. Intake: 明确输入和缺口。\n2. Build: 插入资产并编译 PromptIR。\n3. Run: 执行或预览输出。\n4. Review: 评分、诊断和生成 AssetPatch。\n5. Save: 沉淀为可复用资产。${seed}`;
  }
  if (type === 'evaluator') {
    return `# Evaluator 草稿\n\n## Target\n${goal}\n\n## Dimensions\n- 准确性\n- 完整性\n- 可执行性\n- 安全性\n\n## Pass Threshold\n总分 >= 85，且事实边界/安全性不得低于 90。\n\n## Output Format\nscore / issues / evidence / recommendations${seed}`;
  }
  if (type === 'policy') {
    return `# Policy 草稿\n\n## Domain\n${goal}\n\n## Rules\n- 只基于用户提供或可信引用资料输出。\n- 不确定时明确标注并提出澄清问题。\n- 涉及高风险决策时提示人工复核。\n\n## Enforcement\n- 降级回答。\n- 拒绝越权请求。\n- 记录需要补充的资料。${seed}`;
  }
  if (type === 'dataset' || type === 'benchmark') {
    return `# ${ASSET_TYPE_LABELS[type]} 草稿\n\n## Purpose\n用于验证“${goal}”相关 Prompt/Skill/Workflow 的稳定性。\n\n## Item Schema\n- input\n- expectedOutput\n- label\n- notes\n\n## Examples\n- 正例：待补充。\n- 反例：待补充。\n\n## Metrics\n- 完整性\n- 格式符合度\n- 事实边界${seed}`;
  }
  return `# ${ASSET_TYPE_LABELS[type]} 草稿\n\n## Goal\n${goal}\n\n## Structure\n- 适用场景\n- 输入要求\n- 执行规则\n- 输出契约\n- 失败处理\n- 验收标准\n\n## Notes\n保存为资产前请补充 examples、constraints 和 evaluation。${seed}`;
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'asset';
