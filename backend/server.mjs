import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const dataDir = path.join(rootDir, 'data');
const port = Number(process.env.API_PORT || process.env.PORT || 8787);
const STATE_COLLECTIONS = ['assets', 'directions', 'taskModels', 'compilations', 'runs', 'feedbackEvents', 'assetPatches', 'assetGraph', 'capabilityPacks', 'marketItems'];
const LOCAL_STORAGE_KEYS = [
  'promptmaster_asset_library_v1',
  'promptmaster_directions_v1',
  'promptmaster_history_v2',
  'promptmaster_task_models_v1',
  'promptmaster_prompt_compilations_v1',
  'promptmaster_prompt_runs_v1',
  'promptmaster_feedback_events_v1',
  'promptmaster_asset_graph_v1',
  'promptmaster_asset_patches_v1',
  'promptmaster_capability_packs_v1',
  'promptmaster_market_items_v1'
];

const ASSET_SLOT_TYPES = {
  'task-frame': ['prompt', 'template'],
  'work-method': ['skill', 'workflow', 'agent'],
  knowledge: ['reference', 'memory', 'dataset', 'parser'],
  tooling: ['mcp', 'sdk', 'tool', 'connector'],
  guardrail: ['policy', 'evaluator', 'benchmark']
};

await fs.mkdir(dataDir, { recursive: true });

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    const route = `${req.method || 'GET'} ${url.pathname}`;

    if (route === 'GET /api/health') {
      const docs = await readDocsIndex();
      sendJson(res, {
        ok: true,
        service: 'promptmaster-api',
        version: '2.1-local',
        docsCount: docs.length,
        dataDirReady: true,
        timestamp: Date.now()
      });
      return;
    }

    if (route === 'GET /api/docs/index') {
      sendJson(res, await readDocsIndex());
      return;
    }

    if (route === 'GET /api/architecture') {
      sendJson(res, {
        name: '提示词大师 Pro 2.1',
        stack: {
          frontend: 'React 19 + Vite + TypeScript',
          backend: 'Node.js ESM local API',
          docs: 'Markdown document library under docs/',
          storage: 'localStorage in frontend, JSON files in backend data/'
        },
        boundaries: [
          'frontend owns interaction and local-first workspace state',
          'backend owns API orchestration, docs indexing and future model/tool execution',
          'docs library owns product plans, knowledge base and asset package specifications'
        ],
        endpoints: [
          'GET /api/health',
          'GET /api/docs/index',
          'POST /api/task/analyze',
          'POST /api/prompt/compile',
          'POST /api/feedback/diagnose',
          'POST /api/assets/build-draft',
          'POST /api/assets/import-url',
          'POST /api/assets/apply-patch',
          'POST /api/run-lab/compare',
          'POST /api/run-lab/run',
          'POST /api/capabilities/check',
          'POST /api/feedback/insights'
        ]
      });
      return;
    }

    if (route === 'POST /api/task/analyze') {
      const body = await readJsonBody(req);
      sendJson(res, analyzeTask(body.input || '', body.assets || [], body.directions || [], body.scenario || '通用场景'));
      return;
    }

    if (route === 'POST /api/prompt/compile') {
      const body = await readJsonBody(req);
      sendJson(res, compilePrompt(body.task, body.selectedAssets || [], body.directions || [], body.mode || 'strict'));
      return;
    }

    if (route === 'POST /api/feedback/diagnose') {
      const body = await readJsonBody(req);
      sendJson(res, diagnoseFeedback(body.events || [], body.compilation));
      return;
    }

    if (route === 'POST /api/assets/build-draft') {
      const body = await readJsonBody(req);
      sendJson(res, buildAssetDraft(body.assetType || 'prompt', body.task, body.input || ''));
      return;
    }

    if (route === 'POST /api/assets/import-url') {
      const body = await readJsonBody(req);
      sendJson(res, await importAssetFromUrl(body.url || ''));
      return;
    }

    if (route === 'POST /api/assets/apply-patch') {
      const body = await readJsonBody(req);
      sendJson(res, await applyAssetPatch(body.patch, body.assets || []));
      return;
    }

    if (route === 'POST /api/run-lab/compare') {
      const body = await readJsonBody(req);
      sendJson(res, compareRunLab(body.task, body.selectedAssets || [], body.directions || [], body.mode || 'strict'));
      return;
    }

    if (route === 'POST /api/run-lab/run') {
      const body = await readJsonBody(req);
      sendJson(res, await runPrompt(body.compilation, body.input || '', body.model || 'gemini-3-flash-preview'));
      return;
    }

    if (route === 'POST /api/capabilities/check' || route === 'GET /api/capabilities/check') {
      sendJson(res, buildCapabilityCheck());
      return;
    }

    if (route === 'POST /api/feedback/insights') {
      const body = await readJsonBody(req);
      sendJson(res, buildFeedbackInsights(body.events || [], body.patches || []));
      return;
    }

    const stateMatch = url.pathname.match(/^\/api\/state\/([a-zA-Z0-9_-]+)$/);
    if (stateMatch && req.method === 'GET') {
      sendJson(res, await readStateCollection(stateMatch[1]));
      return;
    }
    if (stateMatch && req.method === 'PUT') {
      const body = await readJsonBody(req);
      await writeStateCollection(stateMatch[1], body);
      sendJson(res, { ok: true, collection: stateMatch[1], updatedAt: Date.now() });
      return;
    }

    sendJson(res, { error: 'Not found', path: url.pathname }, 404);
  } catch (error) {
    sendJson(res, { error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`PromptMaster API listening on http://127.0.0.1:${port}`);
});

async function readDocsIndex() {
  const files = await walkMarkdown(docsDir);
  const items = await Promise.all(files.map(async file => {
    const text = await fs.readFile(file, 'utf8');
    const stat = await fs.stat(file);
    const relativePath = path.relative(rootDir, file);
    const title = text.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(file);
    const summary = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && !line.startsWith('```'))
      .slice(0, 2)
      .join(' ')
      .slice(0, 220);
    return {
      path: relativePath,
      title,
      category: categorizeDoc(relativePath),
      summary,
      updatedAt: stat.mtimeMs
    };
  }));
  return items.sort((a, b) => a.path.localeCompare(b.path));
}

async function walkMarkdown(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkMarkdown(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(fullPath);
  }
  return files;
}

function categorizeDoc(relativePath) {
  if (relativePath.includes('asset-package-specs')) return 'asset-spec';
  if (relativePath.includes('prompt-engineering-knowledge')) return 'knowledge';
  if (relativePath.includes('superpowers/plans')) return 'plan';
  if (relativePath.includes('product')) return 'product';
  return 'other';
}

function analyzeTask(input, assets, directions, scenario) {
  const normalized = String(input).toLowerCase();
  const riskLevel = ['合同', '法律', '医疗', '金融', '隐私', '密钥', '合规', '删除'].some(keyword => normalized.includes(keyword.toLowerCase())) ? 'high' : normalized.length > 240 ? 'medium' : 'low';
  const suggestedAssetTypes = inferSuggestedAssetTypes(normalized, riskLevel);
  const missingInfo = [];
  if (!normalized.includes('输出') && !normalized.includes('格式')) missingInfo.push('期望输出格式');
  if (!normalized.includes('用户') && !normalized.includes('受众')) missingInfo.push('目标受众或真实使用场景');
  if (suggestedAssetTypes.includes('evaluator')) missingInfo.push('验收标准或评分维度');

  return {
    id: createId('task'),
    rawInput: input,
    goal: String(input || '把模糊需求封装为可执行提示词').split(/[。！？\n]/)[0].slice(0, 80),
    audience: normalized.includes('开发') || normalized.includes('api') ? '开发者或技术执行者' : '需要借助 AI 完成任务的人',
    scenario,
    inputMaterials: ['用户原始需求', ...(normalized.includes('资料') || normalized.includes('文档') ? ['上传资料或参考文档'] : [])],
    expectedOutputs: ['结构化 Prompt', ...(normalized.includes('skill') ? ['Skill 草稿'] : []), ...(normalized.includes('流程') ? ['Workflow 草稿'] : [])],
    constraints: [
      '必须明确角色、任务、输入、约束、输出格式和验收标准',
      '不得声称已经真实调用未连接的 MCP、SDK 或外部工具',
      '输出应便于人工审核、修改和复用'
    ],
    risks: riskLevel === 'high' ? ['可能涉及高风险业务、合规或安全边界'] : ['需求过于模糊时可能导致输出不可执行'],
    missingInfo: missingInfo.slice(0, 4),
    suggestedAssetTypes,
    riskLevel,
    confidence: Math.max(0.42, Math.min(0.92, 0.58 + Math.min(String(input).length / 500, 0.28) + (assets.length ? 0.08 : 0) + (directions.length ? 0.06 : 0) - missingInfo.length * 0.05)),
    createdAt: Date.now()
  };
}

function inferSuggestedAssetTypes(input, riskLevel) {
  const types = new Set(['prompt', 'template']);
  if (['资料', '文档', '报告', 'pdf', 'excel', 'word'].some(keyword => input.includes(keyword))) {
    types.add('reference');
    types.add('parser');
  }
  if (['工具', 'mcp', 'sdk', 'api', '接口', 'github'].some(keyword => input.includes(keyword))) {
    types.add('tool');
    types.add('mcp');
    types.add('sdk');
    types.add('connector');
  }
  if (['流程', '多步', '迭代', '工作流', 'skill'].some(keyword => input.includes(keyword))) {
    types.add('workflow');
    types.add('skill');
  }
  if (['评估', '验收', '测试', '回归'].some(keyword => input.includes(keyword))) {
    types.add('evaluator');
    types.add('benchmark');
  }
  if (riskLevel === 'high') types.add('policy');
  return Array.from(types).slice(0, 8);
}

function compilePrompt(task, selectedAssets, directions, mode) {
  const compilation = {
    id: createId('compilation'),
    taskId: task.id,
    mode,
    promptIR: buildPromptIR(task, selectedAssets, directions, mode),
    compiledPrompt: '',
    assetIds: selectedAssets.map(asset => asset.id),
    warnings: [],
    createdAt: Date.now()
  };
  compilation.compiledPrompt = formatPromptIR(compilation.promptIR, mode);
  if (selectedAssets.length === 0) compilation.warnings.push('未注入资产，当前编译结果主要依赖任务理解。');
  if (task.missingInfo?.length) compilation.warnings.push(`存在待确认信息：${task.missingInfo.join('、')}`);
  return compilation;
}

function buildPromptIR(task, selectedAssets, directions, mode) {
  const bindings = selectedAssets.map((asset, index) => ({
    assetId: asset.id,
    assetTitle: asset.title,
    slot: resolveSlotId(asset.type),
    appliedToSections: resolveAppliedSections(asset.type),
    priority: index + 1
  }));
  return {
    task,
    sections: {
      role: mode === 'agent-ready' ? `你是面向 ${task.audience} 的 AI 任务执行 Agent。` : `你是面向 ${task.audience} 的提示词工程助手。`,
      context: [
        `任务目标: ${task.goal}`,
        `使用场景: ${task.scenario}`,
        ...directions.map(direction => `优化方向: ${direction.name} - ${direction.description}`),
        ...selectedAssets.slice(0, 6).map(asset => `${asset.type} ${asset.title}: ${asset.summary || asset.integration?.usageNotes || ''}`)
      ],
      inputs: task.inputMaterials || ['用户原始需求'],
      process: [
        '先结构化任务目标、输入、输出和约束。',
        '说明每个已注入资产的作用。',
        '生成可执行 Prompt，并标注不确定事项。',
        '按评估标准自检后输出。'
      ],
      toolRules: selectedAssets.some(asset => ['mcp', 'sdk', 'tool', 'connector'].includes(asset.type))
        ? ['工具资产仅作为上下文；未真实连接时不得声称已调用。']
        : ['本次未注入工具上下文。'],
      constraints: task.constraints || [],
      outputFormat: `Markdown，至少包含：${(task.expectedOutputs || ['结构化 Prompt']).join('、')}。`,
      evaluationCriteria: [
        '覆盖用户目标',
        '输出格式明确',
        '约束和失败处理完整',
        ...selectedAssets.filter(asset => ['evaluator', 'benchmark'].includes(asset.type)).map(asset => asset.summary || asset.title)
      ],
      fallback: [
        '缺少关键信息时先列最多 3 个澄清问题。',
        '资料不足时标注无法确认，不要编造。',
        '工具不可用时输出降级方案。'
      ]
    },
    assetBindings: bindings,
    risks: task.risks || [],
    assumptions: task.missingInfo?.length ? task.missingInfo.map(item => `待确认: ${item}`) : ['任务信息足够生成初版。']
  };
}

function formatPromptIR(promptIR, mode) {
  const sections = promptIR.sections;
  return [
    `# ${mode} Prompt`,
    '',
    '## Role',
    sections.role,
    '',
    '## Context',
    bullets(sections.context),
    '',
    '## Inputs',
    bullets(sections.inputs),
    '',
    '## Process',
    numbers(sections.process),
    '',
    '## Tool Rules',
    bullets(sections.toolRules),
    '',
    '## Constraints',
    bullets(sections.constraints),
    '',
    '## Output Format',
    sections.outputFormat,
    '',
    '## Evaluation Criteria',
    bullets(sections.evaluationCriteria),
    '',
    '## Fallback',
    bullets(sections.fallback),
    '',
    '## Asset Bindings',
    promptIR.assetBindings.length ? bullets(promptIR.assetBindings.map(binding => `${binding.assetTitle} -> ${binding.slot}`)) : '- 未注入资产'
  ].join('\n');
}

function diagnoseFeedback(events, compilation) {
  const labels = events.map(event => event.label || event.type);
  const text = labels.join(' ');
  const patches = [];
  const targetAssetId = compilation?.assetIds?.[0];
  if (text.includes('表格') || text.includes('格式') || events.some(event => event.type === 'manual_edit')) {
    patches.push(createPatch(targetAssetId, 'template', '用户修改了输出结构，建议增强 Template 或 Prompt 输出格式。', labels, 'schema.outputFormat', '补充字段、排序、必填项和空值处理。'));
  }
  if (text.includes('来源') || text.includes('不要编造') || text.includes('资料')) {
    patches.push(createPatch(targetAssetId, 'policy', '用户关注事实来源，建议加入资料边界 Policy。', labels, 'schema.rules', '只基于资料输出，不确定时标注，不编造来源。'));
  }
  if (text.includes('重复') || text.includes('同类资料') || events.some(event => event.type === 'add_attachment')) {
    patches.push(createPatch(targetAssetId, 'skill', '任务具备重复流程特征，建议升级为 Skill。', labels, 'schema.workflow', '补充触发条件、资料解析、执行步骤和质量门。'));
  }
  if (!patches.length) patches.push(createPatch(targetAssetId, 'memory', '反馈信号较弱，先记录为观察。', labels.length ? labels : ['暂无事件'], 'schema.qualityNotes', '记录本次行为，等待更多证据。'));
  return patches;
}

function buildAssetDraft(assetType, task, input) {
  const goal = task?.goal || String(input || '可复用提示词工程资产').slice(0, 80);
  const title = `${typeLabel(assetType)}：${goal}`.slice(0, 80);
  const baseIntegration = {
    entryName: `${assetType}.${slugify(goal)}`,
    capabilities: draftCapabilities(assetType),
    inputs: draftInputs(assetType),
    outputs: draftOutputs(assetType),
    constraints: draftConstraints(assetType),
    usageNotes: '这是 2.0 Builder 生成的资产草稿，需要用户确认后再写入项目库。'
  };
  return {
    id: createId('asset_draft'),
    assetType,
    title,
    summary: `面向“${goal}”的 ${typeLabel(assetType)} 资产草稿，用于把任务方法、上下文、工具边界或输出契约沉淀为可复用资产。`,
    content: draftContent(assetType, task, input),
    integration: baseIntegration,
    schemaPreview: draftSchemaPreview(assetType),
    nextSteps: draftNextSteps(assetType),
    warnings: assetType === 'mcp' || assetType === 'sdk'
      ? ['当前只生成上下文规格，不代表已真实连接或授权执行。', '真实执行前需要 Connector、环境变量、权限边界和人工确认。']
      : ['保存前建议补充正例、反例和验收标准。'],
    createdAt: Date.now()
  };
}

function compareRunLab(task, selectedAssets, directions, mode) {
  const baseline = compilePrompt(task, [], directions, mode);
  const variant = compilePrompt(task, selectedAssets, directions, mode);
  const baselineMetrics = compilationMetrics(baseline);
  const variantMetrics = compilationMetrics(variant);
  const differences = [
    `资产注入: ${baselineMetrics.assetCount} -> ${variantMetrics.assetCount}`,
    `Prompt 长度: ${baselineMetrics.promptLength} -> ${variantMetrics.promptLength}`,
    `警告数量: ${baselineMetrics.warningCount} -> ${variantMetrics.warningCount}`,
    selectedAssets.length
      ? `新增资产绑定: ${selectedAssets.slice(0, 6).map(asset => asset.title).join('、')}`
      : '未选择资产，建议先从项目库注入 Prompt/Template/Skill/Policy 等资产。'
  ];
  return {
    id: createId('runlab'),
    taskId: task.id,
    baselinePrompt: baseline.compiledPrompt,
    variantPrompt: variant.compiledPrompt,
    baselineMetrics,
    variantMetrics,
    differences,
    recommendation: selectedAssets.length
      ? '建议优先人工检查资产绑定说明、工具边界和输出格式，再进入模型 A/B 运行。'
      : '当前只形成基线 Prompt；为提升复用性，建议补充任务骨架、工作方法和评估资产。',
    createdAt: Date.now()
  };
}

function buildFeedbackInsights(events, patches) {
  const patchTypes = patches.reduce((acc, patch) => {
    acc[patch.suggestedAssetType] = (acc[patch.suggestedAssetType] || 0) + 1;
    return acc;
  }, {});
  const eventText = events.map(event => `${event.type} ${event.label}`).join(' ');
  const topSignals = [
    eventText.includes('表格') || eventText.includes('格式') ? '输出格式反复被用户纠正' : '',
    eventText.includes('来源') || eventText.includes('编造') || eventText.includes('资料') ? '事实边界和资料来源需要加强' : '',
    events.some(event => event.type === 'regenerate') ? '用户触发重新生成，可能缺少验收标准' : '',
    events.some(event => event.type === 'add_attachment') ? '用户补充资料，任务可能需要 Parser/Skill 化' : ''
  ].filter(Boolean);
  return {
    totalEvents: events.length,
    patchCount: patches.length,
    patchTypes,
    topSignals: topSignals.length ? topSignals : ['反馈信号较弱，建议继续观察。'],
    nextActions: [
      patches.some(patch => patch.suggestedAssetType === 'template') ? '审查 Template 输出字段和空值处理。' : '',
      patches.some(patch => patch.suggestedAssetType === 'policy') ? '补充 Policy：来源、不确定性、禁止编造和降级规则。' : '',
      patches.some(patch => patch.suggestedAssetType === 'skill') ? '评估是否升级为 Skill：触发条件、资料解析、步骤和质量门。' : '',
      patches.some(patch => patch.suggestedAssetType === 'evaluator') ? '新增 Evaluator：完整性、可执行性、事实边界和格式评分。' : ''
    ].filter(Boolean),
    riskNotes: [
      'AssetPatch 只应作为待确认建议，不能自动覆盖稳定资产。',
      '单次行为可能过拟合，建议结合多次运行和 Benchmark 证据。'
    ],
    createdAt: Date.now()
  };
}

function buildCapabilityCheck() {
  const modelConfigured = Boolean(process.env.GEMINI_API_KEY);
  const modelStatus = modelConfigured ? 'connected' : 'context_only';
  const tooling = {
    mcp: buildToolingStatus('mcp'),
    sdk: buildToolingStatus('sdk'),
    tool: buildToolingStatus('tool'),
    connector: buildToolingStatus('connector')
  };
  const missingConfiguration = [
    modelConfigured ? '' : 'GEMINI_API_KEY',
    ...Object.values(tooling).flatMap(item => item.configured ? [] : [`${item.type.toUpperCase()} runtime`])
  ].filter(Boolean);

  return {
    backend: {
      ok: true,
      apiBaseUrl: `http://127.0.0.1:${port}`,
      stateCollections: STATE_COLLECTIONS,
      state: {
        ok: true,
        mode: 'backend_json',
        dataDirReady: true,
        collections: STATE_COLLECTIONS,
        localStorageKeys: LOCAL_STORAGE_KEYS,
        message: '后端 JSON state 已启用，本地 localStorage keys 仅作为兼容缓存和离线兜底。'
      }
    },
    model: {
      provider: 'gemini',
      configured: modelConfigured,
      status: modelStatus,
      configState: modelConfigured ? 'configured' : 'missing_provider_config',
      requiredEnvVars: ['GEMINI_API_KEY'],
      optionalEnvVars: ['API_PORT', 'VITE_API_BASE_URL'],
      message: modelConfigured
        ? 'GEMINI_API_KEY 已配置，Run Lab 可以尝试真实模型运行。'
        : '未配置 GEMINI_API_KEY，Run Lab 将明确降级为仅编译预览。'
    },
    assets: {
      mcp: tooling.mcp.status,
      sdk: tooling.sdk.status,
      tool: tooling.tool.status,
      connector: tooling.connector.status
    },
    market: {
      mode: 'local',
      configured: true,
      status: 'schema_ready',
      remoteAccountConfigured: false,
      message: '当前为本地市场模式：资产和能力包可作为上下文或结构化 schema 使用，不代表远程账号或执行权限。'
    },
    imports: {
      supportedSources: ['file', 'json', 'external-url', 'market', 'local'],
      executableSources: [],
      defaultStatusForExecutableAssets: 'context_only',
      message: 'market 与 external-url 导入的 MCP/SDK/Tool/Connector 默认不可执行，需要连接配置和显式确认。'
    },
    tooling,
    execution: {
      modelExecutionAllowed: modelConfigured,
      toolExecutionAllowed: false,
      requiresExplicitConfirmation: true,
      missingConfiguration,
      message: modelConfigured
        ? '模型可尝试运行；MCP/SDK/Tool/Connector 仍仅作为上下文，未开放真实执行。'
        : '缺少模型密钥，模型运行降级为仅编译预览；工具类能力仍不可执行。'
    },
    timestamp: Date.now()
  };
}

async function importAssetFromUrl(rawUrl) {
  const url = String(rawUrl || '').trim();
  if (!/^https?:\/\//i.test(url)) {
    return { ok: false, message: '请输入 http 或 https 开头的公开 URL。' };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'PromptMasterLocalImporter/1.0'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      return { ok: false, message: `URL 读取失败：HTTP ${response.status}。可改用手动粘贴或文件导入。` };
    }
    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();
    const text = normalizeImportedUrlText(rawText, contentType).slice(0, 20000);
    const title = extractHtmlTitle(rawText) || new URL(url).hostname;
    const type = inferUrlAssetType(url, text);
    const executableLike = ['mcp', 'sdk', 'tool', 'connector'].includes(type);
    return {
      ok: true,
      message: '已读取公开 URL 并生成资产草稿，请确认后保存。',
      asset: {
        type,
        title: title.slice(0, 80),
        summary: text.split('\n').map(line => line.trim()).find(Boolean)?.slice(0, 180) || `来自 ${url} 的导入草稿`,
        content: `来源 URL: ${url}\n\n${text}`,
        tags: ['external-url', type],
        useCases: ['从外部资料沉淀为可复用资产', '作为提示词优化上下文注入'],
        source: 'external-url',
        status: executableLike ? 'context_only' : 'schema_ready',
        integration: {
          entryName: `${type}.${slugify(title || url)}`,
          capabilities: executableLike ? ['结构化工具/接口文档上下文', '执行边界说明'] : ['资料引用', '上下文注入'],
          inputs: ['用户提示词', '外部链接内容'],
          outputs: ['资产草稿', '可注入上下文'],
          constraints: executableLike ? ['未配置运行时连接前不可执行'] : ['需人工确认内容准确性'],
          usageNotes: executableLike
            ? '该资产来自外部链接，默认仅作为上下文或 schema，不代表已经连接、授权或可执行。'
            : '该资产来自外部链接，保存前请确认来源可信和内容准确。'
        },
        examples: [],
        version: 1
      }
    };
  } catch (error) {
    return { ok: false, message: `URL 读取失败：${error instanceof Error ? error.message : String(error)}。可改用手动粘贴或文件导入。` };
  }
}

function normalizeImportedUrlText(rawText, contentType) {
  if (contentType.includes('html')) {
    return rawText
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return rawText.replace(/\s+\n/g, '\n').trim();
}

function extractHtmlTitle(rawText) {
  return rawText.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim();
}

function inferUrlAssetType(url, text) {
  const normalized = `${url}\n${text}`.toLowerCase();
  if (normalized.includes('mcp') || normalized.includes('model context protocol')) return 'mcp';
  if (normalized.includes('sdk') || normalized.includes('npm install') || normalized.includes('pip install')) return 'sdk';
  if (normalized.includes('api') || normalized.includes('endpoint') || normalized.includes('tool')) return 'tool';
  if (normalized.includes('policy') || normalized.includes('合规') || normalized.includes('规则')) return 'policy';
  if (normalized.includes('workflow') || normalized.includes('流程')) return 'workflow';
  if (normalized.includes('skill') || normalized.includes('技能')) return 'skill';
  if (normalized.includes('template') || normalized.includes('模板')) return 'template';
  return 'reference';
}

function buildToolingStatus(type) {
  return {
    type,
    status: 'context_only',
    configured: false,
    executable: false,
    requiresConfirmation: true,
    message: `${type.toUpperCase()} 当前仅作为提示词工程上下文使用；未检测到运行时连接，因此不可执行。`
  };
}

async function runPrompt(compilation, input, model) {
  const prompt = compilation?.compiledPrompt || '';
  const createdAt = Date.now();
  const base = {
    id: createId('run'),
    compilationId: compilation?.id || 'preview',
    provider: 'gemini',
    model,
    input,
    createdAt
  };

  if (!process.env.GEMINI_API_KEY) {
    return {
      ...base,
      status: 'missing_provider_config',
      output: prompt,
      metrics: promptMetrics(prompt, 0),
      message: '未配置 GEMINI_API_KEY，本次只保存编译预览，不执行模型调用。'
    };
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${prompt}\n\n---\n测试输入：\n${input || '请基于上方 Prompt 输出一次示例结果。'}` }]
        }
      ]
    });
    const output = response.text || '';
    return {
      ...base,
      status: 'completed',
      output,
      metrics: promptMetrics(prompt, output.length),
      message: '模型运行完成，结果已写入本地运行记录。'
    };
  } catch (error) {
    return {
      ...base,
      status: 'failed',
      output: prompt,
      metrics: promptMetrics(prompt, 0),
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

async function applyAssetPatch(patch, assets) {
  if (!patch?.id) {
    return {
      ok: false,
      patchId: '',
      appliedAt: Date.now(),
      message: '缺少 patch id，无法应用补丁。'
    };
  }

  const target = patch.targetAssetId
    ? assets.find(asset => asset.id === patch.targetAssetId)
    : assets[0];

  if (!target) {
    return {
      ok: false,
      patchId: patch.id,
      appliedAt: Date.now(),
      message: '没有找到可应用补丁的资产。'
    };
  }

  const appliedAt = Date.now();
  const patchSummary = [
    target.content || '',
    '',
    '---',
    `AssetPatch ${patch.id}`,
    `Reason: ${patch.reason}`,
    ...(patch.changes || []).map(change => `${change.fieldPath}: ${change.after}`)
  ].join('\n').trim();

  const asset = {
    ...target,
    content: patchSummary,
    version: Number(target.version || 1) + 1,
    qualityScore: Math.min(100, Number(target.qualityScore || 72) + 3),
    status: target.status || inferAssetStatus(target),
    updatedAt: appliedAt
  };

  const nextAssets = [asset, ...assets.filter(item => item.id !== asset.id)];
  await writeStateCollection('assets', nextAssets);

  return {
    ok: true,
    asset,
    patchId: patch.id,
    appliedAt,
    message: `补丁已应用到资产「${asset.title}」，生成版本 v${asset.version}。`
  };
}

function promptMetrics(prompt, outputLength) {
  return {
    promptLength: String(prompt || '').length,
    outputLength,
    sectionCount: (String(prompt || '').match(/^#/gm) || []).length
  };
}

function compilationMetrics(compilation) {
  return {
    promptLength: compilation.compiledPrompt.length,
    assetCount: compilation.assetIds.length,
    sectionCount: Object.keys(compilation.promptIR.sections || {}).length,
    warningCount: compilation.warnings.length
  };
}

function createPatch(targetAssetId, suggestedAssetType, reason, evidenceEvents, fieldPath, after) {
  return {
    id: createId('patch'),
    targetAssetId,
    suggestedAssetType,
    reason,
    evidenceEvents,
    changes: [{ fieldPath, before: '未显式记录', after }],
    expectedImpact: '降低同类失败在后续运行中重复出现的概率。',
    risk: '需要用户确认后再写入资产，避免过度拟合单次行为。',
    createdAt: Date.now()
  };
}

function typeLabel(type) {
  return {
    prompt: 'Prompt',
    skill: 'Skill',
    mcp: 'MCP',
    sdk: 'SDK',
    workflow: 'Workflow',
    reference: 'Reference',
    agent: 'Agent',
    tool: 'Tool',
    template: 'Template',
    evaluator: 'Evaluator',
    dataset: 'Dataset',
    policy: 'Policy',
    memory: 'Memory',
    connector: 'Connector',
    parser: 'Parser',
    benchmark: 'Benchmark'
  }[type] || type;
}

function draftCapabilities(type) {
  const map = {
    prompt: ['结构化任务封装', '输出格式约束', '自检与澄清'],
    skill: ['触发判断', '资源渐进加载', '分步骤执行', '质量门验证'],
    mcp: ['工具 schema 描述', '资源/提示词上下文', '错误处理和权限边界'],
    sdk: ['初始化与认证说明', '核心方法映射', '代码示例和测试策略'],
    workflow: ['多阶段编排', '状态流转', '失败回退', '最终交付约束'],
    reference: ['领域事实整理', '术语和引用规则', '上下文边界'],
    agent: ['身份目标', '工具策略', '记忆和停止条件'],
    tool: ['参数契约', '返回契约', '副作用和回退'],
    template: ['结构骨架', '变量槽位', '输出格式复用'],
    evaluator: ['评分维度', '通过阈值', '失败归因'],
    dataset: ['正反例样例', '标签体系', '质量备注'],
    policy: ['安全边界', '触发条件', '执行和升级策略'],
    memory: ['长期事实', '用户偏好', '失效规则'],
    connector: ['外部服务连接', '认证权限', '数据边界'],
    parser: ['字段抽取', '清洗规则', '输出校验'],
    benchmark: ['测试任务集', '期望输出', '版本回归']
  };
  return map[type] || ['可复用上下文'];
}

function draftInputs(type) {
  const common = ['用户目标', '输入材料', '约束和验收标准'];
  if (type === 'mcp') return [...common, '工具列表', 'inputSchema', '权限范围'];
  if (type === 'sdk') return [...common, '包名', '认证方式', '核心方法'];
  if (type === 'skill') return [...common, '触发条件', 'references/scripts/assets'];
  if (type === 'workflow') return [...common, '阶段、角色、状态和失败条件'];
  if (['tool', 'connector'].includes(type)) return [...common, '接口 schema', '认证和权限边界'];
  if (['evaluator', 'dataset', 'benchmark'].includes(type)) return [...common, '样例', '指标', '失败案例'];
  if (type === 'parser') return [...common, '文件类型', '字段清单', '清洗规则'];
  return common;
}

function draftOutputs(type) {
  const map = {
    prompt: ['最终 Prompt', '变量说明', '评估标准'],
    skill: ['SKILL.md 草稿', '资源目录建议', '验证清单'],
    mcp: ['MCP Server 规格', 'Tool/Resource/Prompt 列表', '安全说明'],
    sdk: ['SDK 接入说明', '示例代码结构', '测试和错误处理'],
    workflow: ['阶段流程', '质量门', '运行记录结构'],
    reference: ['资料摘要', '关键事实', '引用规则'],
    agent: ['Agent 配置', '工具策略', '停止条件'],
    tool: ['工具说明', '参数/返回 schema', '失败回退'],
    template: ['模板结构', '变量槽位', '填充规则'],
    evaluator: ['评分规则', '通过阈值', '评估报告格式'],
    dataset: ['样例结构', '正反例', '标签体系'],
    policy: ['规则集', '触发条件', '执行策略'],
    memory: ['长期事实', '偏好', '失效规则'],
    connector: ['连接说明', '权限边界', '运维备注'],
    parser: ['抽取字段', '清洗规则', '校验方式'],
    benchmark: ['任务输入集', '期望输出', '回归指标']
  };
  return map[type] || ['资产说明'];
}

function draftConstraints(type) {
  const base = ['必须说明适用范围和不适用场景', '必须包含失败处理和人工确认点'];
  if (type === 'mcp' || type === 'sdk') base.push('未真实连接时不得声称已经调用工具或接口');
  return base;
}

function draftSchemaPreview(type) {
  const map = {
    prompt: ['role', 'context', 'task', 'variables', 'constraints', 'outputFormat', 'evaluationCriteria'],
    skill: ['trigger', 'packageStructure', 'resources', 'workflow', 'boundaries', 'validation', 'handoff'],
    mcp: ['server', 'tools', 'resources', 'prompts', 'errorHandling', 'security', 'evaluations'],
    sdk: ['package', 'initialization', 'auth', 'coreMethods', 'examples', 'compatibility', 'testing'],
    workflow: ['goal', 'actors', 'triggers', 'inputs', 'stages', 'state', 'failureHandling', 'finalOutputs'],
    reference: ['source', 'version', 'scope', 'keyFacts', 'terminology', 'citationRules', 'limitations'],
    agent: ['identity', 'goals', 'instructions', 'tools', 'memoryStrategy', 'planningStrategy', 'stopConditions'],
    tool: ['name', 'purpose', 'parameters', 'returns', 'preconditions', 'sideEffects', 'fallback'],
    template: ['structure', 'slots', 'fillRules', 'variants', 'outputFormat', 'constraints'],
    evaluator: ['target', 'dimensions', 'scoringRubric', 'passThreshold', 'failureCases', 'reviewMode'],
    dataset: ['purpose', 'itemSchema', 'positiveExamples', 'negativeExamples', 'labels', 'qualityNotes'],
    policy: ['domain', 'rules', 'triggers', 'enforcement', 'escalation', 'refusalStyle'],
    memory: ['facts', 'preferences', 'projectConventions', 'scope', 'confidence', 'invalidationRules'],
    connector: ['service', 'endpoints', 'auth', 'environment', 'permissions', 'dataBoundaries'],
    parser: ['inputTypes', 'extractionFields', 'cleaningRules', 'outputSchema', 'validationRules'],
    benchmark: ['target', 'tasks', 'inputs', 'expectedOutputs', 'metrics', 'regressionNotes']
  };
  return map[type] || ['title', 'summary', 'content', 'integration'];
}

function draftNextSteps(type) {
  const base = ['确认标题、摘要和适用场景。', '补充至少 1 个正例和 1 个反例。', '绑定 Evaluator 或 Benchmark 方便回归。'];
  if (type === 'skill') return ['补齐 SKILL.md 触发规则。', '整理 references/scripts/assets 目录。', ...base];
  if (type === 'mcp') return ['补齐 server transport/auth/runtime。', '为每个 tool 写 input/output schema。', ...base];
  if (type === 'sdk') return ['确认包名、版本和安装命令。', '补齐认证、核心方法和错误处理。', ...base];
  if (type === 'workflow') return ['拆分阶段和质量门。', '定义状态、失败回退和最终交付物。', ...base];
  return base;
}

function draftContent(type, task, input) {
  const goal = task?.goal || input || '待封装任务';
  if (type === 'skill') {
    return `# Skill 草稿\n\n## Trigger\n当用户需要“${goal}”并且任务会重复出现、涉及资料/工具/质量门时使用。\n\n## Workflow\n1. 判断触发条件和不适用场景。\n2. 读取必要 references/scripts/assets。\n3. 分阶段执行并在关键节点自检。\n4. 输出结果、风险和后续建议。\n\n## Validation\n- 输出是否覆盖目标。\n- 是否遵守边界。\n- 是否留下可复用资产。`;
  }
  if (type === 'mcp') {
    return `# MCP 规格草稿\n\nServer goal: ${goal}\n\nTools:\n- tool_name: 描述用途、输入 schema、输出 schema、错误处理。\n\nSecurity:\n- 默认只读。\n- 写操作需要人工确认。\n- 不保存密钥。`;
  }
  if (type === 'sdk') {
    return `# SDK 接入草稿\n\nGoal: ${goal}\n\nInstall:\n- npm / pip / uv 命令待补充。\n\nInitialization:\n- 从环境变量读取密钥。\n- 声明超时、重试和错误处理。\n\nExamples:\n- 最小可运行示例。\n- 常见失败用例。`;
  }
  if (type === 'workflow') {
    return `# Workflow 草稿\n\nGoal: ${goal}\n\nStages:\n1. Intake: 明确输入和缺口。\n2. Build: 插入资产并编译 PromptIR。\n3. Run: 执行或预览输出。\n4. Review: 评分、诊断和生成 AssetPatch。\n5. Save: 沉淀为可复用资产。`;
  }
  if (type === 'evaluator') {
    return `# Evaluator 草稿\n\nTarget: ${goal}\n\nDimensions:\n- 准确性\n- 完整性\n- 可执行性\n- 安全性\n\nPass threshold:\n- 总分 >= 85\n- 事实边界和安全性不得低于 90\n\nOutput:\n- score\n- issues\n- evidence\n- recommendations`;
  }
  if (type === 'policy') {
    return `# Policy 草稿\n\nDomain: ${goal}\n\nRules:\n- 只基于已提供资料和可信引用输出。\n- 不确定时明确标注并请求澄清。\n- 涉及高风险决策时建议人工复核。\n\nEnforcement:\n- 降级回答\n- 拒绝越权请求\n- 记录需要补充的资料`;
  }
  if (type === 'dataset' || type === 'benchmark') {
    return `# ${typeLabel(type)} 草稿\n\nPurpose: 验证“${goal}”相关资产的稳定性。\n\nItem schema:\n- input\n- expectedOutput\n- label\n- notes\n\nExamples:\n- 正例：待补充\n- 反例：待补充\n\nMetrics:\n- 完整性\n- 格式符合度\n- 事实边界`;
  }
  return `# Prompt 草稿\n\nRole: 你是提示词工程助手。\nTask: ${goal}\nConstraints:\n- 明确输入、输出、约束和验收标准。\n- 缺少信息时先提出澄清问题。\nOutput:\n- 可执行 Prompt\n- 资产融合说明\n- 评估清单`;
}

function slugify(value) {
  return String(value || 'asset')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'asset';
}

function resolveSlotId(type) {
  return Object.entries(ASSET_SLOT_TYPES).find(([, types]) => types.includes(type))?.[0] || 'guardrail';
}

function resolveAppliedSections(type) {
  if (['prompt', 'template'].includes(type)) return ['role', 'task', 'outputFormat'];
  if (['skill', 'workflow', 'agent'].includes(type)) return ['process', 'fallback'];
  if (['reference', 'memory', 'dataset', 'parser'].includes(type)) return ['context', 'inputs'];
  if (['mcp', 'sdk', 'tool', 'connector'].includes(type)) return ['toolRules', 'constraints'];
  return ['constraints', 'evaluationCriteria'];
}

async function readStateCollection(collection) {
  const file = getStateFile(collection);
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return STATE_COLLECTIONS.includes(collection) ? [] : null;
    throw error;
  }
}

async function writeStateCollection(collection, value) {
  const file = getStateFile(collection);
  await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf8');
}

function getStateFile(collection) {
  if (!/^[a-zA-Z0-9_-]+$/.test(collection)) throw new Error('Invalid collection name');
  return path.join(dataDir, `${collection}.json`);
}

function inferAssetStatus(asset) {
  if (!asset?.schema) return 'context_only';
  if (['mcp', 'sdk', 'tool', 'connector'].includes(asset.type)) return 'schema_ready';
  return 'schema_ready';
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, value, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value, null, 2));
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function bullets(items) {
  return items?.length ? items.map(item => `- ${item}`).join('\n') : '- 无';
}

function numbers(items) {
  return items?.length ? items.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. 无';
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
