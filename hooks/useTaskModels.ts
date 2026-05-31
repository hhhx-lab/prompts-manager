import { TaskModel } from '../types';
import { TASK_MODELS_STORAGE_KEY } from '../services/storage';
import { usePersistentState } from './usePersistentState';

export const useTaskModels = () => {
  const [taskModels, setTaskModels] = usePersistentState<TaskModel[]>(TASK_MODELS_STORAGE_KEY, []);

  const saveTaskModel = (taskModel: TaskModel) => {
    setTaskModels(prev => [taskModel, ...prev.filter(item => item.id !== taskModel.id)].slice(0, 100));
  };

  return { taskModels, setTaskModels, saveTaskModel };
};
