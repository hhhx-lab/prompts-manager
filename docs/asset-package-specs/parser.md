# Parser 资产

## 定义

Parser 资产描述如何从文件或文本中抽取结构化信息，包括输入类型、提取字段、清洗规则、输出 schema、校验规则和失败处理。

## 适用场景

- Markdown、TXT、JSON、DOCX、XLSX、CSV 等资料导入。
- 从报告、表格、日志、接口文档中提取字段。
- 为资产导入生成草稿。
- 长文本压缩和结构化摘要。

不适合：

- 只保存提取后的事实，优先用 Reference。
- 只定义输出模板，优先用 Template。
- 需要真实执行脚本，需配合 Tool 或 Skill scripts。

## 必填结构

`ParserAssetSchema`：

```ts
{
  inputTypes: string[];
  extractionFields: string[];
  cleaningRules: string[];
  outputSchema: string;
  validationRules: string[];
  failureHandling: string[];
}
```

## 创建方法

1. 写 inputTypes：md、docx、xlsx、json、pdf 等。
2. 写 extractionFields：title、summary、tables、requirements、tools。
3. 写 cleaningRules：去页眉页脚、合并换行、表格归一化。
4. 写 outputSchema。
5. 写 validationRules：必填、类型、长度、日期。
6. 写 failureHandling：保留原文片段、报告缺失字段、请求人工确认。

## 质量门

- 输入类型明确。
- 输出 schema 可被下游使用。
- 失败时不静默丢信息。
- 不把低置信解析当事实。
- 对表格和长文档有摘要策略。

## 优化注入方式

Parser 资产让最终 Prompt 能要求模型按固定字段抽取资料，尤其适合“长上下文压缩”和“结构化”方向。当前项目的资产导入可用 Parser 资产生成草稿格式。

## 关联资产

- Reference：解析后的资料。
- Dataset：解析样例。
- Template：输出结构。
- Tool：真实解析脚本。
- Skill：文件处理能力包。
