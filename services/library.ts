import {
  AgentAssetSchema,
  AssetSchema,
  AssetType,
  BenchmarkAssetSchema,
  ConnectorAssetSchema,
  DatasetAssetSchema,
  EvaluatorAssetSchema,
  MemoryAssetSchema,
  McpAssetSchema,
  OptimizationDirection,
  ParserAssetSchema,
  PolicyAssetSchema,
  PromptAsset,
  PromptAssetSchema,
  ReferenceAssetSchema,
  SdkAssetSchema,
  SkillAssetSchema,
  TemplateAssetSchema,
  ToolAssetSchema,
  WorkflowAssetSchema
} from '../types';

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  prompt: 'Prompt',
  skill: 'Skill',
  mcp: 'MCP',
  sdk: 'SDK',
  workflow: 'Workflow',
  reference: 'Reference',
  agent: 'Agent',
  tool: 'Tool',
  template: 'Template',
  evaluator: 'Evaluator',
  dataset: 'Dataset',
  policy: 'Policy',
  memory: 'Memory',
  connector: 'Connector',
  parser: 'Parser',
  benchmark: 'Benchmark'
};

export interface AssetSchemaFieldFormat {
  label: string;
  placeholder: string;
  options?: { value: string; label: string }[];
}

export const ASSET_SCHEMA_FIELD_FORMATS: Partial<Record<AssetType, Record<string, AssetSchemaFieldFormat>>> = {
  agent: {
    identity: { label: '身份定位', placeholder: '这个 Agent 是谁，负责哪类任务，默认立场和专业边界是什么。' },
    goals: { label: '目标', placeholder: '每行一个可验收目标，例如：\n定位缺陷根因\n输出可执行修复计划' },
    instructions: { label: '系统指令', placeholder: '每行一条稳定行为规则，例如：\n先收集上下文再修改代码\n不确定时明确标注假设' },
    tools: { label: '可用工具', placeholder: '每行一个工具、MCP、SDK 或 Skill 名称，例如：\nfilesystem.read\ngithub.pr_review' },
    memoryStrategy: { label: '记忆策略', placeholder: '说明哪些事实要记住、多久失效、如何避免污染长期记忆。' },
    planningStrategy: { label: '计划策略', placeholder: '说明何时先计划、何时直接执行、如何拆分任务和更新状态。' },
    stopConditions: { label: '停止条件', placeholder: '每行一个停止条件，例如：\n用户确认完成\n连续失败需要澄清\n达到验收标准' },
    failureHandling: { label: '失败处理', placeholder: '每行一个失败处理策略，例如：\n返回失败阶段和证据\n提供降级路径' },
    outputContract: { label: '输出契约', placeholder: '定义 Agent 最终必须交付的格式、字段、证据和限制。' }
  },
  tool: {
    name: { label: '工具名', placeholder: '稳定、可引用的工具名称，例如：extract_tables_from_xlsx' },
    purpose: { label: '用途', placeholder: '工具解决什么问题，适合在哪些任务中被调用。' },
    parameters: { label: '参数', placeholder: '每行一个参数，例如：\nfilePath: string\nsheetName?: string' },
    returns: { label: '返回值', placeholder: '每行一个返回字段，例如：\nrows: object[]\nwarnings: string[]' },
    preconditions: { label: '前置条件', placeholder: '每行一个条件，例如：\n文件必须存在\n输入已通过权限检查' },
    sideEffects: { label: '副作用', placeholder: '每行一个副作用，例如：\n会写入缓存文件\n会请求外部服务' },
    fallback: { label: '失败回退', placeholder: '每行一个回退策略，例如：\n参数缺失时请求澄清\n解析失败时返回原始文本' },
    examples: { label: '调用示例', placeholder: '每行一个简短示例，包含输入和预期输出。' }
  },
  template: {
    structure: { label: '模板结构', placeholder: '每行一个结构区块，例如：\n# 背景\n# 任务\n# 输出格式' },
    slots: { label: '变量槽位', placeholder: '每行一个槽位，例如：\n{{目标}}\n{{受众}}\n{{约束}}' },
    fillRules: { label: '填充规则', placeholder: '每行一条规则，例如：\n缺失槽位必须先提问\n保留用户原始术语' },
    variants: { label: '模板变体', placeholder: '每行一个变体，例如：\n短版\n审校版\n开发任务版' },
    outputFormat: { label: '输出格式', placeholder: '说明套用模板后应输出 Markdown、JSON、代码块或其他格式。' },
    constraints: { label: '约束', placeholder: '每行一个约束，例如：\n不得删除必填槽位\n不得改变章节顺序' }
  },
  evaluator: {
    target: { label: '评估对象', placeholder: '要评估 Prompt、Agent 输出、工具结果，还是完整 Workflow。' },
    dimensions: { label: '评估维度', placeholder: '每行一个维度，例如：\n准确性\n完整性\n可执行性\n安全性' },
    scoringRubric: { label: '评分规则', placeholder: '每行一条评分标准，例如：\n90-100: 完全满足且有证据\n60-79: 部分满足' },
    passThreshold: { label: '通过阈值', placeholder: '例如：总分 >= 85 且安全性不得低于 90。' },
    failureCases: { label: '失败样例', placeholder: '每行一个失败模式，例如：\n编造事实\n遗漏关键约束\n输出格式错误' },
    reviewMode: {
      label: '审查模式',
      placeholder: '选择人工、AI 或混合审查。',
      options: [
        { value: 'hybrid', label: '混合审查' },
        { value: 'manual', label: '人工审查' },
        { value: 'ai', label: 'AI 审查' }
      ]
    },
    outputFormat: { label: '评估输出格式', placeholder: '定义评估报告字段，例如：score、issues、evidence、recommendations。' }
  },
  dataset: {
    purpose: { label: '数据集用途', placeholder: '说明该样例集用于 few-shot、回归测试、评估还是训练规范。' },
    itemSchema: { label: '样例结构', placeholder: '定义单条样例字段，例如：input、expected、label、notes。' },
    positiveExamples: { label: '正例', placeholder: '每行一个正例摘要或样例 ID。' },
    negativeExamples: { label: '反例', placeholder: '每行一个反例摘要，强调为什么不合格。' },
    labels: { label: '标签体系', placeholder: '每行一个标签，例如：\nformat-error\nmissing-context\nunsafe' },
    splitStrategy: { label: '拆分策略', placeholder: '说明 train/dev/test 或 prompt/eval/benchmark 的拆分方式。' },
    qualityNotes: { label: '质量备注', placeholder: '每行一条质量说明，例如：\n样例来源\n去重规则\n偏差风险' }
  },
  policy: {
    domain: { label: '规则域', placeholder: '规则适用的安全、合规、品牌、业务或输出风格领域。' },
    rules: { label: '规则', placeholder: '每行一条必须遵守的规则。' },
    triggers: { label: '触发条件', placeholder: '每行一个触发场景，例如：\n用户请求敏感数据\n输出涉及医疗建议' },
    enforcement: { label: '执行方式', placeholder: '每行一种执行动作，例如：\n拒绝\n降级回答\n要求用户确认' },
    escalation: { label: '升级策略', placeholder: '每行一种升级路径，例如：\n交给人工复核\n要求补充授权信息' },
    refusalStyle: { label: '拒答 / 降级风格', placeholder: '说明拒绝或降级时的语气、解释粒度和可替代帮助。' },
    examples: { label: '规则示例', placeholder: '每行一个触发输入和期望处理方式。' }
  },
  memory: {
    facts: { label: '长期事实', placeholder: '每行一个稳定事实，例如：\n项目使用 Vite + React\n默认简体中文输出' },
    preferences: { label: '偏好', placeholder: '每行一个用户或团队偏好，例如：\n提交信息用中文\n先本地验证再汇报' },
    projectConventions: { label: '项目约定', placeholder: '每行一个工程约定，例如：\n不提交 dist\n使用 npm run typecheck' },
    scope: { label: '适用范围', placeholder: '说明这段记忆适用于哪个用户、项目、仓库或任务类型。' },
    confidence: { label: '可信度', placeholder: '例如：高 / 中 / 低，并说明证据来源。' },
    updatedAtText: { label: '更新时间', placeholder: '例如：2026-05-27，或说明最近确认来源。' },
    invalidationRules: { label: '失效规则', placeholder: '每行一个失效条件，例如：\n仓库迁移\n用户明确更新偏好\n依赖升级' }
  },
  connector: {
    service: { label: '服务名', placeholder: '外部系统或平台名称，例如：GitHub、Feishu、OpenAI、Postgres。' },
    endpoints: { label: '端点', placeholder: '每行一个 endpoint、topic、resource 或事件名。' },
    auth: { label: '认证方式', placeholder: '说明 API key、OAuth、JWT、环境变量或无认证。' },
    environment: { label: '环境 / 变量', placeholder: '每行一个环境要求，例如：\nNODE_ENV=production\nGITHUB_TOKEN' },
    permissions: { label: '权限范围', placeholder: '每行一个权限，例如：\nread:repo\nwrite:issues' },
    dataBoundaries: { label: '数据边界', placeholder: '每行一个边界，例如：\n不得上传 PII\n只读取当前 workspace' },
    rateLimits: { label: '速率限制', placeholder: '每行一个限制，例如：\n60 req/min\n大文件需分页' },
    operationalNotes: { label: '运维备注', placeholder: '每行一个运行注意事项，例如：\n失败可重试 3 次\n需要审计日志' }
  },
  parser: {
    inputTypes: { label: '输入类型', placeholder: '每行一个输入类型，例如：\nPDF\nDOCX\nXLSX\nMarkdown' },
    extractionFields: { label: '提取字段', placeholder: '每行一个字段，例如：\ntitle\nmaterials[]\nacceptanceCriteria' },
    cleaningRules: { label: '清洗规则', placeholder: '每行一条规则，例如：\n去除页眉页脚\n合并跨页表格' },
    outputSchema: { label: '输出 Schema', placeholder: '定义解析结果 JSON、表格或 Markdown 的结构。' },
    validationRules: { label: '校验规则', placeholder: '每行一条校验，例如：\n必填字段不能为空\n日期必须可解析' },
    failureHandling: { label: '失败处理', placeholder: '每行一个失败处理方式，例如：\n保留原文片段\n报告缺失字段\n请求人工确认' }
  },
  benchmark: {
    target: { label: '测试目标', placeholder: '要回归测试的 Prompt、Skill、Agent、Workflow 或模型版本。' },
    tasks: { label: '测试任务', placeholder: '每行一个任务，例如：\n生成合规检查提示词\n从 Excel 抽取物料表' },
    inputs: { label: '输入集', placeholder: '每行一个测试输入、文件名或样例 ID。' },
    expectedOutputs: { label: '期望输出', placeholder: '每行一个期望结果、断言或关键字段。' },
    metrics: { label: '指标', placeholder: '每行一个指标，例如：\n准确率\n格式合规率\n人工评分' },
    regressionNotes: { label: '回归记录', placeholder: '每行一条历史结果、失败原因或版本差异。' }
  }
};

export const getAssetSchemaFieldFormat = (type: AssetType, key: string): AssetSchemaFieldFormat => (
  ASSET_SCHEMA_FIELD_FORMATS[type]?.[key] || {
    label: formatSchemaKey(key),
    placeholder: `填写 ${formatSchemaKey(key)}`
  }
);

const formatSchemaKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, char => char.toUpperCase());
};

interface AssetTypeFormat {
  name: string;
  description: string;
  formatBullets: string[];
  titlePlaceholder: string;
  summaryPlaceholder: string;
  tagsPlaceholder: string;
  useCasesLabel: string;
  useCasesPlaceholder: string;
  entryNameLabel: string;
  entryNamePlaceholder: string;
  capabilitiesLabel: string;
  capabilitiesPlaceholder: string;
  inputsLabel: string;
  inputsPlaceholder: string;
  outputsLabel: string;
  outputsPlaceholder: string;
  constraintsLabel: string;
  constraintsPlaceholder: string;
  usageNotesLabel: string;
  usageNotesPlaceholder: string;
  examplesLabel: string;
  examplesPlaceholder: string;
  contentLabel: string;
  contentPlaceholder: string;
  template: {
    tags: string[];
    useCases: string[];
    integration: {
      entryName: string;
      capabilities: string[];
      inputs: string[];
      outputs: string[];
      constraints: string[];
      usageNotes: string;
    };
    examples: string[];
    content: string;
  };
}

const createSimpleFormat = (
  type: AssetType,
  name: string,
  description: string,
  components: string[]
): AssetTypeFormat => ({
  name,
  description,
  formatBullets: components.map(component => `${component} 是必填架构组成`),
  titlePlaceholder: `例如：${name} 资产`,
  summaryPlaceholder: `说明这个 ${name} 解决什么问题、何时复用。`,
  tagsPlaceholder: `${type}, reusable`,
  useCasesLabel: '适用场景',
  useCasesPlaceholder: '每行一个适用场景',
  entryNameLabel: '入口 / 名称',
  entryNamePlaceholder: `${type}.name`,
  capabilitiesLabel: '能力',
  capabilitiesPlaceholder: '每行一个能力',
  inputsLabel: '输入',
  inputsPlaceholder: '每行一种输入',
  outputsLabel: '输出',
  outputsPlaceholder: '每行一种输出',
  constraintsLabel: '约束',
  constraintsPlaceholder: '每行一个约束',
  usageNotesLabel: '使用说明',
  usageNotesPlaceholder: '说明何时使用、如何注入、注意事项。',
  examplesLabel: '示例',
  examplesPlaceholder: '多个示例用 --- 分隔',
  contentLabel: `${name} 详细说明`,
  contentPlaceholder: `补充 ${name} 的详细文档、示例或约束。`,
  template: {
    tags: [type],
    useCases: [],
    integration: {
      entryName: '',
      capabilities: [],
      inputs: [],
      outputs: [],
      constraints: [],
      usageNotes: ''
    },
    examples: [],
    content: `# ${name}\n\n## Components\n${components.map(component => `- ${component}: `).join('\n')}\n`
  }
});

export const ASSET_TYPE_FORMATS: Record<AssetType, AssetTypeFormat> = {
  prompt: {
    name: 'Prompt 模板',
    description: '保存可直接复用或二次改写的提示词模板，重点是变量、输出格式、约束和评价标准。',
    formatBullets: ['正文使用完整提示词模板', '变量建议写成 {{变量名}}', '能力字段记录它能稳定完成的任务', '示例放典型输入和理想输出'],
    titlePlaceholder: '例如：技术方案评审 Prompt',
    summaryPlaceholder: '说明这个 Prompt 适合什么任务、能产出什么结果。',
    tagsPlaceholder: 'prompt, review, writing',
    useCasesLabel: '适用场景',
    useCasesPlaceholder: '每行一个场景，例如：\n评审技术方案\n生成结构化写作大纲',
    entryNameLabel: '模板名 / 调用名',
    entryNamePlaceholder: '例如 review.technical-plan',
    capabilitiesLabel: '稳定能力',
    capabilitiesPlaceholder: '每行一项能力，例如：\n拆解目标和约束\n生成验收清单',
    inputsLabel: '变量 / 输入',
    inputsPlaceholder: '每行一个变量，例如：\n{{背景}}\n{{目标}}\n{{资料}}',
    outputsLabel: '输出格式',
    outputsPlaceholder: '每行一种输出，例如：\nMarkdown 报告\n风险清单\n行动建议',
    constraintsLabel: '约束 / 禁止事项',
    constraintsPlaceholder: '每行一个约束，例如：\n必须先澄清缺失信息\n不能编造引用',
    usageNotesLabel: '使用说明',
    usageNotesPlaceholder: '说明什么时候用、如何替换变量、是否需要配合附件。',
    examplesLabel: '示例',
    examplesPlaceholder: '输入：...\n输出：...\n---\n输入：...\n输出：...',
    contentLabel: 'Prompt 正文',
    contentPlaceholder: '粘贴完整 Prompt，建议包含角色、背景、任务、约束、输出格式、验收标准。',
    template: {
      tags: ['prompt'],
      useCases: [''],
      integration: {
        entryName: '',
        capabilities: [''],
        inputs: ['{{输入}}'],
        outputs: [''],
        constraints: [''],
        usageNotes: ''
      },
      examples: [],
      content: `# 角色\n你是...\n\n# 背景\n{{背景}}\n\n# 任务\n请基于 {{输入}} 完成...\n\n# 约束\n- \n\n# 输出格式\n- \n\n# 验收标准\n- `
    }
  },
  skill: {
    name: 'Skill 说明',
    description: '描述一个可复用能力单元，重点是触发条件、边界、执行步骤、输入输出和质量门。',
    formatBullets: ['正文按 Skill 文档写法组织', '入口写 Skill 名或触发短语', '能力字段记录它会做什么', '约束字段记录不能做什么和何时需要澄清'],
    titlePlaceholder: '例如：论文综述写作 Skill',
    summaryPlaceholder: '说明这个 Skill 在什么情况下触发、帮助用户完成什么工作。',
    tagsPlaceholder: 'skill, writing, research',
    useCasesLabel: '触发场景',
    useCasesPlaceholder: '每行一个触发场景，例如：\n用户要求写综述\n用户上传论文包需要归纳',
    entryNameLabel: 'Skill 名 / 触发短语',
    entryNamePlaceholder: '例如 literature-review-writer',
    capabilitiesLabel: '能力边界',
    capabilitiesPlaceholder: '每行一项能力，例如：\n提炼论文贡献\n生成章节结构\n检查引用一致性',
    inputsLabel: '所需输入',
    inputsPlaceholder: '每行一种输入，例如：\n用户目标\n参考资料\n目标读者\n格式要求',
    outputsLabel: '交付输出',
    outputsPlaceholder: '每行一种输出，例如：\n结构化大纲\n正式正文\n检查清单',
    constraintsLabel: '限制 / 澄清条件',
    constraintsPlaceholder: '每行一个限制，例如：\n资料不足时先提问\n不能伪造论文结论',
    usageNotesLabel: '执行步骤',
    usageNotesPlaceholder: '写清楚使用该 Skill 时的步骤、质量门和结束条件。',
    examplesLabel: '调用示例',
    examplesPlaceholder: '用户请求：...\nSkill 响应策略：...\n---',
    contentLabel: 'Skill 文档',
    contentPlaceholder: '按触发条件、流程、边界、检查项整理 Skill 说明。',
    template: {
      tags: ['skill'],
      useCases: [''],
      integration: {
        entryName: '',
        capabilities: [''],
        inputs: ['用户目标', '上下文材料', '输出要求'],
        outputs: [''],
        constraints: [''],
        usageNotes: '1. 判断是否满足触发条件\n2. 收集缺失输入\n3. 执行核心步骤\n4. 按质量门检查输出'
      },
      examples: [],
      content: `# Skill\n\n## 触发条件\n- \n\n## 能力边界\n- \n\n## 输入\n- \n\n## 执行步骤\n1. \n2. \n3. \n\n## 输出\n- \n\n## 质量门\n- \n\n## 不做范围\n- `
    }
  },
  mcp: {
    name: 'MCP 工具引用',
    description: '记录 MCP server 或 tool 的半结构化说明，重点是工具名、输入 schema、输出、权限和失败处理。',
    formatBullets: ['不真实执行 MCP，只注入工具上下文', '入口建议写 server.tool', '输入输出字段尽量贴近 schema', '约束字段记录认证、权限、速率和不可用处理'],
    titlePlaceholder: '例如：GitHub PR Review MCP',
    summaryPlaceholder: '说明这个 MCP 工具能访问什么系统、适合完成什么任务。',
    tagsPlaceholder: 'mcp, github, tool',
    useCasesLabel: '适用任务',
    useCasesPlaceholder: '每行一个任务，例如：\n读取 PR 评论\n列出失败 CI\n查询 issue',
    entryNameLabel: 'Server / Tool',
    entryNamePlaceholder: '例如 github.get_pull_request 或 filesystem.read_file',
    capabilitiesLabel: '工具能力',
    capabilitiesPlaceholder: '每行一个工具能力，例如：\n读取 PR 元数据\n获取 review threads\n查询工作流日志',
    inputsLabel: '输入 Schema',
    inputsPlaceholder: '每行一个输入字段，例如：\nowner: string\nrepo: string\npullNumber: number',
    outputsLabel: '输出 Schema',
    outputsPlaceholder: '每行一个输出字段，例如：\ncomments: ReviewComment[]\nstatus: string',
    constraintsLabel: '权限 / 失败模式',
    constraintsPlaceholder: '每行一个限制，例如：\n需要 GitHub 授权\n网络失败时回退到 gh CLI\n只读调用',
    usageNotesLabel: '调用策略',
    usageNotesPlaceholder: '说明什么时候选择该 tool、如何解释输出、失败时怎么办。',
    examplesLabel: '工具调用示例',
    examplesPlaceholder: '任务：...\n工具：server.tool\n参数：{...}\n期望输出：...',
    contentLabel: 'MCP 说明',
    contentPlaceholder: '粘贴 server/tool 文档、schema、调用注意事项或示例。',
    template: {
      tags: ['mcp', 'tool'],
      useCases: [''],
      integration: {
        entryName: 'server.tool',
        capabilities: [''],
        inputs: ['field: type'],
        outputs: ['field: type'],
        constraints: ['不真实执行，仅作为提示词上下文引用'],
        usageNotes: '优先说明工具能力、输入输出和失败回退；生成提示词时不得声称已经调用。'
      },
      examples: [],
      content: `# MCP Tool Reference\n\n## Server\n- name: \n\n## Tool\n- name: \n- purpose: \n\n## Input Schema\n- \n\n## Output Schema\n- \n\n## Permissions\n- \n\n## Failure Handling\n- \n\n## Usage Example\n`
    }
  },
  sdk: {
    name: 'SDK 用法引用',
    description: '记录 SDK/API 的安装、初始化、方法、参数、返回值和错误处理，优化提示词时用于生成开发类指令。',
    formatBullets: ['正文包含包名、版本、导入和初始化', '入口写 package.method 或 client.method', '输入输出字段记录参数和返回值', '约束字段记录密钥、环境和兼容性'],
    titlePlaceholder: '例如：OpenAI Responses SDK 用法',
    summaryPlaceholder: '说明 SDK 适合实现什么能力、主要接口是什么。',
    tagsPlaceholder: 'sdk, api, typescript',
    useCasesLabel: '开发场景',
    useCasesPlaceholder: '每行一个开发场景，例如：\n生成文本\n处理文件上传\n流式输出',
    entryNameLabel: '包名 / 方法',
    entryNamePlaceholder: '例如 @openai/sdk.responses.create',
    capabilitiesLabel: '可用能力',
    capabilitiesPlaceholder: '每行一项能力，例如：\n文本生成\n工具调用\n结构化输出',
    inputsLabel: '参数',
    inputsPlaceholder: '每行一个参数，例如：\nmodel: string\ninput: string | Message[]',
    outputsLabel: '返回值',
    outputsPlaceholder: '每行一个返回字段，例如：\nid: string\noutput_text: string',
    constraintsLabel: '环境 / 兼容性',
    constraintsPlaceholder: '每行一个约束，例如：\n需要 API key\nNode 版本 >= 20\n不要暴露密钥到前端',
    usageNotesLabel: '接入注意事项',
    usageNotesPlaceholder: '说明初始化方式、错误处理、重试、密钥和安全边界。',
    examplesLabel: '代码示例',
    examplesPlaceholder: '```ts\n...\n```\n---\n```python\n...\n```',
    contentLabel: 'SDK 文档 / 用法',
    contentPlaceholder: '粘贴安装命令、初始化代码、接口文档、最佳实践或错误处理。',
    template: {
      tags: ['sdk', 'api'],
      useCases: [''],
      integration: {
        entryName: 'package.client.method',
        capabilities: [''],
        inputs: ['param: type'],
        outputs: ['field: type'],
        constraints: ['不要在前端暴露服务端密钥'],
        usageNotes: '生成开发提示词时说明依赖、初始化、参数、返回值、错误处理和测试方式。'
      },
      examples: [],
      content: `# SDK Reference\n\n## Package\n- name: \n- version: \n\n## Install\n\`\`\`bash\n\n\`\`\`\n\n## Import / Init\n\`\`\`ts\n\n\`\`\`\n\n## Method\n- name: \n- purpose: \n\n## Parameters\n- \n\n## Return\n- \n\n## Errors\n- \n\n## Example\n\`\`\`ts\n\n\`\`\``
    }
  },
  workflow: {
    name: 'Workflow 流程',
    description: '记录多步骤流程、节点职责、状态流转和质量门，适合 LangGraph、工坊流程或人工协作 SOP。',
    formatBullets: ['正文描述节点和流转', '入口写 workflow 名称或起点节点', '输入输出字段记录全流程契约', '约束字段记录中断、回滚和验收条件'],
    titlePlaceholder: '例如：报告生成 Workflow',
    summaryPlaceholder: '说明这个流程从什么输入开始、最终交付什么结果。',
    tagsPlaceholder: 'workflow, sop, langgraph',
    useCasesLabel: '使用场景',
    useCasesPlaceholder: '每行一个场景，例如：\n从资料生成报告\n多节点审校\n自动化执行计划',
    entryNameLabel: 'Workflow 名 / 起点',
    entryNamePlaceholder: '例如 report_generation.start',
    capabilitiesLabel: '流程能力',
    capabilitiesPlaceholder: '每行一个能力，例如：\n资料解析\n章节生成\n质量检查\n导出交付',
    inputsLabel: '流程输入',
    inputsPlaceholder: '每行一种输入，例如：\nsourceFiles: File[]\nuserRequirements: string',
    outputsLabel: '流程输出',
    outputsPlaceholder: '每行一种输出，例如：\nreport.docx\nvalidationLog\nfinalSummary',
    constraintsLabel: '质量门 / 异常处理',
    constraintsPlaceholder: '每行一个约束，例如：\n每阶段必须可追踪\n失败要返回具体节点和原因',
    usageNotesLabel: '编排策略',
    usageNotesPlaceholder: '说明阶段顺序、并行/串行关系、人工确认点和完成标准。',
    examplesLabel: '流程示例',
    examplesPlaceholder: '输入：...\n阶段：A -> B -> C\n输出：...',
    contentLabel: 'Workflow 定义',
    contentPlaceholder: '粘贴流程图、节点说明、伪代码、状态机或 SOP。',
    template: {
      tags: ['workflow', 'sop'],
      useCases: [''],
      integration: {
        entryName: 'workflow.start',
        capabilities: [''],
        inputs: [''],
        outputs: [''],
        constraints: ['失败时输出具体阶段和错误原因'],
        usageNotes: '按阶段拆解任务，明确每一步输入、动作、输出和验收。'
      },
      examples: [],
      content: `# Workflow\n\n## Goal\n\n## Inputs\n- \n\n## Stages\n1. \n2. \n3. \n\n## Data Flow\n- \n\n## Quality Gates\n- \n\n## Failure Handling\n- \n\n## Final Outputs\n- `
    }
  },
  reference: {
    name: 'Reference 参考资料',
    description: '保存不会被当作工具执行的背景资料、规范、案例、术语表或外部文档摘要。',
    formatBullets: ['正文保留关键原文或整理后的事实', '入口写资料名、版本或来源', '能力字段记录它能提供什么上下文', '约束字段记录时效、引用和不可推断范围'],
    titlePlaceholder: '例如：ICH M10 关键要求摘要',
    summaryPlaceholder: '说明资料主题、来源、适用范围和更新日期。',
    tagsPlaceholder: 'reference, standard, domain',
    useCasesLabel: '引用场景',
    useCasesPlaceholder: '每行一个引用场景，例如：\n生成合规检查提示词\n补充领域术语\n对齐报告口径',
    entryNameLabel: '来源 / 版本',
    entryNamePlaceholder: '例如 ICH M10 / 2022',
    capabilitiesLabel: '提供的上下文',
    capabilitiesPlaceholder: '每行一种上下文，例如：\n术语定义\n验收标准\n领域背景',
    inputsLabel: '引用条件',
    inputsPlaceholder: '每行一个条件，例如：\n当任务涉及生物分析方法验证\n当需要专业术语表',
    outputsLabel: '可支持输出',
    outputsPlaceholder: '每行一种输出，例如：\n术语一致性检查\n标准化约束\n事实依据',
    constraintsLabel: '引用限制',
    constraintsPlaceholder: '每行一个限制，例如：\n可能过期，需要人工确认\n不能扩展到未覆盖场景',
    usageNotesLabel: '引用方式',
    usageNotesPlaceholder: '说明如何引用、优先级、需要保留的措辞和不应推断的内容。',
    examplesLabel: '引用示例',
    examplesPlaceholder: '任务：...\n应引用：...\n不应引用：...',
    contentLabel: '参考内容',
    contentPlaceholder: '粘贴资料摘要、规范条款、术语表、案例或事实清单。',
    template: {
      tags: ['reference'],
      useCases: [''],
      integration: {
        entryName: '',
        capabilities: [''],
        inputs: [''],
        outputs: [''],
        constraints: ['仅作为参考资料，不代表实时最新事实'],
        usageNotes: '生成提示词时将其作为背景资料或事实约束；如涉及时效信息，应提醒人工确认。'
      },
      examples: [],
      content: `# Reference\n\n## Source / Version\n\n## Scope\n\n## Key Facts\n- \n\n## Terms\n- \n\n## Usage Rules\n- \n\n## Limitations\n- `
    }
  },
  agent: createSimpleFormat('agent', 'Agent 智能体', '记录一个带目标、工具、记忆、计划和停止条件的可复用智能体配置。', ['身份与目标', '系统指令', '工具清单', '记忆策略', '计划策略', '停止条件', '失败处理', '输出契约']),
  tool: createSimpleFormat('tool', 'Tool 工具', '记录单个轻量工具能力，比 MCP 更小，关注参数、返回、前置条件和副作用。', ['工具名', '用途', '参数', '返回值', '前置条件', '副作用', '失败回退', '示例']),
  template: createSimpleFormat('template', 'Template 模板', '记录结构骨架和变量槽位，可被 Prompt、Workflow 或文档生成复用。', ['章节结构', '变量槽位', '填充规则', '变体', '输出格式', '约束']),
  evaluator: createSimpleFormat('evaluator', 'Evaluator 评估器', '记录用于评估提示词或模型输出的维度、评分标准、阈值和审查方式。', ['评估目标', '维度', '评分标准', '通过阈值', '失败样例', '审查模式', '输出格式']),
  dataset: createSimpleFormat('dataset', 'Dataset / Example Set', '记录 few-shot 样例、正反例、标签和测试集拆分策略。', ['用途', '样例结构', '正例', '反例', '标签', '拆分策略', '质量备注']),
  policy: createSimpleFormat('policy', 'Policy / Guardrail', '记录安全、合规、风格或业务边界规则，以及触发、执行和升级策略。', ['规则域', '规则', '触发条件', '执行方式', '升级策略', '拒答风格', '示例']),
  memory: createSimpleFormat('memory', 'Memory 记忆', '记录长期可复用事实、偏好、项目约定、可信度和失效规则。', ['事实', '偏好', '项目约定', '适用范围', '可信度', '更新时间', '失效规则']),
  connector: createSimpleFormat('connector', 'Connector 连接器', '记录外部服务连接方式、认证、端点、权限、数据边界和运维约束。', ['服务名', '端点', '认证', '环境变量', '权限范围', '数据边界', '速率限制', '运维备注']),
  parser: createSimpleFormat('parser', 'Parser / Extractor', '记录输入类型、提取字段、清洗规则、输出 schema、校验和失败处理。', ['输入类型', '提取字段', '清洗规则', '输出 Schema', '校验规则', '失败处理']),
  benchmark: createSimpleFormat('benchmark', 'Benchmark 基准测试', '记录用于回归测试 Prompt、Skill 或 Agent 的任务、输入、期望输出和指标。', ['目标对象', '测试任务', '输入集', '期望输出', '指标', '回归记录'])
};

export const BUILT_IN_DIRECTIONS: OptimizationDirection[] = [
  { id: 'structured', name: '结构化', description: '重组为角色、背景、任务、约束、输出格式等清晰区块。', builtIn: true },
  { id: 'constraints', name: '约束增强', description: '补足边界、禁止事项、优先级和失败处理。', builtIn: true },
  { id: 'actionability', name: '可执行性增强', description: '把模糊意图拆成可执行步骤和明确交付物。', builtIn: true },
  { id: 'evaluation', name: '评估标准增强', description: '加入验收标准、打分维度和质量检查清单。', builtIn: true },
  { id: 'counterexamples', name: '反例边界增强', description: '补充反例、非目标范围和容易误判的边界条件。', builtIn: true },
  { id: 'tooling', name: '工具调用适配', description: '让提示词更适合结合工具、SDK、MCP 或外部上下文执行。', builtIn: true },
  { id: 'long-context', name: '长上下文压缩', description: '优化长资料场景下的信息筛选、压缩和引用方式。', builtIn: true },
  { id: 'multi-turn', name: '多轮协作优化', description: '强化澄清、迭代、版本管理和多轮对话策略。', builtIn: true }
];

export const createBlankAsset = (type: AssetType = 'prompt'): PromptAsset => {
  const now = Date.now();
  const asset = {
    id: createId(),
    type,
    title: '',
    summary: '',
    content: '',
    tags: [],
    useCases: [],
    integration: {
      entryName: '',
      capabilities: [],
      inputs: [],
      outputs: [],
      constraints: [],
      usageNotes: ''
    },
    schema: createDefaultAssetSchema(type),
    examples: [],
    createdAt: now,
    updatedAt: now
  };
  return applyAssetFormatTemplate(asset, type);
};

export const applyAssetFormatTemplate = (
  asset: PromptAsset,
  type: AssetType = asset.type,
  overwrite = false
): PromptAsset => {
  const format = ASSET_TYPE_FORMATS[type];
  const template = format.template;
  return {
    ...asset,
    type,
    tags: overwrite || asset.tags.length === 0 ? template.tags.filter(Boolean) : asset.tags,
    useCases: overwrite || asset.useCases.length === 0 ? template.useCases.filter(Boolean) : asset.useCases,
    integration: {
      entryName: overwrite || !asset.integration.entryName ? template.integration.entryName : asset.integration.entryName,
      capabilities: overwrite || asset.integration.capabilities.length === 0 ? template.integration.capabilities.filter(Boolean) : asset.integration.capabilities,
      inputs: overwrite || asset.integration.inputs.length === 0 ? template.integration.inputs.filter(Boolean) : asset.integration.inputs,
      outputs: overwrite || asset.integration.outputs.length === 0 ? template.integration.outputs.filter(Boolean) : asset.integration.outputs,
      constraints: overwrite || asset.integration.constraints.length === 0 ? template.integration.constraints.filter(Boolean) : asset.integration.constraints,
      usageNotes: overwrite || !asset.integration.usageNotes ? template.integration.usageNotes : asset.integration.usageNotes
    },
    schema: overwrite || !asset.schema ? createDefaultAssetSchema(type) : normalizeAssetSchema(type, asset.schema),
    examples: overwrite || asset.examples.length === 0 ? template.examples.filter(Boolean) : asset.examples,
    content: overwrite || !asset.content.trim() ? template.content : asset.content,
    updatedAt: Date.now()
  };
};

export const createAssetDraftFromText = (name: string, content: string, type: AssetType = 'reference'): PromptAsset => {
  const cleanedName = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  const firstLine = content.split('\n').map(line => line.trim()).find(Boolean) || cleanedName || '未命名资产';
  return {
    ...applyAssetFormatTemplate(createBlankAsset(type), type),
    title: cleanedName || firstLine.slice(0, 32),
    summary: firstLine.slice(0, 160),
    content
  };
};

export const parseList = (value: string): string[] => {
  return value
    .split(/[,，\n]/)
    .map(item => item.trim())
    .filter(Boolean);
};

export const listToText = (items: string[] = []): string => items.join(', ');

export const normalizeImportedAsset = (asset: Partial<PromptAsset>): PromptAsset => {
  const now = Date.now();
  const type = isAssetType(asset.type) ? asset.type : 'reference';
  return {
    ...createBlankAsset(type),
    ...asset,
    id: asset.id || createId(),
    type,
    title: asset.title || '未命名资产',
    summary: asset.summary || '',
    content: asset.content || '',
    tags: Array.isArray(asset.tags) ? asset.tags : [],
    useCases: Array.isArray(asset.useCases) ? asset.useCases : [],
    examples: Array.isArray(asset.examples) ? asset.examples : [],
    integration: {
      entryName: asset.integration?.entryName || '',
      capabilities: Array.isArray(asset.integration?.capabilities) ? asset.integration.capabilities : [],
      inputs: Array.isArray(asset.integration?.inputs) ? asset.integration.inputs : [],
      outputs: Array.isArray(asset.integration?.outputs) ? asset.integration.outputs : [],
      constraints: Array.isArray(asset.integration?.constraints) ? asset.integration.constraints : [],
      usageNotes: asset.integration?.usageNotes || ''
    },
    schema: normalizeAssetSchema(type, asset.schema),
    createdAt: asset.createdAt || now,
    updatedAt: now
  };
};

export const mergeImportedAssets = (current: PromptAsset[], incoming: PromptAsset[]): PromptAsset[] => {
  const byId = new Map(current.map(asset => [asset.id, asset]));
  incoming.forEach(asset => {
    byId.set(asset.id, { ...(byId.get(asset.id) || asset), ...asset, updatedAt: Date.now() });
  });
  return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
};

export const recommendAssets = (
  assets: PromptAsset[],
  query: string,
  directionNames: string[],
  limit = 5
): PromptAsset[] => {
  const tokens = tokenize([query, ...directionNames].join(' '));
  if (tokens.length === 0) return assets.slice(0, limit);

  return assets
    .map(asset => ({ asset, score: scoreAsset(asset, tokens) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || b.asset.updatedAt - a.asset.updatedAt)
    .slice(0, limit)
    .map(item => item.asset);
};

export const formatAssetForModel = (asset: PromptAsset): string => {
  const schema = normalizeAssetSchema(asset.type, asset.schema);
  const sections = [
    `标题: ${asset.title}`,
    `类型: ${ASSET_TYPE_LABELS[asset.type]}`,
    asset.summary ? `摘要: ${asset.summary}` : '',
    asset.tags.length ? `标签: ${asset.tags.join(', ')}` : '',
    asset.useCases.length ? `适用场景: ${asset.useCases.join('；')}` : '',
    asset.integration.entryName ? `入口/名称: ${asset.integration.entryName}` : '',
    asset.integration.capabilities.length ? `能力: ${asset.integration.capabilities.join('；')}` : '',
    asset.integration.inputs.length ? `输入: ${asset.integration.inputs.join('；')}` : '',
    asset.integration.outputs.length ? `输出: ${asset.integration.outputs.join('；')}` : '',
    asset.integration.constraints.length ? `约束: ${asset.integration.constraints.join('；')}` : '',
    asset.integration.usageNotes ? `使用说明: ${asset.integration.usageNotes}` : '',
    `结构化架构:\n${formatSchemaForModel(asset.type, schema)}`,
    asset.examples.length ? `示例: ${asset.examples.join('\n---\n')}` : '',
    asset.content ? `正文:\n${asset.content}` : ''
  ];
  return sections.filter(Boolean).join('\n');
};

export const createDefaultAssetSchema = (type: AssetType): AssetSchema => {
  switch (type) {
    case 'prompt':
      return {
        role: '',
        context: '',
        task: '',
        variables: ['{{输入}}'],
        constraints: [],
        outputFormat: '',
        evaluationCriteria: [],
        antiPatterns: []
      } satisfies PromptAssetSchema;
    case 'skill':
      return {
        trigger: {
          description: '',
          explicitInvocations: [],
          implicitSignals: [],
          avoidWhen: []
        },
        packageStructure: ['SKILL.md', 'references/', 'scripts/', 'assets/', 'agents/openai.yaml', 'mcp/'],
        resources: {
          skillMd: '精简入口：触发、边界、流程、资源索引、验证方式',
          references: [],
          scripts: [],
          assets: [],
          agents: [],
          mcp: []
        },
        workflow: [],
        boundaries: [],
        validation: ['检查触发是否准确', '检查上下文加载是否渐进', '检查输出是否可验收'],
        handoff: []
      } satisfies SkillAssetSchema;
    case 'mcp':
      return {
        server: {
          name: '',
          transport: 'unknown',
          auth: '',
          runtime: ''
        },
        tools: [
          {
            name: '',
            description: '',
            inputSchema: '',
            outputSchema: '',
            annotations: []
          }
        ],
        resources: [],
        prompts: [],
        errorHandling: [],
        security: [],
        evaluations: []
      } satisfies McpAssetSchema;
    case 'sdk':
      return {
        package: {
          name: '',
          language: '',
          version: '',
          install: ''
        },
        initialization: '',
        auth: '',
        coreMethods: [
          {
            name: '',
            purpose: '',
            parameters: [],
            returns: [],
            errors: []
          }
        ],
        examples: [],
        compatibility: [],
        testing: []
      } satisfies SdkAssetSchema;
    case 'workflow':
      return {
        goal: '',
        actors: [],
        triggers: [],
        inputs: [],
        stages: [
          {
            name: '',
            objective: '',
            actions: [],
            outputs: [],
            qualityGate: []
          }
        ],
        state: [],
        failureHandling: [],
        finalOutputs: []
      } satisfies WorkflowAssetSchema;
    case 'reference':
      return {
        source: '',
        version: '',
        scope: '',
        keyFacts: [],
        terminology: [],
        citationRules: [],
        limitations: [],
        freshness: ''
      } satisfies ReferenceAssetSchema;
    case 'agent':
      return {
        identity: '',
        goals: [],
        instructions: [],
        tools: [],
        memoryStrategy: '',
        planningStrategy: '',
        stopConditions: [],
        failureHandling: [],
        outputContract: ''
      } satisfies AgentAssetSchema;
    case 'tool':
      return {
        name: '',
        purpose: '',
        parameters: [],
        returns: [],
        preconditions: [],
        sideEffects: [],
        fallback: [],
        examples: []
      } satisfies ToolAssetSchema;
    case 'template':
      return {
        structure: [],
        slots: [],
        fillRules: [],
        variants: [],
        outputFormat: '',
        constraints: []
      } satisfies TemplateAssetSchema;
    case 'evaluator':
      return {
        target: '',
        dimensions: [],
        scoringRubric: [],
        passThreshold: '',
        failureCases: [],
        reviewMode: 'hybrid',
        outputFormat: ''
      } satisfies EvaluatorAssetSchema;
    case 'dataset':
      return {
        purpose: '',
        itemSchema: '',
        positiveExamples: [],
        negativeExamples: [],
        labels: [],
        splitStrategy: '',
        qualityNotes: []
      } satisfies DatasetAssetSchema;
    case 'policy':
      return {
        domain: '',
        rules: [],
        triggers: [],
        enforcement: [],
        escalation: [],
        refusalStyle: '',
        examples: []
      } satisfies PolicyAssetSchema;
    case 'memory':
      return {
        facts: [],
        preferences: [],
        projectConventions: [],
        scope: '',
        confidence: '',
        updatedAtText: '',
        invalidationRules: []
      } satisfies MemoryAssetSchema;
    case 'connector':
      return {
        service: '',
        endpoints: [],
        auth: '',
        environment: [],
        permissions: [],
        dataBoundaries: [],
        rateLimits: [],
        operationalNotes: []
      } satisfies ConnectorAssetSchema;
    case 'parser':
      return {
        inputTypes: [],
        extractionFields: [],
        cleaningRules: [],
        outputSchema: '',
        validationRules: [],
        failureHandling: []
      } satisfies ParserAssetSchema;
    case 'benchmark':
      return {
        target: '',
        tasks: [],
        inputs: [],
        expectedOutputs: [],
        metrics: [],
        regressionNotes: []
      } satisfies BenchmarkAssetSchema;
  }
};

export const normalizeAssetSchema = (type: AssetType, schema?: AssetSchema): AssetSchema => {
  const defaults = createDefaultAssetSchema(type);
  if (!schema || typeof schema !== 'object') return defaults;
  switch (type) {
    case 'prompt': {
      const source = schema as Partial<PromptAssetSchema>;
      return {
        ...defaults as PromptAssetSchema,
        ...source,
        variables: normalizeArray(source.variables),
        constraints: normalizeArray(source.constraints),
        evaluationCriteria: normalizeArray(source.evaluationCriteria),
        antiPatterns: normalizeArray(source.antiPatterns)
      };
    }
    case 'skill': {
      const source = schema as Partial<SkillAssetSchema>;
      const defaultSkill = defaults as SkillAssetSchema;
      return {
        ...defaultSkill,
        ...source,
        trigger: {
          ...defaultSkill.trigger,
          ...source.trigger,
          explicitInvocations: normalizeArray(source.trigger?.explicitInvocations),
          implicitSignals: normalizeArray(source.trigger?.implicitSignals),
          avoidWhen: normalizeArray(source.trigger?.avoidWhen)
        },
        packageStructure: normalizeArray(source.packageStructure, defaultSkill.packageStructure),
        resources: {
          ...defaultSkill.resources,
          ...source.resources,
          references: normalizeArray(source.resources?.references),
          scripts: normalizeArray(source.resources?.scripts),
          assets: normalizeArray(source.resources?.assets),
          agents: normalizeArray(source.resources?.agents),
          mcp: normalizeArray(source.resources?.mcp)
        },
        workflow: normalizeArray(source.workflow),
        boundaries: normalizeArray(source.boundaries),
        validation: normalizeArray(source.validation, defaultSkill.validation),
        handoff: normalizeArray(source.handoff)
      };
    }
    case 'mcp': {
      const source = schema as Partial<McpAssetSchema>;
      const defaultMcp = defaults as McpAssetSchema;
      return {
        ...defaultMcp,
        ...source,
        server: { ...defaultMcp.server, ...source.server },
        tools: Array.isArray(source.tools) && source.tools.length ? source.tools.map(tool => ({
          name: tool.name || '',
          description: tool.description || '',
          inputSchema: tool.inputSchema || '',
          outputSchema: tool.outputSchema || '',
          annotations: normalizeArray(tool.annotations)
        })) : defaultMcp.tools,
        resources: normalizeArray(source.resources),
        prompts: normalizeArray(source.prompts),
        errorHandling: normalizeArray(source.errorHandling),
        security: normalizeArray(source.security),
        evaluations: normalizeArray(source.evaluations)
      };
    }
    case 'sdk': {
      const source = schema as Partial<SdkAssetSchema>;
      const defaultSdk = defaults as SdkAssetSchema;
      return {
        ...defaultSdk,
        ...source,
        package: { ...defaultSdk.package, ...source.package },
        coreMethods: Array.isArray(source.coreMethods) && source.coreMethods.length ? source.coreMethods.map(method => ({
          name: method.name || '',
          purpose: method.purpose || '',
          parameters: normalizeArray(method.parameters),
          returns: normalizeArray(method.returns),
          errors: normalizeArray(method.errors)
        })) : defaultSdk.coreMethods,
        examples: normalizeArray(source.examples),
        compatibility: normalizeArray(source.compatibility),
        testing: normalizeArray(source.testing)
      };
    }
    case 'workflow': {
      const source = schema as Partial<WorkflowAssetSchema>;
      const defaultWorkflow = defaults as WorkflowAssetSchema;
      return {
        ...defaultWorkflow,
        ...source,
        actors: normalizeArray(source.actors),
        triggers: normalizeArray(source.triggers),
        inputs: normalizeArray(source.inputs),
        stages: Array.isArray(source.stages) && source.stages.length ? source.stages.map(stage => ({
          name: stage.name || '',
          objective: stage.objective || '',
          actions: normalizeArray(stage.actions),
          outputs: normalizeArray(stage.outputs),
          qualityGate: normalizeArray(stage.qualityGate)
        })) : defaultWorkflow.stages,
        state: normalizeArray(source.state),
        failureHandling: normalizeArray(source.failureHandling),
        finalOutputs: normalizeArray(source.finalOutputs)
      };
    }
    case 'reference': {
      const source = schema as Partial<ReferenceAssetSchema>;
      return {
        ...defaults as ReferenceAssetSchema,
        ...source,
        keyFacts: normalizeArray(source.keyFacts),
        terminology: normalizeArray(source.terminology),
        citationRules: normalizeArray(source.citationRules),
        limitations: normalizeArray(source.limitations)
      };
    }
    case 'agent':
    case 'tool':
    case 'template':
    case 'evaluator':
    case 'dataset':
    case 'policy':
    case 'memory':
    case 'connector':
    case 'parser':
    case 'benchmark':
      return normalizeGenericSchema(defaults, schema);
  }
};

const formatSchemaForModel = (type: AssetType, schema: AssetSchema): string => {
  switch (type) {
    case 'prompt': {
      const prompt = schema as PromptAssetSchema;
      return [
        prompt.role ? `角色: ${prompt.role}` : '',
        prompt.context ? `背景: ${prompt.context}` : '',
        prompt.task ? `任务: ${prompt.task}` : '',
        prompt.variables.length ? `变量: ${prompt.variables.join('；')}` : '',
        prompt.constraints.length ? `约束: ${prompt.constraints.join('；')}` : '',
        prompt.outputFormat ? `输出格式: ${prompt.outputFormat}` : '',
        prompt.evaluationCriteria.length ? `评价标准: ${prompt.evaluationCriteria.join('；')}` : '',
        prompt.antiPatterns.length ? `反模式: ${prompt.antiPatterns.join('；')}` : ''
      ].filter(Boolean).join('\n');
    }
    case 'skill': {
      const skill = schema as SkillAssetSchema;
      return [
        `触发描述: ${skill.trigger.description}`,
        skill.trigger.explicitInvocations.length ? `显式触发: ${skill.trigger.explicitInvocations.join('；')}` : '',
        skill.trigger.implicitSignals.length ? `隐式信号: ${skill.trigger.implicitSignals.join('；')}` : '',
        skill.trigger.avoidWhen.length ? `避免触发: ${skill.trigger.avoidWhen.join('；')}` : '',
        skill.packageStructure.length ? `目录结构: ${skill.packageStructure.join(' / ')}` : '',
        `SKILL.md 职责: ${skill.resources.skillMd}`,
        skill.resources.references.length ? `references: ${skill.resources.references.join('；')}` : '',
        skill.resources.scripts.length ? `scripts: ${skill.resources.scripts.join('；')}` : '',
        skill.resources.assets.length ? `assets: ${skill.resources.assets.join('；')}` : '',
        skill.resources.agents.length ? `agents: ${skill.resources.agents.join('；')}` : '',
        skill.resources.mcp.length ? `mcp: ${skill.resources.mcp.join('；')}` : '',
        skill.workflow.length ? `工作流: ${skill.workflow.join(' -> ')}` : '',
        skill.boundaries.length ? `边界: ${skill.boundaries.join('；')}` : '',
        skill.validation.length ? `验证: ${skill.validation.join('；')}` : '',
        skill.handoff.length ? `交接: ${skill.handoff.join('；')}` : ''
      ].filter(Boolean).join('\n');
    }
    case 'mcp': {
      const mcp = schema as McpAssetSchema;
      return [
        `Server: ${mcp.server.name}`,
        `Transport: ${mcp.server.transport}`,
        mcp.server.runtime ? `Runtime: ${mcp.server.runtime}` : '',
        mcp.server.auth ? `Auth: ${mcp.server.auth}` : '',
        `Tools:\n${mcp.tools.map(tool => `- ${tool.name}: ${tool.description}\n  input: ${tool.inputSchema}\n  output: ${tool.outputSchema}\n  annotations: ${tool.annotations.join(', ')}`).join('\n')}`,
        mcp.resources.length ? `Resources: ${mcp.resources.join('；')}` : '',
        mcp.prompts.length ? `Prompts: ${mcp.prompts.join('；')}` : '',
        mcp.errorHandling.length ? `Error Handling: ${mcp.errorHandling.join('；')}` : '',
        mcp.security.length ? `Security: ${mcp.security.join('；')}` : '',
        mcp.evaluations.length ? `Evaluations: ${mcp.evaluations.join('；')}` : ''
      ].filter(Boolean).join('\n');
    }
    case 'sdk': {
      const sdk = schema as SdkAssetSchema;
      return [
        `Package: ${sdk.package.name}`,
        sdk.package.language ? `Language: ${sdk.package.language}` : '',
        sdk.package.version ? `Version: ${sdk.package.version}` : '',
        sdk.package.install ? `Install: ${sdk.package.install}` : '',
        sdk.initialization ? `Initialization: ${sdk.initialization}` : '',
        sdk.auth ? `Auth: ${sdk.auth}` : '',
        `Core Methods:\n${sdk.coreMethods.map(method => `- ${method.name}: ${method.purpose}\n  params: ${method.parameters.join('；')}\n  returns: ${method.returns.join('；')}\n  errors: ${method.errors.join('；')}`).join('\n')}`,
        sdk.examples.length ? `Examples: ${sdk.examples.join('\n---\n')}` : '',
        sdk.compatibility.length ? `Compatibility: ${sdk.compatibility.join('；')}` : '',
        sdk.testing.length ? `Testing: ${sdk.testing.join('；')}` : ''
      ].filter(Boolean).join('\n');
    }
    case 'workflow': {
      const workflow = schema as WorkflowAssetSchema;
      return [
        workflow.goal ? `Goal: ${workflow.goal}` : '',
        workflow.actors.length ? `Actors: ${workflow.actors.join('；')}` : '',
        workflow.triggers.length ? `Triggers: ${workflow.triggers.join('；')}` : '',
        workflow.inputs.length ? `Inputs: ${workflow.inputs.join('；')}` : '',
        `Stages:\n${workflow.stages.map(stage => `- ${stage.name}: ${stage.objective}\n  actions: ${stage.actions.join('；')}\n  outputs: ${stage.outputs.join('；')}\n  quality gate: ${stage.qualityGate.join('；')}`).join('\n')}`,
        workflow.state.length ? `State: ${workflow.state.join('；')}` : '',
        workflow.failureHandling.length ? `Failure Handling: ${workflow.failureHandling.join('；')}` : '',
        workflow.finalOutputs.length ? `Final Outputs: ${workflow.finalOutputs.join('；')}` : ''
      ].filter(Boolean).join('\n');
    }
    case 'reference': {
      const reference = schema as ReferenceAssetSchema;
      return [
        reference.source ? `Source: ${reference.source}` : '',
        reference.version ? `Version: ${reference.version}` : '',
        reference.scope ? `Scope: ${reference.scope}` : '',
        reference.keyFacts.length ? `Key Facts: ${reference.keyFacts.join('；')}` : '',
        reference.terminology.length ? `Terminology: ${reference.terminology.join('；')}` : '',
        reference.citationRules.length ? `Citation Rules: ${reference.citationRules.join('；')}` : '',
        reference.limitations.length ? `Limitations: ${reference.limitations.join('；')}` : '',
        reference.freshness ? `Freshness: ${reference.freshness}` : ''
      ].filter(Boolean).join('\n');
    }
    case 'agent':
    case 'tool':
    case 'template':
    case 'evaluator':
    case 'dataset':
    case 'policy':
    case 'memory':
    case 'connector':
    case 'parser':
    case 'benchmark':
      return formatGenericSchema(schema);
  }
};

const normalizeArray = (value: unknown, fallback: string[] = []): string[] => {
  return Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : fallback;
};

const normalizeGenericSchema = (defaults: AssetSchema, source: AssetSchema): AssetSchema => {
  const defaultRecord = defaults as unknown as Record<string, unknown>;
  const sourceRecord = source as unknown as Record<string, unknown>;
  const normalized: Record<string, unknown> = { ...defaultRecord, ...sourceRecord };
  Object.entries(defaultRecord).forEach(([key, value]) => {
    const incoming = sourceRecord[key];
    if (Array.isArray(value)) normalized[key] = normalizeArray(incoming);
    else if (typeof value === 'string') normalized[key] = typeof incoming === 'string' ? incoming : '';
  });
  return normalized as unknown as AssetSchema;
};

const formatGenericSchema = (schema: AssetSchema): string => {
  return Object.entries(schema as unknown as Record<string, unknown>)
    .map(([key, value]) => {
      if (Array.isArray(value)) return value.length ? `${key}: ${value.join('；')}` : '';
      if (typeof value === 'string') return value ? `${key}: ${value}` : '';
      return value ? `${key}: ${JSON.stringify(value)}` : '';
    })
    .filter(Boolean)
    .join('\n');
};

const scoreAsset = (asset: PromptAsset, tokens: string[]): number => {
  const fields = [
    asset.title,
    asset.summary,
    asset.tags.join(' '),
    asset.useCases.join(' '),
    asset.integration.entryName,
    asset.integration.capabilities.join(' '),
    asset.schema ? JSON.stringify(asset.schema) : '',
    asset.content.slice(0, 4000)
  ].join(' ').toLowerCase();

  return tokens.reduce((score, token) => {
    if (!token) return score;
    const exactBoost = fields.includes(token) ? 2 : 0;
    const titleBoost = asset.title.toLowerCase().includes(token) ? 3 : 0;
    const tagBoost = asset.tags.some(tag => tag.toLowerCase().includes(token)) ? 2 : 0;
    return score + exactBoost + titleBoost + tagBoost;
  }, 0);
};

const tokenize = (value: string): string[] => {
  const normalized = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  const words = normalized.split(/\s+/).filter(token => token.length >= 2);
  const chineseChunks = Array.from(value.matchAll(/[\u4e00-\u9fa5]{2,}/g)).map(match => match[0]);
  return Array.from(new Set([...words, ...chineseChunks])).slice(0, 80);
};

const isAssetType = (value: unknown): value is AssetType => {
  return Object.prototype.hasOwnProperty.call(ASSET_TYPE_LABELS, String(value));
};

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
