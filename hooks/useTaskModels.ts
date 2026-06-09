import { TaskModel } from '../types';
import { TASK_MODELS_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';

export const useTaskModels = () => {
  const [taskModels, setTaskModels] = useBackendState<TaskModel[]>(TASK_MODELS_STORAGE_KEY, 'taskModels', []);

  const saveTaskModel = (taskModel: TaskModel) => {
    setTaskModels(prev => [taskModel, ...prev.filter(item => item.id !== taskModel.id)].slice(0, 100));
  };

  return { taskModels, setTaskModels, saveTaskModel };
};
