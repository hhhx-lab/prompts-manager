import { PromptCompilation } from '../types';
import { PROMPT_COMPILATIONS_STORAGE_KEY } from '../services/storage';
import { usePersistentState } from './usePersistentState';

export const usePromptCompilations = () => {
  const [promptCompilations, setPromptCompilations] = usePersistentState<PromptCompilation[]>(PROMPT_COMPILATIONS_STORAGE_KEY, []);

  const savePromptCompilation = (compilation: PromptCompilation) => {
    setPromptCompilations(prev => [compilation, ...prev.filter(item => item.id !== compilation.id)].slice(0, 100));
  };

  return { promptCompilations, setPromptCompilations, savePromptCompilation };
};
