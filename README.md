# 提示词大师 Pro

提示词大师 Pro 是一个本地优先的提示词工程项目库和提示词优化工作台。它用于沉淀可复用的 Prompt、Skill、MCP、SDK、Agent、Workflow、Tool、Reference 等资产，并在优化提示词时推荐、选择和注入这些资产作为半结构化工程上下文。

## 核心能力

- 工作台：输入原始需求，选择场景、风格、优化方向和项目库资产，生成更可执行的提示词。
- 项目库：管理可复用资产，支持搜索筛选、新建、编辑、删除、JSON 导入导出。
- 资产注入：根据原始需求、场景、风格和优化方向推荐资产，用户确认后注入模型上下文。
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

## 本地存储

项目当前不依赖后端数据库，数据保存在浏览器 `localStorage`：

- `promptmaster_history_v2`：提示词优化历史。
- `promptmaster_asset_library_v1`：项目库资产。
- `promptmaster_asset_library_seeded_v1`：默认资产包种子版本。
- `promptmaster_directions_v1`：用户自定义优化方向。

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
├── App.tsx                  # 应用布局、工作台和项目库界面入口
├── geminiService.ts         # 提示词优化、建议、聊天和测试调用
├── types.ts                 # 场景、历史、资产和结构化 schema 类型
├── hooks/
│   ├── useAssetLibrary.ts   # 项目库和优化方向持久化
│   ├── usePersistentState.ts
│   └── usePromptHistory.ts
├── services/
│   ├── fileParsing.ts       # 文件导入解析
│   ├── library.ts           # 资产格式、推荐、导入导出和模型格式化
│   ├── starterAssets.ts     # 默认资产包
│   └── storage.ts           # localStorage key 和读写封装
└── docs/
    ├── asset-package-specs/           # 16 类资产包定义、用法和结构
    ├── prompt-engineering-knowledge/  # 提示词工程系统知识库
    └── starter-assets-v2.md           # 默认资产包追加说明
```

## 安全边界

- 不要提交 `.env.local` 或任何真实密钥。
- `.env.example` 只保留变量名和空模板。
- 项目库中的 MCP/SDK/Tool/Connector 资产只描述能力、接口和约束，不代表已经真实连接、执行或验证。
- 涉及写操作、远程系统、敏感资料或密钥时，应在真实执行前获得用户确认。
