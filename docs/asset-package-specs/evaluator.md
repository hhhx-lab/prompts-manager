# Evaluator 资产

## 定义

Evaluator 资产定义如何评价 Prompt、Agent 输出、工具结果或完整 Workflow。它保存评估对象、维度、评分规则、通过阈值、失败案例、审查模式和输出格式。

## 适用场景

- 需要判断优化后的 Prompt 是否更好。
- 需要 A/B 测试。
- 需要模型升级回归。
- 需要人工和 AI 混合审查。
- 需要把质量标准复用到多个任务。

不适合：

- 保存测试输入集，优先用 Dataset/Benchmark。
- 保存安全规则本身，优先用 Policy。
- 保存任务正文，优先用 Prompt。

## 必填结构

`EvaluatorAssetSchema`：

```ts
{
  target: string;
  dimensions: string[];
  scoringRubric: string[];
  passThreshold: string;
  failureCases: string[];
  reviewMode: 'manual' | 'ai' | 'hybrid';
  outputFormat: string;
}
```

## 创建方法

1. 定义 target：评估什么。
2. 列 dimensions：准确性、完整性、格式、安全、可执行性等。
3. 为每个维度写 scoringRubric。
4. 写 passThreshold。
5. 写 failureCases。
6. 选择 reviewMode。
7. 写 outputFormat，例如 JSON 字段 `score/issues/evidence/recommendations`。

## 推荐 rubric

```text
准确性 0-5
5: 关键事实均由输入或来源支持。
3: 主结论正确，但存在轻微未证实表述。
1: 存在影响使用的事实错误。
0: 主要结论错误或不可用。
```

## 质量门

- 维度可判定。
- 评分标准区分度清楚。
- 通过阈值包含硬性门槛。
- 失败案例来自真实问题。
- 输出格式适合后续汇总。

## 优化注入方式

Evaluator 资产让最终 Prompt 自带验收标准。模型应把评估维度转化为“交付前检查”或“输出质量要求”。如果用户选择“评估标准增强”，Evaluator 应优先注入。

## 关联资产

- Prompt：评估输出质量。
- Dataset：提供评估样例。
- Benchmark：执行回归。
- Policy：安全维度。
- Workflow：阶段质量门。
