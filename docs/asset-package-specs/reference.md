# Reference 资产

## 定义

Reference 资产保存资料、规范、论文、术语、事实、案例或外部文档摘要。它只提供上下文，不应被当作可执行工具。

## 适用场景

- 领域标准、法规、公司规范、产品说明。
- 官方文档摘要。
- 术语表和知识清单。
- 引用资料和事实依据。

不适合：

- 长期用户偏好，优先用 Memory。
- 可执行步骤，优先用 Workflow/Skill。
- 可调用接口，优先用 MCP/SDK/Connector。

## 必填结构

`ReferenceAssetSchema`：

```ts
{
  source: string;
  version: string;
  scope: string;
  keyFacts: string[];
  terminology: string[];
  citationRules: string[];
  limitations: string[];
  freshness: string;
}
```

## 创建方法

1. 记录来源 URL、文件名或文档编号。
2. 记录版本、发布时间或更新时间。
3. 写适用范围和不适用范围。
4. 提取关键事实，不要只粘贴全文。
5. 提取术语和定义。
6. 写引用规则：是否必须标注来源、能否 paraphrase。
7. 写 limitations 和 freshness。

## 推荐正文骨架

```text
# Reference
- source:
- version:
- freshness:
- scope:

# Key Facts
- ...

# Terminology
- ...

# Citation Rules
- ...

# Limitations
- ...
```

## 质量门

- 来源可追溯。
- 事实和推断分开。
- 时效性明确。
- 不把过期资料当最新事实。
- 不导入敏感或无授权资料。

## 优化注入方式

Reference 资产为 Prompt 提供事实和术语。模型应使用它约束内容，但不能扩展到未覆盖场景。若 Reference 时效敏感，最终 Prompt 应提醒确认最新状态。

## 关联资产

- Prompt：引用 Reference 生成领域提示词。
- Dataset：从 Reference 生成样例。
- Policy：把规范转成规则。
- Memory：稳定项目事实可转为 Memory。
