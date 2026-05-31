import React from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { AssetType, FeedbackInsights } from '../../types';
import { ASSET_TYPE_LABELS } from '../../services/library';
import { InfoBlock, Panel } from '../ops/OpsPrimitives';

interface FeedbackInsightsPanelProps {
  isBusy: boolean;
  feedbackInsights: FeedbackInsights | null;
  graphSummary: Record<string, number>;
  onRefresh: () => void;
}

export const FeedbackInsightsPanel: React.FC<FeedbackInsightsPanelProps> = ({
  isBusy,
  feedbackInsights,
  graphSummary,
  onRefresh
}) => (
  <Panel title="7. Feedback Insights" icon={<CheckCircle2 size={18} className="text-cyan-300" />}>
    <button onClick={onRefresh} disabled={isBusy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 text-sm font-bold hover:bg-cyan-500/30">
      <RefreshCw size={16} /> 刷新反馈洞察
    </button>
    {feedbackInsights ? (
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <InfoBlock label="事件" value={`${feedbackInsights.totalEvents}`} />
          <InfoBlock label="补丁" value={`${feedbackInsights.patchCount}`} />
        </div>
        <InfoBlock label="主要信号" value={feedbackInsights.topSignals.join('；')} wide />
        <InfoBlock label="下一步" value={feedbackInsights.nextActions.length ? feedbackInsights.nextActions.join('；') : '继续积累反馈事件'} wide />
        <div className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 rounded-lg p-3">
          {Object.entries(feedbackInsights.patchTypes).map(([type, count]) => `${ASSET_TYPE_LABELS[type as AssetType] || type} ${count}`).join(' / ') || '暂无补丁类型'}
        </div>
        <div className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 rounded-lg p-3">
          图谱关系：{Object.entries(graphSummary).map(([relation, count]) => `${relation} ${count}`).join(' / ') || '暂无'}
        </div>
      </div>
    ) : (
      <div className="mt-4 text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-lg p-3">
        根据反馈事件和 AssetPatch 聚合失败模式，帮助判断该改 Prompt、Template、Policy、Skill 还是 Evaluator。
      </div>
    )}
  </Panel>
);
