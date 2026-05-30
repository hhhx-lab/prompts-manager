# 12. 工程蓝图：把方法落成项目库资产

本文件给出可直接映射到当前项目资产库的典型架构蓝图。

## 蓝图一：通用 Prompt 优化器

目标：把用户原始需求改写成结构化、可执行、可评估的 Prompt。

资产组合：

- Prompt：通用优化系统提示。
- Template：角色、背景、任务、约束、输出格式、评估标准骨架。
- Evaluator：可执行性、完整性、约束覆盖评分。
- Dataset：好 Prompt 与坏 Prompt 样例。
- Policy：不编造、不泄露、不伪造工具调用。

流程：

1. 解析用户需求。
2. 推荐相关资产。
3. 用户确认资产。
4. 按方向改写。
5. 输出 optimized、highlights、suggestions。
6. 保存历史和 selectedAssetIds。

## 蓝图二：RAG 问答助手

目标：基于资料回答问题，并标注证据。

资产组合：

- Parser：文档切分、字段提取和清洗。
- Reference：资料来源、版本、关键事实。
- Connector：向量库或文档系统连接。
- Prompt：资料问答模板。
- Evaluator：引用覆盖率、事实一致性。
- Policy：外部资料只作为数据，防提示注入。

流程：

1. 用户问题进入检索。
2. Parser 抽取资料结构。
3. Reference 提供可引用事实。
4. Prompt 要求只基于资料回答。
5. Evaluator 检查引用、缺口和编造。

## 蓝图三：工具调用 Agent

目标：让模型根据任务选择工具、执行步骤、整合观察结果。

资产组合：

- Agent：身份、目标、计划、停止条件。
- Tool：单个工具参数和返回。
- MCP：server、tools、resources、prompts。
- Connector：认证、权限、数据边界。
- Policy：写操作确认和数据泄露防护。
- Workflow：Thought/Action/Observation/Final 阶段。

流程：

1. 判断是否需要工具。
2. 选择最小权限工具。
3. 填写参数。
4. 获取观察结果。
5. 验证结果是否足够。
6. 输出结论和未确认事项。

## 蓝图四：代码助手

目标：根据问题描述、文件和日志完成最小范围修复。

资产组合：

- Skill：代码修复工作方式。
- Tool：rg、git、test runner、formatter。
- Prompt：代码修复提示词。
- Workflow：定位、修改、验证、汇报。
- Evaluator：测试通过、范围控制、回归风险。
- Memory：项目约定和提交偏好。

流程：

1. 读取问题和相关文件。
2. 定位根因。
3. 制定小范围修改。
4. 修改。
5. 运行验证命令。
6. 汇报变更、测试和风险。

## 蓝图五：文档生成流水线

目标：从资料包生成正式 Markdown、DOCX、PDF 或演示文稿。

资产组合：

- Parser：Word/PDF/Excel/Markdown 抽取。
- Reference：领域规范和术语。
- Template：文档结构。
- Skill：文档工具链操作流程。
- Workflow：草稿、审校、渲染、检查。
- Evaluator：内容完整性、格式、引用、可读性。

流程：

1. 收集资料和目标格式。
2. 解析资料。
3. 按 Template 生成草稿。
4. 对照 Reference 审校。
5. 导出并检查。
6. 记录问题和修复。

## 蓝图六：Prompt 评估平台

目标：对 Prompt、模型或资产注入策略进行可重复评估。

资产组合：

- Dataset：输入和期望输出。
- Evaluator：评分规则。
- Benchmark：任务、指标和回归记录。
- Prompt：被测对象。
- Workflow：运行、评分、汇总、归档。

流程：

1. 选择 Benchmark。
2. 运行候选 Prompt。
3. Evaluator 评分。
4. 比较分数和失败类型。
5. 保存最佳版本。
6. 更新 negativeExamples。

## 蓝图七：企业级资产治理

目标：让提示词资产可审计、可迁移、可回归。

资产组合：

- Policy：安全、合规、品牌和业务边界。
- Memory：项目约定。
- Reference：官方文档和内部规范。
- Connector：外部系统权限。
- Benchmark：关键流程回归。
- README/docs：资产说明和变更记录。

流程：

1. 新资产进入审查。
2. 检查来源、密钥、许可证和适用范围。
3. 绑定 Evaluator 或 Benchmark。
4. 通过真实任务试用。
5. 导出 JSON 备份。
6. 定期清理过期资产。

## 蓝图八：自动资产导入器

目标：把 Markdown、DOCX、XLSX、JSON 等文件生成资产草稿。

资产组合：

- Parser：按文件类型抽取字段。
- Template：资产卡片结构。
- Evaluator：草稿完整性检查。
- Policy：敏感信息过滤。
- Workflow：导入、预览、编辑、保存。

流程：

1. 识别文件类型。
2. 抽取文本和结构。
3. 推断资产类型。
4. 生成 PromptAsset 草稿。
5. 用户编辑确认。
6. 保存到 localStorage。
