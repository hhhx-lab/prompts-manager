---
mode: plan
change_id: add-capability-packs
cwd: /Users/hwaigc/太空垃圾站/提示词大师
task: 能力包创建、资产组合、一键使用和导入导出
source_document: docs/product-plan-promptops-studio-v3.md
created_at: 2026-06-09T11:58:18Z
qualification_status: passed
---

# Plan: 能力包创建、资产组合、一键使用和导入导出

## 背景与动机

v3 产品方案把能力包定义为资产组合层：用户围绕一个具体场景组合已有资产，缺失资产可从资产构建室新建，并支持一键使用、导入导出、上传市场和质量检查。当前仓库已有资产库和资产槽位概念，但没有 CapabilityPack 类型、能力包 state、能力包导航或编辑器。
<!-- 下游：proposal.md 的 motivation -->

## Goal

- 新增能力包模块，允许用户通过一句话让 Agent 生成能力包草稿，并自动推荐已有资产和缺失资产。
- 支持用户从资产库任意挑选资产，按槽位组合成能力包。
- 支持能力包一键使用：跳转工作台并自动带入能力包资产。
- 支持能力包导入、导出、下载、版本、使用次数和质量检查。
<!-- 下游：proposal.md 的 scope -->

## Non-goals

- 不实现远程市场上传下载；市场另由 `add-marketplace-local` 覆盖。
- 不真实执行能力包中的 MCP/SDK/Tool。
- 不实现团队权限、多人协作或云同步。
- 不要求能力包必须包含所有槽位；质量检查给出缺失提示即可。
<!-- 下游：proposal.md 的 scope -->

## 当前仓库事实

- 产品方案要求能力包由多个资产组合，包含核心 Prompt、Skill、Workflow、Reference、Policy、Evaluator、MCP/SDK/Tool、Template、Dataset/Benchmark 等槽位：`docs/product-plan-promptops-studio-v3.md:462`、`docs/product-plan-promptops-studio-v3.md:506`。
- 产品方案要求能力包支持一键使用、导入导出、质量检查和版本管理：`docs/product-plan-promptops-studio-v3.md:530`、`docs/product-plan-promptops-studio-v3.md:544`、`docs/product-plan-promptops-studio-v3.md:561`。
- 产品方案给出了 CapabilityPack 建议字段和资产槽位 JSON 示例：`docs/product-plan-promptops-studio-v3.md:865`、`docs/product-plan-promptops-studio-v3.md:887`。
- 当前 `types.ts` 尚未定义 CapabilityPack 或 MarketItem；仅定义了 PromptAsset、AssetGraphEdge、PromptCompilation、PromptRun 等：`types.ts:14`、`types.ts:343`。
- 当前导航没有“能力包”视图，`AppViewMode` 只包含 workspace/library/builder/runlab/feedback/knowledge/settings/ops：`components/layout/AppShell.tsx:5`、`components/layout/AppShell.tsx:79`。
- 当前后端 state collections 不包含 capabilityPacks：`backend/server.mjs:9`。
- 当前已有 `services/assetSlots.ts` 和 `services/assetGraph.ts`，可作为能力包槽位和资产关系设计参考：`components/workspace/PromptOpsWorkspace.tsx:26` 间接体现工作台已围绕资产推荐。
- OpenSpec 尚未初始化，当前没有 `openspec/specs/` 行为基线。
<!-- 下游：specs baseline，proposal.md 的 context -->

## 改动边界

- 类型定义：新增 CapabilityPack、CapabilityPackSlot、CapabilityPackStatus、CapabilityPackExport。
- 后端 state：新增 `capabilityPacks` collection 和 GET/PUT 支持。
- Hooks/services：新增 `useCapabilityPacks`、`services/capabilityPacks.ts`，支持 CRUD、质量分、导入导出、一键使用 payload。
- UI：新增能力包导航、能力包列表、详情、编辑器、Agent 创建入口、槽位编辑、缺失资产提示。
- 工作台集成：支持接收 capabilityPackId 或一键使用上下文，并自动带入资产。
- 构建室集成：支持从能力包缺失槽位跳转构建室，保存后回填。
- 可能新增或修改 OpenSpec specs 领域：`capability-packs`、`capability-pack-builder`、`capability-pack-usage`、`capability-pack-import-export`。
<!-- 下游：proposal.md scope，design.md scope，spec deltas 范围 -->

## 约束

- 能力包只组合资产，不复制执行权限；MCP/SDK/Tool 权限仍由资产状态和设置页决定。
- 能力包导出需支持完整导出和引用导出，不破坏资产库 JSON 导入格式。
- 一键使用不得静默修改用户当前工作台输入；需要明确带入资产/能力包上下文。
- 能力包缺失资产时必须提示，而不是自动生成并保存。
- 继续保持本地 JSON state，不接云数据库。
<!-- 下游：design.md 的 constraints -->

## 验收标准

1. 用户可以通过一句话创建能力包草稿，Agent 自动生成名称、场景、典型输入、期望输出、推荐槽位、已有资产建议和缺失资产列表。
2. 用户可以在能力包编辑器中从资产库搜索并选择任意资产加入指定槽位。
3. 用户可以手动调整资产槽位、移除资产、查看每个资产在能力包中的角色说明。
4. 当能力包缺少关键槽位时，质量检查显示缺失项和建议补齐的资产类型。
5. 用户点击缺失项“让 Agent 创建”后，系统跳转资产构建室并携带能力包 id 与槽位；保存资产后能回填能力包。
6. 用户点击能力包“一键使用”后，系统跳转工作台并自动选中能力包内的相关资产，工作台显示当前使用的能力包。
7. 用户可以导出能力包为完整 JSON，导入后在另一份本地 state 中恢复能力包和相关资产。
8. 用户可以导出引用 JSON，导入时若本地缺少引用资产，系统显示缺失资产提示。
9. 能力包使用后记录 usageCount、lastUsedAt 和版本信息。
10. 能力包中的 MCP/SDK/Tool 若未连接，仍显示为仅上下文或可编译，不允许一键执行。
<!-- 下游：spec deltas 的 Scenarios，tasks.md 的 verification -->

## 验证方式

- 静态检查：`npm run typecheck`、`npm run build`、`git diff --check`。
- 接口检查：验证 `capabilityPacks` state GET/PUT、导入导出序列化。
- 浏览器手测：创建能力包草稿；搜索资产加入槽位；缺失资产跳转构建室；保存后回填；一键使用进入工作台。
- 浏览器手测：完整导出/导入、引用导出/导入缺失提示。
- 视觉验收：能力包列表、详情、编辑器在桌面和移动视口无横向溢出。
<!-- 下游：tasks.md 的验证步骤 -->

## 迁移 / 回滚 / 降级

- 迁移：新增 `promptmaster_capability_packs_v1` 和后端 `capabilityPacks` collection，缺失时为空数组。
- 回滚：若能力包功能不可用，工作台仍可直接选择单个资产优化提示词。
- 降级：后端不可用时，能力包 CRUD 使用 localStorage 缓存；导入导出仍可本地完成。
<!-- 下游：proposal.md 的 risks，spec deltas 的 REMOVED/MODIFIED -->

## 参考

- `docs/product-plan-promptops-studio-v3.md:462`
- `docs/product-plan-promptops-studio-v3.md:506`
- `docs/product-plan-promptops-studio-v3.md:530`
- `docs/product-plan-promptops-studio-v3.md:544`
- `docs/product-plan-promptops-studio-v3.md:865`
- `docs/product-plan-promptops-studio-v3.md:887`
- `components/layout/AppShell.tsx:5`
- `components/layout/AppShell.tsx:79`
- `backend/server.mjs:9`
- `types.ts:14`
