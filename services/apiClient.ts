import {
  AssetPatch,
  AssetBuilderDraft,
  AssetType,
  ArchitectureManifest,
  BackendHealth,
  CompileMode,
  DocsIndexItem,
  FeedbackEvent,
  FeedbackInsights,
  OptimizationDirection,
  PromptAsset,
  PromptCompilation,
  RunLabComparison,
  TaskModel
} from '../types';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');

export const getBackendHealth = () => request<BackendHealth>('/api/health');
export const getDocsIndex = () => request<DocsIndexItem[]>('/api/docs/index');
export const getArchitectureManifest = () => request<ArchitectureManifest>('/api/architecture');

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
