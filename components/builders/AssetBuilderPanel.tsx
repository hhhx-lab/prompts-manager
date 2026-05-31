import React from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { AssetBuilderDraft, AssetType } from '../../types';
import { ASSET_TYPE_LABELS } from '../../services/library';
import { ALL_ASSET_TYPES } from '../../services/assetDrafts';
import { InfoBlock, Panel } from '../ops/OpsPrimitives';

interface AssetBuilderPanelProps {
  builderType: AssetType;
  builderDraft: AssetBuilderDraft | null;
  isBusy: boolean;
  onBuilderTypeChange: (type: AssetType) => void;
  onBuildDraft: () => void;
}

export const AssetBuilderPanel: React.FC<AssetBuilderPanelProps> = ({
  builderType,
  builderDraft,
  isBusy,
  onBuilderTypeChange,
  onBuildDraft
}) => (
  <Panel title="5. 资产包生成器" icon={<Sparkles size={18} className="text-amber-300" />}>
    <div className="flex flex-wrap gap-2">
      {ALL_ASSET_TYPES.map(type => (
        <button key={type} onClick={() => onBuilderTypeChange(type)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${builderType === type ? 'bg-amber-300 text-slate-950 border-amber-200' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}>
          {ASSET_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
    <button onClick={onBuildDraft} disabled={isBusy} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-300/20 border border-amber-300/30 text-amber-100 text-sm font-bold hover:bg-amber-300/30">
      <Wand2 size={16} /> 生成 {ASSET_TYPE_LABELS[builderType]} 草稿
    </button>
    {builderDraft ? (
      <div className="mt-4 space-y-3">
        <InfoBlock label="草稿标题" value={builderDraft.title} />
        <InfoBlock label="Schema" value={builderDraft.schemaPreview.join(' / ')} />
        <pre className="max-h-[260px] overflow-auto custom-scrollbar whitespace-pre-wrap break-words bg-slate-900 border border-slate-800 rounded-lg p-4 text-[11px] leading-relaxed text-slate-300">{builderDraft.content}</pre>
        <div className="text-[11px] text-amber-100 bg-amber-400/10 border border-amber-300/20 rounded-lg p-3">
          {builderDraft.warnings.join('；')}
        </div>
      </div>
    ) : (
      <div className="mt-4 text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-lg p-3">
        选择资产类型后，系统会基于 TaskModel 生成 Prompt、Skill、MCP、SDK 或 Workflow 的结构化草稿。
      </div>
    )}
  </Panel>
);
