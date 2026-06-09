import React from 'react';
import { MetricCard, Panel as SystemPanel } from '../ui/DesignSystem';

export const Panel: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <SystemPanel title={title} icon={icon}>{children}</SystemPanel>
);

export const StatusCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: 'good' | 'warn' | 'neutral';
}> = ({ icon, label, value, detail, tone }) => <MetricCard icon={icon} label={label} value={value} detail={detail} tone={tone} />;

export const InfoBlock: React.FC<{ label: string; value: string; wide?: boolean }> = ({ label, value, wide }) => (
  <div className={`rounded-md border border-zinc-800 bg-zinc-950/70 p-3 ${wide ? 'md:col-span-2' : ''}`}>
    <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</div>
    <div className="text-xs leading-relaxed text-zinc-200">{value || '无'}</div>
  </div>
);
