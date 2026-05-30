# 08. 供应商差异：OpenAI、Anthropic、Gemini、GitHub、火山方舟

不同模型供应商的提示词建议高度相似，但在上下文组织、工具调用、结构化输出、评估和生态上各有侧重。

## OpenAI

重点能力：

- Prompt Engineering Guide。
- Structured Outputs。
- Function Calling / Tools。
- Responses API 和 Agents SDK。
- Evals。
- Apps SDK 与 MCP。

工程建议：

- 对程序消费输出优先使用结构化输出。
- 工具调用用 schema 精确定义参数。
- Agent 工作流要有 handoff、guardrail 和 trace。
- 用 Evals 做模型升级和 prompt 变更回归。

适合沉淀的资产：

- SDK：Responses、Structured Outputs、Agents SDK。
- MCP：Apps SDK server 工具说明。
- Evaluator：OpenAI Evals 风格评分器。
- Policy：工具调用和数据边界。

## Anthropic Claude

重点能力：

- 清晰的任务和上下文分区。
- XML 标签组织。
- Claude 工具使用。
- 测试与评估。
- 长上下文和安全边界。
- Skills 概念中的渐进披露和资源包思路。

工程建议：

- 用 XML 风格标签隔离 context、examples、instructions、output。
- 对复杂任务显式要求先计划、后输出摘要。
- Skill 文档保持入口精简，把长资料放 references/scripts/assets。
- 评估前定义 success criteria。

适合沉淀的资产：

- Skill：触发、资源、边界、验证。
- Template：XML 标签模板。
- Evaluator：成功标准和失败样例。

## Gemini / Vertex AI

重点能力：

- Prompting strategies。
- Function calling。
- 多模态输入。
- Vertex AI Prompt Optimizer。
- 企业级模型、检索和评估集成。

工程建议：

- 对多模态和长资料任务，明确每个输入的角色。
- 用示例和输出格式约束生成。
- 函数调用要定义清楚函数用途、参数和返回。
- 企业场景用 Vertex AI 的 prompt 试验和优化流程做参考。

适合沉淀的资产：

- Prompt：多模态分析模板。
- SDK：Gemini API、Vertex AI。
- Connector：Google Cloud 环境和权限。
- Benchmark：Prompt Optimizer 前后的质量对比。

## GitHub Copilot

重点能力：

- 面向代码上下文的 prompt engineering。
- 清晰说明目标、范围、约束、相关文件。
- 迭代式代码生成、调试、测试。

工程建议：

- 代码任务要提供文件路径、目标行为、失败日志和验收命令。
- 不要只说“修一下”，要说明期望结果和不允许改变的边界。
- 让模型先定位影响范围，再修改。
- 每次变更后运行明确测试。

适合沉淀的资产：

- Skill：代码审查、CI 修复、重构、文档同步。
- Workflow：实现计划、验证、提交。
- Tool：rg、git、test runner、lint。
- Benchmark：历史 bug 输入和期望修复。

## 字节跳动 / 火山方舟 / 豆包

重点能力：

- 火山方舟模型服务平台。
- 模型体验、推理服务、联网检索、工具调用、上下文缓存等工程能力。
- 豆包模型产品能力和企业服务生态。

工程建议：

- 把模型调用、工具调用、联网检索和上下文缓存分别资产化，不混在 Prompt 里。
- 记录模型名称、上下文限制、调用方式和安全边界。
- 对平台能力使用 Connector 和 SDK 资产描述环境、认证、权限和速率。
- 对 Prompt 最佳实践和模型体验结果沉淀为 Benchmark。

适合沉淀的资产：

- SDK：火山方舟 API/SDK 接入说明。
- Connector：火山引擎账号、环境变量、权限边界。
- Reference：模型能力、上下文限制和平台文档摘要。
- Workflow：模型选择、Prompt 试验、评估和上线流程。

## 跨供应商迁移原则

迁移时不要只替换模型名。必须检查：

- 系统提示和用户提示的分层方式。
- 工具调用 schema。
- 结构化输出支持程度。
- 多模态输入格式。
- 上下文长度和成本。
- 安全策略和拒答风格。
- 评估集是否需要重跑。

资产库的优势在于：Prompt、Tool、Policy、Evaluator、Reference 分开维护，可以逐层迁移。
