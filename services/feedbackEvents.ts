import { FeedbackEvent } from '../types';

export const createFeedbackEventsFromText = (text: string, runId = 'ops-preview'): FeedbackEvent[] => {
  const now = Date.now();
  const events: FeedbackEvent[] = [
    {
      id: `event_${now}_manual`,
      runId,
      type: 'manual_edit',
      label: text,
      payload: { note: text },
      timestamp: now
    }
  ];
  if (containsAny(text, ['资料', '上传', '附件'])) {
    events.push(createEvent(now, runId, 'add_attachment', '用户补充资料', text, 1));
  }
  if (containsAny(text, ['重新', '不是这个意思', '再来'])) {
    events.push(createEvent(now, runId, 'regenerate', '用户重新生成', text, 2));
  }
  if (containsAny(text, ['复制', '保存', '提交', '发送'])) {
    events.push(createEvent(now, runId, 'save_result', '用户保留或使用结果', text, 3));
  }
  if (containsAny(text, ['可复用', '模板', '以后都'])) {
    events.push(createEvent(now, runId, 'mark_reusable', '用户标记可复用', text, 4));
  }
  return events;
};

const createEvent = (
  now: number,
  runId: string,
  type: FeedbackEvent['type'],
  label: string,
  note: string,
  offset: number
): FeedbackEvent => ({
  id: `event_${now}_${type}`,
  runId,
  type,
  label,
  payload: { note },
  timestamp: now + offset
});

const containsAny = (text: string, keywords: string[]) => keywords.some(keyword => text.includes(keyword));
