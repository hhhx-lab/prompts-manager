# Dataset 资产

## 定义

Dataset 资产保存 few-shot 样例、正例、反例、标签和质量备注。它是提示词优化、评估和回归测试的样例基础。

## 适用场景

- 输出风格或格式需要示例说明。
- 任务有容易混淆的边界。
- 需要评估 Prompt 或模型版本。
- 需要保存历史失败案例。

不适合：

- 保存评分规则，优先用 Evaluator。
- 保存回归任务和指标，优先用 Benchmark。
- 保存资料事实，优先用 Reference。

## 必填结构

`DatasetAssetSchema`：

```ts
{
  purpose: string;
  itemSchema: string;
  positiveExamples: string[];
  negativeExamples: string[];
  labels: string[];
  splitStrategy: string;
  qualityNotes: string[];
}
```

## 创建方法

1. 写 purpose：few-shot、评估、训练规范或回归。
2. 定义 itemSchema：input、expected、label、notes、source。
3. 收集 positiveExamples。
4. 收集 negativeExamples，并说明错误原因。
5. 设计 labels。
6. 写 splitStrategy：train/dev/test 或 smoke/regression/stress。
7. 写 qualityNotes：来源、去重、偏差、时效。

## 样例格式

```json
{
  "input": "...",
  "expected": "...",
  "label": ["format-ok", "high-risk"],
  "notes": "为什么这是好样例或坏样例",
  "source": "internal/manual"
}
```

## 质量门

- 正例不是随便成功输出，而是人工确认的好输出。
- 反例包含错误解释。
- 标签稳定。
- 样例不含隐私和密钥。
- 样例覆盖边界条件。

## 优化注入方式

Dataset 可为最终 Prompt 提供 few-shot 示例或反例边界。注入时应选少量高相关样例，避免把样例集全文塞进上下文。

## 关联资产

- Evaluator：用样例评分。
- Benchmark：把样例转为回归任务。
- Prompt：few-shot 示例。
- Parser：提取样例字段。
