# Policy 资产

## 定义

Policy 资产保存安全、合规、品牌、业务边界或输出风格规则。它定义触发条件、执行方式、升级策略、拒答或降级风格和示例。

## 适用场景

- 数据安全、隐私、密钥、版权、医疗、法律、金融等高风险任务。
- 品牌语气和禁用表达。
- 工具调用审批规则。
- 外部资料提示注入防护。
- 业务流程中的硬性红线。

不适合：

- 只是事实资料，优先用 Reference。
- 只是评分规则，优先用 Evaluator。
- 只是用户偏好，优先用 Memory。

## 必填结构

`PolicyAssetSchema`：

```ts
{
  domain: string;
  rules: string[];
  triggers: string[];
  enforcement: string[];
  escalation: string[];
  refusalStyle: string;
  examples: string[];
}
```

## 创建方法

1. 定义 domain：安全、合规、品牌、业务等。
2. 写 rules：必须/禁止/优先级。
3. 写 triggers：何时触发。
4. 写 enforcement：拒绝、降级、要求确认、脱敏。
5. 写 escalation：交给人工、要求授权、停止任务。
6. 写 refusalStyle：语气、解释程度、替代帮助。
7. 写 examples：触发输入和期望处理。

## 推荐正文骨架

```text
# Policy
## Domain
## Rules
## Triggers
## Enforcement
## Escalation
## Refusal Style
## Examples
```

## 质量门

- 规则可执行，不抽象。
- 触发条件具体。
- 有优先级。
- 有拒答或降级方式。
- 不与更高层安全规则冲突。

## 优化注入方式

Policy 资产应以高优先级注入。最终 Prompt 必须遵守它，且用户普通需求不能覆盖。`highlights` 应说明使用了哪些边界规则。

## 关联资产

- Agent：自主行为安全边界。
- Tool/MCP/Connector：权限和数据边界。
- Evaluator：安全评分维度。
- Reference：政策来源。
