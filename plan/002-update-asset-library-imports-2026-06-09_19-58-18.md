---
mode: plan
change_id: update-asset-library-imports
cwd: /Users/hwaigc/太空垃圾站/提示词大师
task: 资产库外部链接导入、文件导入和资产治理增强
source_document: docs/product-plan-promptops-studio-v3.md
created_at: 2026-06-09T11:58:18Z
qualification_status: passed
---

# Plan: 资产库外部链接导入、文件导入和资产治理增强

## 背景与动机

v3 产品方案要求资产库不仅管理本地资产，还要支持从外部链接和上传文件导入，由 Agent 提炼为资产草稿后再保存。当前资产库已有丰富资产类型、筛选、导入导出和本地 JSON state，但外部链接导入、导入队列和 Agent 提炼流程仍缺失。
<!-- 下游：proposal.md 的 motivation -->

## Goal

- 扩展资产库，使用户可以通过外部链接或上传文件导入内容，并由系统生成可确认的资产草稿。
- 保留现有资产搜索、类型筛选、能力状态筛选、质量分、使用次数、导入导出和插入工作台能力。
- 将导入来源、解析状态、Agent 提炼结果和安全边界记录到资产或导入记录中。
<!-- 下游：proposal.md 的 scope -->

## Non-goals

- 不实现登录态网页抓取、付费文档抓取或绕过权限读取。
- 不在本阶段真实执行市场远程下载；市场另由 `add-marketplace-local` 覆盖。
- 不真实执行导入的 MCP / SDK / Tool；导入后默认仅上下文或可编译状态。
- 不引入云数据库；继续使用本地后端 JSON state。
<!-- 下游：proposal.md 的 scope -->

## 当前仓库事实

- 产品方案要求资产库支持 GitHub 仓库、文档链接、API/MCP/SDK 文档、博客教程、公开 Prompt 集合等外部链接导入：`docs/product-plan-promptops-studio-v3.md:240`。
- 产品方案要求资产库支持 Markdown、TXT、JSON、Word、Excel，PDF 和压缩包后续支持：`docs/product-plan-promptops-studio-v3.md:266`。
- 当前资产类型已经覆盖 Prompt、Skill、MCP、SDK、Workflow、Reference、Agent、Tool、Template、Evaluator、Dataset、Policy、Memory、Connector、Parser、Benchmark：`types.ts:14`。
- 当前 `services/library.ts` 已定义资产类型标签、默认能力状态、资产 schema 字段格式和导入标准化函数：`services/library.ts:20`、`services/library.ts:39`。
- 当前 `App.tsx` 已有资产库搜索、类型筛选、能力状态筛选、导入、导出、保存、删除和注入工作台逻辑：`App.tsx:151`、`App.tsx:346`、`App.tsx:393`、`App.tsx:405`、`App.tsx:460`。
- 当前文件解析服务已被用于资产导入和普通优化附件解析：`App.tsx:49`。
- 当前后端 state collections 包含 `assets` 和 `directions`，但没有导入任务或链接抓取接口：`backend/server.mjs:9`、`backend/server.mjs:127`。
- OpenSpec 尚未初始化，当前没有 `openspec/specs/` 行为基线。
<!-- 下游：specs baseline，proposal.md 的 context -->

## 改动边界

- 资产库前端：资产列表、筛选区、导入入口、导入状态、草稿确认流程。
- 导入服务：扩展 `services/fileParsing.ts`、`services/library.ts`，新增链接导入/解析/摘要服务。
- 后端 API：新增外部链接读取或模拟读取接口、导入草稿生成接口、导入记录 state collection。
- 类型定义：新增 ImportSource / ImportJob / ImportDraft 等类型，扩展 PromptAsset source metadata。
- 可能新增或修改 OpenSpec specs 领域：`asset-library`、`asset-imports`、`asset-drafts`。
<!-- 下游：proposal.md scope，design.md scope，spec deltas 范围 -->

## 约束

- 外部链接导入必须尊重权限和安全边界；无法读取时明确失败原因，不使用绕过权限的方式。
- 市场或外部链接导入的 MCP / SDK / Tool 默认不具备执行权限。
- 文件导入不能破坏已有 JSON 导入导出格式；旧 `{ version: 1, assets, directions }` 仍可导入。
- PDF 和压缩包可标记为后续支持，若未实现必须在 UI 明确说明。
- 所有 API key、token、cookie 不得写死在代码中。
<!-- 下游：design.md 的 constraints -->

## 验收标准

1. 当用户在资产库上传 Markdown/TXT/JSON/Word/Excel 文件时，系统抽取文本并生成资产草稿，用户确认后资产进入资产库。
2. 当用户导入 `{ version: 1, assets, directions }` JSON 时，系统按 id 更新已有资产，无 id 时创建新资产，并保留 directions 兼容。
3. 当用户输入可公开访问的 URL 时，系统读取或获取页面摘要，生成导入草稿；读取失败时显示失败原因和手动粘贴替代入口。
4. 当外部链接内容被识别为 API/MCP/SDK 文档时，Agent 提炼结果默认建议 MCP、SDK、Tool 或 Connector 资产草稿。
5. 当外部链接内容被识别为教程、规范或业务文档时，Agent 提炼结果默认建议 Reference、Policy、Workflow、Skill 或 Template 草稿。
6. 每个导入草稿都显示来源、资产类型建议、标题、摘要、能力状态、安全提示和保存/丢弃操作。
7. 从外部链接或市场来源导入的 MCP/SDK/Tool 资产默认状态不得高于 `context_only` 或 `schema_ready`，除非用户在设置中完成连接配置。
8. 资产库仍可按类型、能力状态、标签、质量、使用次数搜索和筛选新导入资产。
<!-- 下游：spec deltas 的 Scenarios，tasks.md 的 verification -->

## 验证方式

- 静态检查：`npm run typecheck`、`npm run build`、`git diff --check`。
- 接口检查：验证新增导入相关 API 对公开 URL、不可访问 URL、普通文本内容、GitHub URL 的响应。
- 浏览器手测：上传 Markdown/TXT/JSON/Word/Excel 并保存草稿；输入公开 URL 并生成草稿；导入旧 JSON 资产包。
- 浏览器手测：新导入资产出现在资产库，可搜索、筛选、插入工作台。
- 安全验收：导入 MCP/SDK/Tool 后默认不显示为可执行。
<!-- 下游：tasks.md 的验证步骤 -->

## 迁移 / 回滚 / 降级

- 迁移：新增 importJobs state collection 时，旧资产库无需迁移；缺失导入记录视为空数组。
- 回滚：如果链接导入失败，可回退到文件上传或手动粘贴内容生成资产草稿。
- 降级：后端不可用时，保留本地 JSON 导入导出和已有文件解析能力，链接导入入口显示不可用状态。
<!-- 下游：proposal.md 的 risks，spec deltas 的 REMOVED/MODIFIED -->

## 参考

- `docs/product-plan-promptops-studio-v3.md:194`
- `docs/product-plan-promptops-studio-v3.md:240`
- `docs/product-plan-promptops-studio-v3.md:266`
- `types.ts:14`
- `services/library.ts:20`
- `services/library.ts:39`
- `App.tsx:151`
- `App.tsx:346`
- `backend/server.mjs:9`

