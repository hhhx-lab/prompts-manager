import React from 'react';
import { Activity, GitBranch } from 'lucide-react';
import { RunLabComparison } from '../../types';
import { InfoBlock, Panel } from '../ops/OpsPrimitives';

interface RunLabPanelProps {
  isBusy: boolean;
  runComparison: RunLabComparison | null;
  onCompare: () => void;
}

export const RunLabPanel: React.FC<RunLabPanelProps> = ({ isBusy, runComparison, onCompare }) => (
  <Panel title="6. Run Lab 资产开关对比" icon={<GitBranch size={18} className="text-emerald-300" />}>
    <button onClick={onCompare} disabled={isBusy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-400/20 border border-emerald-300/30 text-emerald-100 text-sm font-bold hover:bg-emerald-400/30">
      <Activity size={16} /> 比较无资产/有资产版本
    </button>
    {runComparison ? (
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <InfoBlock label="基线长度" value={`${runComparison.baselineMetrics.promptLength}`} />
          <InfoBlock label="资产版长度" value={`${runComparison.variantMetrics.promptLength}`} />
          <InfoBlock label="基线资产" value={`${runComparison.baselineMetrics.assetCount}`} />
          <InfoBlock label="资产版资产" value={`${runComparison.variantMetrics.assetCount}`} />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 space-y-1">
          {runComparison.differences.map(item => <div key={item}>- {item}</div>)}
        </div>
        <div className="text-[11px] text-emerald-100 bg-emerald-400/10 border border-emerald-300/20 rounded-lg p-3">
          {runComparison.recommendation}
        </div>
      </div>
    ) : (
      <div className="mt-4 text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-lg p-3">
        比较同一 TaskModel 在“无资产”和“注入候选资产”两种上下文下的 PromptIR 差异。
      </div>
    )}
  </Panel>
);
