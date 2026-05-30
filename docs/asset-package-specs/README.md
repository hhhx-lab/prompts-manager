# 资产包规格总览

这个目录定义当前项目支持的 16 类资产包。它以源码中的 `AssetType`、`PromptAsset`、`AssetIntegration` 和各类 `*AssetSchema` 为准：

- 源码入口：[types.ts](/Users/hwaigc/太空垃圾站/提示词大师/types.ts)
- 表单与模板入口：[services/library.ts](/Users/hwaigc/太空垃圾站/提示词大师/services/library.ts)
- 默认资产入口：[services/starterAssets.ts](/Users/hwaigc/太空垃圾站/提示词大师/services/starterAssets.ts)

## 统一资产模型

每个资产都是一个 `PromptAsset`：

```ts
interface PromptAsset {
  id: string;
  type: AssetType;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  useCases: string[];
  integration: AssetIntegration;
  schema?: AssetSchema;
  examples: string[];
  createdAt: number;
  updatedAt: number;
}
```

`integration` 是所有资产参与提示词优化的统一接口：

```ts
interface AssetIntegration {
  entryName: string;
  capabilities: string[];
  inputs: string[];
  outputs: string[];
  constraints: string[];
  usageNotes: string;
}
```

注意：v1 中 MCP、SDK、Tool、Connector 等资产只作为“可引用工程上下文”注入，不触发真实调用。

## 当前资产类型

| 类型 | 文件 | 核心用途 |
| --- | --- | --- |
| Prompt | [prompt.md](prompt.md) | 可复用提示词正文和变量 |
| Skill | [skill.md](skill.md) | 可触发能力包和工作方法 |
| MCP | [mcp.md](mcp.md) | MCP server/tool/resource/prompt 引用 |
| SDK | [sdk.md](sdk.md) | API/SDK 接入说明和代码契约 |
| Workflow | [workflow.md](workflow.md) | 多阶段流程、状态和质量门 |
| Reference | [reference.md](reference.md) | 资料、规范、术语和事实来源 |
| Agent | [agent.md](agent.md) | 目标、工具、记忆、计划和停止条件 |
| Tool | [tool.md](tool.md) | 单个轻量工具能力 |
| Template | [template.md](template.md) | 结构骨架和变量槽位 |
| Evaluator | [evaluator.md](evaluator.md) | 评分维度、rubric 和通过阈值 |
| Dataset | [dataset.md](dataset.md) | few-shot、正反例、标签和样例集 |
| Policy | [policy.md](policy.md) | 安全、合规、品牌或业务规则 |
| Memory | [memory.md](memory.md) | 长期事实、偏好、项目约定 |
| Connector | [connector.md](connector.md) | 外部服务连接、认证和数据边界 |
| Parser | [parser.md](parser.md) | 文件/文本抽取、清洗和输出 schema |
| Benchmark | [benchmark.md](benchmark.md) | 回归任务、输入、期望输出和指标 |

## 创建资产的通用流程

1. 选择最小合适类型。不要把所有东西都塞进 Prompt。
2. 写一句话 summary：解决什么问题、何时复用。
3. 填 useCases：让推荐逻辑能找到它。
4. 填 integration：让优化器知道它能提供什么上下文。
5. 填 schema：让该类型有可检查结构。
6. 填 examples：至少一个正例，重要资产补一个反例。
7. 填 content：放完整正文、规范、示例、代码或说明。
8. 检查安全：是否有密钥、隐私、过期信息、越权调用。
9. 通过一次真实优化任务验证。

## 与提示词工程知识库的关系

通用方法见 [../prompt-engineering-knowledge/README.md](../prompt-engineering-knowledge/README.md)。本目录负责把这些方法落到当前项目的资产格式中。
