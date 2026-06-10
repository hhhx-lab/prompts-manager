import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Database, FileText, RefreshCw, Search, Server } from 'lucide-react';
import { ArchitectureManifest, BackendHealth, DocsIndexItem } from '../../types';
import { getArchitectureManifest, getBackendHealth, getDocsIndex } from '../../services/apiClient';
import { InfoBlock } from '../ops/OpsPrimitives';
import { Badge, Button, EmptyState, MetricCard, PageHeader, Panel, StatusPill } from '../ui/DesignSystem';

const categories: Record<DocsIndexItem['category'], string> = {
  product: '产品方案',
  knowledge: '提示词工程',
  'asset-spec': '资产规格',
  plan: '实施计划',
  other: '其他'
};

const categoryOrder: Array<DocsIndexItem['category'] | 'all'> = ['all', 'asset-spec', 'knowledge', 'product', 'plan', 'other'];

export const KnowledgeBaseView: React.FC = () => {
  const [docs, setDocs] = useState<DocsIndexItem[]>([]);
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [architecture, setArchitecture] = useState<ArchitectureManifest | null>(null);
  const [activeCategory, setActiveCategory] = useState<DocsIndexItem['category'] | 'all'>('all');
  const [activeDocPath, setActiveDocPath] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const filteredDocs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return docs.filter(item => {
      const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
      const queryMatch = !normalizedQuery || [item.title, item.summary, item.path].join(' ').toLowerCase().includes(normalizedQuery);
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, docs, query]);

  const activeDoc = useMemo(
    () => docs.find(item => item.path === activeDocPath) || filteredDocs[0] || null,
    [activeDocPath, docs, filteredDocs]
  );

  const categoryCounts = useMemo(() => docs.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {}), [docs]);

  const refresh = async () => {
    try {
      const [nextHealth, nextDocs, nextArchitecture] = await Promise.all([
        getBackendHealth(),
        getDocsIndex(),
        getArchitectureManifest()
      ]);
      setHealth(nextHealth);
      setDocs(nextDocs);
      setArchitecture(nextArchitecture);
      setActiveDocPath(current => current || nextDocs[0]?.path || '');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setHealth(null);
      setDocs([]);
      setArchitecture(null);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-zinc-950">
      <PageHeader
        eyebrow="Knowledge Index"
        title="知识库"
        description="把产品方案、资产规格、提示词工程资料和实施计划收束成可检索索引，服务资产构建和提示词优化。"
        actions={
          <>
            <StatusPill status={health?.ok ? 'online' : 'offline'} />
            <Button onClick={refresh} icon={<RefreshCw size={16} />}>刷新索引</Button>
          </>
        }
      />

      <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-5">
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard icon={<Server size={16} />} label="后端 API" value={health?.ok ? '已连接' : '离线'} tone={health?.ok ? 'good' : 'warn'} detail={error || `version=${health?.version || 'unknown'}`} />
          <MetricCard icon={<BookOpen size={16} />} label="文档索引" value={`${docs.length || health?.docsCount || 0}`} detail="docs/ Markdown" />
          <MetricCard icon={<Database size={16} />} label="State 目录" value={health?.dataDirReady ? 'ready' : 'unknown'} tone={health?.dataDirReady ? 'good' : 'neutral'} detail="本地 JSON state" />
          <MetricCard icon={<FileText size={16} />} label="当前结果" value={`${filteredDocs.length}`} detail={activeCategory === 'all' ? '全部分类' : categories[activeCategory]} />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[240px_minmax(0,1fr)_360px]">
          <Panel title="分类索引" icon={<BookOpen size={16} className="text-zinc-400" />}>
            <div className="space-y-2">
              {categoryOrder.map(category => {
                const label = category === 'all' ? '全部' : categories[category];
                const count = category === 'all' ? docs.length : categoryCounts[category] || 0;
                const active = activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${active ? 'border-teal-800 bg-teal-950/40 text-teal-100' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100'}`}
                  >
                    <span>{label}</span>
                    <span className="text-xs text-zinc-500">{count}</span>
                  </button>
                );
              })}
            </div>

            {architecture && (
              <div className="mt-4 space-y-2 border-t border-zinc-900 pt-4">
                <InfoBlock label="frontend" value={architecture.stack.frontend} />
                <InfoBlock label="backend" value={architecture.stack.backend} />
                <InfoBlock label="storage" value={architecture.stack.storage} />
              </div>
            )}
          </Panel>

          <Panel
            title="文档列表"
            icon={<FileText size={16} className="text-zinc-400" />}
            actions={<Badge tone="muted">{filteredDocs.length} items</Badge>}
          >
            <div className="relative mb-3">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="field-input pl-9"
                placeholder="搜索标题、摘要或路径..."
              />
            </div>

            {filteredDocs.length === 0 ? (
              <EmptyState title="没有匹配文档" description="确认后端已启动，或调整分类与关键词。" />
            ) : (
              <div className="overflow-hidden rounded-lg border border-zinc-800">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-zinc-900 bg-zinc-950 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    <tr>
                      <th className="px-3 py-2 font-bold">文档</th>
                      <th className="px-3 py-2 font-bold">分类</th>
                      <th className="px-3 py-2 font-bold">更新</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {filteredDocs.map(item => (
                      <tr
                        key={item.path}
                        onClick={() => setActiveDocPath(item.path)}
                        className={`cursor-pointer transition-colors hover:bg-zinc-900/60 ${activeDoc?.path === item.path ? 'bg-teal-950/20' : ''}`}
                      >
                        <td className="max-w-[520px] px-3 py-3">
                          <div className="truncate font-semibold text-zinc-100">{item.title}</div>
                          <div className="mt-1 line-clamp-1 text-xs text-zinc-500">{item.summary}</div>
                        </td>
                        <td className="px-3 py-3"><Badge tone={item.category === 'asset-spec' ? 'accent' : 'neutral'}>{categories[item.category]}</Badge></td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-zinc-500">{new Date(item.updatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="文档检查器" icon={<FileText size={16} className="text-zinc-400" />}>
            {activeDoc ? (
              <div className="space-y-4">
                <div>
                  <Badge tone={activeDoc.category === 'asset-spec' ? 'accent' : 'neutral'}>{categories[activeDoc.category]}</Badge>
                  <h3 className="mt-3 text-base font-semibold text-zinc-100">{activeDoc.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{activeDoc.summary || '暂无摘要。'}</p>
                </div>
                <InfoBlock label="路径" value={activeDoc.path} />
                <InfoBlock label="更新时间" value={new Date(activeDoc.updatedAt).toLocaleString()} />
                <div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-3 text-xs leading-relaxed text-zinc-400">
                  {activeDoc.category === 'asset-spec'
                    ? '建议把这里的资产结构要求同步到构建器和资产编辑器，作为保存前完整度检查。'
                    : '可作为提示词优化时的参考资料来源，后续可扩展为一键转 Reference 资产。'}
                </div>
              </div>
            ) : (
              <EmptyState title="选择一份文档" description="点击左侧列表中的文档查看摘要、路径和用途。" />
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
};
