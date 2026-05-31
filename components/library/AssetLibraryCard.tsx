import React from 'react';
import { ArrowRight, Edit3, Trash2 } from 'lucide-react';
import { PromptAsset } from '../../types';
import { ASSET_TYPE_LABELS } from '../../services/library';

interface AssetLibraryCardProps {
  asset: PromptAsset;
  onDelete: (id: string) => void;
  onEdit: (asset: PromptAsset) => void;
  onInject: (id: string) => void;
}

export const AssetLibraryCard: React.FC<AssetLibraryCardProps> = ({ asset, onDelete, onEdit, onInject }) => (
  <article className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-colors">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">{ASSET_TYPE_LABELS[asset.type]}</span>
          {asset.integration.entryName && <span className="px-2 py-1 text-[10px] rounded-md bg-slate-900 border border-slate-800 text-slate-400">{asset.integration.entryName}</span>}
        </div>
        <h3 className="text-base font-bold text-slate-100">{asset.title}</h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{asset.summary || '暂无摘要'}</p>
      </div>
      <div className="flex gap-1">
        <button onClick={() => onEdit(asset)} className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900" title="编辑"><Edit3 size={16} /></button>
        <button onClick={() => onDelete(asset.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900" title="删除"><Trash2 size={16} /></button>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {asset.tags.slice(0, 6).map(tag => <span key={tag} className="px-2 py-1 rounded-md bg-slate-900 text-[10px] text-slate-400 border border-slate-800">{tag}</span>)}
    </div>
    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">能力 {asset.integration.capabilities.length}</div>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">用例 {asset.useCases.length}</div>
    </div>
    <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg p-3 line-clamp-4 whitespace-pre-wrap">{asset.content || '暂无正文内容'}</div>
    <button onClick={() => onInject(asset.id)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-200">
      注入到工作台 <ArrowRight size={14} />
    </button>
  </article>
);
