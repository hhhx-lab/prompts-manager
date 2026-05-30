# 提示词工程知识库

这个目录是一套面向“提示词工程项目库”的系统文档。它把提示词从一次性的文本技巧，提升为可版本化、可评估、可复用、可组合的工程资产。

文档组织遵循四条主线：

1. 从 Prompt 到工程资产：把角色、任务、上下文、约束、输出格式、工具、评估标准拆成可维护结构。
2. 从单轮提示到工作流：把复杂任务拆成推理、检索、工具调用、Agent 协作、人工确认和回归测试。
3. 从经验到证据：优先引用 OpenAI、Anthropic、Gemini/Vertex AI、GitHub、MCP、OWASP、NIST 等官方资料，再吸收 CoT、ReAct、ToT、DSPy 等论文方法。
4. 从个人技巧到项目库运营：每个 Prompt、Skill、MCP、SDK、Workflow、Evaluator、Dataset、Policy 都应能被搜索、推荐、注入、测试和迭代。

## 阅读路径

- 新手先读 [01-foundations.md](01-foundations.md) 和 [02-prompt-anatomy-patterns.md](02-prompt-anatomy-patterns.md)。
- 要做复杂推理、规划、代码、数学或研究任务，读 [03-reasoning-techniques.md](03-reasoning-techniques.md)。
- 要接入资料、知识库、长上下文或记忆，读 [04-context-retrieval-memory.md](04-context-retrieval-memory.md)。
- 要封装 MCP、SDK、Tool、Agent 或 Workflow，读 [05-tool-use-agents-workflows.md](05-tool-use-agents-workflows.md)。
- 要把提示词变成可交付工程能力，读 [06-evaluation-iteration.md](06-evaluation-iteration.md)、[09-library-operations.md](09-library-operations.md) 和 [10-playbooks.md](10-playbooks.md)。
- 要理解不同模型厂商差异，读 [08-provider-guides.md](08-provider-guides.md)。
- 要系统查找技巧和论文方法，读 [11-method-catalog.md](11-method-catalog.md)。
- 要直接搭项目库方案，读 [12-engineering-blueprints.md](12-engineering-blueprints.md)。

## 本知识库怎样服务当前项目

当前项目的优化流程支持把资产库内容作为半结构化工程上下文注入。这个目录给出资产应该如何被设计、筛选、注入和评估：

- Prompt 资产提供稳定的任务表达和输出契约。
- Skill 资产提供可复用工作方式、边界和质量门。
- MCP、SDK、Tool、Connector 资产提供工具能力、参数、权限、错误处理和安全边界。
- Reference、Dataset、Policy、Memory 资产提供事实、样例、规则和长期偏好。
- Evaluator、Benchmark 资产提供验收标准和回归测试。

与之配套的逐类资产结构说明在 [../asset-package-specs/README.md](../asset-package-specs/README.md)。
