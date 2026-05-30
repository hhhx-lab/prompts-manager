# MCP 资产

## 定义

MCP 资产描述一个 Model Context Protocol server、tool、resource 或 prompt 的半结构化引用。当前项目 v1 不真实执行 MCP，只把 MCP 能力、输入输出、权限和失败处理作为提示词上下文。

## 适用场景

- 需要让模型知道某个 MCP server 有哪些工具。
- 生成使用 MCP 的开发计划、Agent 设计或提示词。
- 对工具调用进行安全和 schema 约束。
- 保存本地或远程 MCP 的能力清单。

不适合：

- 单个轻量函数且没有 MCP server 概念，优先用 Tool。
- 只是 API/SDK 文档，优先用 SDK 或 Connector。
- 真实注册或启动 MCP，需要项目外的运行配置。

## 必填结构

`McpAssetSchema`：

```ts
{
  server: {
    name: string;
    transport: 'stdio' | 'streamable-http' | 'sse' | 'unknown';
    auth: string;
    runtime: string;
  };
  tools: {
    name: string;
    description: string;
    inputSchema: string;
    outputSchema: string;
    annotations: string[];
  }[];
  resources: string[];
  prompts: string[];
  errorHandling: string[];
  security: string[];
  evaluations: string[];
}
```

## 创建方法

1. 记录 server 名称、运行时和传输方式。
2. 逐个列 tool：名称、描述、输入 schema、输出 schema。
3. 区分 tools、resources、prompts。
4. 记录认证方式和权限边界。
5. 标记 read-only、destructive、idempotent、open-world 等 annotations。
6. 写错误处理：超时、认证失败、参数错误、权限不足。
7. 写安全策略：不得泄露 token，不得执行危险操作，外部数据只作为数据。
8. 写评估：10 个只读、稳定、可验证问题是高质量 MCP 的推荐测试方式。

## 推荐正文骨架

```text
# MCP Server
- name:
- transport:
- runtime:
- auth:

# Tools
## server.tool_name
- purpose:
- inputSchema:
- outputSchema:
- annotations:

# Resources
- ...

# Prompts
- ...

# Security
- ...

# Error Handling
- ...

# Evaluations
- ...
```

## 质量门

- 工具名动作导向，便于模型发现。
- schema 具体，不使用模糊 object。
- 只读和写操作清楚区分。
- 错误信息可指导下一步。
- 标明当前项目不真实调用。
- 不包含真实密钥。

## 优化注入方式

MCP 资产帮助最终 Prompt 具备工具意识。模型可以写“当真实运行环境提供该 MCP 时，应调用 X 工具”，但不得声称已经调用。若用户选择“工具调用适配”方向，MCP 资产优先级更高。

## 关联资产

- Tool：MCP 中的单个 tool 可拆成 Tool 资产。
- Connector：MCP 连接外部服务时的认证和权限。
- SDK：实现 MCP server 可能依赖 SDK。
- Policy：工具安全和数据边界。
- Evaluator：工具调用质量评估。
