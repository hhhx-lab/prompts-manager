# SDK 资产

## 定义

SDK 资产记录某个 API/SDK 的接入方式、初始化、认证、核心方法、参数、返回、错误处理、示例和测试方式。它服务于代码生成、架构设计和接入提示词。

## 适用场景

- 生成使用 OpenAI、Anthropic、Gemini、火山方舟、GitHub 等 SDK 的代码。
- 让 Prompt 明确依赖版本和接口契约。
- 为 Agent 或 Workflow 提供开发上下文。
- 保存本项目常用依赖的最小可用示例。

不适合：

- 描述外部服务权限和 endpoint，优先用 Connector。
- 描述可运行工具能力，优先用 Tool/MCP。
- 保存长篇官方文档原文，优先用 Reference。

## 必填结构

`SdkAssetSchema`：

```ts
{
  package: {
    name: string;
    language: string;
    version: string;
    install: string;
  };
  initialization: string;
  auth: string;
  coreMethods: {
    name: string;
    purpose: string;
    parameters: string[];
    returns: string[];
    errors: string[];
  }[];
  examples: string[];
  compatibility: string[];
  testing: string[];
}
```

## 创建方法

1. 从官方文档或 lockfile 确认包名、语言和版本。
2. 写安装命令。
3. 写初始化和认证方式。
4. 列 3-8 个核心方法，避免全文搬运。
5. 对每个方法写参数、返回和错误。
6. 写最小示例。
7. 写兼容性：运行时、Node/Python 版本、浏览器/服务端限制。
8. 写测试方式：mock、smoke test、集成测试。

## 安全要求

- 不把 API key 写入 content。
- 明确密钥应放环境变量。
- 前端项目不得暴露服务端密钥。
- 对写操作和付费操作标注风险。

## 推荐正文骨架

```text
# SDK Reference
- package:
- language:
- version:
- install:

# Initialization
...

# Auth
...

# Core Methods
## methodName
- purpose:
- parameters:
- returns:
- errors:

# Examples
...

# Compatibility
...

# Testing
...
```

## 质量门

- 版本和来源清楚。
- 示例可运行或明确是伪代码。
- 参数和返回不含糊。
- 有错误处理和重试建议。
- 有密钥边界。

## 优化注入方式

SDK 资产在开发类提示词中提供代码上下文。模型应把安装、初始化、方法契约和测试要求融入最终 Prompt，避免编造不存在的 API。

## 关联资产

- Connector：服务端点、权限和环境。
- Tool：SDK 方法封装为工具。
- MCP：SDK 实现 MCP server。
- Benchmark：SDK 接入示例的回归测试。
