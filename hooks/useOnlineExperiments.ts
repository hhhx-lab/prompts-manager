import { OnlineExperiment } from '../types';
import { ONLINE_EXPERIMENTS_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';

export const useOnlineExperiments = () => {
  const [onlineExperiments, setOnlineExperiments, meta] = useBackendState<OnlineExperiment[]>(
    ONLINE_EXPERIMENTS_STORAGE_KEY,
    'onlineExperiments',
    []
  );

  const saveOnlineExperiment = (experiment: OnlineExperiment) => {
    setOnlineExperiments(previous => [experiment, ...previous.filter(item => item.id !== experiment.id)]);
  };

  return { onlineExperiments, setOnlineExperiments, saveOnlineExperiment, ...meta };
};
