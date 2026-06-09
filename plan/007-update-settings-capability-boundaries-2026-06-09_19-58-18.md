---
mode: plan
change_id: update-settings-boundaries
cwd: /Users/hwaigc/太空垃圾站/提示词大师
task: 设置页运行边界、环境配置和能力状态治理
source_document: docs/product-plan-promptops-studio-v3.md
created_at: 2026-06-09T11:58:18Z
qualification_status: passed
---

# Plan: 设置页运行边界、环境配置和能力状态治理

## 背景与动机

v3 产品方案要求设置页承担可信和安全边界：显示模型 key、后端 state、市场连接、MCP/SDK/Tool/Connector 能力状态，并明确不把没连上的工具伪装成可执行。当前设置页已有能力检测和 state 展示，但需要随能力包、市场、导入和更复杂执行边界扩展。
<!-- 下游：proposal.md 的 motivation -->

## Goal

- 设置页展示模型 API、后端 API、本地 JSON state、市场模式、MCP/SDK/Tool/Connector 的真实能力状态。
- 将能力状态治理统一为“仅上下文、可编译、可测试、已连接、可执行”。
- 对市场下载资产、外部链接导入资产和 MCP/SDK/Tool 执行提供安全边界说明和确认入口。
- 提供环境变量说明和数据导入导出设置入口。
<!-- 下游：proposal.md 的 scope -->

## Non-goals

- 不实现真实密钥管理服务或云端凭据托管。
- 不实现真实 MCP/SDK/Tool 执行授权流；只做状态治理和配置检测。
- 不实现远程市场账号配置；市场先为本地模式。
- 不在前端代码中写死任何 key 或 token。
<!-- 下游：proposal.md 的 scope -->

## 当前仓库事实

- 产品方案要求设置页展示模型 API key、后端 API、本地 JSON state、市场连接、MCP/SDK/Tool/Connector 状态、环境变量和数据导入导出设置：`docs/product-plan-promptops-studio-v3.md:768`。
- 产品方案定义能力状态为仅上下文、可编译、可测试、已连接、可执行：`docs/product-plan-promptops-studio-v3.md:787`。
- 产品方案明确不把没连上的工具伪装成能执行，市场下载资产默认无执行权限，任何 MCP/SDK/Tool 执行需要配置和用户确认：`docs/product-plan-promptops-studio-v3.md:797`。
- 当前 `CapabilityStatus` 已定义五级能力状态：`types.ts:33`。
- 当前后端 `/api/capabilities/check` 返回 model 配置和 mcp/sdk/tool/connector 状态：`backend/server.mjs:115`、`backend/server.mjs:462`。
- 当前 `SettingsView` 展示资产、方向、历史、模型运行、环境变量、能力状态、state collections 和本地 storage keys：`components/settings/SettingsView.tsx:31`、`components/settings/SettingsView.tsx:43`。
- 当前 `index.html` 和 AGENTS 约定环境变量使用 env 文件，不得把 key/token 写死在代码中；项目已有 `.env.local` 忽略状态但不应提交。
- OpenSpec 尚未初始化，当前没有 `openspec/specs/` 行为基线。
<!-- 下游：specs baseline，proposal.md 的 context -->

## 改动边界

- 设置页 UI：扩展市场模式、导入来源安全、能力权限说明、数据导入导出入口。
- 后端能力检查：扩展 `/api/capabilities/check`，包含 market、state collections、import capabilities、model providers、tool execution gates。
- 类型定义：扩展 CapabilityCheck，必要时新增 CapabilityProviderStatus / RuntimeBoundary。
- 资产和市场集成：设置页能解释市场下载资产、外部导入资产为何默认不可执行。
- 环境配置文档：确保 `.env.example` 中说明 API_PORT、VITE_API_BASE_URL、GEMINI_API_KEY 和未来 provider key。
- 可能新增或修改 OpenSpec specs 领域：`settings-boundaries`、`capability-status`、`environment-config`。
<!-- 下游：proposal.md scope，design.md scope，spec deltas 范围 -->

## 约束

- 不提交 `.env.local`、token、key、代理配置或本地运行态数据。
- 设置页只能检测配置状态，不应把未配置能力提升为已连接或可执行。
- 市场下载和外部导入资产默认降级为上下文或可编译。
- 所有高风险执行入口必须要求用户显式确认。
- 保持本地 Node API 和前端都能在无模型 key 情况下启动。
<!-- 下游：design.md 的 constraints -->

## 验收标准

1. 设置页展示后端 API 状态、模型 provider 状态、市场模式、本地 JSON state 状态和所有 state collections。
2. 设置页展示 MCP、SDK、Tool、Connector 的能力状态，并使用统一文案解释五级状态含义。
3. 当 `GEMINI_API_KEY` 未配置时，设置页显示缺密钥，Run Lab 和工作台显示仅编译预览或降级说明。
4. 当市场为本地模式时，设置页明确展示“本地市场模式”，不暗示远程市场可用。
5. 当资产来源为 market 或 external-url 且类型为 MCP/SDK/Tool/Connector 时，设置页和资产详情说明其默认不可执行。
6. `.env.example` 包含每个环境变量的中文说明、获取方式、是否必需。
7. 能力检查接口返回前端所需的 provider、state、market、tooling 状态；无配置时返回安全降级值。
8. 用户不能在设置页把未连接工具直接标为 executable；可执行状态必须依赖配置检测或明确确认机制。
<!-- 下游：spec deltas 的 Scenarios，tasks.md 的 verification -->

## 验证方式

- 静态检查：`npm run typecheck`、`npm run build`、`git diff --check`。
- 接口检查：验证 `/api/capabilities/check` 在无 key、有 key、无市场配置、本地市场模式下返回正确状态。
- 浏览器手测：设置页展示各项状态；删除/恢复 `.env.local` 后确认状态变化；市场/外部导入资产显示安全说明。
- 安全检查：`git status --ignored` 确认 `.env.local`、dist、data runtime JSON 不纳入提交。
<!-- 下游：tasks.md 的验证步骤 -->

## 迁移 / 回滚 / 降级

- 迁移：扩展 CapabilityCheck 时前端对旧后端缺失字段使用默认安全状态。
- 回滚：若扩展能力检测失败，保留当前 model/backend/state 基础检测。
- 降级：任何未知 provider 或工具状态默认显示为 `context_only` 或未配置。
<!-- 下游：proposal.md 的 risks，spec deltas 的 REMOVED/MODIFIED -->

## 参考

- `docs/product-plan-promptops-studio-v3.md:768`
- `docs/product-plan-promptops-studio-v3.md:787`
- `docs/product-plan-promptops-studio-v3.md:797`
- `types.ts:33`
- `backend/server.mjs:115`
- `backend/server.mjs:462`
- `components/settings/SettingsView.tsx:31`
- `components/settings/SettingsView.tsx:43`

