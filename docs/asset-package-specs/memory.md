# Memory 资产

## 定义

Memory 资产保存长期可复用事实、用户偏好、项目约定、适用范围、可信度和失效规则。它是项目库的“长期上下文”，不是临时聊天记录。

## 适用场景

- 项目技术栈、目录约定、提交习惯。
- 用户稳定偏好。
- 团队术语和命名规范。
- 长期有效的流程要求。

不适合：

- 会快速变化的信息，例如价格、排期、人员状态。
- 未验证事实。
- 密钥和隐私数据。
- 单次任务输入。

## 必填结构

`MemoryAssetSchema`：

```ts
{
  facts: string[];
  preferences: string[];
  projectConventions: string[];
  scope: string;
  confidence: string;
  updatedAtText: string;
  invalidationRules: string[];
}
```

## 创建方法

1. 写 facts：稳定事实。
2. 写 preferences：用户偏好。
3. 写 projectConventions：项目约定。
4. 写 scope：适用于哪个用户、仓库或任务类型。
5. 写 confidence：证据来源。
6. 写 updatedAtText。
7. 写 invalidationRules。

## 质量门

- 每条记忆有适用范围。
- 不保存敏感信息。
- 可信度清楚。
- 有失效规则。
- 与当前任务无关时不注入。

## 优化注入方式

Memory 资产为最终 Prompt 补充长期偏好和项目约定。它应低于当前用户明确指令，但高于模型默认假设。若当前指令与 Memory 冲突，应优先当前指令并说明冲突。

## 关联资产

- Policy：不可违反规则。
- Reference：来源事实。
- Agent：记忆策略。
- Workflow：项目流程约定。
