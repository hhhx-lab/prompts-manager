# Connector 资产

## 定义

Connector 资产描述外部服务连接方式，包括服务名、端点、认证、环境变量、权限范围、数据边界、速率限制和运维备注。

## 适用场景

- GitHub、Feishu、OpenAI、Anthropic、Gemini、火山方舟、Postgres、Redis 等外部系统。
- 需要记录账号权限和环境变量。
- 需要生成接入计划或部署说明。
- 需要约束数据发送边界。

不适合：

- SDK 方法细节，优先用 SDK。
- 单个工具调用，优先用 Tool/MCP。
- 业务规则，优先用 Policy。

## 必填结构

`ConnectorAssetSchema`：

```ts
{
  service: string;
  endpoints: string[];
  auth: string;
  environment: string[];
  permissions: string[];
  dataBoundaries: string[];
  rateLimits: string[];
  operationalNotes: string[];
}
```

## 创建方法

1. 写 service。
2. 列 endpoints、topics、resources 或事件。
3. 写 auth：API key、OAuth、JWT、SSH、无认证。
4. 写 environment：变量名和运行环境，不写真实值。
5. 写 permissions：最小权限。
6. 写 dataBoundaries：哪些数据可发送、不可发送。
7. 写 rateLimits。
8. 写 operationalNotes：重试、监控、日志、降级。

## 质量门

- 不包含真实密钥。
- 权限最小化。
- 数据边界清楚。
- 速率和成本风险明确。
- 运维故障有降级方案。

## 优化注入方式

Connector 资产用于生成接入、部署、安全和运维相关 Prompt。模型应基于它说明环境变量、权限和数据边界，避免编造认证方式。

## 关联资产

- SDK：具体包和方法。
- MCP：通过 Connector 访问服务。
- Tool：服务上的单个操作。
- Policy：数据与权限规则。
