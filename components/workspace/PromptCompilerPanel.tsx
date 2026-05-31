import React from 'react';
import { Activity } from 'lucide-react';
import { CompileMode, PromptCompilation } from '../../types';
import { Panel } from '../ops/OpsPrimitives';

interface PromptCompilerPanelProps {
  compileMode: CompileMode;
  compilation: PromptCompilation | null;
  onModeChange: (mode: CompileMode) => void;
}

const compileModes: CompileMode[] = ['readable', 'strict', 'tool-ready', 'agent-ready', 'eval-ready'];

export const PromptCompilerPanel: React.FC<PromptCompilerPanelProps> = ({ compileMode, compilation, onModeChange }) => (
  <Panel title="3. PromptIR 编译" icon={<Activity size={18} className="text-emerald-300" />}>
    <div className="flex flex-wrap gap-2 mb-3">
      {compileModes.map(mode => (
        <button key={mode} onClick={() => onModeChange(mode)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${compileMode === mode ? 'bg-emerald-400 text-slate-950 border-emerald-300' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}>
          {mode}
        </button>
      ))}
    </div>
    {compilation ? (
      <div className="space-y-3">
        {compilation.warnings.length > 0 && (
          <div className="bg-amber-400/10 border border-amber-300/20 rounded-lg p-3 text-xs text-amber-100">
            {compilation.warnings.join('；')}
          </div>
        )}
        <pre className="max-h-[460px] overflow-auto custom-scrollbar whitespace-pre-wrap break-words bg-slate-900 border border-slate-800 rounded-lg p-4 text-[11px] leading-relaxed text-slate-300">{compilation.compiledPrompt}</pre>
      </div>
    ) : (
      <div className="text-sm text-slate-500 bg-slate-900 border border-slate-800 rounded-lg p-5">
        先生成任务卡，再点击“编译 PromptIR”。后端在线时使用 API，离线时自动使用本地编译器。
      </div>
    )}
  </Panel>
);
