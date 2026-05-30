import { HistoryEntry } from '../types';
import { HISTORY_STORAGE_KEY } from '../services/storage';
import { usePersistentState } from './usePersistentState';

export const usePromptHistory = () => {
  return usePersistentState<HistoryEntry[]>(HISTORY_STORAGE_KEY, []);
};
