# 05. 工具调用、Agent 与 Workflow

当提示词开始依赖外部能力时，它就不再只是文本，而是一个执行系统的接口说明。

## Tool 的工程含义

Tool 是最小可调用能力。一个高质量 Tool 说明应包含：

- 名称。
- 用途。
- 参数和类型。
- 返回值。
- 前置条件。
- 副作用。
- 错误处理。
- 示例。

Tool 资产适合描述轻量能力；如果涉及 MCP server、认证、传输、资源和 prompts，应使用 MCP 资产。

## MCP 的工程含义

MCP 把外部工具、资源和提示词暴露给模型客户端。官方概念主要包括：

- **Tools**：模型可请求执行的动作。
- **Resources**：可读取的上下文数据。
- **Prompts**：可复用提示模板或工作流入口。
- **Transport**：stdio、streamable HTTP 等通信方式。

在当前项目 v1 中，MCP 资产只作为半结构化上下文，不真实执行。资产必须写清楚：

- server 名称。
- transport。
- auth。
- tools 列表。
- inputSchema 和 outputSchema。
- annotations。
- security。
- evaluations。
- errorHandling。

## Function Calling / Tool Calling

OpenAI、Gemini、Anthropic 都支持某种形式的工具调用。共同原则：

- 工具名要稳定、清晰、动作导向。
- 参数 schema 要具体，不要只写 `object`。
- 工具描述要说明何时使用、何时不用。
- 工具输出要结构化，便于模型继续推理。
- 错误信息要可操作。
- 对危险工具标记权限、确认和副作用。

Prompt 中应区分：

- “你可以使用这些工具”：真实运行环境可调用。
- “以下是工具能力说明”：只是上下文，不得伪造调用结果。

## SDK 资产

SDK 不是工具本身，而是开发者接入某平台的代码接口。SDK 资产应记录：

- package name。
- language。
- version。
- install。
- initialization。
- auth。
- coreMethods。
- examples。
- compatibility。
- testing。

SDK 资产适合让模型生成代码、架构设计、接入计划和错误处理策略。

## Agent 的工程含义

Agent 是带目标、工具、记忆、计划、停止条件和失败处理的执行体。一个 Agent 至少需要：

- identity：它是谁。
- goals：要达成什么。
- instructions：稳定行为规则。
- tools：能用什么。
- memoryStrategy：记住什么，何时失效。
- planningStrategy：何时计划，如何拆分。
- stopConditions：何时停止。
- failureHandling：失败如何报告或降级。
- outputContract：最终交付格式。

Agent 不等于“更自主”。越自主，越需要边界、可观测性和评估。

## Workflow 的工程含义

Workflow 是跨步骤、跨工具、跨角色的流程。适合：

- 多阶段文档生成。
- 代码实现和验证。
- 数据抽取、清洗、审查。
- 人工和 AI 混合协作。

Workflow 资产应包括：

- goal。
- actors。
- triggers。
- inputs。
- stages。
- state。
- failureHandling。
- finalOutputs。

每个 stage 都应有 objective、actions、outputs、qualityGate。

## Skill 与 Workflow 的区别

Skill 是能力包，强调“何时触发、如何执行、边界和资源布局”。Workflow 是流程图，强调“步骤、状态、阶段输出和失败恢复”。

一个 Skill 可以引用一个或多个 Workflow；一个 Workflow 也可以调用多个 Skill。

## 工具安全

工具调用的风险通常来自：

- 权限过大。
- 参数由模型自由生成。
- 用户输入污染工具参数。
- 工具结果被无条件相信。
- 错误处理不清。
- 日志泄露敏感数据。

Policy 和 Connector 资产应记录：

- 权限范围。
- 数据边界。
- 速率限制。
- 是否 destructive。
- 是否需要人工确认。
- 失败回退。

## 设计工具提示词的模板

```text
# Available Tools
列出工具名、用途、参数、返回值、限制。

# Tool Use Rules
1. 只有当工具能显著提高准确性或获取必要事实时才使用。
2. 不要调用与任务无关的工具。
3. 危险或写操作必须先请求确认。
4. 工具失败时说明失败原因并给出降级方案。
5. 不得声称已调用未真实可用的工具。

# Final Answer
区分工具观察、模型推断和用户需确认事项。
```
