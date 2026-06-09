import React from 'react';
import { Filter, Search } from 'lucide-react';
import { AssetType, CapabilityStatus, OptimizationDirection } from '../../types';
import { ASSET_TYPE_LABELS } from '../../services/library';
import { Badge, Panel, StatusPill } from '../ui/DesignSystem';

interface LibraryFilterSidebarProps {
  directions: OptimizationDirection[];
  librarySearch: string;
  libraryStatus: CapabilityStatus | 'all';
  libraryType: AssetType | 'all';
  onSearchChange: (value: string) => void;
  onStatusChange: (status: CapabilityStatus | 'all') => void;
  onTypeChange: (type: AssetType | 'all') => void;
}

export const LibraryFilterSidebar: React.FC<LibraryFilterSidebarProps> = ({
  directions,
  librarySearch,
  libraryStatus,
  libraryType,
  onSearchChange,
  onStatusChange,
  onTypeChange
}) => (
  <aside className="space-y-4">
    <Panel title="筛选" icon={<Filter size={14} />}>
      <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={librarySearch} onChange={(e) => onSearchChange(e.target.value)} placeholder="搜索标题、标签、正文..." className="field-input pl-9" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onTypeChange('all')} className={`px-3 py-2 rounded-md text-xs font-bold border ${libraryType === 'all' ? 'bg-teal-500 text-zinc-950 border-teal-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>全部</button>
        {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map(type => (
          <button key={type} onClick={() => onTypeChange(type)} className={`px-3 py-2 rounded-md text-xs font-bold border ${libraryType === type ? 'bg-teal-500 text-zinc-950 border-teal-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>{ASSET_TYPE_LABELS[type]}</button>
        ))}
      </div>
      </div>
    </Panel>

    <Panel title="能力状态">
      <div className="space-y-2">
        <button onClick={() => onStatusChange('all')} className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs ${libraryStatus === 'all' ? 'border-teal-700 bg-teal-950/30 text-teal-100' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}>
          全部 <Badge tone="neutral">all</Badge>
        </button>
        {(['context_only', 'schema_ready', 'testable', 'connected', 'executable'] as CapabilityStatus[]).map(status => (
          <button key={status} onClick={() => onStatusChange(status)} className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs ${libraryStatus === status ? 'border-teal-700 bg-teal-950/30' : 'border-zinc-800 bg-zinc-950'}`}>
            <StatusPill status={status} />
          </button>
        ))}
      </div>
    </Panel>

    <Panel title="优化方向预设">
      <div className="space-y-2">
        {directions.map(direction => (
          <div key={direction.id} className="p-3 rounded-md bg-zinc-950 border border-zinc-800">
            <div className="text-xs font-bold text-zinc-200">{direction.name}</div>
            <div className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{direction.description}</div>
          </div>
        ))}
      </div>
    </Panel>
  </aside>
);
