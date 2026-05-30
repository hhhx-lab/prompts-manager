# 03. 推理技术与任务拆解

推理技术的目标不是让模型“显得会思考”，而是让复杂任务更可靠、更可检查、更容易失败恢复。

## Chain of Thought

CoT 论文表明，对复杂推理任务，展示中间推理步骤可以提升模型解题能力。工程实践中更推荐“要求模型先分析再给答案”，但最终是否暴露完整推理要视产品、安全和模型供应商规范而定。

适用场景：

- 数学、逻辑、代码诊断。
- 多条件决策。
- 需要从材料中归纳证据。

Prompt 设计：

```text
先分析问题结构、已知条件和可能路径，再给出最终答案。
最终答案必须简洁，并列出关键依据。
```

注意：

- 不要把“长篇思考”当作质量本身。
- 面向用户的输出可以只展示摘要推理、证据和结论。
- 高风险结论需要外部校验或工具验证。

## Self-Consistency

Self-Consistency 不是让模型一次写更长，而是生成多条推理路径，再选择一致或得分最高的答案。

适合：

- 有明确答案的推理题。
- 分类或判断边界不稳定的任务。
- Prompt 评估阶段的离线测试。

资产化方式：

- Benchmark 定义同一输入多次运行。
- Evaluator 统计答案一致性。
- Workflow 加入“多候选生成 -> 投票 -> 解释分歧”阶段。

## ReAct

ReAct 把推理和行动交替组织：

```text
Thought -> Action -> Observation -> Thought -> Action -> Observation -> Final
```

适合：

- 需要工具调用的任务。
- 需要搜索、读取文件、运行测试、再判断的任务。
- Agent 和 MCP 编排。

当前项目中，MCP/SDK/Tool 资产不真实执行，但可以作为“可引用工程上下文”告诉模型：

- 有哪些工具。
- 工具输入输出是什么。
- 什么时候应调用。
- 调用失败怎么降级。

生成提示词时要明确：如果运行环境没有真实工具调用能力，不得声称已经调用。

## Tree of Thoughts

ToT 把推理候选组织成树，搜索、评分、回溯。它适合开放但可评估的问题：

- 策略设计。
- 方案对比。
- 复杂代码重构计划。
- 产品架构决策。

Prompt 模式：

```text
请提出 3 个候选方案。
分别评估每个方案的收益、风险、实施成本和失败条件。
选择最稳妥方案，并说明为什么放弃其它方案。
```

不要在简单任务中滥用 ToT，否则会增加成本和噪声。

## Least-to-Most

Least-to-Most 先把复杂问题拆成更小问题，再按依赖顺序解决。它适合：

- 多步骤数学或代码迁移。
- 文档生成流水线。
- 数据抽取和校验。
- 需求分析。

Workflow 资产可以把这种方法固化为阶段：

1. 拆解子任务。
2. 排序依赖。
3. 逐步解决。
4. 汇总并校验。

## Generated Knowledge

Generated Knowledge 先生成相关背景知识，再回答问题。工程上要谨慎：模型生成的知识可能错误。

更稳妥做法：

- 如果有 Reference，优先用 Reference。
- 如果没有 Reference，生成“可能相关知识”并标注为待验证。
- 对事实问题使用检索或人工提供资料。

## Automatic Prompt Engineer

APE 思路是自动生成多个候选提示词，用评估集筛选。适合提示词库批量优化：

1. 根据任务和失败样例生成候选 Prompt。
2. 在 Dataset 或 Benchmark 上运行。
3. 用 Evaluator 打分。
4. 保留表现最好的版本并记录差异。

当前项目可以先人工模拟这个流程：生成多版本 Prompt，使用 A/B 测试和资产评估器比较。

## DSPy 式思路

DSPy 把 Prompt、示例、检索、模型调用、评估组合为可优化程序。它对当前项目的启发：

- Prompt 不应孤立维护，应该绑定输入、输出、样例和指标。
- 资产库应该保存正反例和评估器。
- 优化不只改文案，也可以改示例、检索策略、工具选择和输出 schema。

## Reflexion 与自我改进

Reflexion 类方法通过失败反馈形成下一轮策略。资产化时可以把“失败反思”沉淀为：

- Dataset 的 negativeExamples。
- Evaluator 的 failureCases。
- Policy 的 enforcement。
- Workflow 的 failureHandling。
- Memory 的 projectConventions。

## 选择推理技术的准则

| 任务特征 | 推荐技术 |
| --- | --- |
| 一步生成、格式明确 | 结构化 Prompt + 输出契约 |
| 多条件判断 | CoT 摘要 + 评估标准 |
| 工具/资料循环 | ReAct / Workflow |
| 多方案策略 | ToT / 多候选比较 |
| 长任务拆解 | Least-to-Most |
| 事实背景不足 | RAG / Reference，而不是纯 Generated Knowledge |
| 需要持续优化 | APE / DSPy / Benchmark |
