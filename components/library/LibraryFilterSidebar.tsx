import React from 'react';
import { Filter, Search } from 'lucide-react';
import { AssetType, OptimizationDirection } from '../../types';
import { ASSET_TYPE_LABELS } from '../../services/library';

interface LibraryFilterSidebarProps {
  directions: OptimizationDirection[];
  librarySearch: string;
  libraryType: AssetType | 'all';
  onSearchChange: (value: string) => void;
  onTypeChange: (type: AssetType | 'all') => void;
}

export const LibraryFilterSidebar: React.FC<LibraryFilterSidebarProps> = ({
  directions,
  librarySearch,
  libraryType,
  onSearchChange,
  onTypeChange
}) => (
  <aside className="space-y-4">
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Filter size={14} /> 筛选</div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={librarySearch} onChange={(e) => onSearchChange(e.target.value)} placeholder="搜索标题、标签、正文..." className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-cyan-400" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onTypeChange('all')} className={`px-3 py-2 rounded-lg text-xs font-bold border ${libraryType === 'all' ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>全部</button>
        {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map(type => (
          <button key={type} onClick={() => onTypeChange(type)} className={`px-3 py-2 rounded-lg text-xs font-bold border ${libraryType === type ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>{ASSET_TYPE_LABELS[type]}</button>
        ))}
      </div>
    </div>

    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">优化方向预设</div>
      <div className="space-y-2">
        {directions.map(direction => (
          <div key={direction.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-xs font-bold text-slate-200">{direction.name}</div>
            <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">{direction.description}</div>
          </div>
        ))}
      </div>
    </div>
  </aside>
);
