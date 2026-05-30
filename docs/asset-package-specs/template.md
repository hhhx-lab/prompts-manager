# Template 资产

## 定义

Template 资产保存结构骨架和变量槽位。它不一定是完整 Prompt，而是可被 Prompt、Workflow、文档生成或输出格式复用的框架。

## 适用场景

- 多个 Prompt 使用相同结构。
- 需要固定章节、表格或 JSON 字段。
- 需要不同变体：短版、详细版、审校版、开发版。
- 需要把输出格式与任务指令分离。

不适合：

- 含完整任务逻辑，优先用 Prompt。
- 含执行步骤和状态，优先用 Workflow。
- 含领域事实，优先用 Reference。

## 必填结构

`TemplateAssetSchema`：

```ts
{
  structure: string[];
  slots: string[];
  fillRules: string[];
  variants: string[];
  outputFormat: string;
  constraints: string[];
}
```

## 创建方法

1. 写 structure：章节、字段或表格结构。
2. 写 slots：`{{变量}}`。
3. 写 fillRules：缺失变量如何处理。
4. 写 variants：不同长度、风格、用途。
5. 写 outputFormat：Markdown、JSON、YAML、代码块等。
6. 写 constraints：不可删除字段、顺序、长度。

## 推荐正文骨架

```text
# Template
## Structure
- ...

## Slots
- {{目标}}
- {{受众}}

## Fill Rules
- ...

## Variants
- ...

## Output Format
...

## Constraints
- ...
```

## 质量门

- 结构稳定，可重复填充。
- 变量槽位命名一致。
- 必填和可选变量清楚。
- 有缺失变量处理。
- 不混入一次性任务事实。

## 优化注入方式

Template 资产主要影响最终 Prompt 的输出结构和组织方式。模型应根据任务选择合适变体，并把用户输入填入槽位或保留待填变量。

## 关联资产

- Prompt：Template 可成为 Prompt 骨架。
- Skill：Template 可放入 Skill 的 assets。
- Evaluator：检查 Template 是否被正确填充。
- Parser：按 Template 生成结构化输出。
