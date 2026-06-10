import { OptimizationDirection, OptimizationResult, PromptAsset, ScenarioType, StyleMode } from './types';
import { chatModelRemote } from './services/apiClient';
import { formatAssetForModel } from './services/library';

type ModelMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const DEFAULT_MODEL = ((import.meta as any).env?.VITE_LLM_MODEL || (import.meta as any).env?.VITE_MODEL_NAME || '') as string;

export const optimizePrompt = async (
  input: string,
  options: {
    scenario: ScenarioType;
    style: StyleMode;
    useThinking: boolean;
    useSearch: boolean;
    attachments?: {
      data: string;
      mimeType: string;
      textContent?: string;
    }[];
    isRefinement?: boolean;
    selectedSuggestions?: string[];
    previousVersion?: string;
    selectedAssets?: PromptAsset[];
    recommendedAssets?: PromptAsset[];
    directions?: OptimizationDirection[];
    customDirection?: string;
    allowLocalFallback?: boolean;
  }
): Promise<OptimizationResult> => {
  const systemInstruction = buildOptimizationSystemInstruction(input, options);
  const userContent = buildOptimizationUserContent(input, options);

  try {
    const result = await callModelJson<{
      optimized?: string;
      highlights?: string[];
      suggestions?: string[];
    }>([
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userContent }
    ]);
    const optimized = String(result.optimized || '').trim();
    if (!optimized) {
      throw new Error('model_optimization_empty: 模型没有返回 optimized 字段，未生成优化结果。');
    }

    return {
      original: input,
      optimized,
      highlights: Array.isArray(result.highlights) ? result.highlights : [],
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      groundingUrls: []
    };
  } catch (error) {
    if (options.allowLocalFallback === false) throw error;
    return buildLocalOptimizationFallback(input, options, error);
  }
};

export const refreshSuggestions = async (promptContent: string): Promise<string[]> => {
  try {
    const result = await callModelJson<{ suggestions?: string[] }>([
      {
        role: 'system',
        content: '你是提示词工程评审助手。只输出 JSON，不要输出 Markdown 代码块。'
      },
      {
        role: 'user',
        content: [
          '请分析以下提示词内容，并提供 4 条专业、具体、可直接操作的进一步优化建议。',
          '返回 JSON: {"suggestions":["..."]}',
          '',
          promptContent
        ].join('\n')
      }
    ]);
    return Array.isArray(result.suggestions) ? result.suggestions : [];
  } catch {
    return [
      '补充输入变量、边界条件和不可做事项，减少模型自由发挥空间。',
      '增加输出格式、字段顺序和空值处理规则，提升结果可验收性。',
      '加入 1-2 个正例和反例，让模型明确质量标准和误区。',
      '补充评估标准或自检清单，便于后续迭代和 A/B 对比。'
    ];
  }
};

export const editImageWithText = async (_base64Image: string, _prompt: string): Promise<string | undefined> => {
  console.warn('图片编辑未接入统一模型网关；请配置专用图像模型/接口后再启用。');
  return undefined;
};

export const runABTest = async (
  testInput: string,
  versions: { id: string; index: number; content: string }[],
  metrics: { id: string; name: string; type: 'score' | 'keyword' | 'custom'; description?: string; keywords?: string[] }[]
) => {
  const results = [];

  for (const version of versions) {
    const output = await generateVersionOutput(version.content, testInput);
    const scores: Record<string, number> = {};
    const keywordMatches: Record<string, boolean> = {};

    for (const metric of metrics) {
      if (metric.type === 'keyword' && metric.keywords) {
        keywordMatches[metric.id] = metric.keywords.some(keyword => output.includes(keyword));
      }
    }

    const aiMetrics = metrics.filter(metric => metric.type === 'score' || metric.type === 'custom');
    let evaluation = '';
    if (aiMetrics.length > 0) {
      const evaluated = await evaluateOutput(testInput, output, aiMetrics);
      evaluation = evaluated.evaluation;
      for (const metric of aiMetrics) {
        scores[metric.id] = Number(evaluated.scores[metric.name] || 0);
      }
    }

    results.push({
      versionId: version.id,
      versionIndex: version.index,
      promptContent: version.content,
      output,
      scores,
      keywordMatches,
      evaluation
    });
  }

  const summary = await summarizeABResults(results);
  return { results, summary };
};

export const startChat = (model: string = DEFAULT_MODEL) => {
  const messages: ModelMessage[] = [
    {
      role: 'system',
      content: '你是一个智能提示词助手，负责解答用户关于提示词优化、资产构建和 PromptOps 流程的问题。'
    }
  ];

  return {
    async sendMessage({ message }: { message: string }) {
      messages.push({ role: 'user', content: message });
      const response = await chatModelRemote({ messages, model, temperature: 0.35 });
      const text = response.ok && response.text
        ? response.text
        : response.message || '模型网关未配置，请先在 .env.local 中填写 LLM_BASE_URL 和 LLM_API_KEY。';
      messages.push({ role: 'assistant', content: text });
      return { text };
    }
  };
};

const callModelJson = async <T,>(messages: ModelMessage[]): Promise<T> => {
  const response = await chatModelRemote({ messages, model: DEFAULT_MODEL, temperature: 0.25, json: true });
  if (!response.ok) throw new Error(response.message);
  if (response.json && typeof response.json === 'object') return response.json as T;
  return parseJsonFromText(response.text) as T;
};

const callModelText = async (messages: ModelMessage[], temperature = 0.35): Promise<string> => {
  const response = await chatModelRemote({ messages, model: DEFAULT_MODEL, temperature });
  if (!response.ok) throw new Error(response.message);
  return response.text || '';
};

const generateVersionOutput = async (prompt: string, testInput: string) => {
  try {
    return await callModelText([
      { role: 'system', content: prompt },
      { role: 'user', content: testInput }
    ]);
  } catch (error) {
    return [
      '【仅预览】当前模型网关不可用，未执行真实模型输出。',
      '',
      'Prompt:',
      prompt,
      '',
      '测试输入:',
      testInput,
      '',
      `降级原因: ${error instanceof Error ? error.message : String(error)}`
    ].join('\n');
  }
};

const evaluateOutput = async (
  testInput: string,
  output: string,
  metrics: { id: string; name: string; type: 'score' | 'keyword' | 'custom'; description?: string }[]
) => {
  try {
    return await callModelJson<{ scores: Record<string, number>; evaluation: string }>([
      {
        role: 'system',
        content: '你是客观的 PromptOps 评委。只输出 JSON，不要输出 Markdown 代码块。'
      },
      {
        role: 'user',
        content: [
          '请对 AI 生成内容进行评估，按每个指标输出 0-100 分和一段简短综合评价。',
          '',
          '【测试输入】',
          testInput,
          '',
          '【AI 生成内容】',
          output,
          '',
          '【评估指标】',
          metrics.map(metric => `- ${metric.name}: ${metric.description || metric.type}`).join('\n'),
          '',
          '返回 JSON: {"scores":{"指标名称":分数},"evaluation":"综合评价"}'
        ].join('\n')
      }
    ]);
  } catch {
    return {
      scores: Object.fromEntries(metrics.map(metric => [metric.name, 0])),
      evaluation: '模型网关未配置或评分失败，当前仅保留 keyword/manual 结果。'
    };
  }
};

const summarizeABResults = async (results: unknown[]) => {
  try {
    return await callModelText([
      {
        role: 'system',
        content: '你是 PromptOps 实验分析助手。请简洁比较版本表现，指出优势、风险和建议。'
      },
      {
        role: 'user',
        content: `请根据以下 A/B 测试结果生成对比总结：\n${JSON.stringify(results, null, 2)}`
      }
    ]);
  } catch {
    return 'A/B 测试已完成，但模型网关不可用，未生成自动总结。请查看各版本输出、关键词命中和评分占位结果。';
  }
};

const buildOptimizationSystemInstruction = (
  _input: string,
  options: Parameters<typeof optimizePrompt>[1]
) => {
  return [
    buildPromptOptimizationAgentIdentity(options),
    '',
    buildPromptEngineeringKnowledgeBase(),
    '',
    buildPromptOptimizationWorkflow(options),
    '',
    buildDirectionInstruction(options.directions || [], options.customDirection || ''),
    '',
    buildAssetInstruction(options.selectedAssets || [], options.recommendedAssets || []),
    '',
    buildPromptOptimizationQualityGate(),
    '',
    '返回严格 JSON，不要输出 Markdown 代码块：',
    '{"optimized":"可直接复制给其他 AI 使用的最终优化版提示词","highlights":["诊断了哪些原提示词问题","做了哪些提示词工程改造","融合了哪些用户确认资产/参考资料/优化方向","如何保留用户手动修改意图"],"suggestions":["4条进一步提升建议，必须具体可执行"]}'
  ].join('\n');
};

const buildPromptOptimizationAgentIdentity = (options: Parameters<typeof optimizePrompt>[1]) => {
  const refinementContext = options.selectedSuggestions?.length
    ? `\n用户点名要继续体现的优化建议：\n- ${options.selectedSuggestions.join('\n- ')}`
    : '';
  const refinementMode = options.isRefinement
    ? [
      '当前模式：迭代优化。',
      '用户可能已经手动编辑过上一版提示词，你必须识别并保留用户编辑意图。',
      '不要把用户删除的内容未经理由重新塞回去；不要覆盖用户新加的字段、措辞偏好、边界或输出格式。'
    ].join('\n')
    : [
      '当前模式：首版优化。',
      '用户左侧输入的是他原本准备发给其他 AI 的粗糙提示词，不是让你直接执行的任务。'
    ].join('\n');

  return [
    '【Prompt Optimization Agent】',
    '你是提示词大师 Pro 内部的“高级提示词工程优化 Agent”。',
    '你的唯一目标：把用户输入的原始提示词改造成更清晰、精准、稳定、可执行、可复用，并且可直接复制给其他 AI 使用的提示词。',
    '你不是任务执行助手，不要回答原始提示词里的业务问题；你要产出“优化后的提示词本身”。',
    refinementMode,
    refinementContext,
    `当前场景：${options.scenario}`,
    `目标表达风格：${options.style}`,
    `深度思考意图：${options.useThinking ? '开启，优化时应做更严格的诊断和质量门' : '关闭，保持简洁但仍要专业'}`,
    `搜索意图：${options.useSearch ? '开启，但只能转化为提示词中的事实核验/引用要求，不声称已经联网' : '关闭'}`
  ].filter(Boolean).join('\n');
};

const buildPromptEngineeringKnowledgeBase = () => [
  '【内置提示词工程知识】',
  '优化时必须综合使用以下知识，而不是只做润色：',
  '- 意图澄清：识别原提示词的目标、受众、输入材料、成功标准和不确定项。',
  '- 角色定位：为目标 AI 定义合适角色、专业边界、职责范围和拒绝/澄清策略。',
  '- 上下文工程：把背景、参考资料、资产包和约束放到清晰区块，避免和待执行任务混在一起。',
  '- 输入契约：明确用户后续要提供什么、变量名是什么、缺失输入如何处理。',
  '- 任务拆解：把模糊指令拆成可执行步骤，明确先后顺序、质量检查和停止条件。',
  '- 约束工程：补齐必须做、禁止做、优先级、边界条件、风险处理、隐私和安全要求。',
  '- 输出契约：定义格式、字段、顺序、语言、长度、空值处理、引用/证据规则。',
  '- 示例工程：必要时加入极简正例、反例或字段示例，但不要编造用户没有授权的事实。',
  '- 评估工程：加入验收标准、自检清单、评分维度或失败模式，让用户能判断输出好坏。',
  '- 工具/资产适配：MCP、SDK、Tool、Skill、Workflow、Reference、Policy、Evaluator 等资产只能作为上下文或规则注入；除非明确可执行且用户确认，否则不得写成“已经调用”。',
  '- 长上下文策略：参考文件只作为背景和约束来源，不能替代原提示词；长资料要抽取关键事实、术语、限制和引用规则。',
  '- 迭代保护：继续优化时保留用户手动修改、偏好和删改意图，只增强结构和可执行性。'
].join('\n');

const buildPromptOptimizationWorkflow = (options: Parameters<typeof optimizePrompt>[1]) => [
  '【工作流】',
  '请在内部按以下步骤完成，但最终只返回 JSON：',
  '1. 诊断原始提示词：找出模糊目标、缺失输入、输出不稳定、约束不足、边界缺失、资产未用好等问题。',
  '2. 建模使用场景：判断这个提示词将被发给“另一个 AI”执行什么任务，明确它需要的角色、输入、流程和输出。',
  '3. 融合上下文：把用户确认资产作为强约束/流程/示例/评估标准；把推荐资产作为弱参考；把附件作为背景资料。',
  '4. 重构提示词：生成一段完整提示词，建议使用 Markdown 分区，但不要在外层解释“我是如何优化的”。',
  '5. 加质量门：在优化后提示词内部加入自检或验收标准，减少后续 AI 胡编、跑题、漏项。',
  '6. 输出 highlights：说明诊断结论、关键改造、资产融合和优化方向，不要泛泛而谈。',
  `7. 输出 suggestions：给出下一步可继续增强的建议，必须结合当前提示词和场景 ${options.scenario}。`
].join('\n');

const buildPromptOptimizationQualityGate = () => [
  '【硬性质量门】',
  '- 输出的 optimized 必须是“提示词”，不是对用户任务的回答。',
  '- optimized 必须可直接复制给其他 AI 使用，不能依赖本系统 UI 才能理解。',
  '- 必须保留用户原提示词的核心目标，不得擅自改成另一个任务。',
  '- 必须显著降低模糊性：补角色、背景、输入、步骤、约束、输出格式、验收标准。',
  '- 如果原提示词本身缺少事实、文件或变量，必须在提示词里要求后续 AI 先澄清或标注缺口，不得替用户编造。',
  '- 用户确认注入的资产必须被转化为最终提示词里的规则、流程、上下文、示例或评估项，而不只是列资产名。',
  '- 推荐资产可以参考，但不能覆盖用户确认资产；未选中的资产不得写成强依赖。',
  '- MCP/SDK/Tool/Connector 只能写成“可用时如何使用/需确认后使用/作为上下文”，不得声称已经执行。',
  '- 简体中文输出；除非原提示词明确要求其他语言。',
  '- 不要在 optimized 外层添加道歉、寒暄、解释性前言或代码块围栏。'
].join('\n');

const buildOptimizationUserContent = (
  input: string,
  options: Parameters<typeof optimizePrompt>[1]
) => {
  const base = options.isRefinement && options.previousVersion
    ? [
      '【上一版提示词】',
      options.previousVersion,
      '',
      '【用户修改后的当前内容】',
      input,
      '',
      '请对比差异，保留用户修改，再生成下一版。'
    ].join('\n')
    : `原始提示词：\n${input}`;

  const attachments = (options.attachments || []).map((attachment, index) => {
    if (attachment.textContent) {
      return `\n[附件 ${index + 1}: ${attachment.mimeType}]\n${attachment.textContent}`;
    }
    return `\n[附件 ${index + 1}: ${attachment.mimeType}]\n当前统一模型网关只保证文本附件注入；该附件未解析为文本，请在最终提示词中提示用户先转换或补充关键内容。`;
  }).join('\n');

  return attachments ? `${base}\n\n【附件上下文】${attachments}` : base;
};

const buildLocalOptimizationFallback = (
  input: string,
  options: Parameters<typeof optimizePrompt>[1],
  error: unknown
): OptimizationResult => {
  const selectedAssets = (options.selectedAssets || []).slice(0, 8);
  const directions = options.directions || [];
  const optimized = [
    '# 优化后提示词（仅本地预览）',
    '',
    '## Role',
    `你是面向“${options.scenario}”的专业任务执行助手，输出风格为“${options.style}”。`,
    '',
    '## Task',
    input || '请基于用户后续输入完成任务。',
    '',
    '## Context',
    selectedAssets.length ? selectedAssets.map(asset => `- ${asset.type} ${asset.title}: ${asset.summary || asset.integration.usageNotes}`).join('\n') : '- 暂未注入资产。',
    directions.length ? directions.map(direction => `- 优化方向：${direction.name} - ${direction.description}`).join('\n') : '- 暂未指定优化方向。',
    options.customDirection ? `- 自定义方向：${options.customDirection}` : '',
    '',
    '## Constraints',
    '- 必须明确输入、输出、约束和验收标准。',
    '- 缺少关键信息时先提出澄清问题，不要编造。',
    '- MCP/SDK/Tool 资产未连接时只能作为上下文引用。',
    '',
    '## Output Format',
    '- 最终结果',
    '- 关键依据',
    '- 风险与待确认事项',
    '- 自检清单'
  ].filter(Boolean).join('\n');

  return {
    original: input,
    optimized,
    highlights: [
      '模型网关未配置或调用失败，已生成本地优化预览。',
      selectedAssets.length ? `已引用 ${selectedAssets.length} 个资产作为上下文。` : '本次未注入资产。',
      directions.length ? `已保留 ${directions.length} 个优化方向。` : '可继续选择优化方向增强结构。',
      `降级原因：${error instanceof Error ? error.message : String(error)}`
    ],
    suggestions: [
      '在 .env.local 中填写 LLM_BASE_URL 和 LLM_API_KEY 后重新运行，可获得真实模型优化。',
      '补充可复用 Skill/Policy/Evaluator 资产后再优化，结果会更稳定。',
      '为输出格式增加字段级约束和验收标准。',
      '保存满意版本，并把反复出现的结构沉淀为 Template 或 Skill。'
    ],
    groundingUrls: []
  };
};

const buildDirectionInstruction = (directions: OptimizationDirection[], customDirection: string) => {
  if (directions.length === 0 && !customDirection.trim()) return '';
  const directionLines = directions.map(direction => `- ${direction.name}: ${direction.description}`).join('\n');
  const customLine = customDirection.trim() ? `\n- 自定义方向: ${customDirection.trim()}` : '';
  return `【本次优化方向】\n${directionLines}${customLine}`;
};

const buildAssetInstruction = (selectedAssets: PromptAsset[], recommendedAssets: PromptAsset[]) => {
  const confirmed = selectedAssets.slice(0, 8);
  const recommended = recommendedAssets
    .filter(asset => !confirmed.some(selected => selected.id === asset.id))
    .slice(0, 5);
  if (confirmed.length === 0 && recommended.length === 0) return '';

  const selectedBlock = confirmed.length
    ? `\n【用户确认注入的资产】\n${confirmed.map((asset, index) => `## 资产 ${index + 1}\n${formatAssetForModel(asset)}`).join('\n\n')}`
    : '';
  const recommendedBlock = recommended.length
    ? `\n【系统推荐候选资产】\n这些资产只能作为弱参考：\n${recommended.map((asset, index) => `## 候选 ${index + 1}\n${formatAssetForModel(asset)}`).join('\n\n')}`
    : '';

  return [
    '【项目库资产使用规则】',
    '以下内容来自用户维护的提示词工程项目库，是半结构化引用上下文。',
    '你需要把确认注入的资产转化为提示词中的角色、工具上下文、约束、流程、示例或评估标准。',
    '不得声称已经真实执行、连接、调用或验证这些 MCP/SDK/Skill。',
    selectedBlock,
    recommendedBlock
  ].join('\n');
};

const parseJsonFromText = (text: string) => {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('模型未返回可解析 JSON');
    return JSON.parse(match[0]);
  }
};
