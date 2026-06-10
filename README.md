# 提示词大师 Pro

提示词大师 Pro 是一个本地优先的提示词工程项目库和提示词优化工作台。它用于沉淀可复用的 Prompt、Skill、MCP、SDK、Agent、Workflow、Tool、Reference 等资产，并在优化提示词时推荐、选择和注入这些资产作为半结构化工程上下文。

## 核心能力

- 工作台：输入原始提示词，选择场景、风格、优化方向和项目库资产，生成更可执行的提示词。
- 资产库：管理可复用资产，支持搜索筛选、新建、编辑、删除、JSON 导入导出。
- 构建器：从任务描述、上传资料或多轮 Agent 对话生成 Prompt、Skill、MCP、SDK、Agent、Workflow、Evaluator、Policy 等 16 类资产草稿；Agent 会自动回填标题、摘要、正文、注入规格、缺失字段和下一步动作，用户只需轻量修改后保存。
- 运行实验室：对比无资产基线和资产注入版本，检查 PromptIR、编译模式、差异和风险提示；配置模型网关后支持真实运行、Evaluator 自动评分和多模型实验。
- 反馈洞察：把用户编辑、追问、重新生成、补资料等行为转成 FeedbackEvent，并生成 AssetPatch 迭代建议。
- 工具执行台：设置页提供 MCP/SDK/Tool/Connector adapter 测试台，当前支持 `tool.ripgrep`、`tool.http_get`、`tool.json_extract`、`sdk.openai.chat`、`mcp.stdio.call`。真实执行需要 `.env.local` 开启门控、资产为 `executable`、adapter 在白名单内并由用户确认。
- 市场与团队契约：后端已提供远程市场发布/安装、订单占位、团队空间、审批请求、线上实验创建和事件追踪的本地 JSON state 接口；真实跨用户账号、云端审核、支付结算和线上流量分配仍需接入外部服务。
- 协作治理：一级页面承载团队空间、审批请求和工具执行门控；市场页显示远程市场队列并支持下载安装；运行实验室可从资产对比创建线上实验契约并记录人工胜出事件。
- 知识库：通过本地后端索引 `docs/`，浏览产品方案、提示词工程知识和资产包规格。
- 资产注入：根据原始需求、场景、风格和优化方向推荐资产，用户确认后注入模型上下文。
- 2.0 总控台：保留 `#ops` 调试入口，将需求解析为 TaskModel，插入资产槽位，编译 PromptIR，并输出可追溯的工程化 Prompt。
- PromptOps 闭环：支持 Prompt/Skill/MCP/SDK/Workflow 资产草稿生成、Run Lab 资产开关对比和 Feedback Insights 反馈洞察。
- 优化方向：内置结构化、约束增强、可执行性增强、评估标准增强、工具调用适配等方向，也支持单次自定义方向。
- 文件导入：支持从 Markdown、TXT、JSON、Word、Excel/CSV 抽取文本并生成资产草稿。
- 历史与评估：保留优化历史、版本对比、A/B 测试和聊天式二次优化能力。

## 资产类型

当前项目库支持以下资产类型：

`prompt`、`skill`、`mcp`、`sdk`、`workflow`、`reference`、`agent`、`tool`、`template`、`evaluator`、`dataset`、`policy`、`memory`、`connector`、`parser`、`benchmark`

每类资产都有对应的结构化 schema，用于描述能力边界、输入输出、约束、示例和使用方式。MCP、SDK、Connector、Tool 等资产默认只作为“可引用工程上下文”；只有显式开启执行门控、资产达到 `executable`、绑定 adapter 并由用户确认后，才允许进入真实执行流程。

## 默认资产包

项目内置 starter assets，首次打开会自动写入本地项目库。当前默认资产包包含 82 个资产，其中 v2 新增了本机 Codex Skill/MCP/Prompt、OpenAI SDK、MCP 官方 SDK、LangGraph、LlamaIndex、AutoGen、CrewAI、Playwright、FastAPI、uv、ripgrep 等实用资产。

详细清单见 [docs/starter-assets-v2.md](docs/starter-assets-v2.md)。

## 文档目录

- [docs/prompt-engineering-knowledge](docs/prompt-engineering-knowledge/README.md)：提示词工程知识库，整合官方文档、论文方法、工具调用、Agent、评估、安全治理和项目库运营方法。
- [docs/asset-package-specs](docs/asset-package-specs/README.md)：资产包规格，逐类说明 Prompt、Skill、MCP、SDK、Workflow、Reference、Agent、Tool、Template、Evaluator、Dataset、Policy、Memory、Connector、Parser、Benchmark 的定义、结构和创建方式。
- [docs/product-iteration-2.0.md](docs/product-iteration-2.0.md)：产品 2.0 迭代方案，围绕 Prompt 中间产物、资产插槽、自动迭代、行为反馈、构建器和侧边栏入口规划下一阶段架构。

## 本地存储

项目当前不依赖云数据库，优先使用本地 Node API 的 JSON state；浏览器 `localStorage` 作为兼容缓存和离线兜底：

- `promptmaster_history_v2`：提示词优化历史。
- `promptmaster_asset_library_v1`：项目库资产。
- `promptmaster_asset_library_seeded_v1`：默认资产包种子版本。
- `promptmaster_directions_v1`：用户自定义优化方向。
- `promptmaster_task_models_v1`：2.0 任务理解卡。
- `promptmaster_prompt_compilations_v1`：PromptIR 编译记录。
- `promptmaster_prompt_runs_v1`：Run Lab 本地运行/对比记录。
- `promptmaster_feedback_events_v1`：用户行为反馈事件。
- `promptmaster_asset_graph_v1`：资产关系图谱边。
- `promptmaster_asset_patches_v1`：自动迭代补丁建议。
- `promptmaster_capability_packs_v1`：能力包组合。
- `promptmaster_market_items_v1`：本地市场条目。
- `promptmaster_remote_market_items_v1`：远程市场本地契约条目。
- `promptmaster_market_accounts_v1`：市场账号本地契约。
- `promptmaster_market_orders_v1`：市场订单占位记录。
- `promptmaster_evaluator_results_v1`：Evaluator 评分记录。
- `promptmaster_benchmark_runs_v1`：Benchmark 运行记录。
- `promptmaster_team_spaces_v1`：团队空间本地契约。
- `promptmaster_approval_requests_v1`：团队审批请求。
- `promptmaster_online_experiments_v1`：线上实验契约和事件记录。

可以通过项目库的 JSON 导入导出功能迁移或备份资产。

## 本地运行

前置条件：

- Node.js
- npm

安装依赖：

```bash
npm install
```

配置环境变量：

```bash
cp .env.example .env.local
```

然后在 `.env.local` 中填入统一模型网关配置：

```bash
MODEL_NAME=gpt-5.5
MODEL_BASE_URL=
MODEL_API_KEY=
MODEL_PROVIDER=openai-compatible
```

工具执行相关变量默认关闭，只有本地开发调试时才建议开启：

```bash
ENABLE_TOOL_EXECUTION=false
TOOL_EXECUTION_ALLOWLIST=tool.ripgrep,tool.http_get,tool.json_extract,sdk.openai.chat
TOOL_EXECUTION_TIMEOUT_MS=15000
```

一键启动前后端开发服务器：

```bash
npm run dev:all
```

2.0 架构开始拆分前端、后端和文档库：

- 前端：React + Vite，负责工作台、资产库、构建器、运行实验室、反馈洞察、知识库、设置和本地交互。
- 后端：Node.js ESM 本地 API，负责健康检查、文档索引、任务分析、Prompt 编译、资产草稿生成、Builder Agent 对话回填、统一模型网关、Run Lab 对比/多模型运行、Evaluator 自动评分、Tool Adapter 执行门控、市场/团队/实验本地契约、反馈诊断和本地 JSON 状态。
- 文档库：`docs/` 独立保存产品方案、提示词工程知识库和资产包规格，后端通过 `/api/docs/index` 提供索引。

分别启动前后端：

```bash
npm run dev:api
npm run dev:web
```

## 构建与检查

类型检查：

```bash
npm run typecheck
```

生产构建：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## 项目结构

```text
.
├── App.tsx                  # 应用布局、路由状态和遗留工作台入口
├── backend/
│   └── server.mjs           # 2.0 本地 API 服务
├── components/
│   ├── builders/            # 16 类资产包生成器
│   ├── feedback/            # 反馈诊断、AssetPatch Review 和 Feedback Insights
│   ├── governance/          # 团队空间、审批流和工具执行门控
│   ├── knowledge/           # 文档库和架构索引
│   ├── layout/              # 应用外壳和一级导航
│   ├── library/             # 资产库列表、筛选和资产卡片
│   ├── ops/                 # 2.0 引擎编排容器和共享 UI primitives
│   ├── run-lab/             # Run Lab 对比和运行实验
│   ├── settings/            # 本地存储、环境变量和运行边界
│   └── workspace/           # TaskModel、资产插槽和 PromptIR 编译面板
├── modelService.ts          # 统一模型网关客户端：提示词优化、建议、聊天和测试调用
├── types.ts                 # 场景、历史、资产和结构化 schema 类型
├── hooks/
│   ├── useAssetGraph.ts
│   ├── useAssetLibrary.ts   # 项目库和优化方向持久化
│   ├── useAssetPatches.ts
│   ├── useFeedbackEvents.ts
│   ├── useOnlineExperiments.ts
│   ├── usePersistentState.ts
│   ├── usePromptCompilations.ts
│   ├── usePromptHistory.ts
│   ├── usePromptRuns.ts
│   ├── useRemoteMarket.ts
│   ├── useTeamOps.ts
│   └── useTaskModels.ts
├── services/
│   ├── apiClient.ts         # 2.0 后端 API 客户端和前端 fallback 入口
│   ├── assetDrafts.ts       # 16 类资产草稿生成和草稿转正式资产
│   ├── assetGraph.ts        # 资产关系图谱派生与合并
│   ├── assetPatches.ts      # 资产补丁聚合和反馈洞察
│   ├── assetSlots.ts        # 资产插槽、冲突检测和插入位置
│   ├── feedbackDiagnosis.ts # 行为反馈到资产补丁的诊断逻辑
│   ├── feedbackEvents.ts    # 行为文本到 FeedbackEvent 的解析
│   ├── fileParsing.ts       # 文件导入解析
│   ├── library.ts           # 资产格式、推荐、导入导出和模型格式化
│   ├── promptCompiler.ts    # TaskModel + assets -> PromptIR -> Prompt
│   ├── starterAssets.ts     # 默认资产包
│   ├── storage.ts           # localStorage key 和读写封装
│   └── taskAnalysis.ts      # 本地任务理解 fallback
└── docs/
    ├── asset-package-specs/           # 16 类资产包定义、用法和结构
    ├── prompt-engineering-knowledge/  # 提示词工程系统知识库
    ├── product-iteration-2.0.md       # 产品 2.0 迭代方案
    └── starter-assets-v2.md           # 默认资产包追加说明
```

## 安全边界

- 不要提交 `.env.local` 或任何真实密钥。
- `.env.example` 只保留变量名和空模板。
- 项目库中的 MCP/SDK/Tool/Connector 资产只描述能力、接口和约束，不代表已经真实连接、执行或验证。
- 涉及写操作、远程系统、敏感资料或密钥时，应在真实执行前获得用户确认。
- Tool Adapter 执行必须同时满足 `ENABLE_TOOL_EXECUTION=true`、资产 `status=executable`、adapter 命中 `TOOL_EXECUTION_ALLOWLIST`、用户显式确认。否则后端只返回 blocked、requires_confirmation 或 dry-run 信息。
- 模型接口只通过 `.env.local` 的 `MODEL_BASE_URL` 和 `MODEL_API_KEY` 接入；仓库不会写死任何 key、token 或 base URL。
