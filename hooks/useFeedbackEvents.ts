import { FeedbackEvent } from '../types';
import { FEEDBACK_EVENTS_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';

export const useFeedbackEvents = () => {
  const [feedbackEvents, setFeedbackEvents] = useBackendState<FeedbackEvent[]>(FEEDBACK_EVENTS_STORAGE_KEY, 'feedbackEvents', []);

  const saveFeedbackEvents = (events: FeedbackEvent[]) => {
    setFeedbackEvents(prev => [...events, ...prev.filter(item => !events.some(event => event.id === item.id))].slice(0, 300));
  };

  return { feedbackEvents, setFeedbackEvents, saveFeedbackEvents };
};
