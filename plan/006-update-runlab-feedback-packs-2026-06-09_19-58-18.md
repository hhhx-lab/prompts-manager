---
mode: plan
change_id: update-runlab-feedback-packs
cwd: /Users/hwaigc/太空垃圾站/提示词大师
task: 运行实验室与反馈洞察支持能力包验证和迭代
source_document: docs/product-plan-promptops-studio-v3.md
created_at: 2026-06-09T11:58:18Z
qualification_status: passed
---

# Plan: 运行实验室与反馈洞察支持能力包验证和迭代

## 背景与动机

v3 产品方案要求运行实验室证明资产和能力包确实改善提示词质量，并要求反馈洞察将用户行为转为 AssetPatch，反向更新资产与能力包。当前运行实验室已有资产开关对比、编译模式、无 key 预览和真实运行接口；反馈洞察已有 FeedbackEvent、AssetPatch 和补丁应用雏形，但还未支持能力包对比、Evaluator 评分、Benchmark 回归和能力包质量更新。
<!-- 下游：proposal.md 的 motivation -->

## Goal

- 运行实验室支持不插资产、插单个资产、插整个能力包之间的提示词对比。
- 运行实验室支持 Evaluator 评分和 Benchmark 回归记录的基础闭环。
- 反馈洞察支持将用户行为归因到 PromptAsset 或 CapabilityPack，并生成可接受/拒绝/稍后的补丁。
- 接受补丁后更新资产版本，并在涉及能力包时更新能力包质量和缺失项状态。
<!-- 下游：proposal.md 的 scope -->

## Non-goals

- 不实现复杂统计实验、线上 A/B 分流或多模型自动竞赛。
- 不真实执行未连接 MCP/SDK/Tool。
- 不引入云端日志或用户行为远程上报。
- 不实现团队审核流。
<!-- 下游：proposal.md 的 scope -->

## 当前仓库事实

- 产品方案要求运行实验室支持不插资产 vs 插资产、单资产、能力包、编译模式、测试输入、输出差异和运行记录：`docs/product-plan-promptops-studio-v3.md:669`。
- 产品方案要求有 key 时结合 Evaluator 自动评分并生成 Benchmark 回归记录：`docs/product-plan-promptops-studio-v3.md:704`。
- 产品方案要求反馈洞察记录复制、编辑、删除、追加、重新生成、保存为资产、加入能力包、放弃版本等行为：`docs/product-plan-promptops-studio-v3.md:717`。
- 当前 `RunLabWorkbench` 已支持资产开关对比、编译模式、能力检测、运行/预览和最近运行记录：`components/run-lab/RunLabWorkbench.tsx:20`、`components/run-lab/RunLabWorkbench.tsx:68`、`components/run-lab/RunLabWorkbench.tsx:78`。
- 当前后端提供 `/api/run-lab/compare` 和 `/api/run-lab/run`，无 key 时返回 `missing_provider_config`：`backend/server.mjs:105`、`backend/server.mjs:110`、`backend/server.mjs:485`。
- 当前 `FeedbackWorkbench` 支持将文本行为转成 FeedbackEvent、诊断补丁、应用补丁并更新资产：`components/feedback/FeedbackWorkbench.tsx:80`、`components/feedback/FeedbackWorkbench.tsx:55`。
- 当前 `types.ts` 定义 FeedbackEvent、AssetPatch、PromptRun，但未定义能力包补丁目标或 Evaluator run result：`types.ts:368`、`types.ts:377`、`types.ts:395`。
- OpenSpec 尚未初始化，当前没有 `openspec/specs/` 行为基线。
<!-- 下游：specs baseline，proposal.md 的 context -->

## 改动边界

- 运行实验室 UI：支持选择能力包、展示能力包对比、Evaluator 评分区、Benchmark 记录区。
- 运行服务：扩展 compare/run payload 支持 capabilityPack、evaluators、benchmark inputs。
- 反馈洞察 UI：支持补丁目标为资产或能力包，支持接受/拒绝/稍后状态持久化。
- 类型定义：扩展 AssetPatch 或新增 CapabilityPackPatch、EvaluatorResult、BenchmarkRun。
- 后端 state：扩展 runs、feedbackEvents、assetPatches，新增 benchmarkRuns 或 evaluatorResults。
- 与能力包模块集成：接受补丁后更新能力包质量、usageCount、lastUsedAt 或缺失项状态。
- 可能新增或修改 OpenSpec specs 领域：`run-lab`、`feedback-insights`、`evaluator-scoring`、`benchmark-runs`。
<!-- 下游：proposal.md scope，design.md scope，spec deltas 范围 -->

## 约束

- 无 `GEMINI_API_KEY` 时必须明确为仅编译预览，不得展示真实模型输出。
- Evaluator 评分如果没有模型 key 或 evaluator 资产，必须显示不可用原因和手动验收步骤。
- 用户反馈事件只存本地 state，不上传外部服务。
- 补丁必须人工确认后才写入资产或能力包。
- 能力包对比依赖 `add-capability-packs` 的 CapabilityPack 数据结构；若该 change 未完成，需要以接口占位或受限验收标注。
<!-- 下游：design.md 的 constraints -->

## 验收标准

1. 用户可以在运行实验室选择“无资产”“选择资产”“选择能力包”三种对比对象。
2. 当选择能力包后，运行实验室展示能力包内资产数量、槽位覆盖、提示词差异和风险提示。
3. 无模型 key 时，运行实验室对能力包仍能生成编译预览和差异指标，并显示 `missing_provider_config`。
4. 有模型 key 时，运行实验室可以保存真实运行输出到 runs state。
5. 当选择 Evaluator 资产时，运行实验室展示评分维度、通过阈值和评分结果；无法评分时显示原因。
6. 当保存 Benchmark 记录时，系统记录测试输入、期望输出、实际输出、指标和版本信息。
7. 反馈洞察能将用户行为归因到资产或能力包，并生成补丁建议。
8. 用户接受资产补丁后，目标资产版本增加，并记录补丁来源。
9. 用户接受能力包补丁后，目标能力包质量或缺失项状态更新，并记录补丁来源。
10. 用户拒绝或稍后处理补丁后，补丁状态被保存，不会重复强制出现。
<!-- 下游：spec deltas 的 Scenarios，tasks.md 的 verification -->

## 验证方式

- 静态检查：`npm run typecheck`、`npm run build`、`git diff --check`。
- 接口检查：验证 `/api/run-lab/compare`、`/api/run-lab/run`、反馈诊断和补丁应用接口。
- 浏览器手测：无资产/单资产/能力包对比；无 key 编译预览；有 key 环境下真实运行，若本地无 key 则标记受限验收。
- 浏览器手测：选择 Evaluator 资产评分；保存 Benchmark；接受/拒绝/稍后补丁。
- 回归检查：原有运行实验室单资产对比和反馈洞察资产补丁不被破坏。
<!-- 下游：tasks.md 的验证步骤 -->

## 迁移 / 回滚 / 降级

- 迁移：新增 evaluatorResults/benchmarkRuns 或扩展 runs 时，旧记录缺失字段按 N/A 展示。
- 回滚：能力包对比不可用时，运行实验室仍保留无资产和单资产对比。
- 降级：无模型 key 时只编译预览；无 evaluator 时只展示人工验收建议。
<!-- 下游：proposal.md 的 risks，spec deltas 的 REMOVED/MODIFIED -->

## 参考

- `docs/product-plan-promptops-studio-v3.md:669`
- `docs/product-plan-promptops-studio-v3.md:704`
- `docs/product-plan-promptops-studio-v3.md:717`
- `components/run-lab/RunLabWorkbench.tsx:20`
- `components/run-lab/RunLabWorkbench.tsx:68`
- `components/feedback/FeedbackWorkbench.tsx:55`
- `components/feedback/FeedbackWorkbench.tsx:80`
- `backend/server.mjs:105`
- `backend/server.mjs:110`
- `types.ts:368`
