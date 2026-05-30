# Skill 资产

## 定义

Skill 是可触发的能力包。它不是单条 Prompt，而是一套“什么时候用、用什么资源、按什么流程做、边界是什么、如何验证”的工作方法。Codex/Claude 类 Skill 通常以 `SKILL.md` 为入口，并通过 references、scripts、assets、agents、mcp 等目录渐进加载资源。

## 适用场景

- 稳定重复的复杂任务，例如文档生成、代码审查、PDF 处理、PPT 制作。
- 任务需要专门流程、脚本、模板或参考资料。
- 需要明确触发词、边界和交接方式。
- 希望让 Agent 在遇到某类任务时自动采用同一套方法。

不适合：

- 只有一段提示词模板，优先用 Prompt 或 Template。
- 只是工具 schema，优先用 Tool/MCP。
- 只是执行阶段图，优先用 Workflow。

## 必填结构

`SkillAssetSchema`：

```ts
{
  trigger: {
    description: string;
    explicitInvocations: string[];
    implicitSignals: string[];
    avoidWhen: string[];
  };
  packageStructure: string[];
  resources: {
    skillMd: string;
    references: string[];
    scripts: string[];
    assets: string[];
    agents: string[];
    mcp: string[];
  };
  workflow: string[];
  boundaries: string[];
  validation: string[];
  handoff: string[];
}
```

## 推荐目录结构

```text
my-skill/
├── SKILL.md
├── references/
├── scripts/
├── assets/
├── agents/
│   └── openai.yaml
└── mcp/
```

只有 `SKILL.md` 是必需入口。其它目录是渐进加载资源，不应把所有内容堆进入口文件。

## 创建方法

1. 写清触发描述：用户说什么、上传什么、遇到什么任务时触发。
2. 写显式调用方式：如 `$docx`、`使用 pdf skill`。
3. 写隐式信号：文件类型、任务动词、领域术语。
4. 写 avoidWhen：避免误触发。
5. 拆分资源：长规范进 references，确定性操作进 scripts，模板素材进 assets。
6. 写 workflow、boundaries、validation 和 handoff。
7. 用真实请求验证是否触发准确、上下文加载不过量、输出可验收。

## SKILL.md 应包含

- frontmatter：name、description。
- 触发范围。
- 工作模式选择。
- 步骤。
- 资源索引。
- 工具和安全边界。
- 验证方式。
- 交接和退出条件。

## 质量门

- 触发描述具体，既不过宽也不过窄。
- `SKILL.md` 精简，长资料有外部文件。
- 每个脚本有用途和输入输出。
- MCP 只作为打包约定时必须说明不会自动注册。
- 有 validation。
- 有 handoff 和失败处理。

## 优化注入方式

优化时，Skill 资产提供“工作方法”。模型应把 Skill 的触发、流程、边界、质量门融合进最终 Prompt，而不是把 Skill 全文机械复制。若任务不满足触发条件，应在 highlights 中说明未采用。

## 关联资产

- Workflow：Skill 的执行流程。
- Tool/MCP/SDK：Skill 可调用的能力。
- Template：Skill 的输出模板。
- Evaluator/Benchmark：Skill 的验证方式。
