# Workflow 资产

## 定义

Workflow 资产描述一个多阶段流程，包括目标、参与者、触发条件、输入、阶段、状态、失败处理和最终输出。它适合把复杂任务从“让模型自由发挥”变成可执行流程。

## 适用场景

- 文档生成、代码实现、数据处理、评审、发布等多步骤任务。
- 需要人工确认点或质量门。
- 需要跨 Prompt、Skill、Tool、MCP、Evaluator 协作。
- 需要明确失败时回到哪个阶段。

不适合：

- 单条提示词模板，优先用 Prompt。
- 只是一种能力入口，优先用 Skill。
- 只是外部工具，优先用 Tool/MCP。

## 必填结构

`WorkflowAssetSchema`：

```ts
{
  goal: string;
  actors: string[];
  triggers: string[];
  inputs: string[];
  stages: {
    name: string;
    objective: string;
    actions: string[];
    outputs: string[];
    qualityGate: string[];
  }[];
  state: string[];
  failureHandling: string[];
  finalOutputs: string[];
}
```

## 创建方法

1. 写最终目标和交付物。
2. 列参与者：用户、模型、工具、人工审查、外部系统。
3. 写触发条件。
4. 定义输入和状态。
5. 拆阶段，每阶段必须有 objective、actions、outputs、qualityGate。
6. 写失败处理：重试、降级、人工确认、回滚。
7. 写最终输出和验收标准。

## 推荐正文骨架

```text
# Workflow
## Goal

## Actors

## Triggers

## Inputs

## Stages
### 1. Stage Name
- objective:
- actions:
- outputs:
- qualityGate:

## State

## Failure Handling

## Final Outputs
```

## 质量门

- 每个阶段有明确产物。
- 阶段之间输入输出能衔接。
- 有失败处理，不只是“重试”。
- 有人工确认点。
- 有最终验收标准。

## 优化注入方式

Workflow 资产提供任务编排。优化时应把用户需求映射到流程阶段，生成分步 Prompt 或操作计划。若某阶段需要真实工具，必须说明前提和降级方案。

## 关联资产

- Skill：Workflow 可由 Skill 触发。
- Tool/MCP/SDK：阶段动作可能依赖工具。
- Evaluator：每阶段质量门。
- Benchmark：全流程回归。
