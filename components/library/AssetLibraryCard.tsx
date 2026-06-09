import React from 'react';
import { ArrowRight, Edit3, Trash2 } from 'lucide-react';
import { PromptAsset } from '../../types';
import { ASSET_TYPE_LABELS } from '../../services/library';
import { Badge, Button, StatusPill } from '../ui/DesignSystem';

interface AssetLibraryCardProps {
  asset: PromptAsset;
  onDelete: (id: string) => void;
  onEdit: (asset: PromptAsset) => void;
  onInject: (id: string) => void;
}

const runtimeAssetTypes = new Set(['mcp', 'sdk', 'tool', 'connector']);

const isExternalRuntimeAsset = (asset: PromptAsset) =>
  runtimeAssetTypes.has(asset.type) && ['market', 'external-url', 'external_url'].includes(String(asset.source || '').toLowerCase());

export const AssetLibraryCard: React.FC<AssetLibraryCardProps> = ({ asset, onDelete, onEdit, onInject }) => {
  const needsRuntimeBoundary = isExternalRuntimeAsset(asset);
  const displayStatus = needsRuntimeBoundary && (asset.status === 'connected' || asset.status === 'executable')
    ? 'context_only'
    : asset.status || 'context_only';

  return (
  <article className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 space-y-4 hover:border-zinc-700 transition-colors">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="neutral">{ASSET_TYPE_LABELS[asset.type]}</Badge>
          <StatusPill status={displayStatus} />
          {needsRuntimeBoundary && <Badge tone="warn">默认不可执行</Badge>}
        </div>
        <h3 className="text-base font-bold text-zinc-100">{asset.title}</h3>
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{asset.summary || '暂无摘要'}</p>
      </div>
      <div className="flex gap-1">
        <button onClick={() => onEdit(asset)} className="p-2 rounded-md text-zinc-500 hover:text-teal-300 hover:bg-zinc-900" title="编辑"><Edit3 size={16} /></button>
        <button onClick={() => onDelete(asset.id)} className="p-2 rounded-md text-zinc-600 hover:text-red-400 hover:bg-zinc-900" title="删除"><Trash2 size={16} /></button>
      </div>
    </div>
    {needsRuntimeBoundary && (
      <div className="rounded-md border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-xs leading-relaxed text-amber-100/85">
        来源为 {asset.source} 的 {ASSET_TYPE_LABELS[asset.type]} 仅作为提示词工程上下文或 schema 注入；未检测到运行时连接和用户确认前，不会真实执行。
      </div>
    )}
    <div className="flex flex-wrap gap-2">
      {asset.tags.slice(0, 6).map(tag => <Badge key={tag} tone="muted">{tag}</Badge>)}
    </div>
    <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-500">
      <div className="bg-zinc-900 border border-zinc-800 rounded-md p-2">质量 {asset.qualityScore || 72}%</div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-md p-2">使用 {asset.usageCount || 0}</div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-md p-2">v{asset.version || 1}</div>
    </div>
    <div className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md p-3 line-clamp-4 whitespace-pre-wrap">{asset.content || '暂无正文内容'}</div>
    <Button onClick={() => onInject(asset.id)} className="w-full" icon={<ArrowRight size={14} />}>注入到工作台</Button>
  </article>
  );
};
