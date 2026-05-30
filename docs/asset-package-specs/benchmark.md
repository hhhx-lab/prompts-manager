# Benchmark 资产

## 定义

Benchmark 资产记录用于回归测试 Prompt、Skill、Agent、Workflow 或模型版本的任务、输入、期望输出、指标和历史记录。

## 适用场景

- 比较两版 Prompt。
- 模型升级回归。
- 资产注入策略变更验证。
- 高频工作流质量监控。
- 记录历史失败是否修复。

不适合：

- 单纯样例集合，优先用 Dataset。
- 评分规则，优先用 Evaluator。
- 单次人工审查结果，优先写入历史记录或 content。

## 必填结构

`BenchmarkAssetSchema`：

```ts
{
  target: string;
  tasks: string[];
  inputs: string[];
  expectedOutputs: string[];
  metrics: string[];
  regressionNotes: string[];
}
```

## 创建方法

1. 写 target：要测试的 Prompt、Skill、Agent、Workflow 或模型。
2. 列 tasks。
3. 列 inputs：文本、文件、样例 ID。
4. 写 expectedOutputs：字段、断言、关键结论。
5. 写 metrics：准确率、格式合规率、人工评分、成本、耗时。
6. 写 regressionNotes：版本、结果、失败原因、修复情况。

## 推荐正文骨架

```text
# Benchmark
## Target
## Tasks
## Inputs
## Expected Outputs
## Metrics
## Regression Notes
```

## 质量门

- 任务可重复。
- 期望输出可判定。
- 指标稳定。
- 样例覆盖核心路径和历史失败。
- 结果能关联版本。

## 优化注入方式

Benchmark 资产通常不全部注入最终 Prompt，而是作为优化前后的验证依据。若用户要求“评估标准增强”或“回归测试”，模型应把 Benchmark 的任务和指标转成验收要求。

## 关联资产

- Dataset：输入样例来源。
- Evaluator：评分方法。
- Prompt/Skill/Agent/Workflow：测试目标。
- Memory：记录长期项目回归要求。
