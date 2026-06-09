import { PromptRun } from '../types';
import { PROMPT_RUNS_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';

export const usePromptRuns = () => {
  const [promptRuns, setPromptRuns] = useBackendState<PromptRun[]>(PROMPT_RUNS_STORAGE_KEY, 'runs', []);

  const savePromptRun = (run: PromptRun) => {
    setPromptRuns(prev => [run, ...prev.filter(item => item.id !== run.id)].slice(0, 100));
  };

  return { promptRuns, setPromptRuns, savePromptRun };
};
