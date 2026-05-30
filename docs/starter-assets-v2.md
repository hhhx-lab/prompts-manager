# Starter Assets v2 追加说明

本次把默认资产包从 32 个扩展到 82 个，新增 50 个资产。新增内容主要来自两类来源：

- 本机 Codex 资产：读取 `.codex` 中已经沉淀的 Skill、Prompt、MCP 配置和文档工具链约定。
- 高采用度开源项目：通过 GitHub 公开 API 在 2026-05-28 查询并筛选官方或广泛使用的 AI SDK、MCP、Agent、Web 自动化和工程工具项目。

这些资产仍然只作为“半结构化工程上下文”参与提示词优化，不代表项目已经真实安装、授权或调用对应 MCP/SDK/Tool。

## 本次新增资产概览

| 类型 | 新增数量 | 代表资产 |
| --- | ---: | --- |
| Skill | 5 | Skill 蓝图大师、MCP Builder、WebApp Testing、LangGraph 工作流 Skill 化器、文档处理 Skill Pack |
| Prompt | 3 | Docs Driven Dev 路由、OpenSpec 提案与实施、工具安全执行 |
| MCP | 5 | 本机 Playwright、Node REPL、GitHub 官方 MCP、Context7、Microsoft Playwright MCP |
| SDK | 9 | OpenAI Node/Python、MCP TS/Python、LangChain JS、LangGraph、LlamaIndex、AutoGen、CrewAI |
| Agent | 4 | LangGraph 有状态 Agent、CrewAI 角色团队、AutoGen 对话式 Agent、RAG 文档策展 Agent |
| Tool | 8 | Playwright、Puppeteer、Zod、Pydantic、FastAPI、uv、ripgrep、本机文档工具链 |
| Workflow | 4 | Docs Driven SOP、OpenSpec 生命周期、Skill 封装生命周期、浏览器回归验证 |
| Reference | 3 | MCP 最佳实践、Codex Skill 架构、高认可度 AI 工程仓库索引 |
| Template | 2 | MCP Tool 规格模板、Agent 运行契约模板 |
| Evaluator | 2 | MCP Server 质量评估器、SDK 接入就绪度评估器 |
| Policy | 1 | 环境变量与密钥边界 |
| Memory | 1 | 本机 Codex 能力索引 |
| Connector | 1 | OpenAI API Connector |
| Parser | 1 | SKILL.md 资产解析器 |
| Benchmark | 1 | MCP 与浏览器自动化回归 Benchmark |

## 新增资产清单

### Skill

- `本机 Skill 蓝图大师`：来自 `/Users/hwaigc/.codex/skills/skill-blueprint-master/SKILL.md`，用于设计和审计生产级 Skill 包。
- `本机 MCP Builder Skill`：来自 `/Users/hwaigc/.codex/skills/mcp-builder/SKILL.md`，用于 MCP Server、Tool schema、错误处理和评测设计。
- `本机 WebApp Testing Skill`：来自本机 WebApp Testing Skill，用 Playwright 验证本地 Web 应用。
- `本机 LangGraph 工作流 Skill 化器`：用于把复杂多节点 Agent 工作流诊断、瘦身、复核并封装成 Skill。
- `本机文档处理 Skill Pack`：聚合 docx、pdf、xlsx、pptx 等本机文档处理能力。

### Prompt

- `本机 Docs Driven Dev 路由 Prompt`：来自 `.codex/prompts/docs-driven-dev.md`，把研发请求分流到需求收集、Docs Driven、Fast Fix、文档同步和提交检查。
- `本机 OpenSpec 提案与实施 Prompt`：来自 opsx propose/apply 流程，用于 proposal、design、tasks 和实现闭环。
- `工具安全执行 Prompt`：用于 MCP、SDK、Connector、Tool 相关任务，明确计划、确认、执行、验证和回退边界。

### MCP

- `本机 Playwright MCP 配置`：来自 `.codex/config.toml` 的 `playwright-mcp --extension` 配置。
- `本机 Node REPL MCP 配置`：来自 `.codex/config.toml` 的 `node_repl` 配置，用于受控 JavaScript 执行和数据处理。
- `GitHub 官方 MCP Server`：来源 [github/github-mcp-server](https://github.com/github/github-mcp-server)，适合 PR、Issue、Actions、代码上下文。
- `Context7 文档上下文 MCP`：来源 [upstash/context7](https://github.com/upstash/context7)，适合获取当前 SDK/API 文档上下文。
- `Microsoft Playwright MCP Server`：来源 [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)，适合浏览器自动化。

### SDK

- `OpenAI Node 官方 SDK`：来源 [openai/openai-node](https://github.com/openai/openai-node)，适合 TypeScript 服务端模型调用。
- `OpenAI Python 官方 SDK`：来源 [openai/openai-python](https://github.com/openai/openai-python)，适合 Python 服务、批处理和评测脚本。
- `MCP TypeScript 官方 SDK`：来源 [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)，适合 TypeScript MCP Server/Client。
- `MCP Python 官方 SDK`：来源 [modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk)，适合 Python/FastMCP 风格 MCP 服务。
- `LangChain JS Agent 工程 SDK`：来源 [langchain-ai/langchainjs](https://github.com/langchain-ai/langchainjs)，适合 TypeScript Agent、Tool 和 RAG 编排。
- `LangGraph 状态化 Agent 框架`：来源 [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)，适合有状态、多节点、可恢复 Agent。
- `LlamaIndex 文档 Agent/RAG SDK`：来源 [run-llama/llama_index](https://github.com/run-llama/llama_index)，适合资料索引、RAG 和文档 Agent。
- `Microsoft AutoGen Agent 框架`：来源 [microsoft/autogen](https://github.com/microsoft/autogen)，适合多 Agent 协作。
- `CrewAI 多 Agent 编排框架`：来源 [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)，适合角色化 Agent 团队。

### Agent

- `状态化 LangGraph Agent`：用于长任务、多节点、checkpoint、人审和可恢复执行。
- `CrewAI 角色团队 Agent`：用于研究、撰写、审查、交付等多角色任务流。
- `AutoGen 对话式多 Agent`：用于多 Agent 对话推进研究、编码、审查和工具执行。
- `RAG 文档策展 Agent`：用于资料解析、切片、索引、检索、引用和答案质量检查。

### Tool

- `Playwright Web 自动化 Tool`：来源 [microsoft/playwright](https://github.com/microsoft/playwright)，适合端到端验证和浏览器脚本。
- `Puppeteer Chrome 自动化 Tool`：来源 [puppeteer/puppeteer](https://github.com/puppeteer/puppeteer)，适合抓取、截图和轻量浏览器任务。
- `Zod TypeScript Schema Tool`：来源 [colinhacks/zod](https://github.com/colinhacks/zod)，适合 TypeScript schema、模型输出和 MCP 输入校验。
- `Pydantic Python 数据校验 Tool`：来源 [pydantic/pydantic](https://github.com/pydantic/pydantic)，适合 Python schema、FastAPI 和评测输出。
- `FastAPI 服务骨架 Tool`：来源 [fastapi/fastapi](https://github.com/fastapi/fastapi)，适合 Python AI 服务和 API 封装。
- `uv Python 项目环境 Tool`：来源 [astral-sh/uv](https://github.com/astral-sh/uv)，适合隔离 Python 项目依赖。
- `ripgrep 代码检索 Tool`：来源 [BurntSushi/ripgrep](https://github.com/BurntSushi/ripgrep)，适合代码库快速检索。
- `本机 Codex 文档工具链`：来自项目 `AGENTS.md` 约定，覆盖 Markdown、Word、PDF 转换和检查命令。

### Workflow / Reference / Quality Assets

- `文档驱动研发 SOP Workflow`：把研发需求纳入需求入口、计划确认、实现验证和提交检查。
- `OpenSpec Change 生命周期 Workflow`：覆盖 propose、apply、verify、archive。
- `Skill 封装生命周期 Workflow`：把成熟 Prompt/流程封装成 Codex Skill。
- `浏览器回归验证 Workflow`：用于本地 Web 应用启动、侦察、交互、截图、console 检查。
- `MCP 设计最佳实践 Reference`：汇总 MCP 工具命名、schema、错误处理、安全和评测口径。
- `Codex Skill 架构 Reference`：说明 Skill 的组成和每个目录职责。
- `高认可度 AI 工程资产索引 Reference`：记录本次筛选的 GitHub 来源。
- `MCP Tool 规格模板`：用于设计 MCP tool 的固定字段。
- `Agent 运行契约模板`：用于定义 Agent 的身份、目标、工具、记忆、停止条件和输出契约。
- `MCP Server 质量评估器`：评估 MCP 是否适合 Agent 使用。
- `SDK 接入就绪度评估器`：检查 SDK 资产是否足够指导真实实现。
- `环境变量与密钥边界 Policy`：约束 `.env`、API key、token 和 SDK/MCP 凭据。
- `本机 Codex 能力 Memory`：记录当前本机可复用插件、MCP、Skill 和工具链。
- `OpenAI API Connector`：描述 OpenAI API 的认证、端点、权限和数据边界。
- `SKILL.md 资产解析器`：把本机或仓库中的 `SKILL.md` 转成 Skill 资产草稿。
- `MCP 与浏览器自动化回归 Benchmark`：检查工具类提示词是否正确规划调用并避免虚假执行。

## 使用方式

在提示词优化时，新增资产会参与本地关键词推荐。用户可以手动勾选推荐资产，系统会把这些资产的 `summary`、`content`、`integration` 和结构化 `schema` 作为上下文注入给模型。

推荐使用方式：

- 写 Skill：组合 `Skill 蓝图大师`、`Codex Skill 架构 Reference`、`Skill 封装生命周期 Workflow`。
- 写 MCP：组合 `MCP Builder Skill`、`MCP Tool 规格模板`、`MCP Server 质量评估器`、MCP SDK。
- 写 Agent：组合 `Agent 运行契约模板`、LangGraph/AutoGen/CrewAI 资产和对应 Evaluator。
- 写 SDK 接入：组合对应 SDK、`SDK 接入就绪度评估器`、`环境变量与密钥边界 Policy`。
- 做前端验证：组合 `WebApp Testing Skill`、Playwright MCP/Tool 和 `浏览器回归验证 Workflow`。
- 做文档和 RAG：组合文档处理 Skill Pack、LlamaIndex、RAG Agent、引用和时效 Policy。

## 存储与迁移

本次同时把 starter seed 从布尔标记升级成版本号：

- 旧值 `true` 会被识别为 v1。
- 首次加载会写入 82 个默认资产并把 seed 标记为 `2`。
- 已经拥有 v1 默认资产的本地库，会只补 v2 新增的 50 个资产，不覆盖已有同 id 资产。
- 用户自己新建或编辑的资产会保留。

验证结果：

- `npm run typecheck` 通过。
- `npm run build` 通过。
- 隔离浏览器验证：首次加载资产数为 82，旧版 `seed=true` 迁移后资产数为 82，其中 v1 为 32 个、v2 新增为 50 个。
