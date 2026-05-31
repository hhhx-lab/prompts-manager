# 提示词大师 Pro

提示词大师 Pro 是一个本地优先的提示词工程项目库和提示词优化工作台。它用于沉淀可复用的 Prompt、Skill、MCP、SDK、Agent、Workflow、Tool、Reference 等资产，并在优化提示词时推荐、选择和注入这些资产作为半结构化工程上下文。

## 核心能力

- 工作台：输入原始需求，选择场景、风格、优化方向和项目库资产，生成更可执行的提示词。
- 资产库：管理可复用资产，支持搜索筛选、新建、编辑、删除、JSON 导入导出。
- 构建器：从任务描述生成 Prompt、Skill、MCP、SDK、Agent、Workflow、Evaluator、Policy 等 16 类资产草稿，并保存到项目库。
- 运行实验室：对比无资产基线和资产注入版本，检查 PromptIR、编译模式、差异和风险提示。
- 反馈洞察：把用户编辑、追问、重新生成、补资料等行为转成 FeedbackEvent，并生成 AssetPatch 迭代建议。
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

每类资产都有对应的结构化 schema，用于描述能力边界、输入输出、约束、示例和使用方式。MCP、SDK、Connector、Tool 等资产在 v1 中只作为“可引用工程上下文”，不会在优化阶段被真实调用。

## 默认资产包

项目内置 starter assets，首次打开会自动写入本地项目库。当前默认资产包包含 82 个资产，其中 v2 新增了本机 Codex Skill/MCP/Prompt、OpenAI SDK、MCP 官方 SDK、LangGraph、LlamaIndex、AutoGen、CrewAI、Playwright、FastAPI、uv、ripgrep 等实用资产。

详细清单见 [docs/starter-assets-v2.md](docs/starter-assets-v2.md)。

## 文档目录

- [docs/prompt-engineering-knowledge](docs/prompt-engineering-knowledge/README.md)：提示词工程知识库，整合官方文档、论文方法、工具调用、Agent、评估、安全治理和项目库运营方法。
- [docs/asset-package-specs](docs/asset-package-specs/README.md)：资产包规格，逐类说明 Prompt、Skill、MCP、SDK、Workflow、Reference、Agent、Tool、Template、Evaluator、Dataset、Policy、Memory、Connector、Parser、Benchmark 的定义、结构和创建方式。
- [docs/product-iteration-2.0.md](docs/product-iteration-2.0.md)：产品 2.0 迭代方案，围绕 Prompt 中间产物、资产插槽、自动迭代、行为反馈、构建器和侧边栏入口规划下一阶段架构。

## 本地存储

项目当前不依赖后端数据库，数据保存在浏览器 `localStorage`：

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

然后在 `.env.local` 中填入本地模型服务密钥：

```bash
GEMINI_API_KEY=
```

启动开发服务器：

```bash
npm run dev
```

2.0 架构开始拆分前端、后端和文档库：

- 前端：React + Vite，负责工作台、资产库、构建器、运行实验室、反馈洞察、知识库、设置和本地交互。
- 后端：Node.js ESM 本地 API，负责健康检查、文档索引、任务分析、Prompt 编译、资产草稿生成、Run Lab 对比、反馈诊断和后续本地 JSON 状态。
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
│   ├── knowledge/           # 文档库和架构索引
│   ├── layout/              # 应用外壳和一级导航
│   ├── library/             # 资产库列表、筛选和资产卡片
│   ├── ops/                 # 2.0 引擎编排容器和共享 UI primitives
│   ├── run-lab/             # Run Lab 对比和运行实验
│   ├── settings/            # 本地存储、环境变量和运行边界
│   └── workspace/           # TaskModel、资产插槽和 PromptIR 编译面板
├── geminiService.ts         # 提示词优化、建议、聊天和测试调用
├── types.ts                 # 场景、历史、资产和结构化 schema 类型
├── hooks/
│   ├── useAssetGraph.ts
│   ├── useAssetLibrary.ts   # 项目库和优化方向持久化
│   ├── useAssetPatches.ts
│   ├── useFeedbackEvents.ts
│   ├── usePersistentState.ts
│   ├── usePromptCompilations.ts
│   ├── usePromptHistory.ts
│   ├── usePromptRuns.ts
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
