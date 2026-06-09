---
mode: plan
change_id: add-agent-asset-builder
cwd: /Users/hwaigc/太空垃圾站/提示词大师
task: 资产构建室手动构建与 Agent 协作构建双模式
source_document: docs/product-plan-promptops-studio-v3.md
created_at: 2026-06-09T11:58:18Z
qualification_status: passed
---

# Plan: 资产构建室手动构建与 Agent 协作构建双模式

## 背景与动机

v3 产品方案将资产构建室定义为产品第二核心：它不是单纯表单，而是支持用户手动构建和 Agent 协作构建两种模式。当前构建器可以从任务生成某一类资产草稿，但还缺少明确的手动/Agent 模式切换、对话式补全、文档/链接提炼入口和从能力包缺失资产回填的闭环。
<!-- 下游：proposal.md 的 motivation -->

## Goal

- 将资产构建器升级为“资产构建室”，支持手动构建模式和 Agent 构建模式。
- Agent 构建模式允许用户用一句话、上传文档或粘贴链接生成资产草稿，并由用户轻量修改确认。
- 手动构建模式保留按资产类型编辑结构化字段的能力。
- 支持从能力包缺失资产入口跳转进构建室，保存后回填到原能力包上下文。
<!-- 下游：proposal.md 的 scope -->

## Non-goals

- 不实现完整能力包编辑器；仅支持接收能力包回填上下文，能力包模块另由 `add-capability-packs` 覆盖。
- 不实现真实远程爬取登录态文档；链接读取遵循 `update-asset-library-imports` 的安全边界。
- 不让 Agent 自动保存资产；所有草稿必须用户确认后才能进入资产库。
- 不真实执行生成的 MCP / SDK / Tool。
<!-- 下游：proposal.md 的 scope -->

## 当前仓库事实

- 产品方案要求资产构建室支持手动构建和 Agent 构建两种模式：`docs/product-plan-promptops-studio-v3.md:304`。
- 产品方案要求 Agent 构建支持一句话、上传文档、粘贴链接，并自动判断资产类型、提炼标题、拆解输入输出、生成示例和验证标准：`docs/product-plan-promptops-studio-v3.md:391`。
- 当前 `BuilderWorkbench` 有输入框、资产类型选择、生成任务卡、生成某类资产草稿、保存到项目库：`components/builders/BuilderWorkbench.tsx:31`、`components/builders/BuilderWorkbench.tsx:40`、`components/builders/BuilderWorkbench.tsx:52`、`components/builders/BuilderWorkbench.tsx:62`。
- 当前 `services/assetDrafts.ts` 已能基于 assetType/task/input 本地生成资产草稿，并转换为 PromptAsset：`services/assetDrafts.ts:5`、`services/assetDrafts.ts:39`。
- 当前后端提供 `POST /api/assets/build-draft`，用于生成资产草稿：`backend/server.mjs:99`。
- 当前 `services/library.ts` 和 `types.ts` 已定义 16 类资产 schema 与字段格式，可用于手动构建表单：`types.ts:14`、`services/library.ts:43`。
- OpenSpec 尚未初始化，当前没有 `openspec/specs/` 行为基线。
<!-- 下游：specs baseline，proposal.md 的 context -->

## 改动边界

- 构建室 UI：`components/builders/BuilderWorkbench.tsx` 增加手动构建/Agent 构建模式、对话式输入、草稿检查器、来源解析区。
- 资产草稿服务：`services/assetDrafts.ts` 增强 Agent 提炼结果结构，支持多资产建议、缺失项、确认状态。
- 后端 API：`/api/assets/build-draft` 扩展为支持 buildMode、sourceText、sourceUrl、sourceFiles、targetPackContext；必要时新增 `/api/assets/agent-build`。
- 类型定义：新增 AssetBuildMode、AssetBuildSession、AssetBuildSuggestion、AssetDraftReview。
- 与能力包模块的交互契约：支持从构建室保存资产后返回 capabilityPackId / slotKey。
- 可能新增或修改 OpenSpec specs 领域：`asset-builder`、`agent-build-sessions`、`asset-draft-review`。
<!-- 下游：proposal.md scope，design.md scope，spec deltas 范围 -->

## 约束

- Agent 生成内容必须以草稿形式展示，用户确认前不得写入资产库。
- 手动构建模式必须保留所有已有资产类型的结构化字段。
- Agent 构建模式必须清楚标注来源、推断依据和缺失项，避免让用户误以为内容已被验证。
- 构建室保存后的资产必须进入后端 `assets` state 和本地缓存。
- 若来源是 MCP/SDK/Tool 文档，生成资产默认不得高于 `context_only` 或 `schema_ready` 状态。
<!-- 下游：design.md 的 constraints -->

## 验收标准

1. 用户进入资产构建室时，可以在“手动构建”和“Agent 构建”两种模式间切换，切换不丢失当前草稿。
2. 手动构建模式下，用户选择任一资产类型后，页面展示该类型对应的结构化字段，保存后资产进入资产库。
3. Agent 构建模式下，用户输入一句话并点击生成后，系统自动建议一个或多个资产草稿，包含类型、标题、摘要、输入输出、边界、示例、验证方式和缺失项。
4. Agent 构建模式下，用户上传或粘贴文档内容后，系统能从内容中提炼 Skill、Reference、Policy、Workflow、MCP/SDK 等资产草稿。
5. 用户可以编辑 Agent 生成的草稿后保存；保存后资产库中出现该资产，且保留来源和版本信息。
6. 当从能力包缺失资产入口进入构建室时，构建室显示目标能力包和目标槽位；保存资产后可回填到该能力包。
7. Agent 生成 MCP/SDK/Tool 草稿时，UI 明确展示“仅上下文/可编译，不代表已连接或可执行”。
8. 构建室在无后端或模型不可用时，提供本地草稿生成降级，并清楚显示能力限制。
<!-- 下游：spec deltas 的 Scenarios，tasks.md 的 verification -->

## 验证方式

- 静态检查：`npm run typecheck`、`npm run build`、`git diff --check`。
- 接口检查：验证资产草稿生成接口支持手动/Agent 两种模式的 payload。
- 浏览器手测：手动创建 Skill、MCP、Workflow、Evaluator、Policy；Agent 一句话生成资产；文档内容生成资产；保存后资产库可搜索。
- 浏览器手测：模拟从能力包缺失资产进入构建室，保存后回填目标槽位。
- 安全验收：生成 MCP/SDK/Tool 草稿后能力状态默认不可执行。
<!-- 下游：tasks.md 的验证步骤 -->

## 迁移 / 回滚 / 降级

- 迁移：已有 BuilderWorkbench 草稿无需迁移；新增 build sessions state 缺失时视为空。
- 回滚：若 Agent 构建失败，用户仍可切回手动构建并保存资产。
- 降级：后端不可用时，沿用 `buildLocalAssetDraft` 生成基础草稿，并禁用链接解析。
<!-- 下游：proposal.md 的 risks，spec deltas 的 REMOVED/MODIFIED -->

## 参考

- `docs/product-plan-promptops-studio-v3.md:304`
- `docs/product-plan-promptops-studio-v3.md:391`
- `docs/product-plan-promptops-studio-v3.md:419`
- `docs/product-plan-promptops-studio-v3.md:443`
- `components/builders/BuilderWorkbench.tsx:31`
- `components/builders/BuilderWorkbench.tsx:52`
- `components/builders/BuilderWorkbench.tsx:62`
- `services/assetDrafts.ts:5`
- `backend/server.mjs:99`

