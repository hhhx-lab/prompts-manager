import {
  AssetPatch,
  AssetPatchApplyResult,
  AssetBuilderDraft,
  AssetType,
  ArchitectureManifest,
  BackendHealth,
  BuilderChatResponse,
  CapabilityCheck,
  CompileMode,
  DocsIndexItem,
  EvaluatorResult,
  FeedbackEvent,
  FeedbackInsights,
  OptimizationDirection,
  PromptAsset,
  PromptCompilation,
  RunLabMultiRunResult,
  RunLabRunResult,
  RunLabComparison,
  ToolAdapterSummary,
  ToolExecutionResult,
  TaskModel,
  MarketItem,
  TeamSpace,
  ApprovalRequest,
  OnlineExperiment
} from '../types';

const API_BASE_URL = (
  import.meta.env.PROD ? '' : import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787'
).replace(/\/$/, '');

export const getBackendHealth = () => request<BackendHealth>('/api/health');
export const getDocsIndex = () => request<DocsIndexItem[]>('/api/docs/index');
export const getArchitectureManifest = () => request<ArchitectureManifest>('/api/architecture');
export const getCapabilityCheck = () => request<CapabilityCheck>('/api/capabilities/check');

export const analyzeTaskRemote = (payload: {
  input: string;
  assets: PromptAsset[];
  directions: OptimizationDirection[];
  scenario: string;
}) => request<TaskModel>('/api/task/analyze', { method: 'POST', body: payload });

export const compilePromptRemote = (payload: {
  task: TaskModel;
  selectedAssets: PromptAsset[];
  directions: OptimizationDirection[];
  mode: CompileMode;
}) => request<PromptCompilation>('/api/prompt/compile', { method: 'POST', body: payload });

export const diagnoseFeedbackRemote = (payload: {
  events: FeedbackEvent[];
  compilation?: PromptCompilation;
}) => request<AssetPatch[]>('/api/feedback/diagnose', { method: 'POST', body: payload });

export const buildAssetDraftRemote = (payload: {
  assetType: AssetType;
  task?: TaskModel;
  input: string;
}) => request<AssetBuilderDraft>('/api/assets/build-draft', { method: 'POST', body: payload });

export const chatAssetBuilderRemote = (payload: {
  messages: { role: 'user' | 'assistant' | 'model' | 'system'; content?: string; text?: string }[];
  assetType: AssetType;
  assets: PromptAsset[];
  currentDraft?: AssetBuilderDraft | null;
  sourceText?: string;
  input?: string;
}) => request<BuilderChatResponse>('/api/assets/builder-chat', { method: 'POST', body: payload });

export const autofillAssetDraftRemote = (payload: {
  assetType: AssetType;
  messages: { role: 'user' | 'assistant' | 'model' | 'system'; content?: string; text?: string }[];
  input: string;
  sourceText?: string;
  currentDraft?: AssetBuilderDraft | null;
}) => request<AssetBuilderDraft>('/api/assets/builder-autofill', { method: 'POST', body: payload });

export const importAssetFromUrlRemote = (payload: {
  url: string;
}) => request<{ ok: boolean; asset?: Partial<PromptAsset>; message: string }>('/api/assets/import-url', { method: 'POST', body: payload });

export const compareRunLabRemote = (payload: {
  task: TaskModel;
  selectedAssets: PromptAsset[];
  directions: OptimizationDirection[];
  mode: CompileMode;
}) => request<RunLabComparison>('/api/run-lab/compare', { method: 'POST', body: payload });

export const getFeedbackInsightsRemote = (payload: {
  events: FeedbackEvent[];
  patches: AssetPatch[];
}) => request<FeedbackInsights>('/api/feedback/insights', { method: 'POST', body: payload });

export const runPromptRemote = (payload: {
  compilation: PromptCompilation;
  input: string;
  model?: string;
}) => request<RunLabRunResult>('/api/run-lab/run', { method: 'POST', body: payload });

export const runMultiModelRemote = (payload: {
  compilation: PromptCompilation;
  input: string;
  models?: string[];
}) => request<RunLabMultiRunResult>('/api/run-lab/multi-run', { method: 'POST', body: payload });

export const scoreEvaluatorRemote = (payload: {
  run: RunLabRunResult;
  evaluators: PromptAsset[];
  expectedOutput: string;
}) => request<EvaluatorResult>('/api/evaluator/score', { method: 'POST', body: payload });

export const chatModelRemote = (payload: {
  messages: { role: 'system' | 'user' | 'assistant' | 'model'; content?: string; text?: string }[];
  model?: string;
  temperature?: number;
  json?: boolean;
}) => request<{ ok: boolean; status: string; provider: string; model: string; text: string; json?: unknown; message: string }>('/api/model/chat', { method: 'POST', body: payload });

export const getToolAdaptersRemote = () => request<ToolAdapterSummary[]>('/api/tools/adapters');

export const executeToolRemote = (payload: {
  asset: PromptAsset;
  input: unknown;
  confirm: boolean;
}) => request<ToolExecutionResult>('/api/tools/execute', { method: 'POST', body: payload });

export const publishRemoteMarketItemRemote = (payload: {
  item: MarketItem;
  account?: { id?: string; name?: string; email?: string };
}) => request<{ ok: boolean; item?: MarketItem; message: string }>('/api/market/remote/publish', { method: 'POST', body: payload });

export const installRemoteMarketItemRemote = (payload: {
  itemId: string;
}) => request<{ ok: boolean; item?: MarketItem; message: string }>('/api/market/remote/install', { method: 'POST', body: payload });

export const createMarketOrderRemote = (payload: {
  item: MarketItem;
  buyer?: string;
}) => request<{ ok: boolean; order: Record<string, unknown>; message: string }>('/api/market/orders/create', { method: 'POST', body: payload });

export const bootstrapTeamSpaceRemote = (payload: {
  name?: string;
  summary?: string;
  ownerName?: string;
  ownerEmail?: string;
  assetIds?: string[];
  packIds?: string[];
}) => request<TeamSpace>('/api/teams/bootstrap', { method: 'POST', body: payload });

export const createApprovalRequestRemote = (payload: {
  teamId: string;
  targetKind: 'asset' | 'capability_pack' | 'market_item';
  targetId: string;
  requestedBy?: string;
  comment?: string;
}) => request<ApprovalRequest>('/api/teams/approval', { method: 'POST', body: payload });

export const createOnlineExperimentRemote = (payload: {
  name: string;
  variants: OnlineExperiment['variants'];
  metrics: string[];
}) => request<OnlineExperiment>('/api/experiments/online/create', { method: 'POST', body: payload });

export const trackOnlineExperimentRemote = (payload: {
  experimentId: string;
  variantId: string;
  metric: string;
  value: number;
}) => request<OnlineExperiment>('/api/experiments/online/track', { method: 'POST', body: payload });

export const applyAssetPatchRemote = (payload: {
  patch: AssetPatch;
  assets: PromptAsset[];
}) => request<AssetPatchApplyResult>('/api/assets/apply-patch', { method: 'POST', body: payload });

export const getStateCollectionRemote = <T,>(collection: string) => request<T | null>(`/api/state/${collection}`);

export const putStateCollectionRemote = <T,>(collection: string, value: T) =>
  request<{ ok: boolean; collection: string; updatedAt: number }>(`/api/state/${collection}`, { method: 'PUT', body: value });

const request = async <T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${path} failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
};
