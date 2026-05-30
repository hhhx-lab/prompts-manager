export const HISTORY_STORAGE_KEY = 'promptmaster_history_v2';
export const ASSET_LIBRARY_STORAGE_KEY = 'promptmaster_asset_library_v1';
export const ASSET_LIBRARY_SEEDED_STORAGE_KEY = 'promptmaster_asset_library_seeded_v1';
export const DIRECTIONS_STORAGE_KEY = 'promptmaster_directions_v1';

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
