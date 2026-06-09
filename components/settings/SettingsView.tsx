import React, { useEffect, useState } from 'react';
import { Database, FileText, KeyRound, ShieldCheck } from 'lucide-react';
import { CapabilityCheck, CapabilityStatus } from '../../types';
import { getCapabilityCheck } from '../../services/apiClient';
import { InfoBlock, Panel, StatusCard } from '../ops/OpsPrimitives';
import { Badge, PageHeader, StatusPill } from '../ui/DesignSystem';

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

const capabilityStatusOrder: CapabilityStatus[] = ['context_only', 'schema_ready', 'testable', 'connected', 'executable'];

const capabilityStatusCopy: Record<CapabilityStatus, { label: string; description: string }> = {
  context_only: {
    label: '仅上下文',
    description: '只参与提示词上下文，不代表可连接或可运行。'
  },
  schema_ready: {
    label: '可编译',
    description: '结构字段完整，可用于编译和校验，但不代表运行时已连接。'
  },
  testable: {
    label: '可测试',
    description: '具备连接或格式测试条件，仍需明确配置后才能进入运行态。'
  },
  connected: {
    label: '已连接',
    description: '检测到运行时配置或连接证据，但真实执行仍需要确认门。'
  },
  executable: {
    label: '可执行',
    description: '配置、连接和用户确认都满足后，才允许进入真实执行流程。'
  }
};

const isCapabilityStatus = (value: unknown): value is CapabilityStatus =>
  typeof value === 'string' && capabilityStatusOrder.includes(value as CapabilityStatus);

const safeCapabilityStatus = (value: unknown): CapabilityStatus =>
  isCapabilityStatus(value) ? value : 'context_only';

const getToolingStatus = (
  capability: CapabilityCheck | null,
  type: 'mcp' | 'sdk' | 'tool' | 'connector'
): CapabilityStatus => safeCapabilityStatus(capability?.tooling?.[type]?.status || capability?.assets?.[type]);

export const SettingsView: React.FC<SettingsViewProps> = ({ assetCount, directionCount, historyCount }) => {
  const [capability, setCapability] = useState<CapabilityCheck | null>(null);

  useEffect(() => {
    getCapabilityCheck().then(setCapability).catch(() => setCapability(null));
  }, []);

  const modelConfigured = Boolean(capability?.model?.configured);
  const modelStatus = modelConfigured ? 'connected' : safeCapabilityStatus(capability?.model?.status);

  return (
  <div className="h-full overflow-y-auto custom-scrollbar bg-zinc-950">
    <PageHeader
      eyebrow="Settings"
      title="设置与运行边界"
      description="展示后端 state、模型密钥和工具类资产能力状态。不可用能力不会伪装成可执行。"
      actions={<StatusPill status={modelConfigured ? 'connected' : 'missing_provider_config'} />}
    />
    <div className="max-w-7xl mx-auto p-4 lg:p-5 space-y-6">

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <StatusCard icon={<Database size={18} />} label="资产" value={`${assetCount}`} tone="neutral" detail="Prompt / Skill / MCP / SDK / Workflow 等 16 类" />
        <StatusCard icon={<FileText size={18} />} label="优化方向" value={`${directionCount}`} tone="neutral" detail="内置方向 + 自定义方向" />
        <StatusCard icon={<Database size={18} />} label="历史" value={`${historyCount}`} tone="neutral" detail="兼容 promptmaster_history_v2" />
        <StatusCard icon={<ShieldCheck size={18} />} label="模型运行" value={modelConfigured ? '已配置' : '缺密钥'} tone={modelConfigured ? 'good' : 'warn'} detail={capability?.model?.message || '等待后端能力检测'} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Panel title="前后端与文档库分离" icon={<Database size={18} className="text-zinc-400" />}>
          <div className="space-y-3">
            <InfoBlock label="前端" value="React + Vite 负责工作台、资产库、构建器、Run Lab、反馈洞察和本地状态。" />
            <InfoBlock label="后端" value="Node 本地 API 负责 docs 索引、任务分析、Prompt 编译、反馈诊断和 JSON 状态接口。" />
            <InfoBlock label="文档库" value="docs/ 保存产品方案、提示词工程知识、资产包规格和实施计划。" />
          </div>
        </Panel>

        <Panel title="环境变量" icon={<KeyRound size={18} className="text-zinc-400" />}>
          <div className="space-y-3">
            <InfoBlock label="GEMINI_API_KEY" value={modelConfigured ? '已配置：Run Lab 可尝试真实模型运行。' : '未配置：Run Lab 将明确降级为仅编译预览。'} />
            <InfoBlock label="API_PORT" value="默认 8787，本地后端监听 127.0.0.1。" />
            <InfoBlock label="VITE_API_BASE_URL" value="默认 http://127.0.0.1:8787，前端用于调用本地 API。" />
          </div>
        </Panel>

        <Panel title="能力状态" icon={<ShieldCheck size={18} className="text-zinc-400" />}>
          <div className="space-y-3">
            <InfoBlock label="模型" value={`${capabilityStatusCopy[modelStatus].label}：${capability?.model?.message || capabilityStatusCopy[modelStatus].description}`} />
            <InfoBlock label="MCP" value={`${capabilityStatusCopy[getToolingStatus(capability, 'mcp')].label}：${capability?.tooling?.mcp?.message || capabilityStatusCopy[getToolingStatus(capability, 'mcp')].description}`} />
            <InfoBlock label="SDK" value={`${capabilityStatusCopy[getToolingStatus(capability, 'sdk')].label}：${capability?.tooling?.sdk?.message || capabilityStatusCopy[getToolingStatus(capability, 'sdk')].description}`} />
            <InfoBlock label="Tool" value={`${capabilityStatusCopy[getToolingStatus(capability, 'tool')].label}：${capability?.tooling?.tool?.message || capabilityStatusCopy[getToolingStatus(capability, 'tool')].description}`} />
            <InfoBlock label="Connector" value={`${capabilityStatusCopy[getToolingStatus(capability, 'connector')].label}：${capability?.tooling?.connector?.message || capabilityStatusCopy[getToolingStatus(capability, 'connector')].description}`} />
            <div className="flex flex-wrap gap-2 pt-1">
              {capabilityStatusOrder.map(status => (
                <Badge key={status} tone={status === 'executable' || status === 'connected' ? 'good' : status === 'testable' ? 'warn' : status === 'schema_ready' ? 'accent' : 'muted'}>
                  {capabilityStatusCopy[status].label}
                </Badge>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="后端 State Collections" icon={<Database size={18} className="text-zinc-400" />}>
          <div className="flex flex-wrap gap-2">
            {(capability?.backend.stateCollections || []).map(collection => (
              <span key={collection} className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">{collection}</span>
            ))}
          </div>
        </Panel>

        <Panel title="本地存储 Keys" icon={<FileText size={18} className="text-zinc-400" />}>
          <div className="space-y-2 max-h-[360px] overflow-auto custom-scrollbar pr-1">
            {storageKeys.map(key => (
              <div key={key} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] text-zinc-400 font-mono break-all">
                {key}
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  </div>
  );
};
