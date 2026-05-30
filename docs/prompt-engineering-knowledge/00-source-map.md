# 来源地图

本文件记录本知识库采用的主要资料来源。文档正文会基于这些来源进行工程化整理，避免把提示词工程写成孤立技巧清单。

## 官方文档

### OpenAI

- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)：提示词结构、指令清晰度、示例、拆分复杂任务等基础方法。
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)：函数调用、参数 schema、工具选择和结构化交互。
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)：用 schema 约束模型输出，适合资产库、评估器和工作流交付。
- [OpenAI Evals](https://platform.openai.com/docs/guides/evals)：把提示词、模型输出、工具调用做成可回归评估。
- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)：以 MCP server 和 UI 组件构建 ChatGPT 应用。
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)：Agent、工具、handoff、guardrail、trace 等工程编排概念。
- [OpenAI Cookbook](https://github.com/openai/openai-cookbook)：示例驱动的 API、结构化输出、RAG、评估和工具调用实践。

### Anthropic

- [Claude Prompt Engineering Overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)：Claude 官方提示词方法总览。
- [Use XML Tags](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags)：用 XML 风格标签隔离上下文、示例、约束和输出。
- [Let Claude Think](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-of-thought)：复杂任务中规划和思考预算的使用方式。
- [Tool Use Overview](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview)：工具定义、工具调用循环和结果回填。
- [Define Success Criteria](https://docs.anthropic.com/en/docs/test-and-evaluate/define-success)：先定义成功标准，再设计评估。
- [Anthropic Courses](https://github.com/anthropics/courses)：Claude 提示词、工具使用和评估课程。

### Gemini / Google Vertex AI

- [Gemini API Prompting Strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)：Gemini 官方提示词策略，包括任务说明、示例、拆解和输出约束。
- [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)：函数声明、工具选择和工具调用响应。
- [Vertex AI Prompt Design Introduction](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/introduction-prompt-design)：企业级生成式 AI 提示词设计流程。
- [Vertex AI Prompt Optimizer](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/prompt-optimizer)：自动提示词优化的产品化参考。

### GitHub

- [GitHub Copilot Prompt Engineering](https://docs.github.com/en/copilot/concepts/prompt-engineering)：面向代码助手的提示词上下文、约束和迭代技巧。
- [GitHub Blog: What is prompt engineering](https://github.blog/ai-and-ml/github-copilot/what-is-prompt-engineering/)：从开发者工作流视角解释提示词工程。
- [GitHub Models Docs](https://docs.github.com/en/github-models)：模型选择、评估和 prompt 试验的 GitHub 平台入口。

### 字节跳动 / 火山引擎

- [火山方舟大模型服务平台文档](https://www.volcengine.com/docs/82379)：模型调用、工具调用、联网检索、上下文缓存、模型体验和 Prompt 最佳实践入口。
- [豆包大模型平台](https://www.volcengine.com/product/doubao)：豆包模型和企业应用能力入口。
- [PromptPilot 相关公开检索](https://github.com/search?q=PromptPilot+prompt&type=repositories)：社区中关于提示词优化器、Prompt 管理和自动调优工具的实现参考。

### MCP

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/docs)：MCP 官方文档入口。
- [MCP Tools](https://modelcontextprotocol.io/docs/concepts/tools)：工具定义、输入 schema、调用结果和 annotations。
- [MCP Resources](https://modelcontextprotocol.io/docs/concepts/resources)：面向上下文读取的数据资源。
- [MCP Prompts](https://modelcontextprotocol.io/docs/concepts/prompts)：可复用提示词模板和工作流入口。
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)：TypeScript server/client SDK。
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)：Python/FastMCP server/client SDK。

### 安全与治理

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)：提示注入、数据泄露、工具滥用等风险分类。
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)：AI 风险管理框架。
- [Microsoft Prompt Shields](https://learn.microsoft.com/azure/ai-services/content-safety/concepts/jailbreak-detection)：提示注入和越狱检测思路。

## 论文与研究方法

- [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/abs/2201.11903)：用中间推理步骤提升复杂推理。
- [Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/abs/2203.11171)：多样化推理路径投票。
- [ReAct: Synergizing Reasoning and Acting](https://arxiv.org/abs/2210.03629)：交替进行思考、行动和观察。
- [Tree of Thoughts](https://arxiv.org/abs/2305.10601)：把推理过程组织为树搜索。
- [Least-to-Most Prompting](https://arxiv.org/abs/2205.10625)：先拆子问题，再逐步求解。
- [Generated Knowledge Prompting](https://arxiv.org/abs/2110.08387)：先生成相关知识，再回答。
- [Automatic Prompt Engineer](https://arxiv.org/abs/2211.01910)：自动生成和筛选候选提示词。
- [DSPy](https://arxiv.org/abs/2310.03714)：把提示词、示例、检索和评估编译为可优化程序。
- [Reflexion](https://arxiv.org/abs/2303.11366)：通过语言化反馈改进行为策略。
- [Toolformer](https://arxiv.org/abs/2302.04761)：模型学习何时调用工具。
- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)：检索增强生成的经典框架。

## 高信号 GitHub 仓库

- [dair-ai/Prompt-Engineering-Guide](https://github.com/dair-ai/Prompt-Engineering-Guide)：社区维护的提示词工程指南和论文索引。
- [openai/openai-cookbook](https://github.com/openai/openai-cookbook)：OpenAI API 示例和工程实践。
- [microsoft/generative-ai-for-beginners](https://github.com/microsoft/generative-ai-for-beginners)：生成式 AI 入门课程，包含提示词、RAG、Agent、评估。
- [microsoft/promptflow](https://github.com/microsoft/promptflow)：LLM 工作流开发、评估和部署工具。
- [langchain-ai/langchain](https://github.com/langchain-ai/langchain)：PromptTemplate、Tool、Agent、Retriever 等组件化实践。
- [run-llama/llama_index](https://github.com/run-llama/llama_index)：面向数据和 Agent 的索引、检索、工作流实践。
- [microsoft/autogen](https://github.com/microsoft/autogen)：多 Agent 协作框架。
- [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)：角色化 Agent 团队和任务编排。
- [stanfordnlp/dspy](https://github.com/stanfordnlp/dspy)：声明式 LM 程序和自动优化。
- [guardrails-ai/guardrails](https://github.com/guardrails-ai/guardrails)：输出校验、格式约束和 guardrail。
