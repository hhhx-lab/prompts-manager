import { EvaluatorResult } from '../types';
import { EVALUATOR_RESULTS_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';

export const useEvaluatorResults = () => {
  const [evaluatorResults, setEvaluatorResults] = useBackendState<EvaluatorResult[]>(EVALUATOR_RESULTS_STORAGE_KEY, 'evaluatorResults', []);

  const saveEvaluatorResult = (result: EvaluatorResult) => {
    setEvaluatorResults(previous => [result, ...previous.filter(item => item.id !== result.id)].slice(0, 200));
  };

  return { evaluatorResults, setEvaluatorResults, saveEvaluatorResult };
};
