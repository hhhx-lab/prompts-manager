import { BenchmarkRun } from '../types';
import { BENCHMARK_RUNS_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';

export const useBenchmarkRuns = () => {
  const [benchmarkRuns, setBenchmarkRuns] = useBackendState<BenchmarkRun[]>(BENCHMARK_RUNS_STORAGE_KEY, 'benchmarkRuns', []);

  const saveBenchmarkRun = (run: BenchmarkRun) => {
    setBenchmarkRuns(previous => [run, ...previous.filter(item => item.id !== run.id)].slice(0, 200));
  };

  return { benchmarkRuns, setBenchmarkRuns, saveBenchmarkRun };
};
