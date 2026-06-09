import {
  AssetPatch,
  AssetPatchApplyResult,
  AssetBuilderDraft,
  AssetType,
  ArchitectureManifest,
  BackendHealth,
  CapabilityCheck,
  CompileMode,
  DocsIndexItem,
  FeedbackEvent,
  FeedbackInsights,
  OptimizationDirection,
  PromptAsset,
  PromptCompilation,
  RunLabRunResult,
  RunLabComparison,
  TaskModel
} from '../types';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');

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
