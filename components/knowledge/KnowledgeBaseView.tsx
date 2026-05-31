import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Database, FileText, RefreshCw, Server } from 'lucide-react';
import { ArchitectureManifest, BackendHealth, DocsIndexItem } from '../../types';
import { getArchitectureManifest, getBackendHealth, getDocsIndex } from '../../services/apiClient';
import { InfoBlock, Panel, StatusCard } from '../ops/OpsPrimitives';

const categories: Record<DocsIndexItem['category'], string> = {
  product: '产品方案',
  knowledge: '提示词工程知识',
  'asset-spec': '资产包规格',
  plan: '实施计划',
  other: '其他文档'
};

export const KnowledgeBaseView: React.FC = () => {
  const [docs, setDocs] = useState<DocsIndexItem[]>([]);
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [architecture, setArchitecture] = useState<ArchitectureManifest | null>(null);
  const [activeCategory, setActiveCategory] = useState<DocsIndexItem['category'] | 'all'>('all');
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
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-900/20">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
        <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs font-bold mb-3">
              <BookOpen size={14} /> Docs Library
            </div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <BookOpen className="text-cyan-300" /> 文档库与架构索引
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-3xl">
              文档库独立于前端和后端：产品方案、提示词工程知识、资产包规格和实施计划都由本地 API 扫描索引。
            </p>
          </div>
          <button onClick={refresh} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-bold">
            <RefreshCw size={16} /> 刷新索引
          </button>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <StatusCard icon={<Server size={18} />} label="后端 API" value={health?.ok ? '已连接' : '离线'} tone={health?.ok ? 'good' : 'warn'} detail={error || `version=${health?.version || 'unknown'}`} />
          <StatusCard icon={<BookOpen size={18} />} label="文档总数" value={`${docs.length || health?.docsCount || 0}`} tone="neutral" detail="Markdown under docs/" />
          <StatusCard icon={<Database size={18} />} label="数据目录" value={health?.dataDirReady ? 'ready' : 'unknown'} tone={health?.dataDirReady ? 'good' : 'neutral'} detail="runtime JSON ignored by git" />
          <StatusCard icon={<FileText size={18} />} label="当前筛选" value={activeCategory === 'all' ? '全部' : categories[activeCategory]} tone="neutral" detail={`${filteredDocs.length} matches`} />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <aside className="space-y-4">
            <Panel title="分类" icon={<BookOpen size={18} className="text-cyan-300" />}>
              <div className="space-y-2">
                <button onClick={() => setActiveCategory('all')} className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${activeCategory === 'all' ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                  全部 · {docs.length}
                </button>
                {(Object.keys(categories) as DocsIndexItem['category'][]).map(category => (
                  <button key={category} onClick={() => setActiveCategory(category)} className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${activeCategory === category ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                    {categories[category]} · {categoryCounts[category] || 0}
                  </button>
                ))}
              </div>
            </Panel>

            {architecture && (
              <Panel title="运行边界" icon={<Server size={18} className="text-emerald-300" />}>
                <div className="space-y-3">
                  <InfoBlock label="frontend" value={architecture.stack.frontend} />
                  <InfoBlock label="backend" value={architecture.stack.backend} />
                  <InfoBlock label="docs" value={architecture.stack.docs} />
                  <InfoBlock label="storage" value={architecture.stack.storage} />
                </div>
              </Panel>
            )}
          </aside>

          <section className="space-y-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400"
              placeholder="搜索标题、摘要或路径..."
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredDocs.map(item => (
                <article key={item.path} className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-bold">{categories[item.category]}</div>
                      <h3 className="text-base font-bold text-slate-100 mt-1">{item.title}</h3>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mt-3 line-clamp-4">{item.summary}</p>
                  <div className="mt-4 text-[11px] text-slate-500 bg-slate-900 border border-slate-800 rounded-lg p-2 break-all">{item.path}</div>
                </article>
              ))}
            </div>

            {filteredDocs.length === 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-10 text-center text-slate-500">
                暂无匹配文档。确认后端已启动，或调整分类和搜索词。
              </div>
            )}
          </section>
        </section>
      </div>
    </div>
  );
};
