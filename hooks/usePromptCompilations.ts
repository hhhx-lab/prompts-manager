import { PromptCompilation } from '../types';
import { PROMPT_COMPILATIONS_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';

export const usePromptCompilations = () => {
  const [promptCompilations, setPromptCompilations] = useBackendState<PromptCompilation[]>(PROMPT_COMPILATIONS_STORAGE_KEY, 'compilations', []);

  const savePromptCompilation = (compilation: PromptCompilation) => {
    setPromptCompilations(prev => [compilation, ...prev.filter(item => item.id !== compilation.id)].slice(0, 100));
  };

  return { promptCompilations, setPromptCompilations, savePromptCompilation };
};
