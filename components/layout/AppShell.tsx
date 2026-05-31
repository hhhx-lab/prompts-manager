import React from 'react';
import { Activity, BookOpen, Boxes, CheckCircle2, Database, LayoutDashboard, Settings, Sparkles } from 'lucide-react';

export type AppViewMode = 'workspace' | 'library' | 'builder' | 'runlab' | 'feedback' | 'knowledge' | 'settings' | 'ops';

interface AppShellProps {
  activeView: AppViewMode;
  assetCount: number;
  children: React.ReactNode;
  onViewChange: (view: AppViewMode) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ activeView, assetCount, children, onViewChange }) => (
  <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100">
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/90 backdrop-blur-md z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Sparkles className="text-slate-950 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">提示词大师 <span className="text-cyan-300">Pro</span></h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Prompt Engineering Repository</p>
        </div>
      </div>
      <nav className="hidden md:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 overflow-x-auto max-w-[62vw] custom-scrollbar">
        <NavButton active={activeView === 'workspace'} icon={<LayoutDashboard size={18} />} label="工作台" onClick={() => onViewChange('workspace')} />
        <NavButton active={activeView === 'library'} icon={<Database size={18} />} label="资产库" onClick={() => onViewChange('library')} />
        <NavButton active={activeView === 'builder'} icon={<Boxes size={18} />} label="构建器" onClick={() => onViewChange('builder')} />
        <NavButton active={activeView === 'runlab'} icon={<Activity size={18} />} label="运行实验室" onClick={() => onViewChange('runlab')} />
        <NavButton active={activeView === 'feedback'} icon={<CheckCircle2 size={18} />} label="反馈洞察" onClick={() => onViewChange('feedback')} />
        <NavButton active={activeView === 'knowledge'} icon={<BookOpen size={18} />} label="知识库" onClick={() => onViewChange('knowledge')} />
        <NavButton active={activeView === 'settings'} icon={<Settings size={18} />} label="设置" onClick={() => onViewChange('settings')} />
      </nav>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-slate-800 rounded-lg bg-slate-900">
          <Database size={14} className="text-cyan-300" /> {assetCount} 资产
        </div>
      </div>
    </header>

    <main className="flex-1 overflow-hidden">
      {children}
    </main>

    <footer className="h-10 border-t border-slate-800 flex items-center justify-center px-4 bg-slate-950 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
      本地项目库已启用 · 资产仅作为半结构化上下文注入 · 不真实执行 MCP/SDK
    </footer>
  </div>
);

const NavButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
  >
    {icon} {label}
  </button>
);
