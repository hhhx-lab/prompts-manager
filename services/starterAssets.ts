import {
  AgentAssetSchema,
  AssetIntegration,
  BenchmarkAssetSchema,
  ConnectorAssetSchema,
  DatasetAssetSchema,
  EvaluatorAssetSchema,
  McpAssetSchema,
  MemoryAssetSchema,
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

const STARTER_CREATED_AT = 1764288000000;
const STARTER_V1_MAX_ORDER = 32;
export const STARTER_ASSET_PACK_VERSION = 2;

const integration = (
  entryName: string,
  capabilities: string[],
  inputs: string[],
  outputs: string[],
  constraints: string[],
  usageNotes: string
): AssetIntegration => ({
  entryName,
  capabilities,
  inputs,
  outputs,
  constraints,
  usageNotes
});

const starterAsset = (
  order: number,
  asset: Omit<PromptAsset, 'createdAt' | 'updatedAt'>
): PromptAsset => ({
  ...asset,
  createdAt: STARTER_CREATED_AT + order * 1000,
  updatedAt: STARTER_CREATED_AT + order * 1000
});

export const getStarterAssetIntroducedVersion = (asset: PromptAsset) =>
  asset.createdAt <= STARTER_CREATED_AT + STARTER_V1_MAX_ORDER * 1000 ? 1 : 2;

const makePromptSchema = (
  role: string,
  context: string,
  task: string,
  variables: string[],
  constraints: string[],
  outputFormat: string,
  evaluationCriteria: string[],
  antiPatterns: string[]
): PromptAssetSchema => ({
  role,
  context,
  task,
  variables,
  constraints,
  outputFormat,
  evaluationCriteria,
  antiPatterns
});

const makeSkillSchema = (
  description: string,
  workflow: string[],
  options: Partial<Omit<SkillAssetSchema, 'trigger' | 'resources'>> & {
    trigger?: Partial<SkillAssetSchema['trigger']>;
    resources?: Partial<SkillAssetSchema['resources']>;
  } = {}
): SkillAssetSchema => ({
  trigger: {
    description,
    explicitInvocations: options.trigger?.explicitInvocations ?? [],
    implicitSignals: options.trigger?.implicitSignals ?? [],
    avoidWhen: options.trigger?.avoidWhen ?? []
  },
  packageStructure: options.packageStructure ?? ['SKILL.md', 'references/', 'scripts/', 'assets/', 'agents/openai.yaml', 'mcp/'],
  resources: {
    skillMd: options.resources?.skillMd ?? '精简入口：触发、边界、流程、资源索引和验证说明。',
    references: options.resources?.references ?? [],
    scripts: options.resources?.scripts ?? [],
    assets: options.resources?.assets ?? [],
    agents: options.resources?.agents ?? [],
    mcp: options.resources?.mcp ?? []
  },
  workflow,
  boundaries: options.boundaries ?? ['只作为可引用工程上下文，不代表当前运行时已安装该 Skill。'],
  validation: options.validation ?? ['触发边界清晰', '输出可复核', '必要时有 smoke test 或检查清单'],
  handoff: options.handoff ?? ['需要外部工具时转交 MCP/Tool 资产', '需要实现时转交工程工作流']
});

const makeSdkSchema = (
  name: string,
  language: string,
  version: string,
  install: string,
  initialization: string,
  methodName: string,
  purpose: string,
  parameters: string[],
  returns: string[],
  errors: string[],
  compatibility: string[],
  testing: string[]
): SdkAssetSchema => ({
  package: { name, language, version, install },
  initialization,
  auth: '密钥和 token 只放服务端或本地安全环境；前端不得直接暴露。',
  coreMethods: [{ name: methodName, purpose, parameters, returns, errors }],
  examples: [`${methodName} 用于 ${purpose}`],
  compatibility,
  testing
});

const makeToolSchema = (
  name: string,
  purpose: string,
  parameters: string[],
  returns: string[],
  preconditions: string[],
  sideEffects: string[],
  fallback: string[],
  examples: string[]
): ToolAssetSchema => ({
  name,
  purpose,
  parameters,
  returns,
  preconditions,
  sideEffects,
  fallback,
  examples
});

const makeReferenceSchema = (
  source: string,
  scope: string,
  keyFacts: string[],
  limitations: string[]
): ReferenceAssetSchema => ({
  source,
  version: '2026-05-28 查询',
  scope,
  keyFacts,
  terminology: ['资产上下文: 可被提示词引用的结构化能力说明', '运行时能力: 已实际安装、授权并可调用的工具或服务'],
  citationRules: ['优化提示词时保留来源 URL 或本地路径', '高时效信息需要重新确认'],
  limitations,
  freshness: 'GitHub 仓库元数据和本地配置会变化，使用前应按需刷新。'
});

export const STARTER_ASSETS: PromptAsset[] = [
  starterAsset(1, {
    id: 'starter-prompt-requirement-to-spec',
    type: 'prompt',
    title: '需求澄清到工程规格 Prompt',
    summary: '把一句模糊需求转成可执行的工程规格，适合功能规划、改造计划和交付前澄清。',
    content: `# 角色
你是资深产品工程师和提示词工程师。

# 任务
把用户的原始需求整理成可执行规格，先澄清不确定点，再给出最小可行实现路径。

# 输出
1. 目标和非目标
2. 用户故事
3. 输入、处理、输出
4. 关键边界和风险
5. 验收清单
6. 下一步实施计划`,
    tags: ['prompt', 'requirement', 'spec'],
    useCases: ['把自然语言需求整理为开发规格', '编写功能改造计划', '对齐提示词优化目标'],
    integration: integration(
      'prompt.requirement_to_spec',
      ['需求澄清', '范围定义', '验收标准生成'],
      ['原始需求', '业务背景', '约束条件'],
      ['工程规格', '风险清单', '验收清单'],
      ['缺失信息必须显式列出', '不得替用户虚构业务前提'],
      '适合在复杂任务开始前注入，帮助模型先把意图收束成可执行结构。'
    ),
    schema: {
      role: '资深产品工程师和提示词工程师',
      context: '用户给出模糊需求，需要转成可执行规格。',
      task: '澄清需求并生成工程规格。',
      variables: ['{{原始需求}}', '{{业务背景}}', '{{限制条件}}'],
      constraints: ['先列出缺失信息', '区分目标和非目标', '不要编造未给出的事实'],
      outputFormat: 'Markdown，包含目标、范围、流程、风险、验收清单。',
      evaluationCriteria: ['可执行', '边界清晰', '验收标准明确'],
      antiPatterns: ['直接给代码', '跳过澄清', '只输出泛泛建议']
    } satisfies PromptAssetSchema,
    examples: ['输入：我要做一个提示词库\n输出：目标、资产类型、用户流程、验收清单']
  }),
  starterAsset(2, {
    id: 'starter-prompt-long-context-compressor',
    type: 'prompt',
    title: '长资料压缩与引用 Prompt',
    summary: '把长文档、会议纪要或多附件压缩成可引用上下文，保留事实、出处和未确认项。',
    content: `# 角色
你是长上下文信息架构师。

# 任务
从资料中抽取和当前任务有关的事实，压缩为可引用上下文。

# 规则
- 保留事实来源或段落线索
- 区分事实、推断、待确认
- 不要覆盖原文含义
- 输出可直接插入后续提示词`,
    tags: ['prompt', 'long-context', 'reference'],
    useCases: ['压缩会议纪要', '整理附件上下文', '为优化提示词准备背景材料'],
    integration: integration(
      'prompt.long_context_compressor',
      ['事实抽取', '上下文压缩', '引用线索保留'],
      ['长资料', '目标问题', '优先级'],
      ['压缩摘要', '关键事实', '待确认项'],
      ['不得添加原文没有的结论', '时效信息必须标注'],
      '适合和 Reference、Dataset、Parser 资产一起注入。'
    ),
    schema: {
      role: '长上下文信息架构师',
      context: '需要从长资料中抽取任务相关上下文。',
      task: '压缩资料并保留可追踪事实。',
      variables: ['{{资料}}', '{{目标问题}}', '{{压缩预算}}'],
      constraints: ['保留来源线索', '区分事实和推断', '列出不确定项'],
      outputFormat: '摘要、关键事实、引用线索、待确认项。',
      evaluationCriteria: ['信息密度高', '无编造', '可追溯'],
      antiPatterns: ['全文复述', '丢失限制条件', '把推断写成事实']
    } satisfies PromptAssetSchema,
    examples: ['输入：一份会议纪要\n输出：和任务相关的 8 条事实、3 个风险、2 个待确认问题']
  }),
  starterAsset(3, {
    id: 'starter-skill-document-review',
    type: 'skill',
    title: '文档审校 Skill',
    summary: '用于审校中文正式文档，检查结构、术语、事实一致性、格式和可交付风险。',
    content: `# Skill

## 触发条件
- 用户要求审校、润色、检查正式文档
- 用户上传 Markdown、Word 或 PDF

## 执行步骤
1. 识别文档类型和交付目标
2. 检查结构完整性
3. 检查术语、事实、口径一致性
4. 输出问题清单和修改建议

## 质量门
- 问题必须可定位
- 建议必须可执行`,
    tags: ['skill', 'document', 'review'],
    useCases: ['正式文档审校', '报告交付前检查', '中文文档结构优化'],
    integration: integration(
      'skill.document_review',
      ['结构审校', '术语一致性检查', '交付风险识别'],
      ['文档正文', '目标读者', '格式要求'],
      ['问题清单', '修改建议', '风险提示'],
      ['不能替换成用户未确认的新事实', '重要事实需标注需要人工确认'],
      '当任务涉及正式文档交付时注入，作为审校流程和质量门。'
    ),
    schema: {
      trigger: {
        description: '用户需要审校、润色或检查正式文档时触发。',
        explicitInvocations: ['使用文档审校 Skill', '帮我审校这份文档'],
        implicitSignals: ['上传 Word/PDF/Markdown', '提到格式、口径、交付'],
        avoidWhen: ['只需要自由创作', '没有任何文档内容']
      },
      packageStructure: ['SKILL.md', 'references/style-guide.md', 'scripts/check_doc_structure.ts'],
      resources: {
        skillMd: '触发、边界、审校步骤和交付格式',
        references: ['style-guide.md', 'term-consistency.md'],
        scripts: ['check_doc_structure.ts'],
        assets: ['review-checklist.md'],
        agents: [],
        mcp: []
      },
      workflow: ['识别文档目标', '检查结构', '检查术语事实', '输出问题和建议'],
      boundaries: ['不编造事实', '不代替专业法律/医学审核'],
      validation: ['问题可定位', '建议可执行', '保留原文意图'],
      handoff: ['需要导出 Word/PDF 时交给文档工具链']
    } satisfies SkillAssetSchema,
    examples: ['用户：帮我检查这份报告是否能交付\n策略：先给问题清单，再给修改优先级']
  }),
  starterAsset(4, {
    id: 'starter-skill-code-review',
    type: 'skill',
    title: '代码评审 Skill',
    summary: '以审查姿态检查代码变更，优先找 bug、回归风险、缺失测试和架构边界问题。',
    content: `# Skill

## 触发条件
- 用户要求 review、审查、看看这段代码

## 输出顺序
1. 高风险问题
2. 中低风险问题
3. 测试缺口
4. 简短总结

## 原则
发现必须有文件/行号或可复现理由。`,
    tags: ['skill', 'code-review', 'engineering'],
    useCases: ['PR 前自查', '重构风险检查', '缺陷定位前审阅'],
    integration: integration(
      'skill.code_review',
      ['行为回归识别', '缺失测试识别', '风险排序'],
      ['diff', '相关文件', '测试输出'],
      ['评审发现', '开放问题', '测试建议'],
      ['发现优先于总结', '不能把风格偏好当作 bug'],
      '适合在代码改造后作为质量门注入。'
    ),
    schema: {
      trigger: {
        description: '用户要求 review 或检查代码风险时触发。',
        explicitInvocations: ['review 一下', '做代码评审'],
        implicitSignals: ['PR', 'diff', '改动风险', '测试失败'],
        avoidWhen: ['用户只要求解释概念', '没有代码上下文']
      },
      packageStructure: ['SKILL.md', 'references/review-rubric.md'],
      resources: {
        skillMd: '评审姿态、优先级和输出格式',
        references: ['review-rubric.md'],
        scripts: [],
        assets: ['finding-template.md'],
        agents: [],
        mcp: ['github.pr_comments']
      },
      workflow: ['读取 diff', '定位行为变化', '检查测试覆盖', '按严重度输出'],
      boundaries: ['不做无依据猜测', '不大段重写代码'],
      validation: ['每条发现可验证', '严重度排序合理'],
      handoff: ['需要修复时交给实现工作流']
    } satisfies SkillAssetSchema,
    examples: ['用户：review 这次资产库改造\n输出：P1/P2 发现、测试缺口、开放问题']
  }),
  starterAsset(5, {
    id: 'starter-mcp-github-readonly',
    type: 'mcp',
    title: 'GitHub 只读 MCP 引用',
    summary: '描述 GitHub MCP 只读能力，用于让提示词理解 issue、PR、CI、review 上下文。',
    content: `# MCP

## Server
github

## Tools
- get_pull_request
- list_review_comments
- list_workflow_runs

## Security
只读优先，破坏性动作必须人工确认。`,
    tags: ['mcp', 'github', 'readonly'],
    useCases: ['分析 PR 评论', '定位 CI 失败', '总结 issue 上下文'],
    integration: integration(
      'github.readonly',
      ['读取 PR 元数据', '读取 review 评论', '读取 CI 状态'],
      ['owner', 'repo', 'pullNumber', 'issueNumber'],
      ['metadata', 'comments', 'workflowStatus'],
      ['只读引用', '不得声称已经真实调用', '需要授权上下文'],
      '作为工具上下文注入，提示词可以规划如何使用，但不能假装已调用。'
    ),
    schema: {
      server: {
        name: 'github',
        transport: 'streamable-http',
        auth: 'OAuth 或 GITHUB_TOKEN',
        runtime: 'remote service'
      },
      tools: [
        {
          name: 'get_pull_request',
          description: '读取 PR 标题、描述、分支和状态。',
          inputSchema: '{ owner: string, repo: string, pullNumber: number }',
          outputSchema: '{ title: string, body: string, state: string, checks: Check[] }',
          annotations: ['readOnlyHint: true']
        },
        {
          name: 'list_review_comments',
          description: '读取 PR review 评论。',
          inputSchema: '{ owner: string, repo: string, pullNumber: number }',
          outputSchema: '{ comments: ReviewComment[] }',
          annotations: ['readOnlyHint: true']
        }
      ],
      resources: ['github://repo/{owner}/{repo}', 'github://pull/{owner}/{repo}/{number}'],
      prompts: ['summarize_pr_context', 'triage_review_feedback'],
      errorHandling: ['授权失败时要求用户确认连接状态', '分页过多时先缩小范围'],
      security: ['默认只读', '写操作必须人工确认'],
      evaluations: ['能否基于 PR 评论生成修复计划']
    } satisfies McpAssetSchema,
    examples: ['任务：总结 PR review 待处理事项\n工具上下文：github.list_review_comments']
  }),
  starterAsset(6, {
    id: 'starter-mcp-filesystem-context',
    type: 'mcp',
    title: '本地文件检索 MCP 引用',
    summary: '描述本地文件读取和搜索能力，用于让提示词理解 workspace、路径、搜索和文件边界。',
    content: `# MCP

## Server
filesystem

## Tools
- search_files
- read_file
- list_directory

## Boundary
只读取工作区相关文件，不越权访问敏感路径。`,
    tags: ['mcp', 'filesystem', 'workspace'],
    useCases: ['读取项目结构', '搜索代码引用', '定位配置文件'],
    integration: integration(
      'filesystem.workspace',
      ['文件搜索', '文件读取', '目录枚举'],
      ['cwd', 'pattern', 'path'],
      ['matches', 'fileContent', 'directoryTree'],
      ['只在授权工作区内使用', '读取敏感文件前需要确认'],
      '注入给代码类提示词，帮助模型规划先搜索再修改的流程。'
    ),
    schema: {
      server: {
        name: 'filesystem',
        transport: 'stdio',
        auth: 'local workspace permission',
        runtime: 'Node/Python local process'
      },
      tools: [
        {
          name: 'search_files',
          description: '按 glob 或全文搜索文件。',
          inputSchema: '{ cwd: string, query: string, glob?: string }',
          outputSchema: '{ matches: { path: string, line?: number, text?: string }[] }',
          annotations: ['readOnlyHint: true']
        },
        {
          name: 'read_file',
          description: '读取指定文件文本。',
          inputSchema: '{ path: string }',
          outputSchema: '{ content: string }',
          annotations: ['readOnlyHint: true']
        }
      ],
      resources: ['file://workspace'],
      prompts: ['inspect_project_structure'],
      errorHandling: ['文件不存在时返回候选路径', '二进制文件提示不可直接读取'],
      security: ['限制在 workspace', '敏感文件需确认'],
      evaluations: ['能否先搜索再读取目标文件']
    } satisfies McpAssetSchema,
    examples: ['任务：找出环境变量读取位置\n工具：filesystem.search_files(query="GEMINI_API_KEY")']
  }),
  starterAsset(7, {
    id: 'starter-sdk-openai-responses',
    type: 'sdk',
    title: 'OpenAI Responses SDK 用法引用',
    summary: '保存 Responses API 的服务端接入要点，适合生成开发任务提示词。',
    content: `# SDK Reference

## Package
openai

## Install
npm install openai

## Notes
- 服务端保存 API key
- 前端不要直接暴露密钥
- 结构化输出要定义 schema`,
    tags: ['sdk', 'openai', 'responses'],
    useCases: ['文本生成', '结构化输出', '工具调用编排'],
    integration: integration(
      'openai.responses.create',
      ['文本生成', '结构化输出', '工具调用'],
      ['model', 'input', 'tools', 'response_format'],
      ['id', 'output_text', 'tool_calls'],
      ['密钥只放服务端', '以官方文档为准'],
      '生成开发提示词时说明服务端边界、错误处理、测试和成本控制。'
    ),
    schema: {
      package: {
        name: 'openai',
        language: 'TypeScript',
        version: '^4',
        install: 'npm install openai'
      },
      initialization: 'const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });',
      auth: 'OPENAI_API_KEY 放在服务端环境变量。',
      coreMethods: [
        {
          name: 'client.responses.create',
          purpose: '创建一次响应生成。',
          parameters: ['model: string', 'input: string | ResponseInput', 'tools?: Tool[]'],
          returns: ['id: string', 'output_text?: string', 'output: ResponseOutputItem[]'],
          errors: ['401 Unauthorized', '429 Rate Limited', '400 Invalid Request']
        }
      ],
      examples: ['const response = await client.responses.create({ model, input });'],
      compatibility: ['Node.js 服务端', '不要直接用于浏览器暴露 key'],
      testing: ['mock client', '覆盖 401/429/400 错误分支']
    } satisfies SdkAssetSchema,
    examples: ['任务：写一个服务端文本生成接口\n应注入：初始化、参数、错误处理、安全边界']
  }),
  starterAsset(8, {
    id: 'starter-sdk-vercel-ai-streaming',
    type: 'sdk',
    title: 'Vercel AI SDK 流式聊天引用',
    summary: '记录 AI SDK 的流式文本、聊天接口和前后端边界，用于构建 AI 应用提示词。',
    content: `# SDK Reference

## Package
ai

## Use
- streamText
- generateText
- useChat

## Notes
服务端负责模型调用，客户端负责展示流。`,
    tags: ['sdk', 'vercel-ai-sdk', 'streaming'],
    useCases: ['流式聊天', 'AI 应用前端', '模型调用封装'],
    integration: integration(
      'ai.streamText',
      ['流式文本生成', '聊天 UI 接入', 'provider 抽象'],
      ['model', 'messages', 'system', 'tools'],
      ['textStream', 'response', 'usage'],
      ['服务端执行模型调用', '客户端不保存 provider key'],
      '适合生成 Next/Vite AI 应用的实现提示词。'
    ),
    schema: {
      package: {
        name: 'ai',
        language: 'TypeScript',
        version: '^5',
        install: 'npm install ai'
      },
      initialization: 'import { streamText } from "ai";',
      auth: '由具体 provider 的服务端环境变量提供。',
      coreMethods: [
        {
          name: 'streamText',
          purpose: '创建可流式返回的模型响应。',
          parameters: ['model: LanguageModel', 'messages?: UIMessage[]', 'system?: string'],
          returns: ['textStream', 'toUIMessageStreamResponse()'],
          errors: ['provider auth error', 'invalid messages', 'network timeout']
        }
      ],
      examples: ['return result.toUIMessageStreamResponse();'],
      compatibility: ['Next.js Route Handler', 'Node/Edge 视 provider 而定'],
      testing: ['mock provider', '验证流中断和重试']
    } satisfies SdkAssetSchema,
    examples: ['任务：实现一个流式聊天接口\n输出：route handler、前端 hook、错误状态']
  }),
  starterAsset(9, {
    id: 'starter-workflow-prompt-optimization',
    type: 'workflow',
    title: '提示词优化工作流',
    summary: '从原始需求到优化提示词的标准流程，包含资产推荐、方向选择、生成、评估和迭代。',
    content: `# Workflow

1. 接收原始需求
2. 识别场景和目标
3. 推荐项目库资产
4. 用户确认注入资产和方向
5. 生成优化版提示词
6. 输出 highlights 和建议
7. 二次迭代`,
    tags: ['workflow', 'prompt-optimization'],
    useCases: ['优化提示词', '沉淀项目库资产', '复用资产上下文'],
    integration: integration(
      'workflow.prompt_optimization',
      ['资产推荐', '方向编排', '提示词生成', '二次优化'],
      ['原始需求', '资产库', '优化方向'],
      ['优化提示词', 'highlights', 'suggestions'],
      ['资产仅作为上下文', '最多注入 8 个确认资产'],
      '作为本项目核心优化流程的默认编排参考。'
    ),
    schema: {
      goal: '把模糊需求转为可复用、高执行力提示词。',
      actors: ['用户', '提示词优化模型', '项目库推荐器'],
      triggers: ['用户输入原始需求', '用户点击二次优化'],
      inputs: ['input', 'scenario', 'style', 'selectedAssets', 'directions'],
      stages: [
        {
          name: 'recommend_assets',
          objective: '根据输入和方向推荐相关资产。',
          actions: ['关键词匹配', '按得分排序', '最多返回 5 个候选'],
          outputs: ['recommendedAssets'],
          qualityGate: ['候选与输入相关', '不覆盖用户选择']
        },
        {
          name: 'generate_prompt',
          objective: '融合确认资产和优化方向生成提示词。',
          actions: ['格式化资产上下文', '构造系统指令', '生成 JSON 结果'],
          outputs: ['optimized', 'highlights', 'suggestions'],
          qualityGate: ['highlights 说明资产和方向使用情况']
        }
      ],
      state: ['draft', 'generated', 'refining', 'saved'],
      failureHandling: ['模型失败时提示重试', '资产为空时降级为普通优化'],
      finalOutputs: ['optimizedPrompt', 'highlights', 'suggestions', 'historyVersion']
    } satisfies WorkflowAssetSchema,
    examples: ['输入：帮我写一份 code review prompt\n流程：推荐 code-review skill + evaluator 后生成']
  }),
  starterAsset(10, {
    id: 'starter-workflow-material-to-report',
    type: 'workflow',
    title: '资料包到报告 Workflow',
    summary: '把多文件资料包整理为正式报告的流程，可复用在文档生成、审校和导出任务。',
    content: `# Workflow

## Stages
1. 资料盘点
2. 解析文本和表格
3. 建立章节大纲
4. 生成正文
5. 审校事实和格式
6. 导出交付稿`,
    tags: ['workflow', 'document', 'report'],
    useCases: ['从附件生成报告', '多文件资料整理', '交付文档生成'],
    integration: integration(
      'workflow.material_to_report',
      ['资料解析', '章节生成', '审校', '导出'],
      ['sourceFiles', 'requirements', 'styleGuide'],
      ['reportDraft', 'reviewIssues', 'deliverables'],
      ['必须保留资料来源', '缺失字段需标注'],
      '适合搭配 Parser、Reference、Evaluator 资产。'
    ),
    schema: {
      goal: '从多文件资料生成可交付报告。',
      actors: ['用户', 'Parser', 'Writer Agent', 'Reviewer'],
      triggers: ['用户上传资料包', '用户要求生成报告'],
      inputs: ['sourceFiles', 'reportRequirements', 'referenceStandards'],
      stages: [
        {
          name: 'inventory',
          objective: '盘点资料和缺失项。',
          actions: ['列出文件', '识别类型', '标注不可解析文件'],
          outputs: ['fileInventory'],
          qualityGate: ['资料清单完整']
        },
        {
          name: 'draft_and_review',
          objective: '生成并审校报告。',
          actions: ['生成大纲', '填充正文', '检查事实和格式'],
          outputs: ['reportDraft', 'reviewChecklist'],
          qualityGate: ['事实可追溯', '章节完整']
        }
      ],
      state: ['collected', 'parsed', 'drafted', 'reviewed', 'exported'],
      failureHandling: ['解析失败时保留原文件名和错误', '资料不足时先请求补充'],
      finalOutputs: ['report.md', 'report.docx', 'reviewChecklist']
    } satisfies WorkflowAssetSchema,
    examples: ['输入：资料包 + 报告模板\n输出：报告草稿 + 审校清单']
  }),
  starterAsset(11, {
    id: 'starter-reference-prompt-quality',
    type: 'reference',
    title: 'Prompt 质量标准 Reference',
    summary: '提示词质量检查标准，覆盖清晰度、上下文、约束、输出契约、评估标准和可迭代性。',
    content: `# Prompt 质量标准

- 角色清晰
- 背景和目标完整
- 输入变量明确
- 约束和禁止事项可执行
- 输出格式可验证
- 有评价标准
- 支持二次迭代`,
    tags: ['reference', 'prompt-quality'],
    useCases: ['评估提示词质量', '生成优化 highlights', '构建 evaluator'],
    integration: integration(
      'reference.prompt_quality_standard',
      ['质量标准', '验收清单', '优化维度'],
      ['promptDraft', 'targetTask'],
      ['qualityChecklist', 'improvementAreas'],
      ['只是质量标准，不替代真实任务测试'],
      '作为 Prompt、Evaluator、Benchmark 的共同参考。'
    ),
    schema: {
      source: '项目内置标准',
      version: 'v1',
      scope: '适用于通用提示词、工程提示词和多轮协作提示词。',
      keyFacts: ['好的提示词应有清晰角色、任务、约束和输出契约', '评估标准应可观察、可打分或可验收'],
      terminology: ['输出契约: 对格式、字段、语言、长度和结构的明确约定', '反模式: 容易导致失败的提示词写法'],
      citationRules: ['作为内部标准引用', '如与用户领域规则冲突，以用户规则优先'],
      limitations: ['不能证明模型一定表现好', '需要结合真实样例测试'],
      freshness: '内部标准，可随项目经验更新。'
    } satisfies ReferenceAssetSchema,
    examples: ['任务：检查某个 Prompt 是否可执行\n引用：质量标准中的 7 个维度']
  }),
  starterAsset(12, {
    id: 'starter-reference-tool-context-boundary',
    type: 'reference',
    title: 'MCP/SDK 半结构化上下文边界 Reference',
    summary: '说明项目库中的 MCP、SDK、Skill 资产只作为上下文，不代表真实调用或执行。',
    content: `# 工具上下文边界

项目库中的 MCP、SDK、Skill、Connector、Tool 资产描述的是能力和接口。
在提示词优化阶段，它们只能作为上下文被引用。
模型不能声称已经连接、调用、执行或验证外部工具。`,
    tags: ['reference', 'tooling', 'boundary'],
    useCases: ['优化工具调用提示词', '避免虚假执行描述', '生成安全约束'],
    integration: integration(
      'reference.tool_context_boundary',
      ['工具边界说明', '安全约束', '措辞规则'],
      ['assetContext', 'optimizedPrompt'],
      ['safeToolWording', 'constraints'],
      ['不得声称真实执行', '需要用户确认真实调用步骤'],
      '建议始终和 MCP/SDK/Connector 资产一起注入。'
    ),
    schema: {
      source: '项目内置规则',
      version: 'v1',
      scope: '适用于项目库资产参与提示词优化的所有场景。',
      keyFacts: ['项目库资产是上下文，不是运行时调用', '最终提示词可以规划工具调用，但不能伪造执行结果'],
      terminology: ['半结构化上下文: 描述能力、输入输出、约束的资料', '真实调用: 对外部系统发生实际请求或状态改变'],
      citationRules: ['在系统指令或提示词约束中明确体现'],
      limitations: ['不覆盖真实运行时权限管理'],
      freshness: '随着项目执行能力扩展需要更新。'
    } satisfies ReferenceAssetSchema,
    examples: ['错误：已调用 github.get_pr\n正确：如可用，请调用 github.get_pr 获取上下文']
  }),
  starterAsset(13, {
    id: 'starter-agent-prompt-architect',
    type: 'agent',
    title: '提示词架构师 Agent',
    summary: '专门负责把任务拆成角色、上下文、约束、输出契约和评估标准的提示词设计 Agent。',
    content: `# Agent

## Identity
提示词架构师

## Behavior
- 先判断用户目标
- 再选择资产和优化方向
- 最后输出可执行 Prompt

## Stop
当提示词满足验收清单时停止。`,
    tags: ['agent', 'prompt-architect'],
    useCases: ['生成复杂提示词', '重构旧提示词', '设计多轮协作策略'],
    integration: integration(
      'agent.prompt_architect',
      ['提示词结构设计', '资产融合', '质量自检'],
      ['userGoal', 'selectedAssets', 'directions'],
      ['optimizedPrompt', 'rationale', 'checklist'],
      ['不真实调用工具', '缺失关键信息时先澄清'],
      '作为工作台默认优化代理的结构参考。'
    ),
    schema: {
      identity: '提示词架构师，负责把需求转成稳定可执行提示词。',
      goals: ['生成结构化 Prompt', '融合项目库资产', '明确输出契约和验收标准'],
      instructions: ['先识别任务类型', '再选择可引用资产', '最后输出可执行提示词'],
      tools: ['PromptAssetLibrary', 'Evaluator.prompt_actionability'],
      memoryStrategy: '记住项目资产类型和用户偏好，但不记住敏感密钥。',
      planningStrategy: '复杂任务先拆解为澄清、资产选择、生成、评估四步。',
      stopConditions: ['输出满足质量标准', '用户确认不再迭代'],
      failureHandling: ['缺失信息时提出最少必要问题', '资产冲突时说明优先级'],
      outputContract: 'Markdown Prompt + highlights + 后续优化建议。'
    } satisfies AgentAssetSchema,
    examples: ['用户：帮我写一个报告生成 prompt\nAgent：选择 workflow + parser + evaluator 后生成']
  }),
  starterAsset(14, {
    id: 'starter-agent-library-curator',
    type: 'agent',
    title: '资产库策展 Agent',
    summary: '负责把零散经验整理成可复用资产，判断类型、补 schema、加标签和使用场景。',
    content: `# Agent

## Goal
把散乱材料整理成项目库资产。

## Rules
- 判断最合适资产类型
- 补齐 schema
- 保留原始内容
- 输出标签和 use cases`,
    tags: ['agent', 'library-curator'],
    useCases: ['导入文件后生成资产草稿', '整理提示词经验', '批量补齐资产 metadata'],
    integration: integration(
      'agent.library_curator',
      ['资产分类', 'schema 补齐', '标签生成'],
      ['rawText', 'fileName', 'targetType'],
      ['assetDraft', 'tags', 'useCases'],
      ['不能删除原始关键信息', '不确定类型时给候选类型'],
      '适合文件导入、JSON 导入和资产整理流程。'
    ),
    schema: {
      identity: '项目库策展 Agent，负责沉淀和规范化可复用资产。',
      goals: ['判断资产类型', '补齐结构字段', '生成摘要标签和使用场景'],
      instructions: ['保留原始内容', '优先补齐可复用信息', '标注不确定字段'],
      tools: ['Parser.markdown_asset', 'Template.asset_card'],
      memoryStrategy: '记住项目资产分类口径和命名规则。',
      planningStrategy: '先分类，再抽取 schema，最后生成可编辑草稿。',
      stopConditions: ['资产草稿字段齐全', '需要用户确认分类'],
      failureHandling: ['文本太短时只生成最小草稿', '类型不确定时列出候选'],
      outputContract: 'PromptAsset 草稿，包含 type、title、summary、schema、tags、content。'
    } satisfies AgentAssetSchema,
    examples: ['输入：一段 SDK 文档\n输出：SDK 资产草稿']
  }),
  starterAsset(15, {
    id: 'starter-tool-markdown-section-extractor',
    type: 'tool',
    title: 'Markdown 章节抽取 Tool',
    summary: '轻量工具规格：从 Markdown 中按标题抽取章节，供 Parser、Workflow 或 Prompt 使用。',
    content: `# Tool

extractMarkdownSections(markdown, headingLevel?)

返回章节标题、层级、正文和行号范围。`,
    tags: ['tool', 'markdown', 'parser'],
    useCases: ['解析文档结构', '生成资产草稿', '压缩长文档'],
    integration: integration(
      'tool.extract_markdown_sections',
      ['章节识别', '标题层级解析', '正文切片'],
      ['markdown: string', 'headingLevel?: number'],
      ['sections: Section[]'],
      ['不解析非 Markdown 二进制内容'],
      '作为提示词上下文描述工具能力，不代表实际执行。'
    ),
    schema: {
      name: 'extractMarkdownSections',
      purpose: '从 Markdown 文本中抽取章节结构。',
      parameters: ['markdown: string', 'headingLevel?: number'],
      returns: ['sections: { title, level, content, startLine, endLine }[]'],
      preconditions: ['输入是 Markdown 文本'],
      sideEffects: ['无副作用'],
      fallback: ['没有标题时返回全文 single section'],
      examples: ['# A\\ntext -> [{ title: "A", content: "text" }]']
    } satisfies ToolAssetSchema,
    examples: ['任务：把导入的 Markdown 变成 Reference 草稿\n工具：先抽章节，再生成 schema']
  }),
  starterAsset(16, {
    id: 'starter-tool-json-schema-validator',
    type: 'tool',
    title: 'JSON Schema 校验 Tool',
    summary: '描述 JSON schema 校验工具，用于保证资产导入、模型输出和评估报告结构稳定。',
    content: `# Tool

validateJsonSchema(data, schema)

返回 valid、errors 和 normalizedData。`,
    tags: ['tool', 'json', 'validation'],
    useCases: ['导入 JSON 资产前校验', '模型 JSON 输出校验', '评估报告格式检查'],
    integration: integration(
      'tool.validate_json_schema',
      ['schema 校验', '错误定位', '结构归一化'],
      ['data: unknown', 'schema: JsonSchema'],
      ['valid: boolean', 'errors: ValidationError[]'],
      ['校验失败不得静默通过'],
      '适合和 Parser、Evaluator、Benchmark 资产一起使用。'
    ),
    schema: {
      name: 'validateJsonSchema',
      purpose: '检查 JSON 数据是否满足指定 schema。',
      parameters: ['data: unknown', 'schema: JsonSchema'],
      returns: ['valid: boolean', 'errors: { path, message }[]', 'normalizedData?: unknown'],
      preconditions: ['schema 可解析'],
      sideEffects: ['无副作用'],
      fallback: ['schema 无效时返回 schemaError'],
      examples: ['validateJsonSchema(asset, PromptAssetSchema)']
    } satisfies ToolAssetSchema,
    examples: ['任务：导入资产 JSON\n输出：失败路径和修复建议']
  }),
  starterAsset(17, {
    id: 'starter-template-structured-prompt',
    type: 'template',
    title: '结构化提示词模板',
    summary: '通用 Prompt 骨架，包含角色、背景、任务、输入、约束、输出格式和验收标准。',
    content: `# {{角色}}

## 背景
{{背景}}

## 任务
{{任务}}

## 输入
{{输入}}

## 约束
{{约束}}

## 输出格式
{{输出格式}}

## 验收标准
{{验收标准}}`,
    tags: ['template', 'prompt'],
    useCases: ['生成标准提示词', '重构零散指令', '统一团队 Prompt 格式'],
    integration: integration(
      'template.structured_prompt',
      ['提示词骨架', '变量槽位', '验收标准'],
      ['role', 'context', 'task', 'constraints'],
      ['promptMarkdown'],
      ['必填槽位不能为空'],
      '作为 Prompt 资产或优化输出的默认骨架。'
    ),
    schema: {
      structure: ['角色', '背景', '任务', '输入', '约束', '输出格式', '验收标准'],
      slots: ['{{角色}}', '{{背景}}', '{{任务}}', '{{输入}}', '{{约束}}', '{{输出格式}}', '{{验收标准}}'],
      fillRules: ['缺失关键槽位先提问', '保留用户原始术语', '约束必须可执行'],
      variants: ['短版', '开发任务版', '文档生成版'],
      outputFormat: 'Markdown',
      constraints: ['不得删除验收标准', '不得把背景和任务混在一起']
    } satisfies TemplateAssetSchema,
    examples: ['输入：做一个周报生成 prompt\n输出：套用该结构填充变量']
  }),
  starterAsset(18, {
    id: 'starter-template-evaluation-report',
    type: 'template',
    title: '评估报告模板',
    summary: '用于输出 Prompt、Agent 或模型结果评估，固定包含分数、问题、证据和改进建议。',
    content: `# 评估报告

## 总分
{{score}}

## 维度评分
{{dimensionScores}}

## 主要问题
{{issues}}

## 证据
{{evidence}}

## 改进建议
{{recommendations}}`,
    tags: ['template', 'evaluation'],
    useCases: ['评估 Prompt 输出', 'A/B 测试报告', '资产质量审查'],
    integration: integration(
      'template.evaluation_report',
      ['评估报告结构', '证据记录', '改进建议'],
      ['scores', 'issues', 'evidence'],
      ['evaluationReport'],
      ['问题必须有证据', '建议必须可执行'],
      '适合 Evaluator 和 Benchmark 的输出格式。'
    ),
    schema: {
      structure: ['总分', '维度评分', '主要问题', '证据', '改进建议'],
      slots: ['{{score}}', '{{dimensionScores}}', '{{issues}}', '{{evidence}}', '{{recommendations}}'],
      fillRules: ['没有证据的问题不输出', '每条建议对应一个问题'],
      variants: ['简版', '详细版', 'A/B 对比版'],
      outputFormat: 'Markdown table + bullet list',
      constraints: ['不得只给分不解释', '不得输出空泛建议']
    } satisfies TemplateAssetSchema,
    examples: ['输入：两个 Prompt 输出\n输出：按维度评分并列证据']
  }),
  starterAsset(19, {
    id: 'starter-evaluator-prompt-actionability',
    type: 'evaluator',
    title: 'Prompt 可执行性评估器',
    summary: '评估提示词是否能被模型稳定执行，覆盖目标、步骤、约束、输出格式和验收标准。',
    content: `# Evaluator

## Dimensions
- 目标清晰度
- 输入完整性
- 约束可执行性
- 输出格式稳定性
- 验收标准可检查性`,
    tags: ['evaluator', 'prompt-quality'],
    useCases: ['评估优化后的 Prompt', '筛选可复用 Prompt 资产', '生成改进建议'],
    integration: integration(
      'evaluator.prompt_actionability',
      ['维度评分', '失败模式识别', '改进建议'],
      ['promptText', 'targetTask'],
      ['score', 'issues', 'recommendations'],
      ['必须指出证据', '不得只输出总分'],
      '适合每次优化后作为自检标准注入。'
    ),
    schema: {
      target: 'Prompt 文本',
      dimensions: ['目标清晰度', '输入完整性', '约束可执行性', '输出格式稳定性', '验收标准可检查性'],
      scoringRubric: ['90-100: 可直接用于真实任务', '70-89: 基本可用但有局部缺口', '0-69: 缺少关键执行条件'],
      passThreshold: '总分 >= 85 且输出格式稳定性 >= 80',
      failureCases: ['任务目标模糊', '没有输入变量说明', '输出格式不可验证'],
      reviewMode: 'hybrid',
      outputFormat: 'score + dimensionScores + issues + recommendations'
    } satisfies EvaluatorAssetSchema,
    examples: ['Prompt 缺少输出格式 -> 输出问题和建议补全格式契约']
  }),
  starterAsset(20, {
    id: 'starter-evaluator-asset-fusion',
    type: 'evaluator',
    title: '资产融合质量评估器',
    summary: '检查优化提示词是否真正融合了选中的 Skill、MCP、SDK、Reference 等资产。',
    content: `# Evaluator

## Check
- 是否引用确认资产
- 是否转化为角色/约束/流程/工具上下文
- 是否避免声称真实调用
- highlights 是否说明资产使用`,
    tags: ['evaluator', 'asset-fusion'],
    useCases: ['检查资产注入效果', '优化 highlights', '防止资产只被罗列'],
    integration: integration(
      'evaluator.asset_fusion_quality',
      ['资产融合检查', '虚假调用检测', 'highlights 检查'],
      ['optimizedPrompt', 'selectedAssets', 'highlights'],
      ['fusionScore', 'missingAssets', 'unsafeClaims'],
      ['候选资产优先级低于用户确认资产'],
      '适合项目库优化流程的质量门。'
    ),
    schema: {
      target: '优化后的提示词和 highlights',
      dimensions: ['确认资产覆盖率', '融合深度', '安全边界', '说明完整性'],
      scoringRubric: ['高分: 资产被转化为明确流程/约束/示例', '低分: 只列资产名或声称已调用工具'],
      passThreshold: '无 unsafeClaims 且融合深度 >= 80',
      failureCases: ['没有提到用户确认资产', '声称已经调用 MCP', 'highlights 缺少资产说明'],
      reviewMode: 'ai',
      outputFormat: 'fusionScore + missingAssets + unsafeClaims + fixSuggestions'
    } satisfies EvaluatorAssetSchema,
    examples: ['选中 GitHub MCP，但提示词说“我已读取 PR” -> unsafeClaims']
  }),
  starterAsset(21, {
    id: 'starter-dataset-prompt-fewshot',
    type: 'dataset',
    title: 'Prompt 优化 few-shot 样例集',
    summary: '保存原始需求到优化 Prompt 的正例，帮助模型学习本项目的优化风格。',
    content: `# Dataset

## Item
input: 原始需求
assets: 注入资产
directions: 优化方向
expected: 优化后的 Prompt`,
    tags: ['dataset', 'few-shot', 'prompt'],
    useCases: ['给优化模型提供示例', '构建 Benchmark', '训练团队提示词风格'],
    integration: integration(
      'dataset.prompt_optimization_fewshot',
      ['正例学习', '风格对齐', '输出格式示范'],
      ['rawInput', 'selectedAssets', 'directions'],
      ['expectedPrompt'],
      ['样例不得包含敏感信息'],
      '作为 few-shot 上下文注入时只选最相关 1-3 条。'
    ),
    schema: {
      purpose: '提供提示词优化正例。',
      itemSchema: '{ input: string, assets: string[], directions: string[], expected: string, notes?: string }',
      positiveExamples: ['把“帮我写日报”优化成带角色、输入字段和输出格式的日报 Prompt'],
      negativeExamples: ['只把用户原话润色，没有补约束和输出格式'],
      labels: ['writing', 'engineering', 'document', 'tooling'],
      splitStrategy: '80% prompt 示例，20% benchmark 回归样例。',
      qualityNotes: ['去除真实密钥和敏感业务数据', '每条样例保留任务类型标签']
    } satisfies DatasetAssetSchema,
    examples: ['input=帮我分析 PR; expected=包含 GitHub MCP 上下文和 review 输出格式']
  }),
  starterAsset(22, {
    id: 'starter-dataset-failure-cases',
    type: 'dataset',
    title: '提示词失败案例数据集',
    summary: '记录常见失败模式和反例，用于边界增强、Evaluator 和 Benchmark。',
    content: `# Dataset

## Failures
- 目标模糊
- 输出格式缺失
- 工具虚假调用
- 引用过期信息
- 忽略用户附件`,
    tags: ['dataset', 'negative-examples', 'quality'],
    useCases: ['生成反例边界', '评估 Prompt 风险', '构建回归测试'],
    integration: integration(
      'dataset.prompt_failure_cases',
      ['反例提供', '风险识别', '边界增强'],
      ['promptDraft', 'taskType'],
      ['failureModes', 'counterExamples'],
      ['反例不能替代真实测试'],
      '适合和“反例边界增强”方向一起注入。'
    ),
    schema: {
      purpose: '收集提示词失败反例。',
      itemSchema: '{ failureMode: string, badPrompt: string, whyBad: string, fix: string }',
      positiveExamples: ['明确说“如可用再调用工具”，避免虚假调用'],
      negativeExamples: ['“我已经查询数据库并确认结果”但实际未调用任何工具'],
      labels: ['missing-output-format', 'unsafe-tool-claim', 'hallucinated-reference'],
      splitStrategy: '按失败模式分组，每类保留 3-5 条代表样例。',
      qualityNotes: ['反例要短且典型', '每条反例必须有修复建议']
    } satisfies DatasetAssetSchema,
    examples: ['failureMode=unsafe-tool-claim; fix=改成“请调用可用工具获取...”']
  }),
  starterAsset(23, {
    id: 'starter-policy-tool-safety',
    type: 'policy',
    title: '工具调用安全边界 Policy',
    summary: '规定 MCP、SDK、Connector、Tool 的使用措辞、安全边界和升级策略。',
    content: `# Policy

- 不声称未发生的工具调用
- 写操作必须确认
- 敏感数据外传必须确认
- 密钥不得写入前端或日志
- 失败要给降级路径`,
    tags: ['policy', 'tool-safety', 'guardrail'],
    useCases: ['生成工具调用提示词', '审查 SDK/MCP 资产', '避免安全风险'],
    integration: integration(
      'policy.tool_safety_boundary',
      ['安全规则', '升级策略', '拒绝/降级措辞'],
      ['toolContext', 'plannedActions'],
      ['safeInstructions', 'escalationRules'],
      ['不替代真实权限系统'],
      '建议所有工具类资产默认引用。'
    ),
    schema: {
      domain: '工具调用、外部连接和敏感数据处理。',
      rules: ['不得声称未执行的工具调用', '写操作前必须确认', '密钥只放服务端或本地安全环境'],
      triggers: ['涉及 MCP/SDK/Connector', '可能写入远程系统', '涉及敏感数据传输'],
      enforcement: ['改写为计划性措辞', '要求用户确认', '降级为只读分析'],
      escalation: ['破坏性操作交给用户确认', '权限不足时请求授权说明'],
      refusalStyle: '简短说明原因，并提供安全替代路径。',
      examples: ['错误：已删除远程分支；正确：如果确认，我将删除远程分支。']
    } satisfies PolicyAssetSchema,
    examples: ['任务：生成 GitHub 自动修复 Prompt\n必须包含写操作确认规则']
  }),
  starterAsset(24, {
    id: 'starter-policy-fact-citation',
    type: 'policy',
    title: '事实引用与时效 Policy',
    summary: '约束模型在使用 Reference、Memory 和外部知识时标注来源、时效和不确定性。',
    content: `# Policy

- 引用事实要有来源线索
- 可能过期的信息要提醒确认
- 区分事实、推断、建议
- 不得把参考资料外推到未覆盖场景`,
    tags: ['policy', 'citation', 'freshness'],
    useCases: ['生成研究类 Prompt', '引用标准/规范', '处理长期记忆'],
    integration: integration(
      'policy.fact_citation_freshness',
      ['事实边界', '时效提醒', '引用规则'],
      ['referenceAssets', 'taskQuestion'],
      ['citationRules', 'uncertaintyNotes'],
      ['高时效信息需要检索或人工确认'],
      '适合 Reference、Memory、Dataset 资产参与优化时注入。'
    ),
    schema: {
      domain: '事实引用、资料时效和不确定性表达。',
      rules: ['事实要可追溯', '过期风险要标注', '推断必须明确标记'],
      triggers: ['引用 Reference', '使用 Memory', '涉及法规、价格、版本、人物等易变信息'],
      enforcement: ['添加来源线索', '添加待确认提示', '限制结论范围'],
      escalation: ['高风险事实要求联网验证或人工确认'],
      refusalStyle: '说明当前资料不足，并列出需要确认的信息。',
      examples: ['“根据提供资料”而不是“事实一定如此”']
    } satisfies PolicyAssetSchema,
    examples: ['任务：基于规范写提示词\n输出：引用范围和时效提醒']
  }),
  starterAsset(25, {
    id: 'starter-memory-project-conventions',
    type: 'memory',
    title: '本项目工程约定 Memory',
    summary: '记录当前项目的本地工程约定，帮助提示词优化和代码任务保持一致。',
    content: `# Memory

- 项目是 Vite + React + TypeScript
- 资产库本地优先存储
- MCP/SDK v1 只作为上下文，不真实执行
- 构建验证使用 npm run typecheck 和 npm run build`,
    tags: ['memory', 'project-conventions'],
    useCases: ['生成项目内开发 Prompt', '代码改造前加载约定', '保持输出风格一致'],
    integration: integration(
      'memory.project_conventions',
      ['项目约定', '验证命令', '架构边界'],
      ['repoContext', 'task'],
      ['constraints', 'verificationPlan'],
      ['只适用于当前项目', '若代码变化需要更新'],
      '适合作为开发类 Prompt 的长期上下文。'
    ),
    schema: {
      facts: ['Vite + React + TypeScript', 'localStorage 保存历史和资产', '资产只作为半结构化上下文注入'],
      preferences: ['默认简体中文', '实现后运行 typecheck 和 build'],
      projectConventions: ['不新增后端', '不真实执行 MCP/SDK', '不提交 .env.local'],
      scope: '当前提示词大师项目',
      confidence: '高，来自当前仓库代码和用户确认计划。',
      updatedAtText: '2026-05-28',
      invalidationRules: ['引入后端数据库', '实现真实 MCP/SDK 调用', '更换技术栈']
    } satisfies MemoryAssetSchema,
    examples: ['任务：新增资产导入能力\n注入：本项目不新增后端、用 localStorage']
  }),
  starterAsset(26, {
    id: 'starter-memory-user-collaboration',
    type: 'memory',
    title: '协作偏好 Memory',
    summary: '记录适用于本项目协作的通用偏好：直接实现、中文说明、验证结果简洁汇报。',
    content: `# Memory

- 用户倾向直接实现，不只给方案
- 中文沟通
- 关注架构是否真实有用，而不是只换标签
- 提交前保持工作区干净`,
    tags: ['memory', 'collaboration'],
    useCases: ['生成 Codex 工作 Prompt', '规范任务执行方式', '保持沟通风格一致'],
    integration: integration(
      'memory.collaboration_preferences',
      ['协作偏好', '执行风格', '汇报口径'],
      ['taskRequest'],
      ['workingStyleConstraints'],
      ['偏好可被用户随时覆盖'],
      '用于让 Agent 或 Prompt 更贴近当前用户的协作方式。'
    ),
    schema: {
      facts: ['用户正在把项目改造成提示词工程项目库'],
      preferences: ['直接实现', '简体中文', '解释要短但有关键验证证据'],
      projectConventions: ['临时产物不提交', '本地优先'],
      scope: '当前用户与本项目协作',
      confidence: '中，高优先级应以用户最新指令为准。',
      updatedAtText: '2026-05-28',
      invalidationRules: ['用户明确改变协作偏好', '切换到其他项目']
    } satisfies MemoryAssetSchema,
    examples: ['任务：补齐资产类型\n执行：直接改代码并跑验证']
  }),
  starterAsset(27, {
    id: 'starter-connector-github',
    type: 'connector',
    title: 'GitHub Connector',
    summary: '外部 GitHub 连接器说明，包含端点、权限、认证和数据边界。',
    content: `# Connector

## Service
GitHub

## Use
- Issues
- Pull Requests
- Actions
- Repository files

## Boundary
默认只读，写操作需要确认。`,
    tags: ['connector', 'github'],
    useCases: ['PR review', 'issue triage', 'CI debug', '发布变更'],
    integration: integration(
      'connector.github',
      ['仓库读取', 'PR/Issue 上下文', 'CI 状态'],
      ['repo', 'branch', 'pullNumber', 'token'],
      ['metadata', 'comments', 'status'],
      ['写操作需要确认', 'token 不得暴露'],
      '用于设计 GitHub 自动化或提示词上下文，不代表已经连接。'
    ),
    schema: {
      service: 'GitHub',
      endpoints: ['/repos/{owner}/{repo}', '/pulls/{pull_number}', '/issues/{issue_number}', '/actions/runs'],
      auth: 'GITHUB_TOKEN 或 OAuth',
      environment: ['GITHUB_TOKEN', 'GITHUB_REPOSITORY'],
      permissions: ['contents:read', 'pull_requests:read', 'issues:read', 'actions:read'],
      dataBoundaries: ['默认只读', '不上传密钥', '不跨 repo 读取未授权内容'],
      rateLimits: ['REST API rate limit', '分页读取大列表'],
      operationalNotes: ['失败时返回状态码和请求范围', '写操作前要求确认']
    } satisfies ConnectorAssetSchema,
    examples: ['任务：设计 PR review Agent\n注入：GitHub Connector 权限和边界']
  }),
  starterAsset(28, {
    id: 'starter-connector-local-files',
    type: 'connector',
    title: '本地文件 Connector',
    summary: '描述本地 workspace 文件访问边界，适合文档、Parser、Skill 和代码任务。',
    content: `# Connector

## Service
Local Workspace

## Use
- read files
- search text
- parse documents

## Boundary
只访问用户授权的工作区。`,
    tags: ['connector', 'local-files', 'workspace'],
    useCases: ['读取项目文件', '解析本地文档', '生成资产草稿'],
    integration: integration(
      'connector.local_workspace',
      ['本地文件读取', '文本搜索', '文档解析'],
      ['cwd', 'path', 'glob'],
      ['fileContent', 'searchResults', 'parsedText'],
      ['不读取未授权敏感路径', '写入前确认'],
      '帮助提示词明确本地文件访问边界。'
    ),
    schema: {
      service: 'Local Workspace',
      endpoints: ['file://workspace/**', 'search://workspace'],
      auth: '用户本地授权',
      environment: ['cwd', 'workspaceRoot'],
      permissions: ['read workspace files', 'write only when requested'],
      dataBoundaries: ['不读取密钥文件除非明确需要', '不上传本地敏感内容'],
      rateLimits: ['大文件需摘要或分块读取'],
      operationalNotes: ['优先用 rg 搜索', '解析失败时保留原文件路径']
    } satisfies ConnectorAssetSchema,
    examples: ['任务：导入 Markdown 资产\n连接器：读取 workspace 文件并抽取文本']
  }),
  starterAsset(29, {
    id: 'starter-parser-markdown-asset',
    type: 'parser',
    title: 'Markdown 资产解析器',
    summary: '把 Markdown 文件解析为项目库资产草稿，抽取标题、摘要、标签、正文和章节。',
    content: `# Parser

## Input
Markdown / TXT

## Extract
- title
- summary
- headings
- code blocks
- tags

## Output
PromptAsset draft`,
    tags: ['parser', 'markdown', 'asset-import'],
    useCases: ['导入 Markdown 成资产', '整理 Prompt 文档', '生成 Reference 草稿'],
    integration: integration(
      'parser.markdown_asset',
      ['标题抽取', '章节解析', '资产草稿生成'],
      ['fileName', 'markdownText', 'targetType?'],
      ['assetDraft'],
      ['保留原文正文', '无法判断类型时默认为 Reference'],
      '用于项目库文件导入流程。'
    ),
    schema: {
      inputTypes: ['.md', '.markdown', '.txt'],
      extractionFields: ['title', 'summary', 'headings', 'tags', 'content'],
      cleaningRules: ['保留代码块', '去除多余空行', '文件名可作为标题候选'],
      outputSchema: 'Partial<PromptAsset>',
      validationRules: ['title 不为空', 'content 不为空'],
      failureHandling: ['文本为空时返回错误', '标题缺失时使用文件名']
    } satisfies ParserAssetSchema,
    examples: ['README.md -> Reference 资产草稿']
  }),
  starterAsset(30, {
    id: 'starter-parser-excel-table',
    type: 'parser',
    title: 'Excel 表格资产解析器',
    summary: '把 Excel/CSV 表格转换为可注入上下文，保留 sheet、列名、预览和数据质量提示。',
    content: `# Parser

## Input
XLSX / XLS / CSV

## Extract
- sheets
- headers
- row preview
- data warnings

## Output
Text summary or Dataset draft`,
    tags: ['parser', 'excel', 'dataset'],
    useCases: ['导入表格样例', '从 Excel 生成 Dataset', '为报告生成准备结构化数据'],
    integration: integration(
      'parser.excel_table',
      ['sheet 枚举', '表头识别', '预览压缩'],
      ['workbook', 'sheetName?'],
      ['tablePreview', 'warnings', 'datasetDraft'],
      ['大表只输出预览和统计', '保留原 sheet 名'],
      '适合文件导入和长上下文压缩。'
    ),
    schema: {
      inputTypes: ['.xlsx', '.xls', '.csv'],
      extractionFields: ['sheetName', 'headers', 'rowCount', 'previewRows', 'warnings'],
      cleaningRules: ['去除全空行', '保留首行表头', '大表只截取前几行预览'],
      outputSchema: '{ sheets: { name, headers, rowCount, previewRows }[], warnings: string[] }',
      validationRules: ['至少有一个非空 sheet', '表头或数据行至少存在一个'],
      failureHandling: ['无法解析时提示文件可能损坏', '多 sheet 时列出候选']
    } satisfies ParserAssetSchema,
    examples: ['prices.xlsx -> sheet 清单 + 每张表前 5 行预览']
  }),
  starterAsset(31, {
    id: 'starter-benchmark-prompt-optimization',
    type: 'benchmark',
    title: '提示词优化回归 Benchmark',
    summary: '测试优化流程是否能稳定生成结构化、可执行、带验收标准的 Prompt。',
    content: `# Benchmark

## Tasks
- 简单写作需求
- 工程开发需求
- 文档生成需求
- 工具调用需求

## Metrics
- 结构完整率
- 输出契约完整率
- 资产融合质量`,
    tags: ['benchmark', 'prompt-optimization'],
    useCases: ['回归测试优化质量', '比较 Prompt 版本', '验证资产注入效果'],
    integration: integration(
      'benchmark.prompt_optimization_regression',
      ['任务集', '期望输出', '质量指标'],
      ['optimizedPrompt', 'testInput'],
      ['metricScores', 'regressionNotes'],
      ['人工抽检仍然必要'],
      '适合 A/B 测试和发布前回归。'
    ),
    schema: {
      target: '提示词优化流程',
      tasks: ['优化日报生成 Prompt', '优化代码评审 Prompt', '优化报告生成 Prompt', '优化工具调用 Prompt'],
      inputs: ['我要写日报', '帮我 review 代码', '根据资料生成报告', '用 GitHub 查 PR'],
      expectedOutputs: ['包含角色、任务、输入、约束、输出格式、验收标准', 'highlights 说明优化点'],
      metrics: ['结构完整率', '约束可执行性', '输出契约完整率', '资产融合质量'],
      regressionNotes: ['新增资产类型后要检查是否仍能推荐正确资产']
    } satisfies BenchmarkAssetSchema,
    examples: ['输入：帮我 review 代码\n期望：推荐 code-review skill 和 evaluator']
  }),
  starterAsset(32, {
    id: 'starter-benchmark-asset-recommendation',
    type: 'benchmark',
    title: '资产推荐 Benchmark',
    summary: '测试本地关键词推荐能否把输入需求匹配到合适的 Prompt、Skill、MCP、SDK 等资产。',
    content: `# Benchmark

## Cases
- PR review -> code review skill + GitHub MCP
- 长资料 -> long context prompt + parser
- SDK 接入 -> SDK reference + tool policy
- 报告生成 -> workflow + document review skill`,
    tags: ['benchmark', 'asset-recommendation'],
    useCases: ['调试资产推荐逻辑', '检查新增资产标签质量', '优化关键词字段'],
    integration: integration(
      'benchmark.asset_recommendation',
      ['推荐质量测试', '标签覆盖检查', '误召回分析'],
      ['query', 'directions', 'assetLibrary'],
      ['topAssets', 'expectedMatches', 'misses'],
      ['关键词匹配不是语义检索', '结果需要人工确认'],
      '用于评估 v1 本地推荐策略。'
    ),
    schema: {
      target: '本地资产推荐函数 recommendAssets',
      tasks: ['代码评审查询', '文档生成查询', 'SDK 接入查询', '长上下文查询'],
      inputs: ['review 这个 PR', '把资料生成报告', '接入 OpenAI SDK', '压缩会议纪要'],
      expectedOutputs: ['code-review skill', 'material-to-report workflow', 'OpenAI SDK reference', 'long-context prompt'],
      metrics: ['Top-5 命中率', '误召回数量', '标签覆盖率'],
      regressionNotes: ['新增类型后检查是否被筛选按钮和推荐逻辑覆盖']
    } satisfies BenchmarkAssetSchema,
    examples: ['query=接入 Vercel AI SDK -> 命中 starter-sdk-vercel-ai-streaming']
  }),
  starterAsset(33, {
    id: 'starter-skill-local-skill-blueprint-master',
    type: 'skill',
    title: '本机 Skill 蓝图大师',
    summary: '来自本机 .codex/skills/skill-blueprint-master，用于设计、审计、封装生产级 Codex Skill。',
    content: `# Local Skill
Source: /Users/hwaigc/.codex/skills/skill-blueprint-master/SKILL.md

## 核心结构
- SKILL.md 作为精简入口
- references/ 放长文档、策略、示例
- scripts/ 放确定性校验和脚手架
- assets/ 放模板和示例素材
- agents/openai.yaml 放 Agent 策略
- mcp/ 放 MCP 服务代码和配置模板

## 适合注入
当用户要把某个流程封装成 Skill、Skill Pack 或带 MCP 的能力包时。`,
    tags: ['skill', 'local-codex', 'skill-packaging', 'blueprint'],
    useCases: ['设计 Skill 架构', '审计 Skill 触发和资源布局', '把成熟流程封装成能力包'],
    integration: integration(
      'skill.local.skill_blueprint_master',
      ['Skill 架构设计', '触发策略', '资源分层', 'MCP 打包约定'],
      ['能力边界', '目标用户', '输入输出', '外部工具需求'],
      ['Skill 目录方案', 'SKILL.md 结构', '验证清单'],
      ['不假设运行时支持真正嵌套 Skill', 'MCP 仍需客户端单独注册'],
      '用于优化“把流程封装为 Skill”的提示词，要求输出目录、触发、边界和验证方式。'
    ),
    schema: makeSkillSchema(
      '用户需要设计、创建、审计、重构或打包 Codex Skill 时触发。',
      ['判断模式', '读取必要 references', '生成目录和触发策略', '补齐验证方式'],
      {
        trigger: {
          explicitInvocations: ['使用 skill-blueprint-master', '帮我设计一个 Skill'],
          implicitSignals: ['SKILL.md', 'references', 'scripts', 'assets', 'Skill Pack', 'MCP 接入'],
          avoidWhen: ['只需要普通提示词润色', '没有可复用能力边界']
        },
        resources: {
          skillMd: '路由、边界、流程、资源索引和验证说明。',
          references: ['architecture.md', 'trigger-strategy.md', 'composition-and-nesting.md', 'mcp-integration.md', 'authoring-checklist.md'],
          scripts: ['validate_skill.py', 'scaffold_skill_pack.ps1'],
          assets: ['templates/SKILL.md', 'templates/openai.yaml'],
          agents: ['agents/openai.yaml'],
          mcp: ['mcp/config/', 'mcp/server/']
        },
        boundaries: ['不把所有长说明塞进 SKILL.md', '不把 MCP 文件夹等同于已注册 MCP'],
        validation: ['运行结构校验', '检查触发描述', '检查资源是否渐进加载'],
        handoff: ['需要外部工具时交给 MCP 资产', '需要实现时交给工程工作流']
      }
    ),
    examples: ['用户：我要把报告生成流程做成 Skill\n输出：Skill 目录、触发策略、references/scripts/assets 分工']
  }),
  starterAsset(34, {
    id: 'starter-skill-local-mcp-builder',
    type: 'skill',
    title: '本机 MCP Builder Skill',
    summary: '来自本机 .codex/skills/mcp-builder，用于设计高质量 MCP Server、工具 schema、错误处理和评测。',
    content: `# Local Skill
Source: /Users/hwaigc/.codex/skills/mcp-builder/SKILL.md

## 设计重点
- API 覆盖与 workflow tools 平衡
- 工具命名清晰可发现
- 输入输出 schema 结构化
- 错误消息可操作
- readOnly/destructive/idempotent/openWorld 注解明确
- TypeScript SDK 优先，Python FastMCP 也可用`,
    tags: ['skill', 'mcp', 'local-codex', 'tool-design'],
    useCases: ['规划 MCP Server', '审计 MCP 工具设计', '生成 MCP 评测问题'],
    integration: integration(
      'skill.local.mcp_builder',
      ['MCP 设计', 'Tool schema 设计', '安全注解', '评测问题生成'],
      ['外部 API 文档', '目标工作流', '权限模型'],
      ['MCP server 方案', 'tools/resources/prompts 列表', '评测清单'],
      ['密钥只通过环境变量', '破坏性工具必须标注和确认'],
      '用于让优化后的提示词具备 MCP 设计标准，而不是只列工具名。'
    ),
    schema: makeSkillSchema(
      '用户要构建或审计 MCP Server、工具 schema、资源和 prompts 时触发。',
      ['研究 API 和 MCP 协议', '设计工具列表', '定义 schema 和注解', '规划测试和评测'],
      {
        trigger: {
          explicitInvocations: ['使用 mcp-builder', '设计 MCP Server'],
          implicitSignals: ['MCP', 'Model Context Protocol', 'tools/resources/prompts', 'FastMCP', 'typescript-sdk'],
          avoidWhen: ['只是普通 SDK 使用', '没有外部工具接口需求']
        },
        resources: {
          skillMd: 'MCP 设计流程和质量门。',
          references: ['mcp_best_practices.md', 'node_mcp_server.md', 'python_mcp_server.md', 'evaluation.md'],
          scripts: [],
          assets: [],
          agents: [],
          mcp: []
        },
        boundaries: ['不替用户伪造外部 API 行为', '不把未授权写操作设计成默认执行'],
        validation: ['工具名可发现', 'schema 完整', '错误可操作', '至少 10 个独立评测问题'],
        handoff: ['需要实现时转交 TypeScript/Python SDK 资产']
      }
    ),
    examples: ['任务：把 Notion API 封成 MCP\n输出：server、tool 列表、schema、安全注解、eval 问题']
  }),
  starterAsset(35, {
    id: 'starter-skill-local-webapp-testing',
    type: 'skill',
    title: '本机 WebApp Testing Skill',
    summary: '来自本机 .codex/skills/webapp-testing，用 Playwright 验证本地 Web 应用、截图、日志和交互。',
    content: `# Local Skill
Source: /Users/hwaigc/.codex/skills/webapp-testing/SKILL.md

## 核心模式
1. 先判断静态 HTML 还是动态 WebApp
2. 动态应用先启动或连接 dev server
3. 等待 networkidle
4. 侦察 DOM、截图和 console
5. 再执行交互验证`,
    tags: ['skill', 'playwright', 'testing', 'local-codex'],
    useCases: ['本地前端验收', '调试 UI 交互', '生成浏览器回归流程'],
    integration: integration(
      'skill.local.webapp_testing',
      ['本地服务器管理', 'Playwright 自动化', '截图和 console 检查'],
      ['devServerUrl', 'userFlow', 'expectedState'],
      ['verificationLog', 'screenshots', 'consoleIssues'],
      ['动态应用必须等待 networkidle', '验证脚本要关闭浏览器'],
      '用于生成前端验收或回归测试提示词。'
    ),
    schema: makeSkillSchema(
      '用户需要测试、检查或自动化本地 Web 应用时触发。',
      ['确认服务器状态', '打开页面等待渲染', '侦察 DOM/截图/日志', '执行交互', '汇报问题'],
      {
        trigger: {
          explicitInvocations: ['使用 webapp-testing', '跑一下浏览器验证'],
          implicitSignals: ['localhost', '127.0.0.1', 'Vite dev server', 'Playwright', '截图'],
          avoidWhen: ['纯后端逻辑', '无需真实浏览器']
        },
        resources: {
          skillMd: 'WebApp 验证决策树和 Playwright 模式。',
          references: ['examples/element_discovery.py', 'examples/console_logging.py'],
          scripts: ['scripts/with_server.py'],
          assets: [],
          agents: [],
          mcp: ['playwright']
        },
        validation: ['页面非空', '无关键 console error', '核心交互可完成'],
        handoff: ['需要视觉检查时交给 Browser/Playwright MCP', '需要修 bug 时交给工程实现流程']
      }
    ),
    examples: ['任务：验证资产库新建/编辑/删除\n输出：Playwright 步骤、断言、console 检查']
  }),
  starterAsset(36, {
    id: 'starter-skill-local-langgraph-skillifier',
    type: 'skill',
    title: '本机 LangGraph 工作流 Skill 化器',
    summary: '来自本机 .codex/skills/langgraph-workflow-skillifier，用于诊断、瘦身、复核并封装多节点 AI 工作流。',
    content: `# Local Skill
Source: /Users/hwaigc/.codex/skills/langgraph-workflow-skillifier/SKILL.md

## 状态机
S0 现状不清 -> 诊断
S1 逻辑过重 -> 瘦身
S2 改了一版 -> 复核
S3 Review 后 -> 逐条迭代
S4 稳定后 -> Skill 化封装
S5 完成后 -> 最终核验`,
    tags: ['skill', 'langgraph', 'workflow', 'local-codex'],
    useCases: ['重构 LangGraph 工作流', '把多节点流程封装成 Skill', '审计 Prompt 分散和节点冗余'],
    integration: integration(
      'skill.local.langgraph_workflow_skillifier',
      ['工作流诊断', '节点瘦身', 'Prompt 收口', 'Skill 化封装'],
      ['节点图', '状态字段', 'Prompt 列表', '失败点'],
      ['诊断报告', '最简流程', 'Skill 规格'],
      ['一次只推进一个最小闭环', '不要在看清前直接 Skill 化'],
      '适合复杂 Agent/LangGraph 项目重构提示词。'
    ),
    schema: makeSkillSchema(
      '用户需要诊断、精简、重构、复核或 Skill 化 LangGraph/多节点 AI 工作流时触发。',
      ['判断当前状态', '读取对应 reference', '输出本轮最小目标', '给出新执行逻辑'],
      {
        trigger: {
          explicitInvocations: ['使用 langgraph-workflow-skillifier', '帮我把 LangGraph 流程 Skill 化'],
          implicitSignals: ['LangGraph', '节点过多', 'Prompt 分散', '状态机', 'SSE', 'FastAPI 联调'],
          avoidWhen: ['普通单轮 Prompt', '没有多节点工作流']
        },
        resources: {
          skillMd: '状态机、流程和边界。',
          references: ['source-distillation.md', 'state-machine.md', 'minimalization-rules.md', 'skill-packaging.md'],
          scripts: ['validate_workflow_packet.py', 'render_skillization_brief.py'],
          assets: ['diagnosis-template.md', 'final-skill-spec-template.md'],
          agents: [],
          mcp: []
        },
        validation: ['节点职责清晰', 'Prompt 收口', '重试和状态清理明确'],
        handoff: ['稳定后交给 Skill 蓝图资产打包']
      }
    ),
    examples: ['用户：这个 LangGraph 太乱了\n输出：S0/S1 判断、删减清单、最小状态流']
  }),
  starterAsset(37, {
    id: 'starter-skill-local-document-processing-pack',
    type: 'skill',
    title: '本机文档处理 Skill Pack',
    summary: '聚合本机 docx/pdf/xlsx/pptx Skill，覆盖 Word、PDF、Excel、PPT 的读取、生成、检查和转换。',
    content: `# Local Skill Pack
Sources:
- /Users/hwaigc/.codex/skills/docx/SKILL.md
- /Users/hwaigc/.codex/skills/pdf/SKILL.md
- /Users/hwaigc/.codex/skills/xlsx/SKILL.md
- /Users/hwaigc/.codex/skills/pptx/SKILL.md

## 用途
把文档、表格、PDF、PPT 类任务拆成可解析、可检查、可导出的流程。`,
    tags: ['skill', 'document', 'pdf', 'xlsx', 'pptx', 'local-codex'],
    useCases: ['文档解析资产导入', '资料包到报告', '表格数据提取', 'PPT 生成或检查'],
    integration: integration(
      'skill.local.document_processing_pack',
      ['Word/PDF/Excel/PPT 处理', '内容抽取', '格式检查', '导出验证'],
      ['sourceFiles', 'targetFormat', 'formatRules'],
      ['parsedText', 'tables', 'deliverables', 'inspectionReport'],
      ['正式交付必须检查可抽取文本和明显空白页', '不能把解析失败静默忽略'],
      '用于文档资产导入、资料压缩和正式交付提示词。'
    ),
    schema: makeSkillSchema(
      '用户上传或要求处理 Word、PDF、Excel、PPT 时触发。',
      ['识别文件类型', '调用对应解析/检查工具', '保留来源和失败信息', '按交付格式输出'],
      {
        trigger: {
          explicitInvocations: ['使用 docx/pdf/xlsx/pptx skill', '处理这个文档包'],
          implicitSignals: ['.docx', '.pdf', '.xlsx', '.pptx', '报告', '表格', '幻灯片'],
          avoidWhen: ['纯文本短内容', '不涉及文件处理']
        },
        resources: {
          skillMd: '按文件类型路由。',
          references: ['document-toolchain-conventions'],
          scripts: ['codex-md-to-docx', 'codex-docx-to-pdf', 'codex-md-to-pdf', 'codex-docx-inspect', 'codex-pdf-inspect'],
          assets: ['templates/report.md', 'templates/checklist.md'],
          agents: [],
          mcp: []
        },
        validation: ['段落/表格数量合理', 'PDF 文本可抽取', '公式不是 LaTeX 源码'],
        handoff: ['需要生成正式文档时交给文档工具链 Tool']
      }
    ),
    examples: ['任务：从 Excel 和 Word 生成报告\n输出：解析步骤、来源保留、检查清单']
  }),
  starterAsset(38, {
    id: 'starter-prompt-local-docs-driven-dev-router',
    type: 'prompt',
    title: '本机 Docs Driven Dev 路由 Prompt',
    summary: '来自本机 .codex/prompts/docs-driven-dev.md，把研发请求分流到需求收集、Docs Driven、Fast Fix、文档同步和提交检查。',
    content: `# Local Prompt
Source: /Users/hwaigc/.codex/prompts/docs-driven-dev.md

核心路线：
需求统一入口 -> 自动判断分支 -> Docs Driven 或 Fast Fix -> 必要验证 -> 提交前覆盖检查。

适合把代码改造类需求转成可追踪、可验证、可提交的工程流程。`,
    tags: ['prompt', 'docs-driven', 'engineering', 'local-codex'],
    useCases: ['研发请求路由', '生成工程任务 Prompt', '规范改动前的计划与验证'],
    integration: integration(
      'prompt.local.docs_driven_dev_router',
      ['需求路由', '计划确认', 'Docs Driven/Fast Fix 分流', '提交覆盖检查'],
      ['userRequest', 'repoState', 'moduleDocs'],
      ['routeDecision', 'plan', 'verificationSteps'],
      ['不跳过需求入口直接实现', 'plan 未确认不进入实现'],
      '用于优化工程类提示词，让模型先判断影响面和文档落点。'
    ),
    schema: makePromptSchema(
      '文档驱动研发路由器',
      '用户提出代码、产品或流程改动，需要先判断路线并建立可追踪落点。',
      '把用户输入分流到需求收集、Docs Driven、Fast Fix、文档同步或提交检查。',
      ['{{需求描述}}', '{{仓库现状}}', '{{模块文档状态}}'],
      ['不跳过 requirement-intake-plan', 'plan 未确认不实现', '文档基线失真时先同步'],
      '输出路线判断、理由、下一步动作和需要确认的信息。',
      ['路线选择合理', '不越过确认门', '能解释文档和验证要求'],
      ['直接改代码', '把 Fast Fix 当自由修改', '忽略模块文档']
    ),
    examples: ['输入：给订单流程加优惠券校验\n输出：Docs Driven 路线、plan 生成要求、确认门']
  }),
  starterAsset(39, {
    id: 'starter-prompt-local-openspec-propose-apply',
    type: 'prompt',
    title: '本机 OpenSpec 提案与实施 Prompt',
    summary: '来自本机 opsx-propose/opsx-apply prompt，将变更创建为 proposal、design、tasks，再按任务实施。',
    content: `# Local Prompt
Sources:
- /Users/hwaigc/.codex/prompts/opsx-propose.md
- /Users/hwaigc/.codex/prompts/opsx-apply.md

## 流程
1. 创建 change
2. 生成 proposal/design/tasks
3. 检查 apply-ready
4. 读取上下文文件
5. 按任务逐项实现并更新状态`,
    tags: ['prompt', 'openspec', 'spec-driven', 'local-codex'],
    useCases: ['复杂功能设计', '按任务实施计划', '把需求转成 OpenSpec 产物'],
    integration: integration(
      'prompt.local.openspec_propose_apply',
      ['变更提案', '设计文档', '任务清单', '逐项实施'],
      ['changeName', 'requirements', 'projectContext'],
      ['proposal', 'design', 'tasks', 'implementationProgress'],
      ['上下文不清必须澄清', '实现前读取 contextFiles'],
      '用于让优化后的工程 Prompt 具备 proposal -> design -> tasks -> apply 的闭环。'
    ),
    schema: makePromptSchema(
      'OpenSpec 变更编排器',
      '用户要做需要设计和任务拆解的变更。',
      '创建变更产物并按任务实施。',
      ['{{变更名称}}', '{{需求描述}}', '{{项目约束}}'],
      ['先创建必要 artifacts', '实现前读取依赖上下文', '遇到设计问题暂停更新 artifacts'],
      '输出 change 名称、artifact 清单、任务进度和阻塞项。',
      ['artifact 完整', '任务可执行', '实现过程可追踪'],
      ['没有设计就实施', '任务未完成却标记完成', '忽略阻塞']
    ),
    examples: ['输入：新增资产推荐 explainability\n输出：OpenSpec 变更、tasks、apply 顺序']
  }),
  starterAsset(40, {
    id: 'starter-prompt-safe-tool-execution',
    type: 'prompt',
    title: '工具安全执行 Prompt',
    summary: '让模型在涉及 MCP、SDK、Connector、Tool 时明确“计划、请求确认、执行、验证、回退”的边界。',
    content: `# Prompt
当任务涉及外部工具、SDK 或写操作时：
1. 先说明目标和工具能力
2. 区分只读、写入、破坏性操作
3. 写入或外部副作用前请求确认
4. 执行后汇报证据
5. 失败时给出降级路径`,
    tags: ['prompt', 'tool-safety', 'mcp', 'sdk'],
    useCases: ['生成工具调用 Agent 提示词', '审查自动化 Prompt', '避免虚假调用和越权'],
    integration: integration(
      'prompt.safe_tool_execution',
      ['操作分级', '确认门', '验证证据', '回退策略'],
      ['toolContext', 'userGoal', 'riskLevel'],
      ['safeExecutionPrompt', 'confirmationQuestions', 'verificationPlan'],
      ['不得声称未执行的调用', '高风险动作必须确认'],
      '建议和所有 MCP/SDK/Connector/Tool 资产一起注入。'
    ),
    schema: makePromptSchema(
      '工具安全执行协调器',
      '模型需要规划或调用外部工具，存在权限、写入或副作用风险。',
      '生成带确认门和验证证据的工具执行提示词。',
      ['{{工具上下文}}', '{{用户目标}}', '{{风险等级}}'],
      ['区分只读和写操作', '不得伪造执行结果', '失败必须给降级方案'],
      'Markdown，包含操作分类、执行步骤、确认点、验证证据和回退方案。',
      ['边界清晰', '确认点充分', '验证方式可执行'],
      ['默认执行破坏性动作', '把计划写成已执行', '忽略认证失败']
    ),
    examples: ['任务：用 GitHub 修 PR 评论\n输出：先读评论，提交前确认，推送后给证据']
  }),
  starterAsset(41, {
    id: 'starter-mcp-local-playwright-extension',
    type: 'mcp',
    title: '本机 Playwright MCP 配置',
    summary: '来自 .codex/config.toml 的 playwright stdio MCP，命令为 playwright-mcp --extension，用于浏览器自动化上下文。',
    content: `# Local MCP
Source: /Users/hwaigc/.codex/config.toml

[mcp_servers.playwright]
type = "stdio"
command = "playwright-mcp"
args = ["--extension"]

env:
PLAYWRIGHT_EXTENSION_PROTOCOL=2`,
    tags: ['mcp', 'playwright', 'local-codex', 'browser'],
    useCases: ['本地 WebApp 自动化验证', '浏览器截图与交互', '检查 console 和网络请求'],
    integration: integration(
      'mcp.local.playwright_extension',
      ['浏览器导航', '点击输入', '截图', 'DOM 快照', 'console/network 读取'],
      ['url', 'selector', 'actionPlan'],
      ['browserState', 'screenshot', 'verificationResult'],
      ['这里只是配置上下文，不代表当前优化流程已真实调用浏览器', '写操作/提交表单需确认'],
      '用于生成包含浏览器验证步骤的提示词。'
    ),
    schema: {
      server: { name: 'playwright', transport: 'stdio', auth: 'local extension permission', runtime: 'playwright-mcp --extension' },
      tools: [
        { name: 'browser_navigate', description: '打开 URL。', inputSchema: '{ url: string }', outputSchema: '{ pageState: string }', annotations: ['openWorldHint: true'] },
        { name: 'browser_snapshot', description: '读取可访问性快照。', inputSchema: '{ target?: string }', outputSchema: '{ snapshot: string }', annotations: ['readOnlyHint: true'] },
        { name: 'browser_click', description: '点击页面元素。', inputSchema: '{ target: string }', outputSchema: '{ result: string }', annotations: ['destructiveHint: false'] }
      ],
      resources: ['browser://current-page'],
      prompts: ['verify_local_webapp_flow'],
      errorHandling: ['元素找不到时先重新 snapshot', '页面未加载时等待 networkidle 或显式文本'],
      security: ['不自动提交敏感表单', '不读取未授权页面'],
      evaluations: ['能否完成本地应用核心用户流并给出证据']
    } satisfies McpAssetSchema,
    examples: ['任务：验证项目库导入 JSON\n工具上下文：navigate -> snapshot -> upload/click -> assert']
  }),
  starterAsset(42, {
    id: 'starter-mcp-local-node-repl',
    type: 'mcp',
    title: '本机 Node REPL MCP 配置',
    summary: '来自 .codex/config.toml 的 node_repl MCP，用于执行受控 JavaScript、处理数据和浏览器辅助自动化。',
    content: `# Local MCP
Source: /Users/hwaigc/.codex/config.toml

[mcp_servers.node_repl]
command = "/Applications/Codex.app/Contents/Resources/node_repl"
startup_timeout_sec = 120

env includes CODEX_HOME and trusted browser backends.`,
    tags: ['mcp', 'node-repl', 'local-codex', 'javascript'],
    useCases: ['运行 JavaScript 数据处理', '生成图表/图片辅助结果', '快速验证结构化数据'],
    integration: integration(
      'mcp.local.node_repl',
      ['执行 JS 片段', '处理 JSON/表格', '发出图片结果', '辅助浏览器自动化'],
      ['javascriptCode', 'inputData', 'timeout'],
      ['stdout', 'jsonResult', 'imageResult'],
      ['只在可信代码路径内执行', '不得读取或输出密钥'],
      '用于让提示词规划可复用 JS 工具脚本或数据处理步骤。'
    ),
    schema: {
      server: { name: 'node_repl', transport: 'stdio', auth: 'local trusted code path', runtime: 'Codex bundled Node REPL' },
      tools: [
        { name: 'js', description: '运行 JavaScript，支持 top-level await。', inputSchema: '{ code: string, timeout_ms?: number }', outputSchema: '{ text?: string, images?: Image[] }', annotations: ['openWorldHint: false'] },
        { name: 'js_reset', description: '重置持久 JS 内核。', inputSchema: '{}', outputSchema: '{ ok: boolean }', annotations: ['idempotentHint: true'] }
      ],
      resources: ['node://repl/session'],
      prompts: ['transform_json_data', 'render_chart_preview'],
      errorHandling: ['超时时缩小任务', 'SyntaxError 时保留上下文并换变量名'],
      security: ['不导出 process 原始流', '敏感路径需要用户明确授权'],
      evaluations: ['能否稳定处理资产 JSON 并返回校验报告']
    } satisfies McpAssetSchema,
    examples: ['任务：批量检查资产 JSON\n工具：node_repl.js 读取结构并输出统计']
  }),
  starterAsset(43, {
    id: 'starter-mcp-github-official-server',
    type: 'mcp',
    title: 'GitHub 官方 MCP Server',
    summary: 'GitHub 官方 MCP Server 资产引用，适合 PR、Issue、Actions、代码上下文类提示词。',
    content: `# MCP Reference
Source: https://github.com/github/github-mcp-server
Description: GitHub's official MCP Server
Queried: 2026-05-28

## 适合
仓库、Issue、PR、review、Actions 状态读取，以及受控写操作规划。`,
    tags: ['mcp', 'github', 'official', 'pr-review'],
    useCases: ['PR review 自动化', 'Issue triage', 'CI 上下文读取', '仓库文件检索'],
    integration: integration(
      'mcp.github.official_server',
      ['Repository/Issue/PR 上下文', 'Actions 状态', '受控写操作'],
      ['repo', 'issueNumber', 'pullNumber', 'branch'],
      ['metadata', 'comments', 'files', 'workflowRuns'],
      ['需要 GitHub 授权', '写操作必须用户确认', '分页结果需压缩'],
      '优化 GitHub 类提示词时注入，强调只读优先和写操作确认。'
    ),
    schema: {
      server: { name: 'github-mcp-server', transport: 'stdio', auth: 'GITHUB_TOKEN 或 GitHub App/OAuth', runtime: 'GitHub official MCP server' },
      tools: [
        { name: 'get_pull_request', description: '读取 PR 元数据。', inputSchema: '{ owner, repo, pullNumber }', outputSchema: '{ title, body, state, files }', annotations: ['readOnlyHint: true'] },
        { name: 'list_issues', description: '列出 issue。', inputSchema: '{ owner, repo, state? }', outputSchema: '{ issues: Issue[] }', annotations: ['readOnlyHint: true'] },
        { name: 'create_issue_comment', description: '创建 issue/PR 评论。', inputSchema: '{ owner, repo, issueNumber, body }', outputSchema: '{ url }', annotations: ['destructiveHint: false'] }
      ],
      resources: ['github://repo/{owner}/{repo}', 'github://pull/{owner}/{repo}/{number}'],
      prompts: ['summarize_pr', 'triage_issue', 'prepare_review_response'],
      errorHandling: ['权限不足时说明需要的 scope', 'rate limit 时降级为用户提供上下文'],
      security: ['默认只读', '写入评论/修改分支前确认'],
      evaluations: ['基于真实 PR 评论生成可执行修复计划']
    } satisfies McpAssetSchema,
    examples: ['任务：处理 PR review\n注入：GitHub 官方 MCP 的只读读取和写入确认边界']
  }),
  starterAsset(44, {
    id: 'starter-mcp-context7-docs',
    type: 'mcp',
    title: 'Context7 文档上下文 MCP',
    summary: 'Context7 提供面向 LLM/AI Code Editor 的最新代码文档上下文，适合 SDK/API 使用提示词。',
    content: `# MCP Reference
Source: https://github.com/upstash/context7
Description: Up-to-date code documentation for LLMs and AI code editors
Queried: 2026-05-28

## 适合
在写 SDK/API 集成提示词时先获取当前库文档，减少过期 API 写法。`,
    tags: ['mcp', 'docs', 'context7', 'sdk'],
    useCases: ['获取库文档上下文', '减少过期 SDK API', '生成代码前检索官方示例'],
    integration: integration(
      'mcp.context7.docs',
      ['库文档检索', '版本相关 API 说明', '示例代码上下文'],
      ['libraryName', 'topic', 'version?'],
      ['documentationSnippets', 'examples', 'sourceLinks'],
      ['文档仍需核对版本', '不能代替真实安装测试'],
      '优化 SDK 接入类提示词时注入，要求先检索再生成代码。'
    ),
    schema: {
      server: { name: 'context7', transport: 'stdio', auth: 'none or service-specific', runtime: 'Context7 MCP server' },
      tools: [
        { name: 'resolve-library-id', description: '解析库名到 Context7 library id。', inputSchema: '{ libraryName: string }', outputSchema: '{ libraryId: string }', annotations: ['readOnlyHint: true'] },
        { name: 'get-library-docs', description: '获取库文档片段。', inputSchema: '{ libraryId: string, topic?: string }', outputSchema: '{ snippets: DocSnippet[] }', annotations: ['readOnlyHint: true'] }
      ],
      resources: ['context7://library/{id}'],
      prompts: ['fetch_current_sdk_docs'],
      errorHandling: ['库名歧义时要求用户选择', '文档不足时退回官方仓库 README'],
      security: ['只读文档检索', '不处理用户密钥'],
      evaluations: ['能否为指定 SDK 提供当前 API 用法和来源']
    } satisfies McpAssetSchema,
    examples: ['任务：写 Vercel AI SDK v5 示例\n流程：先 resolve，再 get docs，再生成代码']
  }),
  starterAsset(45, {
    id: 'starter-mcp-playwright-official',
    type: 'mcp',
    title: 'Microsoft Playwright MCP Server',
    summary: 'Microsoft Playwright MCP Server 资产引用，用于把浏览器自动化能力提供给模型。',
    content: `# MCP Reference
Source: https://github.com/microsoft/playwright-mcp
Description: Playwright MCP server
Queried: 2026-05-28

## 适合
Web 自动化、UI 验证、可访问性快照、截图和浏览器端调试。`,
    tags: ['mcp', 'playwright', 'browser', 'microsoft'],
    useCases: ['浏览器自动化测试', '本地 WebApp 手测脚本化', '网站状态检查'],
    integration: integration(
      'mcp.playwright.official',
      ['导航', '点击输入', '截图', '可访问性快照', '网络/console 辅助检查'],
      ['url', 'selectors', 'testFlow'],
      ['browserTrace', 'screenshot', 'assertionResult'],
      ['不可默认提交表单或执行购买/删除动作', '动态页面要等待稳定状态'],
      '用于生成端到端 UI 验证提示词。'
    ),
    schema: {
      server: { name: 'playwright-mcp', transport: 'stdio', auth: 'local browser permission', runtime: 'Microsoft Playwright MCP server' },
      tools: [
        { name: 'navigate', description: '打开页面。', inputSchema: '{ url: string }', outputSchema: '{ status: string }', annotations: ['openWorldHint: true'] },
        { name: 'snapshot', description: '读取页面结构。', inputSchema: '{}', outputSchema: '{ tree: string }', annotations: ['readOnlyHint: true'] },
        { name: 'screenshot', description: '截图。', inputSchema: '{ fullPage?: boolean }', outputSchema: '{ imagePath: string }', annotations: ['readOnlyHint: true'] }
      ],
      resources: ['browser://page'],
      prompts: ['verify_web_flow'],
      errorHandling: ['页面超时时记录 URL 和等待条件', '选择器失效时回到 snapshot'],
      security: ['不自动执行高风险点击', '不绕过登录或权限限制'],
      evaluations: ['能否稳定验证核心 UI 流程']
    } satisfies McpAssetSchema,
    examples: ['任务：检查项目库新建资产流程\n输出：Playwright MCP 交互步骤和断言']
  }),
  starterAsset(46, {
    id: 'starter-sdk-github-openai-node',
    type: 'sdk',
    title: 'OpenAI Node 官方 SDK',
    summary: 'OpenAI 官方 JavaScript/TypeScript SDK，适合 Node 服务端、结构化输出、工具调用和多模态能力封装。',
    content: `# SDK Reference
Source: https://github.com/openai/openai-node
Description: Official JavaScript / TypeScript library for the OpenAI API
Queried: 2026-05-28

## 关键边界
API key 放服务端环境变量；前端只调用自己的后端接口。`,
    tags: ['sdk', 'openai', 'typescript', 'official'],
    useCases: ['服务端模型调用', '结构化输出', '工具调用编排', '图片/多模态接入'],
    integration: integration(
      'sdk.openai.node',
      ['Responses API', 'Chat/Assistants 迁移', '结构化输出', '工具调用'],
      ['model', 'input/messages', 'tools', 'schema'],
      ['response id', 'output text', 'tool calls', 'usage'],
      ['不要在浏览器暴露 OPENAI_API_KEY', '版本差异需查官方文档'],
      '用于生成 TypeScript 服务端 AI 功能提示词。'
    ),
    schema: makeSdkSchema(
      'openai',
      'TypeScript',
      'latest',
      'npm install openai',
      'const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });',
      'client.responses.create',
      '创建 Responses API 请求',
      ['model', 'input', 'tools?', 'text?/response_format?'],
      ['id', 'output_text', 'output', 'usage'],
      ['401 auth', '429 rate limit', '400 invalid schema'],
      ['Node.js 服务端', 'Serverless/Edge 视运行时能力而定'],
      ['mock OpenAI client', '覆盖 401/429/400', '验证 schema parse']
    ),
    examples: ['任务：给项目加提示词优化 API\n注入：OpenAI Node SDK 初始化、安全边界和错误处理']
  }),
  starterAsset(47, {
    id: 'starter-sdk-github-openai-python',
    type: 'sdk',
    title: 'OpenAI Python 官方 SDK',
    summary: 'OpenAI 官方 Python SDK，适合 FastAPI、批处理、评测脚本和数据处理型 AI 应用。',
    content: `# SDK Reference
Source: https://github.com/openai/openai-python
Description: The official Python library for the OpenAI API
Queried: 2026-05-28

## 关键边界
使用环境变量管理密钥；批处理和评测脚本要记录输入输出与错误分支。`,
    tags: ['sdk', 'openai', 'python', 'official'],
    useCases: ['Python AI 服务', '评测脚本', '批量处理 Prompt', 'FastAPI 集成'],
    integration: integration(
      'sdk.openai.python',
      ['Responses API', '结构化输出', '批处理', '评测流水线'],
      ['model', 'input', 'tools', 'schema'],
      ['response', 'parsedOutput', 'usage'],
      ['不要把 key 写入代码或日志', '生产环境要处理限流重试'],
      '用于生成 Python/FastAPI AI 服务提示词。'
    ),
    schema: makeSdkSchema(
      'openai',
      'Python',
      'latest',
      'pip install openai',
      'client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])',
      'client.responses.create',
      '创建模型响应',
      ['model', 'input', 'tools', 'text/response_format'],
      ['response.output_text', 'response.output', 'usage'],
      ['AuthenticationError', 'RateLimitError', 'BadRequestError'],
      ['Python 服务端', 'FastAPI', '批处理脚本'],
      ['pytest mock client', '错误分支测试', '小样本 golden test']
    ),
    examples: ['任务：做一个批量优化提示词脚本\n输出：输入读取、Responses 调用、错误重试、结果保存']
  }),
  starterAsset(48, {
    id: 'starter-sdk-mcp-typescript-official',
    type: 'sdk',
    title: 'MCP TypeScript 官方 SDK',
    summary: 'Model Context Protocol 官方 TypeScript SDK，用于构建 MCP Server/Client 和工具 schema。',
    content: `# SDK Reference
Source: https://github.com/modelcontextprotocol/typescript-sdk
Description: The official TypeScript SDK for Model Context Protocol servers and clients
Queried: 2026-05-28`,
    tags: ['sdk', 'mcp', 'typescript', 'official'],
    useCases: ['实现 MCP Server', '定义工具输入输出', '接入 stdio/HTTP transport'],
    integration: integration(
      'sdk.mcp.typescript',
      ['MCP Server', 'Tool/Resource/Prompt 注册', 'stdio/HTTP transport'],
      ['serverName', 'toolSchemas', 'transportConfig'],
      ['runningServer', 'toolResults', 'protocolMessages'],
      ['工具 schema 要清晰', '错误消息要可操作'],
      '用于生成 TypeScript MCP 实现提示词。'
    ),
    schema: makeSdkSchema(
      '@modelcontextprotocol/sdk',
      'TypeScript',
      'latest',
      'npm install @modelcontextprotocol/sdk',
      'const server = new McpServer({ name, version });',
      'server.registerTool',
      '注册一个 MCP 工具',
      ['name', 'description', 'inputSchema', 'handler'],
      ['content', 'structuredContent'],
      ['schema validation error', 'transport error', 'auth failure'],
      ['Node.js MCP Server', 'stdio', 'streamable HTTP'],
      ['npm run build', 'MCP Inspector smoke test', 'tool-level unit test']
    ),
    examples: ['任务：封装本地文件摘要 MCP\n输出：工具 schema、handler、错误处理、Inspector 测试']
  }),
  starterAsset(49, {
    id: 'starter-sdk-mcp-python-official',
    type: 'sdk',
    title: 'MCP Python 官方 SDK',
    summary: 'Model Context Protocol 官方 Python SDK，适合 Python/FastMCP 风格的本地或远程 MCP 服务。',
    content: `# SDK Reference
Source: https://github.com/modelcontextprotocol/python-sdk
Description: The official Python SDK for Model Context Protocol servers and clients
Queried: 2026-05-28`,
    tags: ['sdk', 'mcp', 'python', 'official'],
    useCases: ['Python MCP Server', '封装数据处理工具', '快速暴露本地脚本能力'],
    integration: integration(
      'sdk.mcp.python',
      ['Python MCP Server', 'Tool 注册', '本地脚本封装'],
      ['toolFunction', 'inputModel', 'transport'],
      ['toolResponse', 'structuredData'],
      ['保持输入输出可序列化', '不要泄露本地敏感路径'],
      '用于生成 Python MCP 或 FastMCP 风格工具提示词。'
    ),
    schema: makeSdkSchema(
      'mcp',
      'Python',
      'latest',
      'pip install mcp',
      'mcp = FastMCP("server-name")',
      '@mcp.tool',
      '声明一个可调用 MCP 工具',
      ['typed function args', 'docstring', 'context?'],
      ['text result', 'structured data'],
      ['validation error', 'tool runtime error', 'transport error'],
      ['Python 本地工具', 'stdio/HTTP 视实现而定'],
      ['python -m py_compile', 'MCP Inspector', 'pytest']
    ),
    examples: ['任务：把 Excel 解析脚本封成 MCP\n输出：FastMCP 工具、参数类型、失败处理']
  }),
  starterAsset(50, {
    id: 'starter-sdk-langchain-js',
    type: 'sdk',
    title: 'LangChain JS Agent 工程 SDK',
    summary: 'LangChain JS 仓库用于 Agent/RAG/Tool 调用工程化，适合 TypeScript 生态的链路封装。',
    content: `# SDK Reference
Source: https://github.com/langchain-ai/langchainjs
Description: The agent engineering platform
Queried: 2026-05-28`,
    tags: ['sdk', 'langchain', 'typescript', 'agent'],
    useCases: ['Agent 工程', '工具调用编排', 'RAG 链路', '多模型适配'],
    integration: integration(
      'sdk.langchain.js',
      ['Tool abstraction', 'Runnable pipeline', 'Agent/RAG 编排'],
      ['model', 'tools', 'documents', 'promptTemplate'],
      ['agentResponse', 'toolTrace', 'retrievedDocs'],
      ['链路复杂时需要 tracing 和评测', '版本 API 需查文档'],
      '用于生成 TypeScript Agent/RAG 实现提示词。'
    ),
    schema: makeSdkSchema(
      '@langchain/core / langchain',
      'TypeScript',
      'latest',
      'npm install langchain @langchain/core',
      'import { tool } from "@langchain/core/tools";',
      'createAgent / RunnableSequence',
      '构建 Agent 或可组合链路',
      ['model', 'tools', 'prompt', 'retriever?'],
      ['AIMessage', 'tool calls', 'intermediate steps'],
      ['tool schema error', 'model provider error', 'retriever empty result'],
      ['Node.js', '多 provider 视包而定'],
      ['unit test tools', 'golden RAG cases', 'trace review']
    ),
    examples: ['任务：做一个文档问答 Agent\n输出：retriever、prompt、tools、评测样例']
  }),
  starterAsset(51, {
    id: 'starter-sdk-langgraph',
    type: 'sdk',
    title: 'LangGraph 状态化 Agent 框架',
    summary: 'LangGraph 用于构建 resilient agents，适合状态机、多节点、可恢复 Agent 工作流。',
    content: `# SDK Reference
Source: https://github.com/langchain-ai/langgraph
Description: Build resilient agents.
Queried: 2026-05-28`,
    tags: ['sdk', 'langgraph', 'agent', 'workflow'],
    useCases: ['状态化 Agent', '多节点工作流', '人工确认节点', '长任务恢复'],
    integration: integration(
      'sdk.langgraph',
      ['StateGraph', '节点/边', 'checkpoint', 'human-in-the-loop'],
      ['stateSchema', 'nodes', 'edges', 'checkpointer'],
      ['finalState', 'nodeTrace', 'interrupts'],
      ['节点职责必须单一', '状态字段要有失效和清理策略'],
      '用于复杂 Agent 工作流提示词，建议搭配 LangGraph Skill 化器。'
    ),
    schema: makeSdkSchema(
      'langgraph',
      'Python/TypeScript',
      'latest',
      'pip install langgraph 或 npm install @langchain/langgraph',
      'const graph = new StateGraph(StateAnnotation);',
      'graph.addNode / graph.addEdge',
      '定义状态图节点和流转',
      ['state schema', 'node functions', 'edges', 'checkpointer?'],
      ['compiled graph', 'state updates', 'trace'],
      ['invalid state update', 'node exception', 'checkpoint error'],
      ['Python', 'TypeScript', 'LangChain 生态'],
      ['节点单测', '状态迁移回归', '人工中断路径测试']
    ),
    examples: ['任务：把提示词优化拆成推荐、生成、评估节点\n输出：StateGraph 节点和状态字段']
  }),
  starterAsset(52, {
    id: 'starter-sdk-llamaindex',
    type: 'sdk',
    title: 'LlamaIndex 文档 Agent/RAG SDK',
    summary: 'LlamaIndex 适合文档索引、RAG、OCR/资料问答和文档 Agent 场景。',
    content: `# SDK Reference
Source: https://github.com/run-llama/llama_index
Description: LlamaIndex is the leading document agent and OCR platform
Queried: 2026-05-28`,
    tags: ['sdk', 'llamaindex', 'rag', 'document'],
    useCases: ['文档索引', 'RAG 问答', '资料库 Agent', 'OCR 资料处理'],
    integration: integration(
      'sdk.llamaindex',
      ['document loading', 'index/query engine', 'retrieval', 'agent over data'],
      ['documents', 'metadata', 'query', 'retrievalConfig'],
      ['retrievedNodes', 'answer', 'citations'],
      ['必须保留来源和 chunk metadata', '不能把检索不到的信息编造成答案'],
      '用于生成资料库、知识库和文档 Agent 的提示词。'
    ),
    schema: makeSdkSchema(
      'llama-index',
      'Python',
      'latest',
      'pip install llama-index',
      'index = VectorStoreIndex.from_documents(documents)',
      'index.as_query_engine().query',
      '对文档索引执行查询',
      ['query', 'retriever config', 'response mode'],
      ['response text', 'source nodes', 'metadata'],
      ['loader error', 'empty retrieval', 'embedding/provider error'],
      ['Python RAG', '文档处理流水线'],
      ['golden question set', 'citation coverage', 'empty retrieval tests']
    ),
    examples: ['任务：把项目库资产做成问答索引\n输出：loader、index、query engine、引用规则']
  }),
  starterAsset(53, {
    id: 'starter-sdk-autogen',
    type: 'sdk',
    title: 'Microsoft AutoGen Agent 框架',
    summary: 'AutoGen 是 Microsoft 的 agentic AI 编程框架，适合多 Agent 协作、工具使用和自动化流程。',
    content: `# SDK Reference
Source: https://github.com/microsoft/autogen
Description: A programming framework for agentic AI
Queried: 2026-05-28`,
    tags: ['sdk', 'agent', 'autogen', 'microsoft'],
    useCases: ['多 Agent 协作', '任务分解', '工具调用代理', '自动化研究流程'],
    integration: integration(
      'sdk.autogen',
      ['Agent 定义', '多 Agent 对话', '工具/代码执行协作'],
      ['agents', 'messages', 'tools', 'termination'],
      ['conversationTrace', 'taskResult', 'toolOutputs'],
      ['必须定义停止条件和权限边界', '工具执行要隔离风险'],
      '用于生成多 Agent 协作提示词和架构方案。'
    ),
    schema: makeSdkSchema(
      'autogen',
      'Python',
      'latest',
      'pip install autogen-agentchat',
      'agent = AssistantAgent(name, model_client=model_client)',
      'agent.run / team.run',
      '运行单 Agent 或团队任务',
      ['task', 'agents', 'tools', 'termination condition'],
      ['messages', 'task result', 'trace'],
      ['model client error', 'tool execution error', 'termination missing'],
      ['Python agentic workflow'],
      ['停止条件测试', '工具权限测试', '对话 trace 检查']
    ),
    examples: ['任务：设计研究 + 编码 + 审查三 Agent\n输出：角色、消息流、停止条件和工具边界']
  }),
  starterAsset(54, {
    id: 'starter-sdk-crewai',
    type: 'sdk',
    title: 'CrewAI 多 Agent 编排框架',
    summary: 'CrewAI 用于编排 role-playing autonomous agents，适合职责明确的多角色任务流。',
    content: `# SDK Reference
Source: https://github.com/crewAIInc/crewAI
Description: Framework for orchestrating role-playing, autonomous AI agents.
Queried: 2026-05-28`,
    tags: ['sdk', 'agent', 'crewai', 'multi-agent'],
    useCases: ['多角色任务流', '研究写作协作', '工具化 Agent 团队', '业务流程自动化'],
    integration: integration(
      'sdk.crewai',
      ['Agent roles', 'Tasks', 'Crew orchestration', 'Tools'],
      ['agents', 'tasks', 'process', 'tools'],
      ['crewOutput', 'taskResults', 'logs'],
      ['角色边界要清楚', '任务依赖和验收标准必须明确'],
      '用于生成职责分明的多 Agent 协作提示词。'
    ),
    schema: makeSdkSchema(
      'crewai',
      'Python',
      'latest',
      'pip install crewai',
      'crew = Crew(agents=agents, tasks=tasks)',
      'crew.kickoff',
      '启动多 Agent 任务流',
      ['agents', 'tasks', 'tools?', 'process?'],
      ['final output', 'task outputs', 'logs'],
      ['tool error', 'task dependency error', 'model provider error'],
      ['Python 多 Agent 工作流'],
      ['任务依赖测试', '角色输出评审', '工具失败回退']
    ),
    examples: ['任务：做市场研究报告 Agent 团队\n输出：Researcher/Writer/Reviewer、任务依赖、最终报告契约']
  }),
  starterAsset(55, {
    id: 'starter-agent-langgraph-stateful',
    type: 'agent',
    title: '状态化 LangGraph Agent',
    summary: '适合长任务、多节点、需要 checkpoint、人审和可恢复执行的 Agent 架构。',
    content: `# Agent Pattern
使用状态图管理任务：
- state schema 保存输入、计划、工具结果、草稿和错误
- node 单一职责
- edge 表示条件流转
- interrupt 处理人工确认
- checkpoint 支持恢复`,
    tags: ['agent', 'langgraph', 'stateful', 'workflow'],
    useCases: ['长任务 Agent', '多轮确认流程', '可恢复工作流', '复杂提示词优化管线'],
    integration: integration(
      'agent.langgraph_stateful',
      ['状态管理', '条件流转', '人审节点', '恢复执行'],
      ['taskState', 'nodes', 'checkpointer', 'approvalRules'],
      ['finalState', 'trace', 'approvalRequests'],
      ['节点不能过度耦合', '状态字段要有清理规则'],
      '用于把复杂提示词优化流程拆成推荐、生成、评估、迭代节点。'
    ),
    schema: {
      identity: '状态化 Agent 编排器',
      goals: ['把复杂任务拆为可恢复节点', '保留状态和证据', '在高风险步骤请求确认'],
      instructions: ['先定义 state schema', '每个 node 只做一件事', '为失败路径写 edge'],
      tools: ['LangGraph StateGraph', 'Evaluator', 'MCP tools'],
      memoryStrategy: '长期记忆只保存偏好和项目约定，任务状态进 checkpoint。',
      planningStrategy: '先画状态流，再实现节点。',
      stopConditions: ['达到 finalState', '用户拒绝继续', '不可恢复错误'],
      failureHandling: ['节点失败写入 error 字段', '可重试错误进入 retry edge', '不可恢复错误请求人工处理'],
      outputContract: '状态图说明、节点职责、输入输出、失败路径和验收标准。'
    } satisfies AgentAssetSchema,
    examples: ['任务：优化提示词并评估\n节点：recommendAssets -> generatePrompt -> evaluate -> refine']
  }),
  starterAsset(56, {
    id: 'starter-agent-crewai-role-team',
    type: 'agent',
    title: 'CrewAI 角色团队 Agent',
    summary: '适合把复杂任务拆成研究、撰写、审查、交付等角色协作的 Agent 团队。',
    content: `# Agent Pattern
角色：
- Researcher 收集资料
- Architect 设计方案
- Writer 生成交付物
- Reviewer 检查质量

每个角色有目标、工具、任务和验收标准。`,
    tags: ['agent', 'crewai', 'role-team', 'multi-agent'],
    useCases: ['研究报告生成', '多角色 Prompt 设计', '复杂资料整理'],
    integration: integration(
      'agent.crewai_role_team',
      ['角色分工', '任务依赖', '团队交付', '审查回路'],
      ['roles', 'tasks', 'tools', 'qualityGates'],
      ['taskOutputs', 'finalDeliverable', 'reviewFindings'],
      ['角色之间不能职责重叠过多', 'Reviewer 必须有证据标准'],
      '用于生成 CrewAI 或通用多 Agent 团队提示词。'
    ),
    schema: {
      identity: '多角色 Agent 团队编排器',
      goals: ['按角色拆分复杂任务', '建立任务依赖', '让审查结果回流修改'],
      instructions: ['定义每个角色的目标和禁止事项', '为每个 task 写 expected_output', '最后由 Reviewer 做质量门'],
      tools: ['CrewAI Tools', 'Reference assets', 'Evaluator assets'],
      memoryStrategy: '共享项目背景，角色私有中间笔记只在任务内使用。',
      planningStrategy: '先确定最终交付物，再倒推角色和任务依赖。',
      stopConditions: ['最终交付物通过 Reviewer', '缺少关键输入需要用户补充'],
      failureHandling: ['角色输出不合格时回到对应 task', '工具失败时降级为人工提供资料'],
      outputContract: '角色表、任务表、依赖关系、工具边界和最终交付格式。'
    } satisfies AgentAssetSchema,
    examples: ['任务：生成行业分析报告\n团队：Researcher -> Writer -> Reviewer']
  }),
  starterAsset(57, {
    id: 'starter-agent-autogen-conversation-team',
    type: 'agent',
    title: 'AutoGen 对话式多 Agent',
    summary: '适合通过多 Agent 对话推进研究、编码、审查和工具执行的自动化任务。',
    content: `# Agent Pattern
使用 AutoGen 风格：
- AssistantAgent 负责专业角色
- UserProxy 或 Controller 负责确认和工具边界
- termination condition 防止无限对话
- conversation trace 用于复核`,
    tags: ['agent', 'autogen', 'multi-agent', 'conversation'],
    useCases: ['研究 + 编码 + 审查协作', '自动任务分解', '工具执行带人审'],
    integration: integration(
      'agent.autogen_conversation_team',
      ['对话式协作', '终止条件', '工具执行代理', 'trace 复核'],
      ['task', 'agents', 'tools', 'termination'],
      ['conversationTrace', 'finalAnswer', 'toolEvidence'],
      ['必须设置停止条件', '工具执行前区分只读/写入'],
      '用于生成 AutoGen 或对话式多 Agent 的系统提示词。'
    ),
    schema: {
      identity: '对话式多 Agent 协调器',
      goals: ['让多个专业 Agent 通过对话解决任务', '保留可审查 trace', '避免无限循环'],
      instructions: ['定义角色和消息权限', '设置 termination condition', '工具执行要经过 Controller'],
      tools: ['AutoGen AgentChat', 'Tool wrappers', 'Evaluator'],
      memoryStrategy: '对话 trace 作为短期任务记忆，长期只沉淀可复用结论。',
      planningStrategy: '先定义成员和协作协议，再定义停止条件。',
      stopConditions: ['任务完成信号', '最大轮次', '用户确认停止'],
      failureHandling: ['重复争论时由 Controller 总结并决策', '工具失败时请求替代输入'],
      outputContract: '成员角色、对话协议、工具权限、停止条件和 trace 摘要。'
    } satisfies AgentAssetSchema,
    examples: ['任务：自动修复 PR\nAgent：Planner、Coder、Reviewer、Controller']
  }),
  starterAsset(58, {
    id: 'starter-agent-rag-document-curator',
    type: 'agent',
    title: 'RAG 文档策展 Agent',
    summary: '负责把资料解析、切片、索引、检索、引用和答案质量检查串成稳定文档问答流程。',
    content: `# Agent Pattern
流程：
1. 资料盘点
2. 解析和清洗
3. 切片与 metadata
4. 建索引
5. 检索回答
6. 引用覆盖检查`,
    tags: ['agent', 'rag', 'document', 'llamaindex'],
    useCases: ['文档问答系统', '资料库 Agent', '引用型报告生成'],
    integration: integration(
      'agent.rag_document_curator',
      ['资料清洗', 'chunk metadata', '检索回答', '引用检查'],
      ['documents', 'question', 'indexConfig'],
      ['answer', 'citations', 'coverageReport'],
      ['答案必须基于检索内容', '检索为空时不能编造'],
      '用于生成 RAG/文档 Agent 的提示词。'
    ),
    schema: {
      identity: '文档 RAG 策展 Agent',
      goals: ['让文档问答可追溯', '保留来源和 chunk metadata', '检查答案引用覆盖'],
      instructions: ['先盘点资料', '再解析切片', '回答时引用来源', '检索为空要说明'],
      tools: ['Parser assets', 'LlamaIndex', 'Evaluator.citation_coverage'],
      memoryStrategy: '索引 metadata 保存来源；用户偏好单独保存。',
      planningStrategy: '按 ingestion -> indexing -> query -> evaluation 规划。',
      stopConditions: ['答案有足够引用', '资料不足需用户补充'],
      failureHandling: ['解析失败列出文件', '检索为空返回缺失项', '引用不足要求二次检索'],
      outputContract: '答案、引用、未覆盖问题、下一步补充资料建议。'
    } satisfies AgentAssetSchema,
    examples: ['任务：用一堆 PDF 做问答\n输出：解析、索引、检索、引用检查流程']
  }),
  starterAsset(59, {
    id: 'starter-tool-playwright-web-automation',
    type: 'tool',
    title: 'Playwright Web 自动化 Tool',
    summary: 'Microsoft Playwright 是高采用度 Web Testing/Automation 框架，适合端到端验证和浏览器脚本。',
    content: `# Tool Reference
Source: https://github.com/microsoft/playwright
Description: Web Testing and Automation for Chromium, Firefox and WebKit
Queried: 2026-05-28`,
    tags: ['tool', 'playwright', 'browser', 'testing'],
    useCases: ['E2E 测试', '本地应用验收', '浏览器自动化脚本', '截图和 trace'],
    integration: integration(
      'tool.playwright',
      ['浏览器启动', '定位器', '断言', '截图', 'trace'],
      ['url', 'selectors', 'testSteps'],
      ['testResult', 'screenshot', 'trace'],
      ['动态页面需等待稳定状态', '高风险点击需确认'],
      '用于生成 Web 自动化测试提示词或脚本规格。'
    ),
    schema: makeToolSchema(
      'playwright',
      '用真实浏览器验证 Web 应用行为。',
      ['url: string', 'steps: TestStep[]', 'viewport?: Viewport'],
      ['passed: boolean', 'logs: string[]', 'artifacts: string[]'],
      ['目标页面可访问', '测试环境和依赖已安装'],
      ['可能触发表单提交或状态变更'],
      ['定位器失效时重新 snapshot', '页面慢时增加显式等待'],
      ['page.goto(url); await page.getByRole("button").click();']
    ),
    examples: ['任务：验证资产筛选\n工具：打开页面、搜索 tag、断言资产数量变化']
  }),
  starterAsset(60, {
    id: 'starter-tool-puppeteer-browser-automation',
    type: 'tool',
    title: 'Puppeteer Chrome 自动化 Tool',
    summary: 'Puppeteer 提供 Chrome/Firefox JavaScript 自动化 API，适合抓取、截图和轻量浏览器任务。',
    content: `# Tool Reference
Source: https://github.com/puppeteer/puppeteer
Description: JavaScript API for Chrome and Firefox
Queried: 2026-05-28`,
    tags: ['tool', 'puppeteer', 'browser', 'automation'],
    useCases: ['网页截图', '页面抓取', 'Chrome 自动化', '生成 PDF'],
    integration: integration(
      'tool.puppeteer',
      ['浏览器控制', 'DOM 查询', '截图/PDF', '页面抓取'],
      ['url', 'evaluateScript', 'screenshotOptions'],
      ['pageContent', 'screenshotPath', 'pdfPath'],
      ['不要抓取未授权内容', '动态页面需等待 selector'],
      '用于需要 Chrome 自动化但不一定要测试断言的提示词。'
    ),
    schema: makeToolSchema(
      'puppeteer',
      '通过 JavaScript 控制浏览器执行页面任务。',
      ['url: string', 'actions: BrowserAction[]'],
      ['html?: string', 'screenshot?: string', 'pdf?: string'],
      ['目标网页可访问', '遵守网站权限和 robots/条款'],
      ['可能触发页面交互和网络请求'],
      ['失败时保留 URL、selector 和错误堆栈'],
      ['const browser = await puppeteer.launch();']
    ),
    examples: ['任务：把页面截成长图\n工具：Puppeteer 打开、等待、screenshot']
  }),
  starterAsset(61, {
    id: 'starter-tool-zod-schema-contract',
    type: 'tool',
    title: 'Zod TypeScript Schema Tool',
    summary: 'Zod 是 TypeScript-first schema validation 工具，适合资产 schema、模型输出和 API 输入校验。',
    content: `# Tool Reference
Source: https://github.com/colinhacks/zod
Description: TypeScript-first schema validation with static type inference
Queried: 2026-05-28`,
    tags: ['tool', 'zod', 'typescript', 'schema'],
    useCases: ['模型结构化输出校验', '资产导入 JSON 校验', 'MCP tool input schema', 'API 参数校验'],
    integration: integration(
      'tool.zod_schema',
      ['schema 定义', 'runtime validation', 'TypeScript 类型推断'],
      ['unknownData', 'zodSchema'],
      ['parsedData', 'validationErrors'],
      ['校验失败不能静默通过', '错误要映射到用户可理解路径'],
      '用于生成 TS 项目 schema 校验提示词。'
    ),
    schema: makeToolSchema(
      'zod',
      '定义和校验 TypeScript 数据结构。',
      ['data: unknown', 'schema: ZodSchema'],
      ['success: boolean', 'data?: T', 'errors?: ZodIssue[]'],
      ['schema 已定义', '输入可序列化'],
      ['无副作用'],
      ['safeParse 失败时返回 issue path 和 message'],
      ['const result = AssetSchema.safeParse(data);']
    ),
    examples: ['任务：导入资产 JSON\n工具：用 Zod 校验 version 和 assets 字段']
  }),
  starterAsset(62, {
    id: 'starter-tool-pydantic-validation',
    type: 'tool',
    title: 'Pydantic Python 数据校验 Tool',
    summary: 'Pydantic 用 Python type hints 做数据校验，适合 FastAPI、SDK 输入输出和评测结果结构化。',
    content: `# Tool Reference
Source: https://github.com/pydantic/pydantic
Description: Data validation using Python type hints
Queried: 2026-05-28`,
    tags: ['tool', 'pydantic', 'python', 'schema'],
    useCases: ['FastAPI 请求响应模型', '评测报告校验', 'MCP Python 工具参数', '批处理配置'],
    integration: integration(
      'tool.pydantic_model',
      ['数据模型', '运行时校验', '错误路径', '序列化'],
      ['rawData', 'BaseModel'],
      ['modelInstance', 'validationErrors', 'jsonSchema'],
      ['不要吞掉 ValidationError', '字段说明要可读'],
      '用于生成 Python 服务或数据管线提示词。'
    ),
    schema: makeToolSchema(
      'pydantic',
      '用 Python 类型声明校验和序列化数据。',
      ['rawData: dict', 'model: BaseModel'],
      ['model instance', 'errors', 'json schema'],
      ['模型字段已声明'],
      ['无副作用'],
      ['校验失败返回字段路径和修复建议'],
      ['class Asset(BaseModel): title: str']
    ),
    examples: ['任务：做 Python 资产导入 API\n工具：Pydantic 校验 PromptAsset']
  }),
  starterAsset(63, {
    id: 'starter-tool-fastapi-service-shell',
    type: 'tool',
    title: 'FastAPI 服务骨架 Tool',
    summary: 'FastAPI 是高采用度 Python Web 框架，适合 AI 服务、Webhook、MCP 辅助 HTTP 服务。',
    content: `# Tool Reference
Source: https://github.com/fastapi/fastapi
Description: FastAPI framework, high performance, easy to learn, ready for production
Queried: 2026-05-28`,
    tags: ['tool', 'fastapi', 'python', 'api'],
    useCases: ['AI 后端 API', 'Webhook 服务', '批处理任务入口', '本地工具 HTTP 化'],
    integration: integration(
      'tool.fastapi_service',
      ['HTTP 路由', 'Pydantic 模型', '依赖注入', 'OpenAPI'],
      ['requestModel', 'routeHandlers', 'authConfig'],
      ['JSON response', 'OpenAPI schema', 'errors'],
      ['密钥只在服务端环境变量', '生产环境要加鉴权和限流'],
      '用于生成 Python API 服务提示词。'
    ),
    schema: makeToolSchema(
      'fastapi',
      '构建 Python HTTP API 服务。',
      ['routes: RouteSpec[]', 'models: PydanticModel[]', 'dependencies?: Dependency[]'],
      ['app', 'OpenAPI spec', 'test client result'],
      ['Python 环境已管理', '依赖已安装'],
      ['启动服务监听端口'],
      ['启动失败时检查端口和依赖', '请求失败时返回结构化错误'],
      ['app = FastAPI(); @app.post("/optimize")']
    ),
    examples: ['任务：把提示词优化做成后端接口\n输出：route、request/response 模型、错误处理']
  }),
  starterAsset(64, {
    id: 'starter-tool-uv-python-env',
    type: 'tool',
    title: 'uv Python 项目环境 Tool',
    summary: 'uv 是 Rust 编写的高速 Python package/project manager，适合隔离项目依赖和可复现运行。',
    content: `# Tool Reference
Source: https://github.com/astral-sh/uv
Description: An extremely fast Python package and project manager, written in Rust.
Queried: 2026-05-28`,
    tags: ['tool', 'uv', 'python', 'environment'],
    useCases: ['Python 项目依赖管理', '临时脚本环境', '文档处理工具隔离', 'CI 可复现安装'],
    integration: integration(
      'tool.uv_project_env',
      ['虚拟环境', '依赖锁定', '脚本运行', 'Python 版本管理'],
      ['pyproject.toml', 'dependencies', 'pythonVersion'],
      ['venv', 'lockfile', 'runResult'],
      ['不要混用 Homebrew Python 和 Conda/uv 环境', '不使用 sudo pip'],
      '用于生成 Python 工程执行提示词，尤其符合本机项目约定。'
    ),
    schema: makeToolSchema(
      'uv',
      '管理 Python 项目依赖和运行环境。',
      ['dependencies: string[]', 'pythonVersion?: string', 'command?: string'],
      ['virtualenv path', 'uv.lock', 'command output'],
      ['uv 已安装', '项目允许创建本地环境'],
      ['写入 pyproject/lock/venv'],
      ['失败时检查 Python 版本和依赖冲突'],
      ['uv run python script.py']
    ),
    examples: ['任务：写一个 PDF 解析脚本\n约束：用 uv/conda 管理依赖，不 sudo pip']
  }),
  starterAsset(65, {
    id: 'starter-tool-ripgrep-search',
    type: 'tool',
    title: 'ripgrep 代码检索 Tool',
    summary: 'ripgrep 是高性能全文搜索工具，适合代码库检索、影响面分析和快速定位引用。',
    content: `# Tool Reference
Source: https://github.com/BurntSushi/ripgrep
Description: recursively searches directories for a regex pattern while respecting gitignore
Queried: 2026-05-28`,
    tags: ['tool', 'ripgrep', 'search', 'codebase'],
    useCases: ['代码库检索', '定位配置和引用', '影响面分析', '重构前盘点'],
    integration: integration(
      'tool.ripgrep',
      ['全文搜索', '文件列表', 'glob 过滤', 'gitignore 兼容'],
      ['pattern', 'path', 'glob?'],
      ['matches', 'filePaths', 'lineNumbers'],
      ['正则过宽会产生噪声', '二进制/大文件需过滤'],
      '用于生成“先搜索再修改”的工程提示词。'
    ),
    schema: makeToolSchema(
      'rg',
      '快速搜索代码库文本和文件。',
      ['pattern: string', 'path?: string', 'glob?: string'],
      ['matches: { path, line, text }[]'],
      ['当前目录是目标仓库', 'ripgrep 可用'],
      ['无副作用'],
      ['无结果时放宽 pattern 或搜索文件名'],
      ['rg "GEMINI_API_KEY" .']
    ),
    examples: ['任务：找资产推荐逻辑\n工具：rg "recommendAssets" services App.tsx']
  }),
  starterAsset(66, {
    id: 'starter-tool-codex-document-toolchain',
    type: 'tool',
    title: '本机 Codex 文档工具链',
    summary: '来自项目 AGENTS.md 约定：Markdown/Word/PDF 转换、检查和公式渲染的本地可复用命令。',
    content: `# Local Toolchain
Source: /Users/hwaigc/太空垃圾站/提示词大师/AGENTS.md

Commands:
- codex-md-to-docx input.md output.docx
- codex-docx-to-pdf input.docx [output_dir]
- codex-md-to-pdf input.md output.pdf
- codex-docx-inspect input.docx
- codex-pdf-inspect input.pdf

正式中文文档默认 Markdown -> DOCX -> PDF，并检查段落、表格、页数、文本可抽取性和公式。`,
    tags: ['tool', 'document', 'docx', 'pdf', 'local-codex'],
    useCases: ['正式文档导出', 'Markdown 转 Word/PDF', '交付前检查', 'Mermaid/公式文档处理'],
    integration: integration(
      'tool.codex_document_toolchain',
      ['Markdown 转 DOCX/PDF', 'Word/PDF 检查', 'Mermaid 渲染', 'OMML 公式转换'],
      ['input.md', 'output.docx/pdf', 'styleRules'],
      ['docx', 'pdf', 'inspectionReport'],
      ['最终文档不能残留 LaTeX 源码', '转换后必须检查空白页和文本可抽取性'],
      '用于正式文档生成和检查提示词。'
    ),
    schema: makeToolSchema(
      'codex-document-toolchain',
      '把 Markdown、Word、PDF 文档转换并检查为可交付格式。',
      ['inputPath: string', 'outputPath: string', 'format: docx|pdf'],
      ['deliverablePath', 'inspectionSummary'],
      ['本机文档工具链已安装', '输入文件可读取'],
      ['写入输出文档'],
      ['转换失败时保留源稿并报告命令输出', '检查失败时返回问题清单'],
      ['codex-md-to-pdf report.md report.pdf']
    ),
    examples: ['任务：生成中文正式报告\n输出：Markdown 源稿、DOCX、PDF、检查结果']
  }),
  starterAsset(67, {
    id: 'starter-workflow-docs-driven-sop',
    type: 'workflow',
    title: '文档驱动研发 SOP Workflow',
    summary: '把研发需求纳入需求入口、计划确认、Docs Driven/Fast Fix、验证和提交覆盖检查。',
    content: `# Workflow
1. 读取需求
2. 检查模块文档基线
3. 生成或更新 Change Plan
4. 用户确认
5. 进入 Docs Driven 或 Fast Fix
6. 执行验证
7. 提交前覆盖检查`,
    tags: ['workflow', 'docs-driven', 'engineering', 'local-codex'],
    useCases: ['规范研发改动', '避免无计划改代码', '建立文档和提交闭环'],
    integration: integration(
      'workflow.docs_driven_sop',
      ['需求入口', '路线判断', '计划确认', '验证闭环'],
      ['userRequest', 'moduleDocs', 'diff'],
      ['changePlan', 'implementation', 'verificationLog'],
      ['未确认 plan 不实现', '文档漂移先同步'],
      '用于工程类提示词的顶层流程约束。'
    ),
    schema: {
      goal: '让研发改动可追踪、可确认、可验证。',
      actors: ['User', 'Requirement Intake', 'Docs Pipeline', 'Fast Fix Pipeline', 'Commit Checker'],
      triggers: ['新需求', 'bug 修复', '提交请求', '文档同步请求'],
      inputs: ['需求描述', '仓库状态', '模块文档', 'git diff'],
      stages: [
        { name: 'intake', objective: '建立需求落点。', actions: ['检查模块 docs', '生成 plan', '判断 route'], outputs: ['changePlan'], qualityGate: ['route 有理由'] },
        { name: 'execute', objective: '按路线实施。', actions: ['确认 plan', '更新 docs/CSV', '改代码', '验证'], outputs: ['diff', 'verification'], qualityGate: ['测试通过'] }
      ],
      state: ['pending', 'confirmed', 'implemented', 'verified', 'ready-to-commit'],
      failureHandling: ['docs 缺失先初始化', 'route 不清回到 intake', '验证失败修复后重跑'],
      finalOutputs: ['plan', 'diff', 'verification summary', 'commit coverage']
    } satisfies WorkflowAssetSchema,
    examples: ['任务：新增资产 seed 迁移\n流程：plan -> implement -> typecheck/build -> commit check']
  }),
  starterAsset(68, {
    id: 'starter-workflow-openspec-change-lifecycle',
    type: 'workflow',
    title: 'OpenSpec Change 生命周期 Workflow',
    summary: '从 propose 到 apply，再到 verify/archive 的 spec-driven 变更生命周期。',
    content: `# Workflow
propose -> proposal/design/tasks -> apply -> verify -> archive

适合影响面较大、需要设计文档和任务清单的功能改造。`,
    tags: ['workflow', 'openspec', 'spec-driven'],
    useCases: ['复杂功能设计', '需求到任务拆解', '按 artifacts 实施'],
    integration: integration(
      'workflow.openspec_change_lifecycle',
      ['变更创建', 'artifact 生成', '任务实施', '归档'],
      ['changeName', 'requirements', 'schema'],
      ['proposal', 'design', 'tasks', 'implementationStatus'],
      ['artifact 未完成不能强行 apply', '任务勾选必须对应真实完成'],
      '用于需要 OpenSpec 风格治理的工程提示词。'
    ),
    schema: {
      goal: '用结构化 artifacts 管理复杂变更。',
      actors: ['Proposer', 'Designer', 'Implementer', 'Verifier'],
      triggers: ['用户提出复杂变更', '已有 change 需要继续'],
      inputs: ['changeName', 'requirements', 'projectContext'],
      stages: [
        { name: 'propose', objective: '创建变更 artifacts。', actions: ['new change', 'proposal', 'design', 'tasks'], outputs: ['artifacts'], qualityGate: ['applyRequires 完成'] },
        { name: 'apply', objective: '按 tasks 实现。', actions: ['读取 contextFiles', '逐项实现', '更新 checkbox'], outputs: ['code diff'], qualityGate: ['tasks 状态真实'] }
      ],
      state: ['draft', 'apply-ready', 'in-progress', 'done', 'archived'],
      failureHandling: ['缺 artifact 时 continue', '实现发现设计问题时回写 artifacts'],
      finalOutputs: ['proposal.md', 'design.md', 'tasks.md', 'verified diff']
    } satisfies WorkflowAssetSchema,
    examples: ['输入：重构资产库推荐\n输出：proposal/design/tasks/apply 状态']
  }),
  starterAsset(69, {
    id: 'starter-workflow-skill-packaging-lifecycle',
    type: 'workflow',
    title: 'Skill 封装生命周期 Workflow',
    summary: '把成熟提示词/流程封装成 Skill：边界定义、资源分层、MCP 接入、校验、发布。',
    content: `# Workflow
1. 定义能力边界
2. 写触发策略
3. 拆 SKILL.md / references / scripts / assets
4. 规划 agents/openai.yaml 和 mcp/
5. 校验结构
6. 写示例和回归案例`,
    tags: ['workflow', 'skill', 'packaging'],
    useCases: ['把 Prompt 变成 Skill', '打包 Skill Pack', '审计 Skill 质量'],
    integration: integration(
      'workflow.skill_packaging_lifecycle',
      ['能力抽象', '资源分层', '触发策略', '验证发布'],
      ['rawWorkflow', 'useCases', 'toolNeeds'],
      ['skillPackagePlan', 'fileStructure', 'validationChecklist'],
      ['SKILL.md 保持精简', 'MCP 需要单独注册'],
      '用于让优化提示词输出可落地的 Skill 包方案。'
    ),
    schema: {
      goal: '把可复用流程封装为生产级 Skill。',
      actors: ['Skill Designer', 'Resource Author', 'Validator'],
      triggers: ['流程稳定', '用户想复用', '需要发布 Skill Pack'],
      inputs: ['流程说明', '触发场景', '示例', '工具需求'],
      stages: [
        { name: 'design', objective: '定义边界和结构。', actions: ['识别触发', '拆资源', '规划脚本'], outputs: ['skillSpec'], qualityGate: ['边界清楚'] },
        { name: 'validate', objective: '验证可安装可调用。', actions: ['结构校验', '示例回归', '触发审计'], outputs: ['validationLog'], qualityGate: ['通过校验'] }
      ],
      state: ['draft', 'structured', 'implemented', 'validated', 'published'],
      failureHandling: ['触发过宽则收窄', '资源过大则拆 references', '脚本失败则修模板'],
      finalOutputs: ['SKILL.md', 'references/', 'scripts/', 'assets/', 'validation report']
    } satisfies WorkflowAssetSchema,
    examples: ['任务：把周报生成流程封成 Skill\n输出：目录结构、触发、校验']
  }),
  starterAsset(70, {
    id: 'starter-workflow-browser-regression',
    type: 'workflow',
    title: '浏览器回归验证 Workflow',
    summary: '围绕本地 Web 应用的启动、侦察、交互、截图、console 检查和回归断言。',
    content: `# Workflow
1. 启动或连接 dev server
2. 打开页面等待稳定
3. 侦察 DOM 和 console
4. 执行核心用户流
5. 断言状态
6. 截图和日志归档
7. 清理临时产物`,
    tags: ['workflow', 'browser', 'playwright', 'testing'],
    useCases: ['前端功能回归', '验证 UI 改造', '检查本地应用交互'],
    integration: integration(
      'workflow.browser_regression',
      ['dev server 管理', 'DOM 侦察', '交互断言', 'console 检查'],
      ['url', 'userFlows', 'expectedAssertions'],
      ['verificationReport', 'screenshots', 'consoleErrors'],
      ['不要遗留临时测试产物', '动态页面先等待 networkidle'],
      '用于生成前端验收和 Playwright 验证提示词。'
    ),
    schema: {
      goal: '验证本地 Web 应用核心流程没有回归。',
      actors: ['Tester', 'Browser Automation', 'Dev Server'],
      triggers: ['前端改动完成', '用户要求手测', '发布前回归'],
      inputs: ['dev server command', 'url', 'test flows', 'assertions'],
      stages: [
        { name: 'recon', objective: '确认页面可用并识别选择器。', actions: ['navigate', 'wait', 'snapshot', 'console check'], outputs: ['pageMap'], qualityGate: ['页面非空'] },
        { name: 'act_assert', objective: '执行并断言核心流程。', actions: ['click/type/upload', 'assert text/state', 'screenshot'], outputs: ['verification'], qualityGate: ['核心断言通过'] }
      ],
      state: ['server-ready', 'page-loaded', 'flow-tested', 'verified', 'cleaned'],
      failureHandling: ['端口占用换端口', 'selector 失效回到 snapshot', 'console error 记录并定位'],
      finalOutputs: ['verification summary', 'screenshots if needed', 'console issue list']
    } satisfies WorkflowAssetSchema,
    examples: ['任务：回归项目库资产导入\n输出：启动、打开、导入、断言、日志']
  }),
  starterAsset(71, {
    id: 'starter-reference-mcp-design-best-practices',
    type: 'reference',
    title: 'MCP 设计最佳实践 Reference',
    summary: '汇总本机 mcp-builder 与官方 MCP SDK 仓库的设计口径：工具命名、schema、错误、安全和评测。',
    content: `# Reference
Sources:
- /Users/hwaigc/.codex/skills/mcp-builder/SKILL.md
- https://github.com/modelcontextprotocol/typescript-sdk
- https://github.com/modelcontextprotocol/python-sdk
- https://github.com/modelcontextprotocol/servers

## 核心事实
MCP Server 质量取决于模型能否用工具完成真实任务，而不只是 API 覆盖数量。`,
    tags: ['reference', 'mcp', 'best-practices'],
    useCases: ['设计 MCP 工具', '审计 MCP 资产', '生成 MCP 评测'],
    integration: integration(
      'reference.mcp_design_best_practices',
      ['工具设计原则', 'schema 要求', '错误处理', '评测方法'],
      ['mcpSpec', 'apiDocs'],
      ['qualityChecklist', 'evalQuestions'],
      ['来源会随 SDK 更新', '实现前要查当前官方文档'],
      '作为 MCP 资产和提示词优化的质量参考。'
    ),
    schema: makeReferenceSchema(
      'local mcp-builder + official MCP SDK repos',
      'MCP Server 设计、工具 schema、错误处理、安全注解和评测。',
      ['工具名应可发现且动词明确', '输入输出 schema 要结构化', '错误消息应指导下一步', '评测问题应真实、独立、可验证'],
      ['不替代最新协议规范', '不同客户端对工具粒度的偏好可能不同']
    ),
    examples: ['任务：审计 GitHub MCP 资产\n引用：工具命名、readOnlyHint、评测问题要求']
  }),
  starterAsset(72, {
    id: 'starter-reference-skill-architecture',
    type: 'reference',
    title: 'Codex Skill 架构 Reference',
    summary: '说明 Skill 由 SKILL.md、references、scripts、assets、agents、mcp 等部分组成，适合资产格式说明。',
    content: `# Reference
Source: /Users/hwaigc/.codex/skills/skill-blueprint-master/SKILL.md

Skill = 精简入口 + 渐进加载资源。
必要：SKILL.md
可选：references/ scripts/ assets/ agents/openai.yaml mcp/

mcp/ 可以随 Skill 打包配置和服务代码，但客户端仍需单独注册。`,
    tags: ['reference', 'skill', 'architecture', 'local-codex'],
    useCases: ['解释 Skill 资产格式', '生成 Skill 新建表单提示', '审计 Skill 包'],
    integration: integration(
      'reference.codex_skill_architecture',
      ['Skill 目录职责', '触发策略', '资源分层', '组合模式'],
      ['skillGoal', 'resources', 'toolNeeds'],
      ['skillArchitecture', 'fileResponsibilities'],
      ['不要假设自动嵌套 Skill', '长资料应放 references'],
      '用于新建 Skill 资产时自动配套架构字段。'
    ),
    schema: makeReferenceSchema(
      'local skill-blueprint-master',
      'Codex Skill 的结构、触发、组合、MCP 接入和验证。',
      ['SKILL.md 是必需入口', 'references/scripts/assets 是渐进加载资源', 'agents/openai.yaml 可控制策略', 'mcp/ 只是打包约定不是自动注册'],
      ['只代表当前 Codex Skill 体系的本机约定', '运行时能力可能随客户端变化']
    ),
    examples: ['新建 skill 资产时，按该 Reference 自动展示结构字段']
  }),
  starterAsset(73, {
    id: 'starter-reference-github-recognized-ai-stack',
    type: 'reference',
    title: '高认可度 AI 工程资产索引 Reference',
    summary: '记录本次从 GitHub 公开 API 查询的高采用度 AI/Agent/MCP/工具项目，作为资产选型参考。',
    content: `# Reference
Queried: 2026-05-28 via GitHub public API

Selected sources:
- https://github.com/openai/openai-node
- https://github.com/openai/openai-python
- https://github.com/vercel/ai
- https://github.com/langchain-ai/langchainjs
- https://github.com/langchain-ai/langgraph
- https://github.com/run-llama/llama_index
- https://github.com/microsoft/autogen
- https://github.com/crewAIInc/crewAI
- https://github.com/modelcontextprotocol/servers
- https://github.com/microsoft/playwright
- https://github.com/astral-sh/uv`,
    tags: ['reference', 'github', 'sdk', 'tooling'],
    useCases: ['资产选型', '推荐 SDK/Tool', '生成项目库默认资产'],
    integration: integration(
      'reference.github_recognized_ai_stack',
      ['来源索引', '选型参考', '生态分类'],
      ['taskType', 'language', 'runtime'],
      ['candidateAssets', 'sourceLinks'],
      ['星标和活跃度会变化', '最终选型要结合项目栈'],
      '用于给资产推荐增加“认可度高、实用”的候选来源。'
    ),
    schema: makeReferenceSchema(
      'GitHub public API repository metadata',
      'AI SDK、Agent 框架、MCP、Web 自动化、Schema 校验和工程工具的来源索引。',
      ['优先官方 SDK 和主流框架', '按任务类型选择而不是盲目堆栈', '资产库只保存上下文不代表已安装'],
      ['不是实时排名', '不能替代安全审计或许可证审查']
    ),
    examples: ['任务：做 RAG 项目\n候选：LlamaIndex、LangChain、LangGraph、引用规则']
  }),
  starterAsset(74, {
    id: 'starter-template-mcp-tool-spec',
    type: 'template',
    title: 'MCP Tool 规格模板',
    summary: '用于新建 MCP 资产时填写 server、tool、input/output schema、注解、安全和评测。',
    content: `# MCP Tool Spec

## Server
name:
transport:
auth:
runtime:

## Tool
name:
description:
inputSchema:
outputSchema:
annotations:

## Error Handling

## Security

## Evaluations`,
    tags: ['template', 'mcp', 'tool-spec'],
    useCases: ['新建 MCP 资产', '审计工具接口', '生成 MCP 实现任务'],
    integration: integration(
      'template.mcp_tool_spec',
      ['MCP 规格骨架', '工具字段', '安全和评测槽位'],
      ['serverInfo', 'toolInfo', 'securityRules'],
      ['mcpSpecMarkdown'],
      ['input/output schema 不可留空', '安全注解必须明确'],
      '用于 MCP 类型资产的新建表单和提示词输出。'
    ),
    schema: {
      structure: ['Server', 'Tools', 'Resources', 'Prompts', 'Error Handling', 'Security', 'Evaluations'],
      slots: ['{{server.name}}', '{{transport}}', '{{tool.name}}', '{{inputSchema}}', '{{outputSchema}}', '{{annotations}}'],
      fillRules: ['工具名用动词开头', 'schema 写字段类型和必填项', '安全边界写清楚'],
      variants: ['只读工具版', '写操作工具版', 'workflow tool 版'],
      outputFormat: 'Markdown + JSON schema snippets',
      constraints: ['不得缺少错误处理', '写操作必须有 destructive/idempotent 说明']
    } satisfies TemplateAssetSchema,
    examples: ['输入：GitHub create issue\n输出：tool spec、schema、注解、评测问题']
  }),
  starterAsset(75, {
    id: 'starter-template-agent-operating-contract',
    type: 'template',
    title: 'Agent 运行契约模板',
    summary: '用于定义 Agent 的身份、目标、工具权限、记忆、计划、停止条件、失败处理和输出契约。',
    content: `# Agent Operating Contract

## Identity
## Goals
## Instructions
## Tools
## Memory Strategy
## Planning Strategy
## Stop Conditions
## Failure Handling
## Output Contract`,
    tags: ['template', 'agent', 'contract'],
    useCases: ['新建 Agent 资产', '规范多 Agent 角色', '优化 Agent 系统提示词'],
    integration: integration(
      'template.agent_operating_contract',
      ['Agent 契约骨架', '工具边界', '停止条件', '失败处理'],
      ['agentRole', 'goals', 'tools', 'riskLevel'],
      ['agentSystemPrompt', 'operatingContract'],
      ['必须有停止条件', '工具权限不可含糊'],
      '用于 Agent 类资产和复杂系统提示词。'
    ),
    schema: {
      structure: ['Identity', 'Goals', 'Instructions', 'Tools', 'Memory Strategy', 'Planning Strategy', 'Stop Conditions', 'Failure Handling', 'Output Contract'],
      slots: ['{{identity}}', '{{goals}}', '{{tools}}', '{{stopConditions}}', '{{outputContract}}'],
      fillRules: ['身份与任务相符', '工具写权限边界', '失败处理必须可执行'],
      variants: ['单 Agent', '多 Agent 成员', 'Controller Agent'],
      outputFormat: 'Markdown system prompt',
      constraints: ['不得没有停止条件', '不得默认执行高风险工具']
    } satisfies TemplateAssetSchema,
    examples: ['输入：PR 修复 Agent\n输出：角色、工具权限、停止条件、提交前确认']
  }),
  starterAsset(76, {
    id: 'starter-evaluator-mcp-server-quality',
    type: 'evaluator',
    title: 'MCP Server 质量评估器',
    summary: '评估 MCP 资产或 Server 设计是否具备可发现工具、清晰 schema、可操作错误、安全注解和评测问题。',
    content: `# Evaluator
维度：
- 工具可发现性
- schema 完整性
- 错误可操作性
- 安全注解
- 评测任务真实性
- 上下文成本`,
    tags: ['evaluator', 'mcp', 'quality'],
    useCases: ['审计 MCP 资产', '发布 MCP 前检查', '生成 MCP 改进建议'],
    integration: integration(
      'evaluator.mcp_server_quality',
      ['MCP 质量评分', '风险识别', '改进建议'],
      ['mcpSpec', 'toolList', 'evalQuestions'],
      ['score', 'issues', 'fixes'],
      ['必须基于具体字段给证据', '不能只给总分'],
      '用于项目库中 MCP 资产的质量门。'
    ),
    schema: {
      target: 'MCP Server 或 MCP 资产规格',
      dimensions: ['工具可发现性', '输入输出 schema', '错误处理', '安全注解', '评测覆盖', '上下文成本'],
      scoringRubric: ['90-100: 可进入实现或发布', '70-89: 局部字段需补齐', '0-69: 工具边界或安全不清'],
      passThreshold: '总分 >= 85 且安全注解无缺失',
      failureCases: ['工具名模糊', 'schema 缺字段类型', '写操作没有 destructiveHint', '没有 eval 问题'],
      reviewMode: 'hybrid',
      outputFormat: 'score + dimensionScores + evidence + fixes'
    } satisfies EvaluatorAssetSchema,
    examples: ['输入：一个 filesystem MCP 设计\n输出：schema 缺口、安全注解、eval 建议']
  }),
  starterAsset(77, {
    id: 'starter-evaluator-sdk-integration-readiness',
    type: 'evaluator',
    title: 'SDK 接入就绪度评估器',
    summary: '检查 SDK 资产是否包含安装、初始化、认证、核心方法、错误处理、兼容性和测试策略。',
    content: `# Evaluator
检查 SDK 接入提示词是否回答：
- 装什么包
- 在哪里初始化
- key 怎么管
- 调哪些核心方法
- 错误怎么处理
- 如何测试`,
    tags: ['evaluator', 'sdk', 'integration'],
    useCases: ['审查 SDK 资产', '生成 SDK 集成任务', '避免过期或不安全 API 使用'],
    integration: integration(
      'evaluator.sdk_integration_readiness',
      ['SDK 接入检查', '安全边界', '测试补齐'],
      ['sdkAsset', 'implementationPrompt'],
      ['readinessScore', 'missingFields', 'riskNotes'],
      ['高时效 API 要查文档', '密钥不能暴露到前端'],
      '用于 SDK 类资产参与优化后的自检。'
    ),
    schema: {
      target: 'SDK 资产或 SDK 集成提示词',
      dimensions: ['安装命令', '初始化', '认证', '核心方法', '错误处理', '兼容性', '测试策略'],
      scoringRubric: ['高分: 可直接指导实现并覆盖错误分支', '中分: 有主要 API 但缺测试或安全', '低分: 只有包名没有接入细节'],
      passThreshold: '所有关键字段存在且安全边界明确',
      failureCases: ['前端暴露 API key', '没有处理 401/429', '使用不明版本 API'],
      reviewMode: 'hybrid',
      outputFormat: 'readinessScore + missingFields + unsafePatterns + fixes'
    } satisfies EvaluatorAssetSchema,
    examples: ['输入：OpenAI SDK 接入 Prompt\n输出：缺少 429 重试和 mock 测试']
  }),
  starterAsset(78, {
    id: 'starter-policy-env-secret-boundary',
    type: 'policy',
    title: '环境变量与密钥边界 Policy',
    summary: '规定 .env、API key、GitHub token、SDK/MCP 凭据的存放、引用和提示词输出边界。',
    content: `# Policy
- .env.local 不提交
- .env.example 只放空模板
- 前端不暴露服务端密钥
- 日志不输出 token
- MCP/SDK 资产只描述 env 名称，不包含真实值
- 需要真实调用时先确认权限`,
    tags: ['policy', 'env', 'secrets', 'security'],
    useCases: ['生成 SDK/MCP 接入提示词', '审查配置文件', '避免资产库泄露密钥'],
    integration: integration(
      'policy.env_secret_boundary',
      ['密钥存放规则', '输出脱敏', '权限确认'],
      ['envVars', 'sdkConfig', 'mcpConfig'],
      ['safeConfigInstructions', 'redactionRules'],
      ['不得保存真实密钥到资产库', '不得提交 .env.local'],
      '建议所有 SDK/MCP/Connector 资产默认引用。'
    ),
    schema: {
      domain: '环境变量、API key、token、MCP/SDK 凭据。',
      rules: ['真实密钥只在本地安全环境或服务端', '.env.example 只放空值', '日志和 Prompt 不输出密钥值'],
      triggers: ['涉及 SDK', '涉及 MCP', '涉及 Connector', '用户要求配置 env'],
      enforcement: ['输出 env 名称而非值', '写入 .env.local 时不提交', '提醒用户填真实 key'],
      escalation: ['需要远程权限时请求用户确认', '疑似密钥泄露时建议轮换'],
      refusalStyle: '不复述密钥，说明安全原因并给出安全替代配置。',
      examples: ['GEMINI_API_KEY= 留空模板；真实值由用户本地填写。']
    } satisfies PolicyAssetSchema,
    examples: ['任务：配置 OpenAI SDK\n输出：.env.example、服务端读取、前端代理边界']
  }),
  starterAsset(79, {
    id: 'starter-memory-local-codex-capabilities',
    type: 'memory',
    title: '本机 Codex 能力 Memory',
    summary: '记录当前本机 Codex 可用的高价值能力：GitHub/Browser/Chrome/Vercel 插件、本地 Playwright 和 Node REPL MCP、文档工具链。',
    content: `# Memory
- GitHub plugin enabled, gh CLI 未登录时可用公开 API 兜底
- Browser/Chrome plugin 可用于本地或已登录浏览器任务
- MCP servers: playwright, node_repl
- 本地 skills 包含 mcp-builder、skill-blueprint-master、webapp-testing、docx/pdf/xlsx/pptx 等
- 文档工具链命令位于 /Users/hwaigc/.local/bin`,
    tags: ['memory', 'local-codex', 'capabilities'],
    useCases: ['生成本机执行计划', '选择可用工具', '提示词优化时注入环境能力'],
    integration: integration(
      'memory.local_codex_capabilities',
      ['本机插件', 'MCP 配置', 'Skill 清单', '工具链约定'],
      ['taskRequest'],
      ['availableCapabilities', 'toolSelectionHints'],
      ['能力会随 Codex 配置变化', '不要包含敏感配置值'],
      '用于让工程提示词知道本机有哪些可复用资产。'
    ),
    schema: {
      facts: ['playwright 和 node_repl MCP 已在 config.toml 中配置', '本机有多个 Codex skills', '文档工具链可转换和检查 Word/PDF'],
      preferences: ['优先本地工具和可验证流程', '中文沟通', '不提交 .env.local'],
      projectConventions: ['MCP/SDK 资产只作为上下文', '新增默认资产要本地 seed 迁移'],
      scope: '当前机器的 Codex 本地环境',
      confidence: '中，来自 2026-05-28 读取的本机配置。',
      updatedAtText: '2026-05-28',
      invalidationRules: ['.codex/config.toml 改动', '插件启停变化', '工具链升级或删除']
    } satisfies MemoryAssetSchema,
    examples: ['任务：浏览器验证\n可用：playwright MCP + webapp-testing skill']
  }),
  starterAsset(80, {
    id: 'starter-connector-openai-api',
    type: 'connector',
    title: 'OpenAI API Connector',
    summary: 'OpenAI API 连接器资产，描述模型调用、认证、环境变量、权限和数据边界。',
    content: `# Connector
Service: OpenAI API
Sources:
- https://github.com/openai/openai-node
- https://github.com/openai/openai-python

## Boundary
只描述连接方式和边界，不包含真实 API key。`,
    tags: ['connector', 'openai', 'api', 'sdk'],
    useCases: ['设计模型调用后端', '配置 SDK', '生成安全接入提示词'],
    integration: integration(
      'connector.openai_api',
      ['模型调用', '结构化输出', '工具调用', '多模态能力'],
      ['OPENAI_API_KEY', 'model', 'input', 'tools'],
      ['response', 'usage', 'toolCalls'],
      ['密钥不得前端暴露', '请求和响应可能包含敏感数据需脱敏'],
      '用于 OpenAI SDK/Prompt 资产的连接边界说明。'
    ),
    schema: {
      service: 'OpenAI API',
      endpoints: ['/v1/responses', '/v1/chat/completions', '/v1/files'],
      auth: 'OPENAI_API_KEY 服务端环境变量',
      environment: ['OPENAI_API_KEY', 'OPENAI_BASE_URL?'],
      permissions: ['model inference', 'file upload if enabled', 'tool calling if configured'],
      dataBoundaries: ['不把密钥写入前端', '用户数据按项目隐私要求处理', '日志脱敏'],
      rateLimits: ['429 rate limit', '模型和账户配额限制'],
      operationalNotes: ['处理 401/429/400', '记录 request id 和 usage', '提供重试和降级']
    } satisfies ConnectorAssetSchema,
    examples: ['任务：做优化接口\n连接器：服务端读取 OPENAI_API_KEY，前端调用本地 API']
  }),
  starterAsset(81, {
    id: 'starter-parser-skill-md-asset',
    type: 'parser',
    title: 'SKILL.md 资产解析器',
    summary: '把本机或仓库中的 SKILL.md 解析为 Skill 资产，抽取 frontmatter、触发描述、流程、资源索引和边界。',
    content: `# Parser
Input: SKILL.md
Extract:
- frontmatter name/description
- trigger description
- workflow/process
- references/scripts/assets/mcp mentions
- boundaries/validation

Output: PromptAsset(type=skill) draft`,
    tags: ['parser', 'skill', 'markdown', 'local-codex'],
    useCases: ['从本机 .codex 导入 Skill', '批量生成 Skill 资产草稿', '审计 Skill 包结构'],
    integration: integration(
      'parser.skill_md_asset',
      ['frontmatter 解析', '章节抽取', '资源索引识别', 'Skill 资产草稿生成'],
      ['skillMdText', 'filePath'],
      ['skillAssetDraft', 'resourceMap', 'warnings'],
      ['保留原始路径但不读取敏感文件', '无法识别资源时给 warnings'],
      '用于把本机 .codex/skills 的内容沉淀进项目库。'
    ),
    schema: {
      inputTypes: ['SKILL.md', '.md'],
      extractionFields: ['name', 'description', 'trigger', 'workflow', 'resources', 'boundaries', 'validation'],
      cleaningRules: ['保留 Markdown 标题', 'frontmatter 单独解析', '相对路径记录为资源引用'],
      outputSchema: 'Partial<PromptAsset> with type=skill and SkillAssetSchema',
      validationRules: ['description 不为空', 'workflow 至少 1 步', '资源路径不包含密钥'],
      failureHandling: ['frontmatter 缺失时用文件夹名', '章节缺失时生成 warnings']
    } satisfies ParserAssetSchema,
    examples: ['输入：mcp-builder/SKILL.md\n输出：MCP Builder Skill 资产草稿']
  }),
  starterAsset(82, {
    id: 'starter-benchmark-mcp-browser-eval',
    type: 'benchmark',
    title: 'MCP 与浏览器自动化回归 Benchmark',
    summary: '测试提示词是否能正确选择 MCP/Tool，规划浏览器验证，不伪造调用，并给出可执行断言。',
    content: `# Benchmark
Cases:
- 本地 WebApp 验证 -> Playwright MCP + browser regression workflow
- PR 上下文 -> GitHub MCP + tool safety policy
- SDK 文档查询 -> Context7 MCP + SDK readiness evaluator
- MCP 设计 -> mcp-builder skill + MCP quality evaluator`,
    tags: ['benchmark', 'mcp', 'browser', 'tool-safety'],
    useCases: ['回归资产推荐', '检查工具边界', '评估 MCP/SDK 融合质量'],
    integration: integration(
      'benchmark.mcp_browser_eval',
      ['工具选择测试', '虚假调用检测', '浏览器断言检查'],
      ['query', 'selectedAssets', 'optimizedPrompt'],
      ['expectedAssets', 'unsafeClaims', 'assertionQuality'],
      ['只评估提示词规划，不代表真实执行结果'],
      '用于新增大量工具资产后的推荐和安全回归。'
    ),
    schema: {
      target: 'MCP/Tool/Browser 相关提示词优化流程',
      tasks: ['验证本地页面', '总结 PR review', '查询 SDK 文档', '设计 MCP server'],
      inputs: ['帮我测一下 localhost', '处理这个 PR 评论', '接入最新 Vercel AI SDK', '封装一个文件搜索 MCP'],
      expectedOutputs: ['Playwright MCP + browser workflow', 'GitHub MCP + safety policy', 'Context7 + SDK evaluator', 'mcp-builder + MCP quality evaluator'],
      metrics: ['Top-5 资产命中率', 'unsafeClaims 数量', '断言可执行性', 'highlights 资产说明完整度'],
      regressionNotes: ['新增工具资产后检查是否误把 SDK 当 MCP', '浏览器任务不能声称已执行']
    } satisfies BenchmarkAssetSchema,
    examples: ['query=测本地项目库 -> 命中 webapp-testing、playwright MCP、browser regression workflow']
  })
];
