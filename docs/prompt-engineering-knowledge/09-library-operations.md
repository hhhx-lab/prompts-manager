# 09. 提示词工程项目库运营

项目库不是收藏夹，而是一个面向复用、优化和交付的工程系统。

## 资产生命周期

1. **发现**：从聊天记录、代码、文档、GitHub、官方文档、失败案例中发现可复用能力。
2. **建模**：选择资产类型，填写 schema、integration、examples。
3. **导入**：手动创建、文件导入或 JSON 导入。
4. **审查**：检查来源、边界、敏感信息、许可证和质量。
5. **使用**：在优化时搜索、推荐、用户确认后注入。
6. **评估**：观察结果，记录成功和失败。
7. **升级**：修改内容、示例、schema 或关联评估器。
8. **归档**：过期或不再使用的资产保留历史但不默认推荐。

## 资产命名

推荐格式：

```text
领域.能力.用途
```

示例：

- `prompt.review.technical-plan`
- `skill.docs.docx-render-verify`
- `mcp.github.pr-review`
- `sdk.openai.responses-structured-output`
- `evaluator.prompt.actionability`
- `policy.data.no-secret-leak`

命名要稳定、可搜索、可引用。

## 标签体系

标签建议包含：

- 类型：prompt、skill、mcp、sdk。
- 领域：code、writing、research、legal、product。
- 阶段：draft、review、eval、deploy。
- 风险：security、privacy、destructive。
- 供应商：openai、anthropic、gemini、github、volcengine。

标签用于推荐，但不能代替 summary 和 useCases。

## 资产推荐策略

当前项目采用本地关键词匹配。建议匹配字段：

- title。
- summary。
- tags。
- useCases。
- integration.entryName。
- integration.capabilities。
- schema。
- content 前若干字符。

推荐结果要展示给用户确认。未经确认的资产只能作为弱参考。

## 注入策略

注入资产时不要原样堆叠。建议压缩为：

- 标题和类型。
- 摘要。
- 适用场景。
- 入口名。
- 能力。
- 输入输出。
- 约束。
- 使用说明。
- 结构化 schema。
- 必要示例和正文节选。

模型输出 highlights 必须说明：

- 使用了哪些资产。
- 每个资产贡献了什么。
- 使用了哪些优化方向。
- 没有采用哪些推荐资产以及原因。

## 版本管理

每次重要变更记录：

- 修改前问题。
- 修改后目标。
- 影响资产。
- 关联 Benchmark。
- 结果变化。
- 兼容性风险。

PromptVersion 已记录 `selectedAssetIds`、`directions`、`customDirection`，历史回看时应展示这些上下文。

## 导入导出

JSON 格式：

```json
{
  "version": 1,
  "assets": [],
  "directions": []
}
```

导入原则：

- 有 id 按 id 更新。
- 无 id 创建新资产。
- 保留 createdAt，更新 updatedAt。
- 对 schema 做 normalize。
- 导入前最好自动导出备份。

## 质量审查清单

每个资产提交前检查：

- 是否有明确用途。
- 是否有适用和不适用场景。
- 是否包含输入输出。
- 是否记录约束。
- 是否有示例或失败案例。
- 是否包含敏感信息。
- 是否来源可信。
- 是否过期。
- 是否能被当前优化流程实际注入。

## 资产组合

常见组合：

- Prompt + Template：稳定任务和结构骨架。
- Prompt + Reference：领域事实约束。
- Prompt + Evaluator：生成和评分闭环。
- Skill + Workflow：能力入口和执行阶段。
- MCP + Tool + Connector：工具能力、具体函数、外部环境。
- Dataset + Benchmark：样例和回归。
- Policy + Agent：自主行为边界。

组合要避免重复和冲突。若两个资产规则冲突，应标注优先级或要求用户确认。
