import React from 'react';
import { AlertTriangle, Boxes } from 'lucide-react';
import { AssetSlot, PromptAsset } from '../../types';
import { ASSET_TYPE_LABELS } from '../../services/library';
import { Panel } from '../ops/OpsPrimitives';

interface AssetSlotBoardProps {
  slots: AssetSlot[];
  suggestedAssets: PromptAsset[];
}

export const AssetSlotBoard: React.FC<AssetSlotBoardProps> = ({ slots, suggestedAssets }) => (
  <Panel title="2. 资产插槽" icon={<Boxes size={18} className="text-amber-300" />}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {slots.map(slot => (
        <div key={slot.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-100">{slot.name}</div>
            <div className="text-[10px] text-cyan-300 font-bold">{slot.assetIds.length} 资产</div>
          </div>
          <p className="text-xs text-slate-500 mt-1">{slot.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {slot.acceptedTypes.map(type => <span key={type} className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-400">{ASSET_TYPE_LABELS[type]}</span>)}
          </div>
          {slot.warnings.map(warning => <div key={warning} className="mt-3 text-[11px] text-amber-200 flex gap-2"><AlertTriangle size={13} /> {warning}</div>)}
        </div>
      ))}
    </div>
    <div className="mt-4 space-y-2">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">本次候选资产</div>
      {suggestedAssets.length ? suggestedAssets.map(asset => (
        <div key={asset.id} className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-200 truncate">{asset.title}</div>
            <div className="text-[10px] text-slate-500 truncate">{asset.summary || asset.integration.usageNotes || '暂无摘要'}</div>
          </div>
          <span className="shrink-0 px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-300 text-[10px] font-bold">{ASSET_TYPE_LABELS[asset.type]}</span>
        </div>
      )) : <div className="text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-lg p-3">暂无候选资产，项目库可先导入或新建资产。</div>}
    </div>
  </Panel>
);
