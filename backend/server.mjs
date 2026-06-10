import http from 'node:http';
import https from 'node:https';
import { execFile, spawn } from 'node:child_process';
import { existsSync, readFileSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const dataDir = path.join(rootDir, 'data');
const execFileAsync = promisify(execFile);
loadEnvFiles();
const port = Number(process.env.API_PORT || process.env.PORT || 8787);
const MODEL_NAME = process.env.LLM_MODEL || process.env.MODEL_NAME || 'gpt-5.5';
const MODEL_PROVIDER = process.env.LLM_PROVIDER || process.env.MODEL_PROVIDER || 'openai-compatible';
const MODEL_BASE_URL = normalizeBaseUrl(process.env.LLM_BASE_URL || process.env.MODEL_BASE_URL || '');
const MODEL_API_KEY = process.env.LLM_API_KEY || process.env.MODEL_API_KEY || '';
const MODEL_CANDIDATE_MODELS = normalizeModelList(process.env.LLM_CANDIDATE_MODELS || process.env.MODEL_CANDIDATE_MODELS || MODEL_NAME);
const MODEL_TIMEOUT_MS = Number(process.env.MODEL_TIMEOUT_MS || 60000);
const MODEL_TEMPERATURE = Number(process.env.MODEL_TEMPERATURE || 0.35);
const MODEL_TLS_REJECT_UNAUTHORIZED = process.env.MODEL_TLS_REJECT_UNAUTHORIZED !== 'false';
const ENABLE_TOOL_EXECUTION = process.env.ENABLE_TOOL_EXECUTION === 'true';
const TOOL_EXECUTION_ALLOWLIST = normalizeList(process.env.TOOL_EXECUTION_ALLOWLIST || 'tool.ripgrep,tool.http_get,tool.json_extract,sdk.openai.chat');
const TOOL_EXECUTION_TIMEOUT_MS = Number(process.env.TOOL_EXECUTION_TIMEOUT_MS || 15000);
const STATE_COLLECTIONS = ['assets', 'directions', 'taskModels', 'compilations', 'runs', 'feedbackEvents', 'assetPatches', 'assetGraph', 'capabilityPacks', 'marketItems', 'remoteMarketItems', 'marketAccounts', 'marketOrders', 'evaluatorResults', 'benchmarkRuns', 'teamSpaces', 'approvalRequests', 'onlineExperiments'];
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
  'promptmaster_market_items_v1',
  'promptmaster_remote_market_items_v1',
  'promptmaster_market_accounts_v1',
  'promptmaster_market_orders_v1',
  'promptmaster_evaluator_results_v1',
  'promptmaster_benchmark_runs_v1',
  'promptmaster_team_spaces_v1',
  'promptmaster_approval_requests_v1',
  'promptmaster_online_experiments_v1'
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
          'POST /api/assets/builder-chat',
          'POST /api/assets/builder-autofill',
          'POST /api/assets/import-url',
          'POST /api/assets/apply-patch',
          'POST /api/run-lab/compare',
          'POST /api/run-lab/run',
          'POST /api/run-lab/multi-run',
          'POST /api/evaluator/score',
          'POST /api/model/chat',
          'GET /api/tools/adapters',
          'POST /api/tools/execute',
          'POST /api/market/remote/publish',
          'POST /api/market/remote/install',
          'POST /api/market/orders/create',
          'POST /api/teams/bootstrap',
          'POST /api/teams/approval',
          'POST /api/experiments/online/create',
          'POST /api/experiments/online/track',
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
      sendJson(res, await buildAssetDraft(body.assetType || 'prompt', body.task, body.input || ''));
      return;
    }

    if (route === 'POST /api/assets/builder-chat') {
      const body = await readJsonBody(req);
      sendJson(res, await chatWithAssetBuilder(body.messages || [], body.assetType || 'skill', body.assets || [], body));
      return;
    }

    if (route === 'POST /api/assets/builder-autofill') {
      const body = await readJsonBody(req);
      sendJson(res, await autofillAssetDraft(body.assetType || 'skill', body.messages || [], body.input || '', body.sourceText || '', body.currentDraft));
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
      sendJson(res, await runPrompt(body.compilation, body.input || '', body.model || MODEL_NAME));
      return;
    }

    if (route === 'POST /api/run-lab/multi-run') {
      const body = await readJsonBody(req);
      sendJson(res, await runPromptAcrossModels(body.compilation, body.input || '', body.models || MODEL_CANDIDATE_MODELS));
      return;
    }

    if (route === 'POST /api/evaluator/score') {
      const body = await readJsonBody(req);
      sendJson(res, await scoreWithEvaluator(body.run, body.evaluators || [], body.expectedOutput || ''));
      return;
    }

    if (route === 'POST /api/model/chat') {
      const body = await readJsonBody(req);
      sendJson(res, await modelChatEndpoint(body));
      return;
    }

    if (route === 'GET /api/tools/adapters') {
      sendJson(res, listToolAdapters());
      return;
    }

    if (route === 'POST /api/tools/execute') {
      const body = await readJsonBody(req);
      sendJson(res, await executeToolAsset(body.asset, body.input || {}, Boolean(body.confirm)));
      return;
    }

    if (route === 'POST /api/market/remote/publish') {
      const body = await readJsonBody(req);
      sendJson(res, await publishRemoteMarketItem(body.item, body.account));
      return;
    }

    if (route === 'POST /api/market/remote/install') {
      const body = await readJsonBody(req);
      sendJson(res, await installRemoteMarketItem(body.itemId));
      return;
    }

    if (route === 'POST /api/market/orders/create') {
      const body = await readJsonBody(req);
      sendJson(res, await createMarketOrder(body.item, body.buyer || 'local-user'));
      return;
    }

    if (route === 'POST /api/teams/bootstrap') {
      const body = await readJsonBody(req);
      sendJson(res, await bootstrapTeamSpace(body));
      return;
    }

    if (route === 'POST /api/teams/approval') {
      const body = await readJsonBody(req);
      sendJson(res, await createApprovalRequest(body));
      return;
    }

    if (route === 'POST /api/experiments/online/create') {
      const body = await readJsonBody(req);
      sendJson(res, await createOnlineExperiment(body));
      return;
    }

    if (route === 'POST /api/experiments/online/track') {
      const body = await readJsonBody(req);
      sendJson(res, await trackOnlineExperimentEvent(body));
      return;
    }

    if (route === 'POST /api/capabilities/check' || route === 'GET /api/capabilities/check') {
      sendJson(res, await buildCapabilityCheck());
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

function loadEnvFiles() {
  for (const filename of ['.env.local', '.env']) {
    const filePath = path.join(rootDir, filename);
    if (!existsSync(filePath)) continue;
    const text = readFileSync(filePath, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const index = line.indexOf('=');
      const key = line.slice(0, index).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;
      process.env[key] = unquoteEnvValue(line.slice(index + 1).trim());
    }
  }
}

function unquoteEnvValue(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function normalizeModelList(value) {
  const models = normalizeList(value);
  return models.length ? Array.from(new Set(models)) : ['gpt-5.5'];
}

function normalizeList(value) {
  const models = String(value || '')
    .split(',')
    .map(model => model.trim())
    .filter(Boolean);
  return Array.from(new Set(models));
}

function isModelConfigured() {
  return Boolean(MODEL_BASE_URL && MODEL_API_KEY);
}

function chatCompletionsUrl() {
  if (/\/chat\/completions$/i.test(MODEL_BASE_URL)) return MODEL_BASE_URL;
  return `${MODEL_BASE_URL}/chat/completions`;
}

async function callModelText({ messages, model = MODEL_NAME, temperature = MODEL_TEMPERATURE, json = false, timeoutMs = MODEL_TIMEOUT_MS }) {
  if (!isModelConfigured()) {
    throw new Error('missing_provider_config: LLM_BASE_URL or LLM_API_KEY is missing');
  }

  const body = {
    model,
    messages: normalizeChatMessages(messages),
    temperature,
    ...(json ? { response_format: { type: 'json_object' } } : {})
  };

  const response = await requestModelJson(chatCompletionsUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MODEL_API_KEY}`
    },
    body: JSON.stringify(body),
    timeoutMs
  });
  const payloadText = response.bodyText;
  let payload;
  try {
    payload = payloadText ? JSON.parse(payloadText) : {};
  } catch {
    payload = { raw: payloadText };
  }

  if (!response.ok) {
    const message = formatModelApiError(response, payload, payloadText);
    throw new Error(`model_api_error: ${message}`);
  }

  return extractModelText(payload);
}

function formatModelApiError(response, payload, payloadText) {
  const contentType = String(response.headers?.['content-type'] || response.headers?.get?.('content-type') || '');
  const rawMessage = payload?.error?.message || payload?.message || payloadText || `HTTP ${response.status}`;
  const looksLikeHtml = /text\/html/i.test(contentType) || /^\s*</.test(String(payloadText || rawMessage));
  if (response.status === 405 && looksLikeHtml) {
    return [
      `LLM_BASE_URL 当前指向的地址不接受 chat/completions POST 请求（HTTP 405）。`,
      `实际请求地址：${chatCompletionsUrl()}`,
      '这通常表示填的是控制台/落地页/Token 页面域名，而不是真实 OpenAI-compatible API Base URL。请把 LLM_BASE_URL 换成网关文档里的 API 地址，例如 https://api.example.com/v1。'
    ].join(' ');
  }
  if (looksLikeHtml) {
    return `模型网关返回 HTML 页面而不是 JSON（HTTP ${response.status}），请确认 LLM_BASE_URL 是真实 API 地址。`;
  }
  return String(rawMessage);
}

function requestModelJson(url, options) {
  const target = new URL(url);
  const transport = target.protocol === 'https:' ? https : http;
  const body = options.body || '';
  const timeoutMs = Number(options.timeoutMs || MODEL_TIMEOUT_MS);

  return new Promise((resolve, reject) => {
    const req = transport.request(target, {
      method: options.method || 'POST',
      headers: {
        ...options.headers,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: timeoutMs,
      rejectUnauthorized: target.protocol === 'https:' ? MODEL_TLS_REJECT_UNAUTHORIZED : undefined
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode || 0,
          headers: res.headers,
          bodyText: Buffer.concat(chunks).toString('utf8')
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`model_api_timeout: request exceeded ${timeoutMs}ms`));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function callModelJson({ messages, model = MODEL_NAME, temperature = MODEL_TEMPERATURE }) {
  const text = await callModelText({ messages, model, temperature, json: true });
  return parseJsonFromText(text);
}

function normalizeChatMessages(messages) {
  const normalized = Array.isArray(messages) ? messages : [{ role: 'user', content: String(messages || '') }];
  return normalized
    .map(message => ({
      role: ['system', 'user', 'assistant', 'tool'].includes(message.role) ? message.role : message.role === 'model' ? 'assistant' : 'user',
      content: String(message.content ?? message.text ?? message.message ?? '')
    }))
    .filter(message => message.content.trim());
}

function extractModelText(payload) {
  const choiceText = payload?.choices?.[0]?.message?.content;
  if (Array.isArray(choiceText)) {
    return choiceText.map(part => part.text || part.content || '').join('\n').trim();
  }
  if (typeof choiceText === 'string') return choiceText;
  if (typeof payload?.output_text === 'string') return payload.output_text;
  if (Array.isArray(payload?.output)) {
    return payload.output
      .flatMap(item => item.content || [])
      .map(item => item.text || item.value || '')
      .join('\n')
      .trim();
  }
  return '';
}

function parseJsonFromText(text) {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('model_json_parse_failed');
    return JSON.parse(match[0]);
  }
}

async function modelChatEndpoint(body) {
  if (!isModelConfigured()) {
    return {
      ok: false,
      status: 'missing_provider_config',
      provider: MODEL_PROVIDER,
      model: body.model || MODEL_NAME,
      text: '',
      message: '未配置 LLM_BASE_URL 或 LLM_API_KEY，无法执行真实模型调用。'
    };
  }

  try {
    const text = await callModelText({
      messages: body.messages || [],
      model: body.model || MODEL_NAME,
      temperature: Number(body.temperature ?? MODEL_TEMPERATURE),
      json: Boolean(body.json)
    });
    return {
      ok: true,
      status: 'completed',
      provider: MODEL_PROVIDER,
      model: body.model || MODEL_NAME,
      text,
      json: body.json ? parseJsonFromText(text) : undefined,
      message: '模型调用完成。'
    };
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      provider: MODEL_PROVIDER,
      model: body.model || MODEL_NAME,
      text: '',
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

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

async function buildAssetDraft(assetType, task, input) {
  if (isModelConfigured()) {
    const modelDraft = await buildAssetDraftWithModel(assetType, task, input);
    if (modelDraft) return modelDraft;
  }

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

async function buildCapabilityCheck() {
  const modelConfigured = Boolean(MODEL_BASE_URL && MODEL_API_KEY);
  const modelProbe = await probeModelConnection();
  const modelStatus = modelConfigured ? modelProbe.status : 'context_only';
  const tooling = {
    mcp: buildToolingStatus('mcp'),
    sdk: buildToolingStatus('sdk'),
    tool: buildToolingStatus('tool'),
    connector: buildToolingStatus('connector')
  };
  const missingConfiguration = [
    MODEL_BASE_URL ? '' : 'LLM_BASE_URL',
    MODEL_API_KEY ? '' : 'LLM_API_KEY',
    ENABLE_TOOL_EXECUTION ? '' : 'ENABLE_TOOL_EXECUTION',
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
      provider: MODEL_PROVIDER,
      configured: modelConfigured,
      status: modelStatus,
      configState: modelConfigured ? (modelProbe.ok ? 'configured' : 'unknown') : 'missing_provider_config',
      requiredEnvVars: ['LLM_BASE_URL', 'LLM_API_KEY'],
      optionalEnvVars: ['LLM_MODEL', 'LLM_PROVIDER', 'LLM_CANDIDATE_MODELS', 'MODEL_TIMEOUT_MS', 'MODEL_TEMPERATURE', 'MODEL_TLS_REJECT_UNAUTHORIZED', 'API_PORT', 'VITE_API_BASE_URL'],
      tlsRejectUnauthorized: MODEL_TLS_REJECT_UNAUTHORIZED,
      message: modelConfigured
        ? modelProbe.message
        : '模型接口已预留。请在 .env.local 填写 LLM_BASE_URL 和 LLM_API_KEY；未配置前模型相关能力明确降级为安全预览。',
      lastProbeAt: modelProbe.checkedAt
    },
    assets: {
      mcp: tooling.mcp.status,
      sdk: tooling.sdk.status,
      tool: tooling.tool.status,
      connector: tooling.connector.status
    },
    market: {
      mode: 'remote',
      configured: true,
      status: 'schema_ready',
      remoteAccountConfigured: true,
      message: '已启用本地远程市场契约：发布、安装、订单、审核状态会写入 JSON state；真实跨用户云端同步和支付仍需外部服务。'
    },
    imports: {
      supportedSources: ['file', 'json', 'external-url', 'market', 'local'],
      executableSources: [],
      defaultStatusForExecutableAssets: 'context_only',
      message: 'market 与 external-url 导入的 MCP/SDK/Tool/Connector 默认不可执行，需要连接配置和显式确认。'
    },
    tooling,
    adapters: listToolAdapters(),
    collaboration: {
      status: 'schema_ready',
      collections: ['teamSpaces', 'approvalRequests'],
      message: '团队空间、成员角色和审批请求已落到本地 JSON state；真实账号、组织权限和内部市场需要云端身份系统。'
    },
    experiments: {
      status: 'schema_ready',
      collections: ['onlineExperiments'],
      message: '线上实验契约已支持创建和事件追踪；真实流量分配、埋点 SDK 和统计分析需要线上接入。'
    },
    execution: {
      modelExecutionAllowed: modelConfigured,
      toolExecutionAllowed: ENABLE_TOOL_EXECUTION,
      requiresExplicitConfirmation: true,
      adapterAllowlist: TOOL_EXECUTION_ALLOWLIST,
      missingConfiguration,
      message: modelConfigured
        ? `模型可尝试运行；MCP/SDK/Tool/Connector ${ENABLE_TOOL_EXECUTION ? '已打开执行门控，但仍需要资产达到 executable 且用户确认。' : '默认仅作为上下文，未开放真实执行。'}`
        : `缺少模型网关配置，模型运行降级为安全预览；MCP/SDK/Tool/Connector ${ENABLE_TOOL_EXECUTION ? '仍需显式确认。' : '仍不可执行。'}`
    },
    timestamp: Date.now()
  };
}

async function probeModelConnection() {
  const checkedAt = Date.now();
  if (!isModelConfigured()) {
    return {
      ok: false,
      status: 'context_only',
      message: '未配置 LLM_BASE_URL 或 LLM_API_KEY，模型优化不可执行。',
      checkedAt
    };
  }

  try {
    const text = await callModelText({
      messages: [
        { role: 'system', content: '只输出 OK。' },
        { role: 'user', content: 'ping' }
      ],
      model: MODEL_NAME,
      temperature: 0,
      json: false,
      timeoutMs: Math.min(MODEL_TIMEOUT_MS, 10000)
    });
    return {
      ok: true,
      status: 'connected',
      message: `${MODEL_PROVIDER} 已真实连通，默认模型 ${MODEL_NAME} 可用于工作台提示词优化、Run Lab、Evaluator 和 Builder Agent。${MODEL_TLS_REJECT_UNAUTHORIZED ? '' : '当前仅模型网关请求启用了 TLS 证书校验豁免，建议后续修复网关证书链。'}探测返回：${String(text || '').slice(0, 24) || 'OK'}`,
      checkedAt
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const tlsHint = /UNABLE_TO_VERIFY|SELF_SIGNED|CERT_|certificate|issuer/i.test(message)
      ? ' 检测到证书链校验问题；更安全的做法是修复网关证书链，临时本地开发可在 .env.local 设置 MODEL_TLS_REJECT_UNAUTHORIZED=false 后重启。'
      : '';
    return {
      ok: false,
      status: 'testable',
      message: `${MODEL_PROVIDER} 已填写配置，但真实探测失败：${message}。请检查 LLM_BASE_URL、LLM_API_KEY、模型名或网络。${tlsHint}`,
      checkedAt
    };
  }
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
  const configured = ENABLE_TOOL_EXECUTION;
  return {
    type,
    status: configured ? 'testable' : 'context_only',
    configured,
    executable: configured,
    requiresConfirmation: true,
    message: configured
      ? `${type.toUpperCase()} 已打开本地执行门控；只有资产状态为 executable 且用户显式确认时才允许尝试执行。`
      : `${type.toUpperCase()} 当前仅作为提示词工程上下文使用；未打开 ENABLE_TOOL_EXECUTION，因此不可执行。`
  };
}

async function buildAssetDraftWithModel(assetType, task, input) {
  try {
    const response = await callModelJson({
      messages: [
        {
          role: 'system',
          content: [
            '你是提示词工程资产构建 Agent，负责把用户的一句话、资料或 API/工具说明整理成可复用资产草稿。',
            '必须输出严格 JSON，不要输出 Markdown 代码块。',
            '资产类型包括 prompt、skill、mcp、sdk、workflow、reference、agent、tool、template、evaluator、dataset、policy、memory、connector、parser、benchmark。',
            'MCP/SDK/Tool/Connector 默认只生成 schema 和上下文，不声称已经真实连接或执行。'
          ].join('\n')
        },
        {
          role: 'user',
          content: JSON.stringify({
            assetType,
            task,
            input,
            requiredShape: {
              title: 'string',
              summary: 'string',
              content: 'string markdown',
              integration: {
                entryName: 'string',
                capabilities: ['string'],
                inputs: ['string'],
                outputs: ['string'],
                constraints: ['string'],
                usageNotes: 'string'
              },
              schemaPreview: ['string'],
              nextSteps: ['string'],
              warnings: ['string']
            }
          }, null, 2)
        }
      ],
      temperature: 0.25
    });
    return normalizeModelAssetDraft(response, assetType, task, input);
  } catch (error) {
    console.warn('Model asset draft failed, falling back to local draft:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

function normalizeModelAssetDraft(raw, assetType, task, input) {
  const now = Date.now();
  const goal = task?.goal || String(input || '可复用提示词工程资产').slice(0, 80);
  const integration = raw?.integration || {};
  return {
    id: createId('asset_draft'),
    assetType,
    title: String(raw?.title || `${typeLabel(assetType)}：${goal}`).slice(0, 80),
    summary: String(raw?.summary || `面向“${goal}”的 ${typeLabel(assetType)} 资产草稿。`),
    content: String(raw?.content || draftContent(assetType, task, input)),
    integration: {
      entryName: String(integration.entryName || `${assetType}.${slugify(goal)}`),
      capabilities: arrayOfStrings(integration.capabilities, draftCapabilities(assetType)),
      inputs: arrayOfStrings(integration.inputs, draftInputs(assetType)),
      outputs: arrayOfStrings(integration.outputs, draftOutputs(assetType)),
      constraints: arrayOfStrings(integration.constraints, draftConstraints(assetType)),
      usageNotes: String(integration.usageNotes || '这是模型辅助生成的资产草稿，需要用户确认后再写入项目库。')
    },
    schemaPreview: arrayOfStrings(raw?.schemaPreview, draftSchemaPreview(assetType)),
    nextSteps: arrayOfStrings(raw?.nextSteps, draftNextSteps(assetType)),
    warnings: arrayOfStrings(raw?.warnings, ['保存前建议补充正例、反例和验收标准。']),
    createdAt: now
  };
}

async function autofillAssetDraft(assetType, messages, input, sourceText, currentDraft) {
  const transcript = normalizeChatMessages(messages)
    .map(message => `${message.role}: ${message.content}`)
    .join('\n');
  const combined = [
    input,
    sourceText ? `\n\n来源资料:\n${sourceText}` : '',
    transcript ? `\n\n构建对话:\n${transcript}` : '',
    currentDraft ? `\n\n当前草稿:\n${JSON.stringify(currentDraft, null, 2)}` : ''
  ].join('').trim();
  const task = analyzeTask(combined, [], [], '资产构建');
  return await buildAssetDraft(assetType, task, combined);
}

async function chatWithAssetBuilder(messages, assetType, assets, context = {}) {
  const normalizedMessages = normalizeChatMessages(messages);
  const draft = await autofillAssetDraft(assetType, normalizedMessages, context.input || '', context.sourceText || '', context.currentDraft);
  const missingFields = inferDraftMissingFields(draft);
  const suggestedActions = buildBuilderSuggestedActions(assetType, draft, missingFields);
  if (!isModelConfigured()) {
    const last = normalizedMessages.at(-1)?.content || '';
    return {
      ok: false,
      status: 'missing_provider_config',
      provider: MODEL_PROVIDER,
      model: MODEL_NAME,
      reply: [
        '当前未配置 LLM_BASE_URL 或 LLM_API_KEY，我先按本地规则给你一个搭建方向：',
        `- 目标资产类型：${typeLabel(assetType)}`,
        `- 先补齐：触发条件、输入输出、执行步骤、边界、示例、验收标准。`,
        last ? `- 你刚才提供的重点是：${last.slice(0, 180)}` : '- 你可以继续补充文档、接口说明或期望输出。'
      ].join('\n'),
      suggestedAssetType: assetType,
      draft,
      missingFields,
      suggestedActions,
      message: '模型未配置，已返回本地构建建议。'
    };
  }

  try {
    const response = await callModelJson({
      messages: [
        {
          role: 'system',
          content: [
            '你是提示词工程资产构建室里的 Agent。',
            '你通过多轮对话帮助用户把一句话、文档、接口说明或模糊想法整理为 Prompt/Skill/MCP/SDK/Workflow/Reference/Agent/Tool/Evaluator/Policy 等资产。',
            '每轮回答要短而可执行：先确认你提炼出的字段，再给缺口，再给下一步建议。',
            '不要要求用户填写长表单；你负责把自然语言整理成字段。',
            '必须输出严格 JSON，不要输出 Markdown 代码块。'
          ].join('\n')
        },
        {
          role: 'user',
          content: JSON.stringify({
            assetType,
            assetsCount: assets.length,
            currentDraft: context.currentDraft || draft,
            sourceText: context.sourceText || '',
            requiredShape: {
              reply: 'string',
              draft: 'AssetBuilderDraft compatible object',
              missingFields: ['string'],
              suggestedActions: ['string']
            }
          }, null, 2)
        },
        ...normalizedMessages
      ],
      temperature: 0.35
    });
    const nextDraft = response?.draft
      ? normalizeModelAssetDraft(response.draft, assetType, analyzeTask(JSON.stringify(response.draft), assets, [], '资产构建'), context.sourceText || '')
      : draft;
    const nextMissingFields = arrayOfStrings(response?.missingFields, inferDraftMissingFields(nextDraft));
    return {
      ok: true,
      status: 'completed',
      provider: MODEL_PROVIDER,
      model: MODEL_NAME,
      reply: String(response?.reply || '我已根据当前对话更新资产草稿，请检查缺失字段和下一步动作。'),
      suggestedAssetType: assetType,
      draft: nextDraft,
      missingFields: nextMissingFields,
      suggestedActions: arrayOfStrings(response?.suggestedActions, buildBuilderSuggestedActions(assetType, nextDraft, nextMissingFields)),
      message: 'Builder Agent 回复完成。'
    };
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      provider: MODEL_PROVIDER,
      model: MODEL_NAME,
      reply: '',
      suggestedAssetType: assetType,
      draft,
      missingFields,
      suggestedActions,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

function inferDraftMissingFields(draft) {
  const missing = [];
  if (!draft?.title?.trim()) missing.push('标题');
  if (!draft?.summary?.trim()) missing.push('摘要');
  if (!draft?.content?.trim() || draft.content.length < 180) missing.push('资产正文');
  if (!draft?.integration?.capabilities?.length) missing.push('能力说明');
  if (!draft?.integration?.inputs?.length) missing.push('输入契约');
  if (!draft?.integration?.outputs?.length) missing.push('输出契约');
  if (!draft?.integration?.constraints?.length) missing.push('边界约束');
  if (!draft?.schemaPreview?.length) missing.push('结构预览');
  if (!draft?.nextSteps?.length) missing.push('下一步建议');
  return missing;
}

function buildBuilderSuggestedActions(assetType, draft, missingFields) {
  const actions = [];
  if (missingFields.length) actions.push(`补齐缺失字段：${missingFields.join('、')}`);
  if (['mcp', 'sdk', 'tool', 'connector'].includes(assetType)) actions.push('如需真实执行，请补充 adapter、输入 schema、权限边界和执行确认说明。');
  if (assetType === 'skill') actions.push('补充触发条件、avoid when、references/scripts/assets 目录和验证清单。');
  if (assetType === 'evaluator') actions.push('补充评分维度、阈值、失败案例和报告格式。');
  if (draft?.warnings?.length) actions.push(`复核风险：${draft.warnings.slice(0, 2).join('；')}`);
  return actions.length ? actions : ['草稿结构完整，可以保存到资产库并在工作台或能力包中使用。'];
}

async function runPromptAcrossModels(compilation, input, models) {
  const modelList = normalizeModelList(Array.isArray(models) ? models.join(',') : models).slice(0, 6);
  const runs = [];
  for (const model of modelList) {
    runs.push(await runPrompt(compilation, input, model));
  }
  return {
    id: createId('multi_run'),
    provider: MODEL_PROVIDER,
    models: modelList,
    runs,
    summary: summarizeMultiRun(runs),
    createdAt: Date.now()
  };
}

function summarizeMultiRun(runs) {
  const completed = runs.filter(run => run.status === 'completed');
  if (!isModelConfigured()) return '未配置模型网关，多模型实验已降级为安全预览。';
  if (!completed.length) return '所有模型运行均未成功，请检查 LLM_BASE_URL、LLM_API_KEY 或候选模型名。';
  const shortest = completed.reduce((best, run) => run.output.length < best.output.length ? run : best, completed[0]);
  const longest = completed.reduce((best, run) => run.output.length > best.output.length ? run : best, completed[0]);
  return `完成 ${completed.length}/${runs.length} 个模型；最短输出 ${shortest.model}，最长输出 ${longest.model}。`;
}

async function scoreWithEvaluator(run, evaluators, expectedOutput) {
  const evaluator = Array.isArray(evaluators) ? evaluators[0] : undefined;
  const schema = evaluator?.schema || {};
  const dimensions = arrayOfStrings(schema.dimensions || evaluator?.integration?.capabilities, ['完整性', '可执行性', '事实边界', '输出格式']);
  const passThreshold = schema.passThreshold || '总分 >= 85';

  if (!run || !isModelConfigured()) {
    return {
      id: createId('evaluator_result'),
      runId: run?.id || 'preview',
      evaluatorAssetId: evaluator?.id,
      evaluatorTitle: evaluator?.title,
      dimensions,
      passThreshold,
      scores: Object.fromEntries(dimensions.map(dimension => [dimension, 0])),
      summary: '未配置 LLM_BASE_URL 或 LLM_API_KEY，Evaluator 自动评分降级为 manual/context-only。',
      unavailableReason: 'missing_provider_config',
      createdAt: Date.now()
    };
  }

  try {
    const result = await callModelJson({
      messages: [
        {
          role: 'system',
          content: '你是严谨的 PromptOps Evaluator。请只输出 JSON，按维度给 0-100 分，并说明证据、问题和改进建议。'
        },
        {
          role: 'user',
          content: JSON.stringify({
            evaluator: evaluator ? {
              title: evaluator.title,
              summary: evaluator.summary,
              content: evaluator.content,
              schema
            } : null,
            dimensions,
            passThreshold,
            expectedOutput,
            run: {
              input: run.input,
              output: run.output,
              promptMetrics: run.metrics,
              status: run.status,
              model: run.model
            },
            requiredShape: {
              scores: Object.fromEntries(dimensions.map(dimension => [dimension, 'number 0-100'])),
              summary: 'string',
              issues: ['string'],
              recommendations: ['string']
            }
          }, null, 2)
        }
      ],
      temperature: 0.2
    });
    return {
      id: createId('evaluator_result'),
      runId: run.id,
      evaluatorAssetId: evaluator?.id,
      evaluatorTitle: evaluator?.title,
      dimensions,
      passThreshold,
      scores: normalizeScores(result?.scores, dimensions),
      summary: String(result?.summary || 'Evaluator 自动评分完成。'),
      issues: arrayOfStrings(result?.issues, []),
      recommendations: arrayOfStrings(result?.recommendations, []),
      createdAt: Date.now()
    };
  } catch (error) {
    return {
      id: createId('evaluator_result'),
      runId: run.id,
      evaluatorAssetId: evaluator?.id,
      evaluatorTitle: evaluator?.title,
      dimensions,
      passThreshold,
      scores: Object.fromEntries(dimensions.map(dimension => [dimension, 0])),
      summary: 'Evaluator 自动评分失败，已保留运行结果供人工复核。',
      unavailableReason: error instanceof Error ? error.message : String(error),
      createdAt: Date.now()
    };
  }
}

function normalizeScores(scores, dimensions) {
  return Object.fromEntries(dimensions.map(dimension => {
    const raw = scores?.[dimension];
    const value = Number(raw);
    return [dimension, Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0];
  }));
}

function listToolAdapters() {
  const enabled = ENABLE_TOOL_EXECUTION;
  return [
    {
      id: 'tool.ripgrep',
      label: 'ripgrep 代码/文档搜索',
      assetTypes: ['tool', 'mcp', 'connector'],
      capability: '在当前仓库内执行只读 rg 搜索。',
      inputHint: '{ "pattern": "MODEL_API_KEY", "cwd": ".", "glob": "*.ts" }',
      risk: 'low',
      enabled: enabled && TOOL_EXECUTION_ALLOWLIST.includes('tool.ripgrep')
    },
    {
      id: 'tool.http_get',
      label: 'HTTP GET 文档读取',
      assetTypes: ['tool', 'connector', 'mcp'],
      capability: '读取公开 http/https 文档或 API 响应，不执行写操作。',
      inputHint: '{ "url": "https://example.com/docs" }',
      risk: 'medium',
      enabled: enabled && TOOL_EXECUTION_ALLOWLIST.includes('tool.http_get')
    },
    {
      id: 'tool.json_extract',
      label: 'JSON 字段提取',
      assetTypes: ['tool', 'parser'],
      capability: '从 JSON 对象中按点路径提取字段。',
      inputHint: '{ "json": { "a": { "b": 1 } }, "path": "a.b" }',
      risk: 'low',
      enabled: enabled && TOOL_EXECUTION_ALLOWLIST.includes('tool.json_extract')
    },
    {
      id: 'sdk.openai.chat',
      label: 'OpenAI-compatible Chat',
      assetTypes: ['sdk', 'connector', 'tool'],
      capability: '通过统一 MODEL_BASE_URL/MODEL_API_KEY 执行一次 chat/completions。',
      inputHint: '{ "prompt": "生成摘要", "model": "gpt-5.5" }',
      risk: 'medium',
      enabled: enabled && TOOL_EXECUTION_ALLOWLIST.includes('sdk.openai.chat') && isModelConfigured()
    },
    {
      id: 'mcp.stdio.call',
      label: 'MCP stdio JSON-RPC 调用',
      assetTypes: ['mcp'],
      capability: '对显式声明 command/toolName 的本地 MCP server 执行一次 tools/call。',
      inputHint: '{ "command": "node server.mjs", "toolName": "search", "arguments": {} }',
      risk: 'high',
      enabled: enabled && TOOL_EXECUTION_ALLOWLIST.includes('mcp.stdio.call')
    }
  ];
}

async function executeToolAsset(asset, input, confirm) {
  const startedAt = Date.now();
  const finish = (patch) => ({
    riskNotes: buildToolRiskNotes(asset, patch.adapterId),
    startedAt,
    completedAt: Date.now(),
    ...patch
  });

  if (!ENABLE_TOOL_EXECUTION) {
    return finish({
      ok: false,
      status: 'blocked',
      mode: 'context_only',
      message: '未开启 ENABLE_TOOL_EXECUTION=true，MCP/SDK/Tool/Connector 不会真实执行。',
      dryRun: { assetTitle: asset?.title, input }
    });
  }
  if (!confirm) {
    return finish({
      ok: false,
      status: 'requires_confirmation',
      mode: 'testable',
      message: '工具执行需要用户显式确认。',
      dryRun: { assetTitle: asset?.title, input }
    });
  }
  if (!asset || !['mcp', 'sdk', 'tool', 'connector', 'parser'].includes(asset.type)) {
    return finish({
      ok: false,
      status: 'blocked',
      mode: 'schema_ready',
      message: '只有 MCP/SDK/Tool/Connector/Parser 资产才允许进入执行适配器。',
      dryRun: { assetTitle: asset?.title, input }
    });
  }
  if (asset.status !== 'executable') {
    return finish({
      ok: false,
      status: 'blocked',
      mode: asset.status || 'schema_ready',
      message: '该资产尚未达到 executable 状态。请先确认 schema、权限、运行边界和回滚方式，再执行真实 adapter。',
      dryRun: {
        assetId: asset.id,
        assetTitle: asset.title,
        currentStatus: asset.status || 'context_only',
        requiredStatus: 'executable',
        input
      }
    });
  }

  const adapterId = resolveToolAdapterId(asset, input);
  if (!adapterId || !TOOL_EXECUTION_ALLOWLIST.includes(adapterId)) {
    return finish({
      ok: false,
      status: 'adapter_missing',
      adapterId,
      mode: 'testable',
      message: adapterId
        ? `适配器 ${adapterId} 未在 TOOL_EXECUTION_ALLOWLIST 中启用。`
        : '没有找到匹配的执行 adapter。请在资产 integration.entryName 或输入 adapterId 中指定。',
      dryRun: {
        assetId: asset.id,
        assetTitle: asset.title,
        entryName: asset.integration?.entryName,
        input,
        allowlist: TOOL_EXECUTION_ALLOWLIST
      }
    });
  }

  try {
    const output = await runToolAdapter(adapterId, asset, input);
    return finish({
      ok: true,
      status: 'completed',
      adapterId,
      mode: asset.status || 'testable',
      message: `适配器 ${adapterId} 执行完成。`,
      output
    });
  } catch (error) {
    return finish({
      ok: false,
      status: 'failed',
      adapterId,
      mode: asset.status || 'testable',
      message: error instanceof Error ? error.message : String(error),
      dryRun: { assetId: asset.id, assetTitle: asset.title, input }
    });
  }
}

function resolveToolAdapterId(asset, input) {
  const explicit = String(input?.adapterId || asset?.integration?.adapterId || '').trim();
  if (explicit) return explicit;
  const haystack = [
    asset?.integration?.entryName,
    asset?.title,
    asset?.summary,
    asset?.content,
    input?.command,
    input?.url ? 'http_get' : '',
    input?.pattern ? 'ripgrep' : '',
    input?.json && input?.path ? 'json_extract' : ''
  ].join('\n').toLowerCase();
  if (haystack.includes('ripgrep') || haystack.includes('rg') || haystack.includes('search_files')) return 'tool.ripgrep';
  if (haystack.includes('http_get') || haystack.includes('http.get') || /^https?:\/\//i.test(String(input?.url || ''))) return 'tool.http_get';
  if (haystack.includes('json_extract') || haystack.includes('json.extract')) return 'tool.json_extract';
  if (haystack.includes('openai') || haystack.includes('chat.completions') || haystack.includes('responses')) return 'sdk.openai.chat';
  if (asset?.type === 'mcp' && (input?.command || haystack.includes('stdio'))) return 'mcp.stdio.call';
  return '';
}

async function runToolAdapter(adapterId, asset, input) {
  if (adapterId === 'tool.ripgrep') return runRipgrepAdapter(input);
  if (adapterId === 'tool.http_get') return runHttpGetAdapter(input);
  if (adapterId === 'tool.json_extract') return runJsonExtractAdapter(input);
  if (adapterId === 'sdk.openai.chat') return runModelSdkAdapter(input);
  if (adapterId === 'mcp.stdio.call') return runMcpStdioAdapter(asset, input);
  throw new Error(`Unsupported adapter: ${adapterId}`);
}

async function runRipgrepAdapter(input) {
  const pattern = String(input?.pattern || input?.query || '').trim();
  if (!pattern) throw new Error('ripgrep adapter requires input.pattern');
  const cwd = resolveSafeCwd(input?.cwd || '.');
  const args = ['--line-number', '--no-heading', '--color', 'never', pattern];
  if (input?.glob) args.splice(0, 0, '--glob', String(input.glob));
  args.push('.');
  const { stdout } = await execFileAsync('rg', args, {
    cwd,
    timeout: TOOL_EXECUTION_TIMEOUT_MS,
    maxBuffer: 1024 * 1024
  }).catch(error => {
    if (error.code === 1) return { stdout: '' };
    throw error;
  });
  const lines = stdout.split(/\r?\n/).filter(Boolean).slice(0, Number(input?.maxResults || 80));
  return {
    cwd: path.relative(rootDir, cwd) || '.',
    pattern,
    matches: lines.map(line => {
      const [file, lineNumber, ...rest] = line.split(':');
      return { file, line: Number(lineNumber), text: rest.join(':') };
    })
  };
}

async function runHttpGetAdapter(input) {
  const url = String(input?.url || '').trim();
  if (!/^https?:\/\//i.test(url)) throw new Error('http_get adapter requires http/https url');
  const response = await fetch(url, {
    method: 'GET',
    headers: sanitizeHeaders(input?.headers),
    signal: AbortSignal.timeout(TOOL_EXECUTION_TIMEOUT_MS)
  });
  const text = await response.text();
  return {
    url,
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get('content-type') || '',
    bodyPreview: text.slice(0, Number(input?.maxBytes || 12000))
  };
}

async function runModelSdkAdapter(input) {
  const messages = input?.messages || [
    { role: 'system', content: input?.system || '你是一个严谨的 SDK 执行助手。' },
    { role: 'user', content: input?.prompt || input?.input || '请回复 OK。' }
  ];
  const text = await callModelText({
    model: input?.model || MODEL_NAME,
    messages,
    temperature: Number(input?.temperature ?? MODEL_TEMPERATURE)
  });
  return { model: input?.model || MODEL_NAME, text };
}

function runJsonExtractAdapter(input) {
  const source = typeof input?.json === 'string' ? JSON.parse(input.json) : input?.json;
  const pathParts = String(input?.path || '').split('.').map(part => part.trim()).filter(Boolean);
  if (!source || !pathParts.length) throw new Error('json_extract adapter requires input.json and input.path');
  let value = source;
  for (const part of pathParts) value = value?.[part];
  return { path: pathParts.join('.'), value };
}

async function runMcpStdioAdapter(asset, input) {
  const commandLine = String(input?.command || asset?.schema?.server?.command || '').trim();
  const toolName = String(input?.toolName || input?.name || '').trim();
  if (!commandLine || !toolName) {
    throw new Error('mcp.stdio.call requires input.command and input.toolName');
  }
  const [command, ...args] = splitCommandLine(commandLine);
  if (!['node', 'python', 'python3', 'uv', 'npx'].includes(command)) {
    throw new Error('mcp.stdio.call command is not in the safe command allowlist');
  }
  const request = {
    jsonrpc: '2.0',
    id: createId('mcp_call'),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: input?.arguments || input?.input || {}
    }
  };
  const result = await runProcessWithInput(command, args, `${JSON.stringify(request)}\n`, TOOL_EXECUTION_TIMEOUT_MS);
  return {
    command: commandLine,
    request,
    stdout: result.stdout.slice(0, 20000),
    stderr: result.stderr.slice(0, 4000),
    exitCode: result.exitCode
  };
}

function splitCommandLine(value) {
  const matches = String(value || '').match(/"([^"]*)"|'([^']*)'|[^\s]+/g) || [];
  return matches.map(part => part.replace(/^["']|["']$/g, ''));
}

function runProcessWithInput(command, args, stdin, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let completed = false;
    const timer = setTimeout(() => {
      if (completed) return;
      completed = true;
      child.kill('SIGTERM');
      reject(new Error(`process_timeout_after_${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on('data', chunk => {
      stdout += chunk.toString('utf8');
      if (stdout.length > 1024 * 1024) stdout = stdout.slice(-1024 * 1024);
    });
    child.stderr.on('data', chunk => {
      stderr += chunk.toString('utf8');
      if (stderr.length > 256 * 1024) stderr = stderr.slice(-256 * 1024);
    });
    child.on('error', error => {
      if (completed) return;
      completed = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', exitCode => {
      if (completed) return;
      completed = true;
      clearTimeout(timer);
      if (exitCode && exitCode !== 0) {
        reject(new Error(`process_exit_${exitCode}: ${stderr || stdout || 'no output'}`));
        return;
      }
      resolve({ stdout, stderr, exitCode });
    });
    child.stdin.write(stdin);
    child.stdin.end();
  });
}

function resolveSafeCwd(rawCwd) {
  const resolved = path.resolve(rootDir, String(rawCwd || '.'));
  if (!resolved.startsWith(rootDir)) throw new Error('cwd must stay inside project workspace');
  return resolved;
}

function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') return {};
  return Object.fromEntries(Object.entries(headers)
    .filter(([key]) => !/authorization|cookie|token|key|secret/i.test(key))
    .map(([key, value]) => [key, String(value)]));
}

function buildToolRiskNotes(asset, adapterId) {
  return [
    `资产: ${asset?.title || '未命名'}`,
    `适配器: ${adapterId || '未匹配'}`,
    '执行需要 ENABLE_TOOL_EXECUTION=true、用户确认和 allowlist 命中。',
    adapterId === 'tool.http_get' ? 'HTTP GET 会访问外部网络，请确认 URL 来源可信。' : '',
    adapterId === 'mcp.stdio.call' ? 'MCP stdio 会启动本地进程，仅允许安全命令并需要显式参数。' : ''
  ].filter(Boolean);
}

function createLegacyAdapterMissingResult(asset, input) {
  return {
    ok: false,
    status: 'adapter_missing',
    mode: 'testable',
    message: '本地执行门控已打开，但该资产尚未绑定具体 adapter。已生成 dry-run 记录，避免执行未知副作用。',
    dryRun: {
      assetId: asset.id,
      assetTitle: asset.title,
      entryName: asset.integration?.entryName,
      input
    }
  };
}

async function publishRemoteMarketItem(item, account = {}) {
  if (!item?.title) {
    return { ok: false, message: '缺少市场条目 title，无法发布。' };
  }
  const now = Date.now();
  const accountRecord = normalizeMarketAccount(account);
  const remoteItem = {
    ...item,
    id: item.id?.startsWith('remote_market_') ? item.id : createId('remote_market'),
    source: 'remote',
    auditStatus: item.auditStatus === 'approved' ? 'approved' : 'submitted',
    downloads: Number(item.downloads || 0),
    rating: Number(item.rating || 0),
    reviews: Array.isArray(item.reviews) ? item.reviews : [],
    cloud: {
      provider: 'local-contract',
      status: 'queued_for_review',
      accountId: accountRecord.id,
      syncedAt: now,
      message: '本地远程市场契约已写入 state；接入真实云端后可替换此 provider。'
    },
    updatedAt: now,
    createdAt: item.createdAt || now
  };
  const [items, accounts] = await Promise.all([
    readStateCollection('remoteMarketItems'),
    readStateCollection('marketAccounts')
  ]);
  await Promise.all([
    writeStateCollection('remoteMarketItems', upsertById(items, remoteItem)),
    writeStateCollection('marketAccounts', upsertById(accounts, accountRecord))
  ]);
  return {
    ok: true,
    item: remoteItem,
    message: '已发布到本地远程市场队列：账号、审核和同步记录已落盘；真实云端服务接入后可继续同步。'
  };
}

async function installRemoteMarketItem(itemId) {
  const items = await readStateCollection('remoteMarketItems');
  const item = items.find(entry => entry.id === itemId);
  if (!item) return { ok: false, message: '远程市场条目不存在或尚未同步。' };
  const nextItem = { ...item, downloads: Number(item.downloads || 0) + 1, updatedAt: Date.now() };
  await writeStateCollection('remoteMarketItems', upsertById(items, nextItem));
  return {
    ok: true,
    item: nextItem,
    message: '远程市场条目已下载到本地安装队列；前端可按冲突策略写入资产库或能力包。'
  };
}

async function createMarketOrder(item, buyer = 'local-user') {
  if (!item?.id) throw new Error('createMarketOrder requires item.id');
  const now = Date.now();
  const order = {
    id: createId('market_order'),
    itemId: item.id,
    itemTitle: item.title || '未命名市场条目',
    buyer,
    seller: item.author || 'unknown',
    amountCents: Number(item.priceCents || 0),
    currency: 'CNY',
    paymentMode: item.paymentMode || 'free',
    status: item.paymentMode === 'paid_placeholder' ? 'payment_required' : 'completed',
    provider: 'local-contract',
    message: item.paymentMode === 'paid_placeholder'
      ? '订单已创建，但真实支付、结算和退款需要接入支付服务。'
      : '免费条目订单已在本地完成。',
    createdAt: now,
    updatedAt: now
  };
  const orders = await readStateCollection('marketOrders');
  await writeStateCollection('marketOrders', [order, ...orders]);
  return { ok: true, order, message: order.message };
}

async function bootstrapTeamSpace(body = {}) {
  const now = Date.now();
  const owner = {
    id: createId('member'),
    name: String(body.ownerName || 'Local Owner'),
    email: String(body.ownerEmail || 'owner@local.promptmaster'),
    role: 'owner',
    status: 'active',
    joinedAt: now
  };
  const team = {
    id: createId('team'),
    name: String(body.name || '本地 PromptOps 团队空间'),
    summary: String(body.summary || '用于模拟团队资产协作、内部市场和审批流的本地团队空间。'),
    members: [owner, ...(Array.isArray(body.members) ? body.members : []).map(member => ({
      id: member.id || createId('member'),
      name: String(member.name || 'Team Member'),
      email: String(member.email || 'member@local.promptmaster'),
      role: ['owner', 'admin', 'editor', 'viewer', 'reviewer'].includes(member.role) ? member.role : 'viewer',
      status: ['active', 'invited', 'disabled'].includes(member.status) ? member.status : 'invited',
      joinedAt: Number(member.joinedAt || now)
    }))],
    assetIds: arrayOfStrings(body.assetIds, []),
    packIds: arrayOfStrings(body.packIds, []),
    internalMarketEnabled: body.internalMarketEnabled !== false,
    permissions: {
      owner: ['manage_team', 'publish_internal_market', 'approve_assets', 'run_executable_assets'],
      admin: ['publish_internal_market', 'approve_assets'],
      editor: ['create_assets', 'request_approval'],
      reviewer: ['review_assets'],
      viewer: ['read_assets']
    },
    createdAt: now,
    updatedAt: now
  };
  const teams = await readStateCollection('teamSpaces');
  await writeStateCollection('teamSpaces', upsertById(teams, team));
  return team;
}

async function createApprovalRequest(body = {}) {
  if (!body.teamId || !body.targetId || !body.targetKind) {
    throw new Error('createApprovalRequest requires teamId, targetKind and targetId');
  }
  const now = Date.now();
  const request = {
    id: createId('approval'),
    teamId: String(body.teamId),
    targetKind: String(body.targetKind),
    targetId: String(body.targetId),
    status: 'pending',
    requestedBy: String(body.requestedBy || 'local-user'),
    comment: String(body.comment || '请求团队审核该资产/能力包。'),
    createdAt: now
  };
  const requests = await readStateCollection('approvalRequests');
  await writeStateCollection('approvalRequests', [request, ...requests]);
  return request;
}

async function createOnlineExperiment(body = {}) {
  const now = Date.now();
  const variants = Array.isArray(body.variants) && body.variants.length
    ? body.variants.map((variant, index) => ({
      id: variant.id || createId(`variant_${index + 1}`),
      name: String(variant.name || `Variant ${index + 1}`),
      promptId: variant.promptId,
      compilationId: variant.compilationId,
      weight: Number.isFinite(Number(variant.weight)) ? Number(variant.weight) : Math.round(100 / body.variants.length)
    }))
    : [
      { id: createId('variant_a'), name: 'Baseline', weight: 50 },
      { id: createId('variant_b'), name: 'Asset Variant', weight: 50 }
    ];
  const experiment = {
    id: createId('online_exp'),
    name: String(body.name || '本地线上实验草稿'),
    status: 'draft',
    variants,
    metrics: arrayOfStrings(body.metrics, ['conversion', 'quality_score', 'manual_win']),
    events: [],
    provider: 'local-contract',
    message: '本地线上实验契约已创建；真实流量分配、埋点 SDK 和统计显著性需接入线上服务。',
    createdAt: now,
    updatedAt: now
  };
  const experiments = await readStateCollection('onlineExperiments');
  await writeStateCollection('onlineExperiments', [experiment, ...experiments]);
  return experiment;
}

async function trackOnlineExperimentEvent(body = {}) {
  if (!body.experimentId || !body.variantId || !body.metric) {
    throw new Error('trackOnlineExperimentEvent requires experimentId, variantId and metric');
  }
  const experiments = await readStateCollection('onlineExperiments');
  const target = experiments.find(experiment => experiment.id === body.experimentId);
  if (!target) throw new Error('online_experiment_not_found');
  const event = {
    id: createId('exp_event'),
    variantId: String(body.variantId),
    metric: String(body.metric),
    value: Number(body.value ?? 1),
    timestamp: Date.now()
  };
  const updated = {
    ...target,
    status: target.status === 'draft' ? 'running' : target.status,
    events: [event, ...(target.events || [])],
    updatedAt: Date.now()
  };
  await writeStateCollection('onlineExperiments', upsertById(experiments, updated));
  return updated;
}

function normalizeMarketAccount(account = {}) {
  const id = String(account.id || 'local-market-account');
  const now = Date.now();
  return {
    id,
    name: String(account.name || 'Local Market Account'),
    email: String(account.email || 'market@local.promptmaster'),
    provider: 'local-contract',
    status: 'connected',
    permissions: ['publish', 'review_local', 'install', 'order_placeholder'],
    createdAt: Number(account.createdAt || now),
    updatedAt: now
  };
}

function upsertById(items, next) {
  const source = Array.isArray(items) ? items : [];
  return [next, ...source.filter(item => item.id !== next.id)];
}

async function runPrompt(compilation, input, model) {
  const prompt = compilation?.compiledPrompt || '';
  const createdAt = Date.now();
  const base = {
    id: createId('run'),
    compilationId: compilation?.id || 'preview',
    provider: MODEL_PROVIDER,
    model: model || MODEL_NAME,
    input,
    createdAt
  };

  if (!isModelConfigured()) {
    return {
      ...base,
      status: 'missing_provider_config',
      output: prompt,
      metrics: promptMetrics(prompt, 0),
      message: '未配置 LLM_BASE_URL 或 LLM_API_KEY，本次只保存安全预览，不执行模型调用。'
    };
  }

  try {
    const output = await callModelText({
      model: model || MODEL_NAME,
      messages: [
        { role: 'system', content: prompt || '你是一个严谨的提示词工程执行助手。' },
        { role: 'user', content: input || '请基于上方 Prompt 输出一次示例结果。' }
      ],
      temperature: MODEL_TEMPERATURE
    });
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
    return `# Workflow 草稿\n\nGoal: ${goal}\n\nStages:\n1. Intake: 明确输入和缺口。\n2. Build: 插入资产并优化提示词。\n3. Run: 执行或预览输出。\n4. Review: 评分、诊断和生成 AssetPatch。\n5. Save: 沉淀为可复用资产。`;
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

function arrayOfStrings(value, fallback = []) {
  if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return value.split(/\n|；|;/).map(item => item.trim()).filter(Boolean);
  return fallback;
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
