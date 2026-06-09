---
mode: plan
change_id: update-workbench-prompt-iteration
cwd: /Users/hwaigc/太空垃圾站/提示词大师
task: 工作台提示词输入、资产整合和多版本迭代闭环
source_document: docs/product-plan-promptops-studio-v3.md
created_at: 2026-06-09T11:58:18Z
qualification_status: passed
---

# Plan: 工作台提示词输入、资产整合和多版本迭代闭环

## 背景与动机

v3 产品方案明确将工作台定位为用户日常入口，用户在这里粘贴的是“自己的提示词内容”，不是需求表单；系统要理解提示词意图、整合资产和参考文件、输出优化提示词，并支持用户编辑后继续迭代。当前工作台已经具备任务分析、资产推荐、Prompt 编译、运行预览和反馈补丁的雏形，但文案和数据语义仍以“需求”为主，需要收敛为提示词优化主链路。
<!-- 下游：proposal.md 的 motivation -->

## Goal

- 将工作台主链路调整为“用户输入提示词内容 -> 选择/推荐资产或能力包 -> 编译优化提示词 -> 用户编辑 -> 继续生成 V2/V3/V4 -> 保存/沉淀”的可验证闭环。
- 工作台优化过程中必须尊重并保留用户在上一版提示词中的手动编辑意图。
- 工作台支持上传参考文件并将解析文本作为提示词优化上下文。
- 工作台支持从满意版本沉淀为 Prompt、Template、Skill/Evaluator/Workflow 草稿或加入能力包的入口。
<!-- 下游：proposal.md 的 scope -->

## Non-goals

- 不实现真实 MCP / SDK / Tool 执行；这些资产仍只作为上下文参与优化。
- 不实现远程市场下载或上传；市场另由 `add-marketplace-local` 覆盖。
- 不实现完整能力包编辑器；工作台只消费能力包选择结果，能力包管理另由 `add-capability-packs` 覆盖。
- 不改变现有历史记录 localStorage key 的兼容策略。
<!-- 下游：proposal.md 的 scope -->

## 当前仓库事实

- 产品方案要求工作台里用户输入自己的提示词内容，而不是需求表单，并要求系统理解提示词目标、缺口和可插入资产：`docs/product-plan-promptops-studio-v3.md:86`、`docs/product-plan-promptops-studio-v3.md:105`。
- 当前工作台 `PromptOpsWorkspace` 的示例输入仍是“模糊需求封装成可执行 Prompt”，状态名为 `input`，页面描述写“从需求进入”：`components/workspace/PromptOpsWorkspace.tsx:43`、`components/workspace/PromptOpsWorkspace.tsx:53`、`components/workspace/PromptOpsWorkspace.tsx:203`。
- 当前工作台会调用 `analyzeTaskRemote` / `compilePromptRemote`，根据输入和已选资产生成任务模型与编译结果：`components/workspace/PromptOpsWorkspace.tsx:86`、`components/workspace/PromptOpsWorkspace.tsx:102`。
- 当前工作台已经允许用户编辑编译结果，并能运行预览、复制、记录编辑、诊断反馈：`components/workspace/PromptOpsWorkspace.tsx:57`、`components/workspace/PromptOpsWorkspace.tsx:125`、`components/workspace/PromptOpsWorkspace.tsx:143`、`components/workspace/PromptOpsWorkspace.tsx:151`、`components/workspace/PromptOpsWorkspace.tsx:157`。
- 当前旧版 `App.tsx` 仍保留 Gemini `optimizePrompt` 历史版本、版本对比、A/B 测试、附件解析和用户编辑后二次优化逻辑，可作为回归能力来源：`App.tsx:116`、`App.tsx:213`、`App.tsx:236`。
- 当前 `types.ts` 已有 `PromptVersion`、`PromptCompilation`、`PromptRun`、`FeedbackEvent` 等支撑版本与运行记录的数据结构：`types.ts:343`、`types.ts:368`。
- OpenSpec 尚未初始化，当前没有 `openspec/specs/` 行为基线；后续 Stage A 需要先 `openspec init` 并创建相关 specs。
<!-- 下游：specs baseline，proposal.md 的 context -->

## 改动边界

- 前端工作台：`components/workspace/PromptOpsWorkspace.tsx` 的输入语义、页面文案、版本迭代、参考附件入口、保存沉淀入口、能力包选择入口。
- 历史与版本状态：复用或扩展 `usePromptHistory`、`PromptVersion`、`PromptCompilation`，确保 V1/V2/V3 追踪和回看。
- 优化服务契约：`services/apiClient.ts`、`backend/server.mjs` 的分析/编译接口需要以“提示词内容”作为输入语义，必要时扩展参数承载 previousVersion / userEdits / attachments / capabilityPackIds。
- 附件解析：复用 `services/fileParsing.ts`，工作台需支持参考文件解析文本注入。
- 可能新增或修改 OpenSpec specs 领域：`workbench-prompt-optimization`、`prompt-versioning`、`attachment-context`。
<!-- 下游：proposal.md scope，design.md scope，spec deltas 范围 -->

## 约束

- 保持本地优先：前端继续可用 localStorage 缓存，后端 JSON state 作为主要持久化入口。
- 用户编辑后的内容必须作为下一轮优化输入的强约束，不得被模型“重写回上一版”。
- 附件上传不得在本阶段引入远程存储；解析文本只用于本地优化上下文。
- 无模型 key 时，工作台仍应能通过本地编译预览给出可用输出，不伪装真实模型优化。
- 不破坏现有历史记录、普通附件优化、复制结果、聊天助手、版本对比和 A/B 测试回归能力。
<!-- 下游：design.md 的 constraints -->

## 验收标准

1. 当用户在工作台输入一段提示词并不选择资产时，点击优化/编译后，系统输出结构化优化提示词，并在界面说明本次未使用外部资产。
2. 当用户在工作台输入提示词并选择至少一个资产时，输出提示词必须包含资产融合内容，且 highlights / 编译说明中列出使用了哪些资产。
3. 当用户编辑 V1 的任意段落并继续优化为 V2 时，V2 必须保留用户编辑的核心措辞或约束，并在版本记录中保留 V1 和 V2。
4. 当用户继续从 V2 生成 V3/V4 时，版本历史可以回看、对比和回退，每个版本保存生成时间、使用资产、用户编辑来源和优化设置。
5. 当用户上传 Markdown / TXT / JSON / Word / Excel 参考文件时，解析文本可以进入本次优化上下文；不支持或解析失败的文件要给出明确提示。
6. 当用户对满意版本点击保存为资产时，系统能生成 Prompt 或 Template 资产草稿；选择 Skill/Evaluator/Workflow 时跳转资产构建室并带入当前提示词上下文。
7. 当无模型 key 或后端不可用时，工作台明确显示降级状态，并至少保留本地编译预览、版本保存和资产选择能力。
8. 工作台桌面和移动视口中主输入、资产推荐、优化结果、版本操作区域无文字重叠和横向溢出。
<!-- 下游：spec deltas 的 Scenarios，tasks.md 的 verification -->

## 验证方式

- 静态检查：`npm run typecheck`、`npm run build`、`git diff --check`。
- 接口检查：启动 `npm run dev:all` 后验证 `/api/health`、`/api/task/analyze`、`/api/prompt/compile`。
- 浏览器手测：输入提示词后直接优化；选择资产后优化；编辑 V1 后生成 V2；回看和对比历史版本；上传 Markdown/TXT/JSON/Word/Excel 参考文件。
- 浏览器手测：无 `GEMINI_API_KEY` 时确认界面显示降级，不展示真实运行成功。
- 视觉验收：桌面 1440px 和移动 390px 截图检查工作台无遮挡、无溢出。
<!-- 下游：tasks.md 的验证步骤 -->

## 迁移 / 回滚 / 降级

- 迁移：若扩展 `PromptVersion.settings` 或新增 version metadata，需要兼容旧 `promptmaster_history_v2`，缺失字段按空数组或默认值处理。
- 回滚：保留旧历史数据和旧版本渲染路径，若新工作台版本迭代失败，可回退到只保存编译结果的行为。
- 降级：后端不可用或模型 key 缺失时，工作台进入本地分析/编译预览模式，不调用真实模型。
<!-- 下游：proposal.md 的 risks，spec deltas 的 REMOVED/MODIFIED -->

## 参考

- `docs/product-plan-promptops-studio-v3.md:68`
- `docs/product-plan-promptops-studio-v3.md:86`
- `docs/product-plan-promptops-studio-v3.md:105`
- `components/workspace/PromptOpsWorkspace.tsx:43`
- `components/workspace/PromptOpsWorkspace.tsx:86`
- `components/workspace/PromptOpsWorkspace.tsx:102`
- `components/workspace/PromptOpsWorkspace.tsx:125`
- `App.tsx:213`
- `services/apiClient.ts:26`
- `backend/server.mjs:84`

