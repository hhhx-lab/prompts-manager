# Agent 资产

## 定义

Agent 资产描述一个具备身份、目标、指令、工具、记忆、计划、停止条件和失败处理的执行体。它不是单次回答模板，而是可持续执行任务的行为配置。

## 适用场景

- 多轮任务助手。
- 自动化开发、研究、审查、运营流程。
- 需要工具和记忆策略。
- 需要明确何时停止、何时升级人工。

不适合：

- 单步生成任务，优先用 Prompt。
- 纯流程图，优先用 Workflow。
- 单个工具，优先用 Tool。

## 必填结构

`AgentAssetSchema`：

```ts
{
  identity: string;
  goals: string[];
  instructions: string[];
  tools: string[];
  memoryStrategy: string;
  planningStrategy: string;
  stopConditions: string[];
  failureHandling: string[];
  outputContract: string;
}
```

## 创建方法

1. 定义 identity：它是谁、服务谁、边界是什么。
2. 定义 goals：可验收目标，不写抽象愿景。
3. 写 instructions：稳定行为规则。
4. 列 tools：只列真实可用或明确作为上下文的工具。
5. 写 memoryStrategy：记什么、不记什么、何时失效。
6. 写 planningStrategy：何时先计划，如何更新计划。
7. 写 stopConditions：完成、阻塞、失败、需确认。
8. 写 failureHandling 和 outputContract。

## 推荐正文骨架

```text
# Agent
## Identity
## Goals
## Instructions
## Tools
## Memory Strategy
## Planning Strategy
## Stop Conditions
## Failure Handling
## Output Contract
```

## 质量门

- 目标可验收。
- 工具权限和副作用清楚。
- 有停止条件，避免无限循环。
- 有失败处理和人工升级。
- 输出契约清楚。

## 优化注入方式

Agent 资产用于生成 Agent 系统提示、工作流或协作策略。优化时应融合身份、目标、工具边界和停止条件，尤其适合“多轮协作优化”和“工具调用适配”方向。

## 关联资产

- Skill：Agent 可使用 Skill。
- Tool/MCP/SDK：Agent 工具。
- Memory：Agent 记忆策略。
- Policy：Agent 安全边界。
- Workflow：Agent 执行流程。
