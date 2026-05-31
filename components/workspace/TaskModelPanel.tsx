import React from 'react';
import { BrainCircuit, FileText, Wand2 } from 'lucide-react';
import { TaskModel } from '../../types';
import { ASSET_TYPE_LABELS } from '../../services/library';
import { InfoBlock, Panel } from '../ops/OpsPrimitives';

interface TaskModelPanelProps {
  input: string;
  isBusy: boolean;
  taskModel: TaskModel | null;
  onInputChange: (value: string) => void;
  onAnalyze: () => void;
  onCompile: () => void;
}

export const TaskModelPanel: React.FC<TaskModelPanelProps> = ({
  input,
  isBusy,
  taskModel,
  onInputChange,
  onAnalyze,
  onCompile
}) => (
  <Panel title="1. 任务理解卡" icon={<BrainCircuit size={18} className="text-cyan-300" />}>
    <textarea value={input} onChange={(event) => onInputChange(event.target.value)} className="w-full min-h-[140px] bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 outline-none focus:border-cyan-400 resize-y" />
    <div className="flex flex-wrap gap-2 mt-3">
      <button onClick={onAnalyze} disabled={isBusy || !input.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-sm font-bold">
        <Wand2 size={16} /> 生成 TaskModel
      </button>
      <button onClick={onCompile} disabled={isBusy || !input.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-bold">
        <FileText size={16} /> 编译 PromptIR
      </button>
    </div>
    {taskModel && (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoBlock label="目标" value={taskModel.goal} />
        <InfoBlock label="受众" value={taskModel.audience} />
        <InfoBlock label="风险等级" value={`${taskModel.riskLevel} · confidence ${(taskModel.confidence * 100).toFixed(0)}%`} />
        <InfoBlock label="建议资产" value={taskModel.suggestedAssetTypes.map(type => ASSET_TYPE_LABELS[type]).join(' / ')} />
        <InfoBlock label="输入材料" value={taskModel.inputMaterials.join('；')} wide />
        <InfoBlock label="待确认" value={taskModel.missingInfo.length ? taskModel.missingInfo.join('；') : '暂无关键缺口'} wide />
      </div>
    )}
  </Panel>
);
