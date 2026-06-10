import React from 'react';
import { AlertCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { CapabilityStatus } from '../../types';

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export const toneClasses = {
  neutral: 'border-zinc-800 bg-zinc-950 text-zinc-200',
  strong: 'border-zinc-700 bg-zinc-900 text-zinc-100',
  accent: 'border-teal-800/70 bg-teal-950/40 text-teal-100',
  good: 'border-emerald-800/70 bg-emerald-950/35 text-emerald-100',
  warn: 'border-amber-800/70 bg-amber-950/35 text-amber-100',
  danger: 'border-red-900/70 bg-red-950/35 text-red-100',
  muted: 'border-zinc-800 bg-zinc-950/70 text-zinc-400'
};

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
  type?: 'button' | 'submit';
}> = ({ children, onClick, disabled, icon, variant = 'secondary', className, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={cx(
      'inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-teal-700/50 disabled:cursor-not-allowed disabled:opacity-45',
      variant === 'primary' && 'bg-teal-500 text-zinc-950 hover:bg-teal-400',
      variant === 'secondary' && 'border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700',
      variant === 'ghost' && 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
      variant === 'danger' && 'border border-red-900/70 bg-red-950/40 text-red-100 hover:bg-red-950',
      className
    )}
  >
    {icon}
    {children}
  </button>
);

export const Panel: React.FC<{
  title?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, eyebrow, icon, actions, children, className }) => (
  <section className={cx('rounded-lg border border-zinc-800 bg-zinc-950/92 shadow-sm', className)}>
    {(title || eyebrow || actions) && (
      <div className="flex items-start justify-between gap-3 border-b border-zinc-900 px-4 py-3">
        <div className="min-w-0">
          {eyebrow && <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</div>}
          {title && <h3 className="mt-0.5 flex items-center gap-2 truncate text-sm font-semibold text-zinc-100">{icon}{title}</h3>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    )}
    <div className="p-4">{children}</div>
  </section>
);

export const PageHeader: React.FC<{
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}> = ({ title, description, eyebrow, actions }) => (
  <section className="flex flex-col gap-4 border-b border-zinc-900 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="min-w-0">
      {eyebrow && <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400/80">{eyebrow}</div>}
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">{title}</h2>
      {description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-500">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
  </section>
);

export const Badge: React.FC<{
  children: React.ReactNode;
  tone?: keyof typeof toneClasses;
  className?: string;
}> = ({ children, tone = 'neutral', className }) => (
  <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-semibold', toneClasses[tone], className)}>
    {children}
  </span>
);

export const StatusPill: React.FC<{ status?: CapabilityStatus | 'online' | 'offline' | 'preview_only' | 'completed' | 'failed' | 'missing_provider_config' }> = ({ status = 'context_only' }) => {
  const config: Record<string, { label: string; tone: keyof typeof toneClasses; icon: React.ReactNode }> = {
    context_only: { label: '仅上下文', tone: 'muted', icon: <Circle size={10} /> },
    schema_ready: { label: '结构就绪', tone: 'accent', icon: <CheckCircle2 size={12} /> },
    testable: { label: '可测试', tone: 'warn', icon: <AlertCircle size={12} /> },
    connected: { label: '已连接', tone: 'good', icon: <CheckCircle2 size={12} /> },
    executable: { label: '可执行', tone: 'good', icon: <CheckCircle2 size={12} /> },
    online: { label: '在线', tone: 'good', icon: <CheckCircle2 size={12} /> },
    offline: { label: '离线', tone: 'warn', icon: <AlertCircle size={12} /> },
    preview_only: { label: '仅预览', tone: 'warn', icon: <AlertCircle size={12} /> },
    completed: { label: '已完成', tone: 'good', icon: <CheckCircle2 size={12} /> },
    failed: { label: '失败', tone: 'danger', icon: <AlertCircle size={12} /> },
    missing_provider_config: { label: '缺配置', tone: 'warn', icon: <AlertCircle size={12} /> }
  };
  const item = config[status] || config.context_only;
  return <Badge tone={item.tone}>{item.icon}{item.label}</Badge>;
};

export const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <label className="block">
    <div className="mb-1 flex items-center justify-between gap-2">
      <span className="text-xs font-semibold text-zinc-300">{label}</span>
      {hint && <span className="text-[11px] text-zinc-500">{hint}</span>}
    </div>
    {children}
  </label>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center">
    <div className="text-sm font-semibold text-zinc-200">{title}</div>
    {description && <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const MetricCard: React.FC<{
  label: string;
  value: string;
  detail?: string;
  tone?: keyof typeof toneClasses;
  icon?: React.ReactNode;
}> = ({ label, value, detail, tone = 'neutral', icon }) => (
  <div className={cx('rounded-lg border p-3', toneClasses[tone])}>
    <div className="flex items-center justify-between gap-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      {icon && <div className="text-zinc-500">{icon}</div>}
    </div>
    <div className="mt-1 text-lg font-semibold text-zinc-50">{value}</div>
    {detail && <div className="mt-1 text-[11px] leading-relaxed text-zinc-500">{detail}</div>}
  </div>
);

export const LoadingInline: React.FC<{ label?: string }> = ({ label = '处理中' }) => (
  <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
    <Loader2 size={13} className="animate-spin" /> {label}
  </span>
);
