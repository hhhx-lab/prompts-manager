# 11. 方法目录：从技巧到可资产化策略

本目录把常见提示词工程方法按用途归类，并说明如何沉淀到当前项目的资产体系中。

## 指令清晰化

### Direct Instruction

直接说明任务、输入、输出和约束。适合低复杂度任务。

资产化：

- Prompt.role
- Prompt.task
- Prompt.outputFormat
- Template.structure

### Delimiters

用分隔符隔离上下文、示例、用户输入和输出要求。Anthropic 常推荐 XML 风格标签；OpenAI 和 Gemini 文档也强调清晰分隔。

资产化：

- Template.slots
- Prompt.context
- Parser.outputSchema

### Role and Audience Framing

指定角色和受众，使输出在术语、粒度和风格上匹配需求。

资产化：

- Prompt.role
- Agent.identity
- Memory.preferences

## 示例与边界

### Zero-shot

无示例，依赖模型和清晰任务。适合简单、常见、低风险任务。

资产化：

- Prompt + Evaluator

### Few-shot

提供少量输入输出示例。适合风格、格式、分类边界稳定的任务。

资产化：

- Dataset.positiveExamples
- Dataset.negativeExamples
- Prompt.examples

### Contrastive Examples

同时给出好例子和坏例子，说明原因。适合边界判断和风格控制。

资产化：

- Dataset.negativeExamples
- Prompt.antiPatterns
- Evaluator.failureCases

### Style Transfer Prompting

把语气、长度、专业度、受众视角作为可控变量。

资产化：

- Template.variants
- Memory.preferences
- Policy.rules

## 推理与分解

### Chain-of-Thought / Rationale Prompting

要求模型先分析再给答案。适合复杂推理，但最终产品输出可只展示摘要推理和证据。

资产化：

- Workflow.stages
- Evaluator.dimensions
- Benchmark.metrics

### Self-Consistency

生成多条候选推理路径，选择一致或得分最高的答案。

资产化：

- Benchmark.tasks
- Evaluator.scoringRubric
- Workflow.stages: generate -> vote -> verify

### Plan-and-Solve

先列计划，再逐步解决。适合开发、研究、报告、数据处理。

资产化：

- Skill.workflow
- Agent.planningStrategy
- Workflow.stages

### Least-to-Most

先拆子问题，再按依赖顺序解决。

资产化：

- Workflow.stages
- Parser.extractionFields
- Evaluator.qualityGate

### Step-back Prompting

先抽象原则或上位问题，再回到具体问题。适合设计、策略、复杂诊断。

资产化：

- Prompt.task: 先抽象再应用
- Evaluator.dimensions: 原则一致性

### Tree of Thoughts

生成候选路径、评分、选择和回溯。适合开放式方案设计。

资产化：

- Workflow.stages: candidates -> score -> select
- Evaluator.scoringRubric
- Benchmark.regressionNotes

## 知识增强

### Generated Knowledge

先生成相关知识再回答。风险是生成知识可能错误，因此应低于 Reference 和检索资料。

资产化：

- Reference.limitations
- Prompt.constraints: 标注待验证

### Retrieval-Augmented Generation

先检索资料，再基于资料回答。

资产化：

- Reference
- Parser
- Connector
- Evaluator: citation coverage

### HyDE

先生成假设性答案或文档，再用它检索真实资料。适合语义检索召回，但生成内容不能当事实。

资产化：

- Workflow.stages: hypothetical query -> retrieval -> grounded answer
- Policy.rules: generated query is not evidence

### Context Compression

把长资料压缩为索引、摘要、关键片段和引用。

资产化：

- Parser.cleaningRules
- Reference.keyFacts
- Template.structure

## 工具与执行

### ReAct

交替进行思考、行动和观察。适合工具调用和检索任务。

资产化：

- Workflow.stages
- Tool
- MCP
- Agent.instructions

### Function Calling

用 schema 定义函数参数，让模型选择并填参。

资产化：

- Tool.parameters
- Tool.returns
- MCP.tools.inputSchema
- SDK.coreMethods

### Program-Aided Language Models

让模型生成或调用程序解决计算、解析、验证问题。

资产化：

- Tool
- Skill.scripts
- Workflow.qualityGate

### Toolformer 式工具学习

关注模型何时调用工具。项目库层面可通过示例和评估器学习工具选择。

资产化：

- Dataset.positiveExamples: 应调用工具
- Dataset.negativeExamples: 不应调用工具
- Evaluator.dimensions: tool selection

## Agent 与多轮协作

### Autonomous Agent

给定目标、工具、记忆和停止条件，让模型多步完成任务。

资产化：

- Agent
- Workflow
- Policy
- Benchmark

### Multi-Agent Debate

多个角色给出观点，再由裁判整合。适合方案评审，不适合简单任务。

资产化：

- Agent.goals
- Workflow.actors
- Evaluator.scoringRubric

### Reflexion

失败后生成反思，改变下一轮策略。

资产化：

- Memory.projectConventions
- Dataset.negativeExamples
- Workflow.failureHandling

### Human-in-the-loop

在高风险节点加入人工确认。

资产化：

- Workflow.stages.qualityGate
- Policy.escalation
- Agent.stopConditions

## 输出控制

### Schema-Constrained Output

用 JSON Schema 或结构化输出约束字段。

资产化：

- Template.outputFormat
- Parser.outputSchema
- Evaluator.outputFormat

### Checklist Output

让模型输出检查清单、风险清单和未确认事项。

资产化：

- Template.structure
- Evaluator.dimensions
- Policy.enforcement

### Refusal and Fallback

当请求越界、信息不足或工具失败时，输出可替代帮助。

资产化：

- Policy.refusalStyle
- Tool.fallback
- Workflow.failureHandling

## 自动优化

### Automatic Prompt Engineer

自动生成候选 Prompt，并用评估集筛选。

资产化：

- Dataset
- Evaluator
- Benchmark
- Workflow: generate -> evaluate -> select -> archive

### DSPy Optimization

把 Prompt、示例、检索和评估看作可优化程序。

资产化：

- Prompt + Dataset + Evaluator + Benchmark
- Workflow.finalOutputs: optimized asset bundle

### Prompt Regression Testing

每次修改 Prompt 或模型后运行固定样例。

资产化：

- Benchmark
- Evaluator
- HistoryEntry
