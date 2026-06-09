export const HISTORY_STORAGE_KEY = 'promptmaster_history_v2';
export const ASSET_LIBRARY_STORAGE_KEY = 'promptmaster_asset_library_v1';
export const ASSET_LIBRARY_SEEDED_STORAGE_KEY = 'promptmaster_asset_library_seeded_v1';
export const DIRECTIONS_STORAGE_KEY = 'promptmaster_directions_v1';
export const TASK_MODELS_STORAGE_KEY = 'promptmaster_task_models_v1';
export const PROMPT_COMPILATIONS_STORAGE_KEY = 'promptmaster_prompt_compilations_v1';
export const PROMPT_RUNS_STORAGE_KEY = 'promptmaster_prompt_runs_v1';
export const FEEDBACK_EVENTS_STORAGE_KEY = 'promptmaster_feedback_events_v1';
export const ASSET_GRAPH_STORAGE_KEY = 'promptmaster_asset_graph_v1';
export const ASSET_PATCHES_STORAGE_KEY = 'promptmaster_asset_patches_v1';
export const CAPABILITY_PACKS_STORAGE_KEY = 'promptmaster_capability_packs_v1';
export const MARKET_ITEMS_STORAGE_KEY = 'promptmaster_market_items_v1';
export const EVALUATOR_RESULTS_STORAGE_KEY = 'promptmaster_evaluator_results_v1';
export const BENCHMARK_RUNS_STORAGE_KEY = 'promptmaster_benchmark_runs_v1';

export const readJson = <T>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch (error) {
    console.error(`读取本地存储失败: ${key}`, error);
    return fallback;
  }
};

export const writeJson = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`写入本地存储失败: ${key}`, error);
  }
};
