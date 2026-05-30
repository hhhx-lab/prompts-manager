# Tool 资产

## 定义

Tool 资产描述单个轻量可调用能力。它关注参数、返回、前置条件、副作用和失败回退，比 MCP 更小，也可以作为 MCP tool 的局部抽象。

## 适用场景

- 单个函数、命令、脚本或内部能力。
- 需要在 Prompt 中描述“可用工具”。
- 需要标注工具参数和危险副作用。
- 需要把脚本能力封装给 Agent/Workflow。

不适合：

- 包含 server、resources、prompts 的协议服务，优先用 MCP。
- 描述 SDK 方法集合，优先用 SDK。
- 外部服务连接和权限，优先用 Connector。

## 必填结构

`ToolAssetSchema`：

```ts
{
  name: string;
  purpose: string;
  parameters: string[];
  returns: string[];
  preconditions: string[];
  sideEffects: string[];
  fallback: string[];
  examples: string[];
}
```

## 创建方法

1. 写稳定工具名。
2. 写 purpose：解决什么问题。
3. 写 parameters：名称、类型、必填、约束。
4. 写 returns：结构化返回。
5. 写 preconditions：文件存在、权限、环境变量、网络。
6. 写 sideEffects：写文件、请求外部服务、删除数据等。
7. 写 fallback：失败时怎么做。
8. 写调用示例。

## 质量门

- 参数足够具体。
- 返回值可被模型继续使用。
- 副作用不隐藏。
- 错误和回退可操作。
- 不声称当前项目能真实执行不存在的工具。

## 优化注入方式

Tool 资产让最终 Prompt 更适合工具调用。模型应明确何时使用工具、如何填参数、如何解释返回、失败时如何降级。

## 关联资产

- MCP：Tool 可属于 MCP server。
- Workflow：Tool 是某阶段 action。
- Agent：Tool 是 Agent 能力。
- Policy：Tool 权限和风险。
