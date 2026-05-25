
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ScenarioType, StyleMode, OptimizationResult } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    selectedSuggestions?: string[]; // 新增：用户选取的迭代建议
    previousVersion?: string;
  }
): Promise<OptimizationResult> => {
  const modelName = options.useThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const refinementContext = options.selectedSuggestions && options.selectedSuggestions.length > 0
    ? `\n特别注意：用户选择了以下专业优化点，请务必在本次精炼中体现：\n- ${options.selectedSuggestions.join('\n- ')}`
    : '';

  const baseInstruction = options.isRefinement 
    ? `你是一位专家级的提示词精炼师。用户对上一版生成的提示词进行了手动修改。${refinementContext}
       你的任务是：
       1. 仔细识别用户的修改内容，深刻理解用户修改的用意和想法。
       2. 优化时必须保留原有的核心内容，同时重点补充和优化用户修改的地方。
       3. 在此基础上，参考用户选中的优化建议进行全局提升。
       4. 确保最终版本在结构上更严谨，指令执行力更强，且完美融合了用户的修改意图。`
    : `你是一位世界顶级的 AI 提示词工程师。你的任务是将用户模糊、非正式的需求转化为专业、高效、符合 AI 理解逻辑的优质提示词。`;

  const attachmentInstruction = options.attachments && options.attachments.length > 0
    ? `\n【极度重要：附件深度分析指令】\n用户上传了 ${options.attachments.length} 个附件。你必须：\n1. 极其仔细地读取并深度分析所有附件的内容（包括文本、图片、文档、数据等）。\n2. 深度揣测用户上传这些附件的真实用意和潜在需求。\n3. 在优化提示词时，必须将附件内容作为核心参考依据，确保生成的提示词能够完美处理、利用或契合这些附件所展现的信息特征。\n4. 你的优化结果必须明显体现出对附件内容的深度理解和针对性适配。`
    : '';

  const systemInstruction = `
    ${baseInstruction}
    ${attachmentInstruction}
    
    核心规则：
    1. 修正语法错误，重构为“角色 - 背景 - 任务 - 约束 - 格式”框架。
    2. 补全目标受众、字数要求、评价标准。
    3. 根据场景（${options.scenario}）和风格（${options.style}）植入专业术语。
    4. 必须使用简体中文。
    
    返回格式 (JSON):
    {
      "optimized": "最终精炼后的提示词字符串",
      "highlights": ["列出本次优化的核心改进项"],
      "suggestions": ["提供 4 条进一步提升该提示词效果的专业、具体且可执行的建议。例如：'增加思维链引导以提升复杂推理准确性'、'为生成的文案补充 3 个反面案例以明确边界'"]
    }
  `;

  const config: any = {
    systemInstruction,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        optimized: { type: Type.STRING },
        highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["optimized", "highlights", "suggestions"]
    }
  };

  if (options.useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  if (options.useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const parts: any[] = [];
  if (options.isRefinement) {
    if (options.previousVersion) {
      parts.push({ text: `【重要上下文】\n这是上一版的提示词内容：\n"""\n${options.previousVersion}\n"""\n\n这是我修改后的当前内容：\n"""\n${input}\n"""\n\n请仔细对比两者的差异，识别我增加、删除或修改的内容。理解我修改的用意和想法，并执行精炼任务。` });
    } else {
      parts.push({ text: `请基于此进行精炼：\n${input}` });
    }
  } else {
    parts.push({ text: `原始输入：${input}` });
  }
  
  if (options.attachments && options.attachments.length > 0) {
    options.attachments.forEach(att => {
      if (att.textContent) {
        // Handle extracted text from Word/Excel/Markdown
        parts.push({ text: `\n[附件内容: ${att.mimeType}]\n${att.textContent}\n` });
      } else if (att.data) {
        // Handle images/PDF with native support
        parts.push({ inlineData: { mimeType: att.mimeType, data: att.data.split(',')[1] } });
      }
    });
  }

  const response = await ai.models.generateContent({ model: modelName, contents: { parts }, config });
  const result = JSON.parse(response.text || '{}');
  
  const groundingUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web?.uri).filter(Boolean) || [];

  return {
    original: input,
    optimized: result.optimized || '',
    highlights: result.highlights || [],
    suggestions: result.suggestions || [],
    groundingUrls
  };
};

export const refreshSuggestions = async (promptContent: string): Promise<string[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `请分析以下提示词内容，并提供 4 条极其专业、具备高度参考性的进一步优化建议，要求建议具体且可直接操作：\n\n${promptContent}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["suggestions"]
      }
    }
  });
  const result = JSON.parse(response.text || '{}');
  return result.suggestions || [];
};

export const editImageWithText = async (base64Image: string, prompt: string): Promise<string | undefined> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
        { text: `请根据以下要求修改图片: ${prompt}` }
      ]
    }
  });
  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return undefined;
};

export const runABTest = async (
  testInput: string,
  versions: { id: string; index: number; content: string }[],
  metrics: { id: string; name: string; type: 'score' | 'keyword' | 'custom'; description?: string; keywords?: string[] }[]
) => {
  const results: any[] = [];

  for (const version of versions) {
    // 1. Generate output using the prompt version as system instruction
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: testInput,
      config: {
        systemInstruction: version.content,
      }
    });
    const output = response.text || '';

    // 2. Evaluate the output
    const scores: Record<string, number> = {};
    const keywordMatches: Record<string, boolean> = {};
    
    // Check keyword metrics locally
    for (const metric of metrics) {
      if (metric.type === 'keyword' && metric.keywords) {
        const matched = metric.keywords.some(kw => output.includes(kw));
        keywordMatches[metric.id] = matched;
      }
    }

    // Use AI to evaluate score and custom metrics
    const aiMetrics = metrics.filter(m => m.type === 'score' || m.type === 'custom');
    let evaluationText = '';
    
    if (aiMetrics.length > 0) {
      const evalPrompt = `
        请作为客观的评委，对以下 AI 生成的内容进行评估。
        
        【测试输入】
        ${testInput}
        
        【AI 生成内容】
        ${output}
        
        【评估指标】
        ${aiMetrics.map(m => `- ${m.name} (${m.type}): ${m.description || ''}`).join('\n')}
        
        请为每个指标打分（0-100分），并提供一段简短的综合评价。
        
        返回 JSON 格式：
        {
          "scores": { "指标名称": 分数 },
          "evaluation": "综合评价"
        }
      `;
      
      const evalResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: evalPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scores: { type: Type.OBJECT },
              evaluation: { type: Type.STRING }
            },
            required: ["scores", "evaluation"]
          }
        }
      });
      
      try {
        const evalResult = JSON.parse(evalResponse.text || '{}');
        evaluationText = evalResult.evaluation || '';
        for (const metric of aiMetrics) {
          scores[metric.id] = evalResult.scores?.[metric.name] || 0;
        }
      } catch (e) {
        console.error("Evaluation parsing failed", e);
      }
    }

    results.push({
      versionId: version.id,
      versionIndex: version.index,
      promptContent: version.content,
      output,
      scores,
      keywordMatches,
      evaluation: evaluationText
    });
  }

  // Generate a summary comparing the versions
  const summaryPrompt = `
    请根据以下 A/B 测试结果，生成一段简短的对比总结报告，指出哪个版本的提示词表现更好，以及各自的优缺点。
    
    【测试结果】
    ${JSON.stringify(results, null, 2)}
  `;
  
  const summaryResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: summaryPrompt
  });

  return {
    results,
    summary: summaryResponse.text || ''
  };
};

export const startChat = (model: string = 'gemini-3-pro-preview') => {
  return ai.chats.create({
    model,
    config: {
      systemInstruction: "你是一个智能提示词助手，负责解答用户关于提示词优化的问题。"
    }
  });
};
