import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { AssetPatch } from '../../types';
import { ASSET_TYPE_LABELS } from '../../services/library';
import { Panel } from '../ops/OpsPrimitives';

interface FeedbackDiagnosisPanelProps {
  feedbackText: string;
  isBusy: boolean;
  patches: AssetPatch[];
  onFeedbackTextChange: (value: string) => void;
  onDiagnose: () => void;
}

export const FeedbackDiagnosisPanel: React.FC<FeedbackDiagnosisPanelProps> = ({
  feedbackText,
  isBusy,
  patches,
  onFeedbackTextChange,
  onDiagnose
}) => (
  <Panel title="4. 行为反馈诊断" icon={<CheckCircle2 size={18} className="text-cyan-300" />}>
    <textarea value={feedbackText} onChange={(event) => onFeedbackTextChange(event.target.value)} className="w-full min-h-[96px] bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-cyan-400 resize-y" />
    <button onClick={onDiagnose} disabled={isBusy} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 text-sm font-bold hover:bg-cyan-500/30">
      <Sparkles size={16} /> 生成资产补丁建议
    </button>
    <div className="mt-4 space-y-3">
      {patches.map(patch => (
        <div key={patch.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm font-bold text-slate-100">{ASSET_TYPE_LABELS[patch.suggestedAssetType]} 补丁</div>
            <span className="text-[10px] text-slate-500">{new Date(patch.createdAt).toLocaleTimeString()}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{patch.reason}</p>
          <div className="mt-3 bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-400">
            <div className="font-bold text-cyan-300 mb-1">{patch.changes[0]?.fieldPath}</div>
            <div>{patch.changes[0]?.after}</div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">影响：{patch.expectedImpact}</div>
        </div>
      ))}
    </div>
  </Panel>
);
