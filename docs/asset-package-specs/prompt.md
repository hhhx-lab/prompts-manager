# Prompt 资产

## 定义

Prompt 资产是可直接复用或二次改写的提示词正文。它保存角色、背景、任务、变量、约束、输出格式、评价标准和反模式，是项目库中最基础的资产。

## 适用场景

- 高频重复任务，例如方案评审、报告生成、代码审查、资料总结。
- 输出格式稳定，需要被复制、优化或版本化。
- 需要配合 Reference、Policy、Evaluator 或 Dataset。
- 想把一次成功对话沉淀为模板。

不适合：

- 复杂多阶段执行流程，优先用 Workflow。
- 需要工具权限和参数，优先用 Tool/MCP/SDK。
- 只是资料事实，优先用 Reference。

## 必填结构

`PromptAssetSchema`：

```ts
{
  role: string;
  context: string;
  task: string;
  variables: string[];
  constraints: string[];
  outputFormat: string;
  evaluationCriteria: string[];
  antiPatterns: string[];
}
```

## 创建方法

1. 从真实任务中提取稳定目标。
2. 把一次性内容替换为 `{{变量}}`。
3. 明确输出格式和验收标准。
4. 将“不要做什么”写入 `antiPatterns`。
5. 给出至少一个典型输入和理想输出。
6. 用 Evaluator 或 Benchmark 验证。

## 推荐正文骨架

```text
# Role
{{role}}

# Context
{{context}}

# Task
{{task}}

# Variables
- {{变量1}}
- {{变量2}}

# Constraints
- ...

# Output Format
...

# Evaluation Criteria
- ...

# Anti-Patterns
- ...
```

## 质量门

- 变量命名稳定且可替换。
- 输出格式可检查。
- 约束具体，不只是“不要胡说”。
- 反例边界清楚。
- 不包含密钥、个人隐私或过期事实。
- 能说明与其它资产如何配合。

## 优化注入方式

优化时，Prompt 资产提供任务结构和表达风格。模型应保留其核心意图，并根据用户输入、方向和其它资产融合更新。`highlights` 应说明借用了哪些结构、变量或评估标准。

## 关联资产

- Template：抽象结构骨架。
- Reference：补领域事实。
- Evaluator：评估 Prompt 输出。
- Dataset：提供 few-shot 和反例。
- Policy：约束安全和业务边界。
