import React from 'react';
import { Activity, BookOpen, Boxes, CheckCircle2, Database, LayoutDashboard, Settings, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/DesignSystem';

export type AppViewMode = 'workspace' | 'library' | 'builder' | 'runlab' | 'feedback' | 'knowledge' | 'settings' | 'ops';

interface AppShellProps {
  activeView: AppViewMode;
  assetCount: number;
  children: React.ReactNode;
  onViewChange: (view: AppViewMode) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ activeView, assetCount, children, onViewChange }) => (
  <div className="flex h-screen max-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
    <aside className="hidden w-[248px] shrink-0 border-r border-zinc-900 bg-zinc-950 lg:flex lg:flex-col">
      <div className="border-b border-zinc-900 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-teal-800/70 bg-teal-950/60 text-teal-300">
            <ShieldCheck size={19} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-zinc-50">提示词大师 Pro</h1>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">PromptOps</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(item => (
          <NavButton
            key={item.view}
            active={activeView === item.view}
            icon={item.icon}
            label={item.label}
            description={item.description}
            onClick={() => onViewChange(item.view)}
          />
        ))}
      </nav>
      <div className="border-t border-zinc-900 p-4">
        <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-zinc-500">资产库</span>
            <Badge tone="accent">{assetCount} 个</Badge>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">MCP/SDK/Tool 默认按能力状态分级，不把未连接能力显示成可执行。</p>
        </div>
      </div>
    </aside>

    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-zinc-900 bg-zinc-950/95 px-4 lg:px-5">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">当前工作区</div>
          <div className="truncate text-sm font-semibold text-zinc-100">{navItems.find(item => item.view === activeView)?.label || '工作台'}</div>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <select
            value={activeView}
            onChange={(event) => onViewChange(event.target.value as AppViewMode)}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none"
          >
            {navItems.map(item => <option key={item.view} value={item.view}>{item.label}</option>)}
          </select>
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <Badge tone="neutral">后端优先 state</Badge>
          <Badge tone="muted">本地优先兜底</Badge>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        {children}
      </main>
    </section>
  </div>
);

const navItems: Array<{ view: AppViewMode; label: string; description: string; icon: React.ReactNode }> = [
  { view: 'workspace', label: '工作台', description: '需求到运行闭环', icon: <LayoutDashboard size={17} /> },
  { view: 'library', label: '资产库', description: '资产治理与注入', icon: <Database size={17} /> },
  { view: 'builder', label: '构建器', description: '资产向导', icon: <Boxes size={17} /> },
  { view: 'runlab', label: '运行实验室', description: '测试与对比', icon: <Activity size={17} /> },
  { view: 'feedback', label: '反馈洞察', description: '补丁和归因', icon: <CheckCircle2 size={17} /> },
  { view: 'knowledge', label: '知识库', description: '文档索引', icon: <BookOpen size={17} /> },
  { view: 'settings', label: '设置', description: '运行边界', icon: <Settings size={17} /> }
];

const NavButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; description: string; onClick: () => void }> = ({ active, icon, label, description, onClick }) => (
  <button
    onClick={onClick}
    className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${active ? 'bg-zinc-900 text-zinc-50 ring-1 ring-zinc-800' : 'text-zinc-500 hover:bg-zinc-900/70 hover:text-zinc-200'}`}
  >
    <span className={`${active ? 'text-teal-300' : 'text-zinc-600 group-hover:text-zinc-400'}`}>{icon}</span>
    <span className="min-w-0">
      <span className="block truncate text-sm font-semibold">{label}</span>
      <span className="block truncate text-[11px] text-zinc-600">{description}</span>
    </span>
  </button>
);
