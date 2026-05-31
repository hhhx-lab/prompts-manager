import React from 'react';

export const Panel: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="bg-slate-950 border border-slate-800 rounded-xl p-5">
    <h3 className="text-sm font-bold flex items-center gap-2 mb-4">{icon} {title}</h3>
    {children}
  </section>
);

export const StatusCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: 'good' | 'warn' | 'neutral';
}> = ({ icon, label, value, detail, tone }) => (
  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
    <div className={`inline-flex p-2 rounded-lg mb-3 ${tone === 'good' ? 'bg-emerald-400/10 text-emerald-300' : tone === 'warn' ? 'bg-amber-400/10 text-amber-300' : 'bg-cyan-500/10 text-cyan-300'}`}>
      {icon}
    </div>
    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
    <div className="text-lg font-bold text-slate-100 mt-1">{value}</div>
    <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{detail}</div>
  </div>
);

export const InfoBlock: React.FC<{ label: string; value: string; wide?: boolean }> = ({ label, value, wide }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-lg p-3 ${wide ? 'md:col-span-2' : ''}`}>
    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">{label}</div>
    <div className="text-xs text-slate-200 leading-relaxed">{value || '无'}</div>
  </div>
);
