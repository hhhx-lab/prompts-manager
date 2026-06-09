---
mode: plan
change_id: add-marketplace-local
cwd: /Users/hwaigc/太空垃圾站/提示词大师
task: 本地市场模块支持资产与能力包上传下载
source_document: docs/product-plan-promptops-studio-v3.md
created_at: 2026-06-09T11:58:18Z
qualification_status: passed
---

# Plan: 本地市场模块支持资产与能力包上传下载

## 背景与动机

v3 产品方案新增市场模块，让用户上传自己的资产或能力包，也能从市场下载别人的资产和能力包到本地库。为避免一开始引入远程账号、权限和服务端分发复杂度，本阶段应先实现本地模拟市场闭环，验证市场信息架构、安全边界和下载到本地的产品体验。
<!-- 下游：proposal.md 的 motivation -->

## Goal

- 新增市场模块，支持浏览本地市场条目、筛选分类、查看详情、安全提示、下载资产/能力包到本地。
- 支持用户将本地资产或能力包上传到本地市场集合。
- 市场条目包含名称、简介、类型、作者、场景、包含资产、能力状态、下载量、评分、更新时间和安全说明。
- 市场下载的 MCP/SDK/Tool 默认不具备执行权限。
<!-- 下游：proposal.md 的 scope -->

## Non-goals

- 不实现真实远程市场服务、账号登录、支付、评论、审核流或云同步。
- 不实现自动更新已下载远程版本；只做本地市场版本字段和手动覆盖策略。
- 不允许市场下载内容自动获得可执行权限。
- 不实现团队私有市场；团队协作另行规划。
<!-- 下游：proposal.md 的 scope -->

## 当前仓库事实

- 产品方案要求市场支持上传和下载 Prompt、Skill、MCP、SDK、Workflow、Evaluator、Policy、Reference、Template 和完整能力包：`docs/product-plan-promptops-studio-v3.md:586`、`docs/product-plan-promptops-studio-v3.md:590`。
- 产品方案要求市场显示名称、简介、类型、作者、使用场景、包含资产、能力状态、下载量、评分、更新时间、安全说明：`docs/product-plan-promptops-studio-v3.md:620`。
- 产品方案要求下载到本地资产库或能力包列表，并可继续编辑和加入工作台使用：`docs/product-plan-promptops-studio-v3.md:636`。
- 产品方案要求市场下载资产默认只作为上下文，MCP/SDK/Tool 不自动变成可执行：`docs/product-plan-promptops-studio-v3.md:655`。
- 当前导航没有市场视图：`components/layout/AppShell.tsx:5`、`components/layout/AppShell.tsx:79`。
- 当前 `types.ts` 尚未定义 MarketItem；产品文档给出 MarketItem 建议字段：`docs/product-plan-promptops-studio-v3.md:938`。
- 当前后端 state collections 不包含 marketplace 或 marketItems：`backend/server.mjs:9`。
- OpenSpec 尚未初始化，当前没有 `openspec/specs/` 行为基线。
<!-- 下游：specs baseline，proposal.md 的 context -->

## 改动边界

- 类型定义：新增 MarketItem、MarketItemType、MarketCategory、MarketInstallResult。
- 后端 state：新增 `marketItems` collection，本地市场通过 JSON state 持久化。
- Hooks/services：新增 `useMarketplace`、`services/marketplace.ts`，支持列表、上传、下载、冲突处理、安全降级。
- UI：新增市场导航、市场列表、筛选、详情、上传入口、下载入口、安全提示。
- 资产库/能力包集成：支持从本地资产或能力包生成 market item；下载后写入 assets 或 capabilityPacks。
- 可能新增或修改 OpenSpec specs 领域：`marketplace`、`market-installation`、`market-safety`。
<!-- 下游：proposal.md scope，design.md scope，spec deltas 范围 -->

## 约束

- 市场先做本地模拟，不依赖远程后端、账号或云数据库。
- 市场下载内容必须走安全降级：MCP/SDK/Tool/Connector 默认最多 `context_only` 或 `schema_ready`。
- 下载冲突必须提示用户覆盖、保留两份或跳过，不得静默覆盖。
- 上传市场不得包含 `.env.local`、API key、token 或本地私密路径。
- 市场条目必须可导出为 JSON，方便后续迁移到真实远程市场。
<!-- 下游：design.md 的 constraints -->

## 验收标准

1. 导航中出现“市场”模块，用户可以浏览本地市场条目列表。
2. 市场列表支持按分类、内容类型、关键词和能力状态筛选。
3. 市场详情展示名称、简介、类型、作者、场景、包含资产、能力状态、下载量、评分、更新时间和安全说明。
4. 用户可以将本地单个资产上传为市场条目，上传前系统展示将发布的字段和安全检查结果。
5. 用户可以将本地能力包上传为市场条目，条目中包含能力包快照和相关资产快照或引用。
6. 用户下载资产条目后，资产进入本地资产库，且来源标记为 market，下载量递增。
7. 用户下载能力包条目后，能力包进入本地能力包列表；若包含资产快照，相关资产进入资产库或触发冲突处理。
8. 当下载内容与本地已有资产或能力包冲突时，用户可选择覆盖、保留两份或跳过。
9. 市场下载的 MCP/SDK/Tool/Connector 默认不可执行，设置页和资产详情显示其真实能力状态。
10. 后端不可用时，市场显示本地缓存或离线状态，不假装远程市场在线。
<!-- 下游：spec deltas 的 Scenarios，tasks.md 的 verification -->

## 验证方式

- 静态检查：`npm run typecheck`、`npm run build`、`git diff --check`。
- 接口检查：验证 `marketItems` state GET/PUT 和上传/下载服务逻辑。
- 浏览器手测：上传资产到市场；上传能力包到市场；下载资产到资产库；下载能力包到能力包列表；处理冲突。
- 安全验收：下载 MCP/SDK/Tool 后默认不可执行；上传时扫描明显 secret 字段。
- 视觉验收：市场列表和详情在桌面/移动视口无溢出。
<!-- 下游：tasks.md 的验证步骤 -->

## 迁移 / 回滚 / 降级

- 迁移：新增 `promptmaster_market_items_v1` 和后端 `marketItems` collection，缺失时为空数组。
- 回滚：市场模块关闭时不影响资产库、能力包和工作台使用；已下载内容仍作为普通本地资产/能力包存在。
- 降级：真实远程市场未配置时，市场明确显示“本地市场模式”。
<!-- 下游：proposal.md 的 risks，spec deltas 的 REMOVED/MODIFIED -->

## 参考

- `docs/product-plan-promptops-studio-v3.md:586`
- `docs/product-plan-promptops-studio-v3.md:620`
- `docs/product-plan-promptops-studio-v3.md:636`
- `docs/product-plan-promptops-studio-v3.md:655`
- `docs/product-plan-promptops-studio-v3.md:938`
- `components/layout/AppShell.tsx:5`
- `components/layout/AppShell.tsx:79`
- `backend/server.mjs:9`
