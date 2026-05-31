import React from 'react';
import { Database, FileText, KeyRound, Settings, ShieldCheck } from 'lucide-react';
import { InfoBlock, Panel, StatusCard } from '../ops/OpsPrimitives';

interface SettingsViewProps {
  assetCount: number;
  directionCount: number;
  historyCount: number;
}

const storageKeys = [
  'promptmaster_asset_library_v1',
  'promptmaster_directions_v1',
  'promptmaster_history_v2',
  'promptmaster_task_models_v1',
  'promptmaster_prompt_compilations_v1',
  'promptmaster_prompt_runs_v1',
  'promptmaster_feedback_events_v1',
  'promptmaster_asset_graph_v1',
  'promptmaster_asset_patches_v1'
];

export const SettingsView: React.FC<SettingsViewProps> = ({ assetCount, directionCount, historyCount }) => (
  <div className="h-full overflow-y-auto custom-scrollbar bg-slate-900/20">
    <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
      <section>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold mb-3">
          <Settings size={14} /> Local PromptOps Settings
        </div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Settings className="text-slate-300" /> 设置与运行边界
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-3xl">
          当前 2.0 版本保持本地优先：资产、方向、历史和 PromptOps 运行记录默认保存在浏览器 localStorage；后端只提供本地 API、文档索引和 JSON 状态能力。
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <StatusCard icon={<Database size={18} />} label="资产" value={`${assetCount}`} tone="neutral" detail="Prompt / Skill / MCP / SDK / Workflow 等 16 类" />
        <StatusCard icon={<FileText size={18} />} label="优化方向" value={`${directionCount}`} tone="neutral" detail="内置方向 + 自定义方向" />
        <StatusCard icon={<Database size={18} />} label="历史" value={`${historyCount}`} tone="neutral" detail="兼容 promptmaster_history_v2" />
        <StatusCard icon={<ShieldCheck size={18} />} label="MCP/SDK" value="上下文模式" tone="warn" detail="默认不真实执行工具或外部接口" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Panel title="前后端与文档库分离" icon={<Database size={18} className="text-cyan-300" />}>
          <div className="space-y-3">
            <InfoBlock label="前端" value="React + Vite 负责工作台、资产库、构建器、Run Lab、反馈洞察和本地状态。" />
            <InfoBlock label="后端" value="Node 本地 API 负责 docs 索引、任务分析、Prompt 编译、反馈诊断和 JSON 状态接口。" />
            <InfoBlock label="文档库" value="docs/ 保存产品方案、提示词工程知识、资产包规格和实施计划。" />
          </div>
        </Panel>

        <Panel title="环境变量" icon={<KeyRound size={18} className="text-amber-300" />}>
          <div className="space-y-3">
            <InfoBlock label="GEMINI_API_KEY" value="用于现有 Gemini 提示词优化、建议刷新、聊天和 A/B 测试。" />
            <InfoBlock label="API_PORT" value="默认 8787，本地后端监听 127.0.0.1。" />
            <InfoBlock label="VITE_API_BASE_URL" value="默认 http://127.0.0.1:8787，前端用于调用本地 API。" />
          </div>
        </Panel>

        <Panel title="本地存储 Keys" icon={<FileText size={18} className="text-emerald-300" />}>
          <div className="space-y-2 max-h-[360px] overflow-auto custom-scrollbar pr-1">
            {storageKeys.map(key => (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[11px] text-slate-400 font-mono break-all">
                {key}
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  </div>
);
