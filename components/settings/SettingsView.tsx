import React, { useEffect, useState } from 'react';
import { Database, FileText, KeyRound, ShieldCheck, Store, UploadCloud, Workflow } from 'lucide-react';
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

const toneForStatus = (status: CapabilityStatus): 'good' | 'warn' | 'neutral' => {
  if (status === 'connected' || status === 'executable') return 'good';
  if (status === 'testable') return 'warn';
  return 'neutral';
};

export const SettingsView: React.FC<SettingsViewProps> = ({ assetCount, directionCount, historyCount }) => {
  const [capability, setCapability] = useState<CapabilityCheck | null>(null);

  useEffect(() => {
    getCapabilityCheck().then(setCapability).catch(() => setCapability(null));
  }, []);

  const capabilityUnavailable = capability === null;
  const modelConfigured = Boolean(capability?.model?.configured);
  const modelStatus = modelConfigured ? 'connected' : safeCapabilityStatus(capability?.model?.status);
  const backendOk = Boolean(capability?.backend?.ok);
  const stateStatus = capability?.backend?.state;
  const marketStatus = capability?.market;
  const importStatus = capability?.imports;
  const executionStatus = capability?.execution;
  const modelValue = capabilityUnavailable ? '未检测' : modelConfigured ? '已配置' : '缺密钥';
  const modelDetail = capabilityUnavailable
    ? '后端未返回能力检测；模型运行按仅编译预览处理。'
    : capability?.model?.message || '等待后端能力检测';

  return (
  <div className="h-full overflow-y-auto custom-scrollbar bg-zinc-950">
    <PageHeader
      eyebrow="Settings"
      title="设置与运行边界"
      description="展示后端 state、模型密钥和工具类资产能力状态。不可用能力不会伪装成可执行。"
      actions={<div className="flex flex-wrap gap-2"><StatusPill status={backendOk ? 'online' : 'offline'} /><StatusPill status={modelConfigured ? 'connected' : 'missing_provider_config'} /></div>}
    />
    <div className="max-w-7xl mx-auto p-4 lg:p-5 space-y-6">

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatusCard icon={<Database size={18} />} label="后端 API" value={backendOk ? '在线' : '待检测'} tone={backendOk ? 'good' : 'warn'} detail={capability?.backend?.apiBaseUrl || '等待本地 API 能力检测'} />
        <StatusCard icon={<ShieldCheck size={18} />} label="模型 Provider" value={modelValue} tone={modelConfigured ? 'good' : 'warn'} detail={modelDetail} />
        <StatusCard icon={<Database size={18} />} label="本地 State" value={stateStatus?.mode === 'backend_json' ? 'JSON State' : '兜底模式'} tone={stateStatus?.ok ? 'good' : 'neutral'} detail={stateStatus?.message || '后端 state 未返回时保留 localStorage 兼容说明'} />
        <StatusCard icon={<Store size={18} />} label="市场模式" value={marketStatus?.mode === 'local' ? '本地市场' : '未配置'} tone={marketStatus?.configured ? 'neutral' : 'warn'} detail={marketStatus?.message || '默认不启用远程市场账号'} />
        <StatusCard icon={<Workflow size={18} />} label="工具执行" value={executionStatus?.toolExecutionAllowed ? '可执行' : '不可执行'} tone={executionStatus?.toolExecutionAllowed ? 'good' : 'warn'} detail={executionStatus?.message || 'MCP/SDK/Tool/Connector 默认仅作为上下文'} />
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
            <InfoBlock label="GEMINI_API_KEY" value={capabilityUnavailable ? '后端未返回能力检测：暂按未配置处理，Run Lab 仅编译预览。' : modelConfigured ? '已配置：Run Lab 可尝试真实模型运行。' : '未配置：Run Lab 将明确降级为仅编译预览。'} />
            <InfoBlock label="API_PORT" value={`默认 8787；当前检测地址：${capability?.backend?.apiBaseUrl || '等待后端返回'}`} />
            <InfoBlock label="VITE_API_BASE_URL" value="默认 http://127.0.0.1:8787，前端用于调用本地 API；修改端口时需要同步。" />
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
        <Panel title="运行边界总览" icon={<ShieldCheck size={18} className="text-zinc-400" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoBlock label="后端 API" value={backendOk ? `已连接 ${capability?.backend?.apiBaseUrl || ''}` : '未检测到后端能力；设置页保留静态边界说明。'} />
            <InfoBlock label="模型运行" value={capabilityUnavailable ? '后端能力检测不可用；工作台和 Run Lab 暂按仅编译预览处理。' : modelConfigured ? '模型 provider 已连接；Run Lab 可尝试真实模型调用。' : '缺少 GEMINI_API_KEY；工作台和 Run Lab 降级为仅编译预览。'} />
            <InfoBlock label="市场" value={marketStatus?.message || '本地市场模式；不代表远程账号、审核或执行权限。'} />
            <InfoBlock label="导入" value={importStatus?.message || '文件、JSON、外部链接和市场导入默认作为上下文或 schema 使用。'} />
            <InfoBlock label="执行确认" value={executionStatus?.requiresExplicitConfirmation ? '任何真实 MCP/SDK/Tool/Connector 执行都需要配置检测和用户显式确认。' : '未返回执行确认状态，按不可执行处理。'} wide />
            <InfoBlock label="不可直接提升" value="context_only 或 schema_ready 只能参与编译和校验；未检测到连接证据时，设置页不提供提升为 executable 的入口。" wide />
            <InfoBlock label="缺失配置" value={(executionStatus?.missingConfiguration || ['MCP/SDK/Tool/Connector runtime']).join('、')} wide />
          </div>
        </Panel>

        <Panel title="工具运行状态" icon={<Workflow size={18} className="text-zinc-400" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(['mcp', 'sdk', 'tool', 'connector'] as const).map(type => {
              const status = getToolingStatus(capability, type);
              const detail = capability?.tooling?.[type]?.message || capabilityStatusCopy[status].description;
              return (
                <div key={type} className="rounded-md border border-zinc-800 bg-zinc-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold uppercase text-zinc-300">{type}</div>
                    <StatusPill status={status} />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">{detail}</p>
                </div>
              );
            })}
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="后端 State Collections" icon={<Database size={18} className="text-zinc-400" />}>
          <div className="space-y-3">
            <InfoBlock label="主存储" value={stateStatus?.message || '后端 JSON state 是主要持久化入口；不可用时前端保留 localStorage 兼容缓存。'} />
            <div className="flex flex-wrap gap-2">
              {(capability?.backend.stateCollections || stateStatus?.collections || []).map(collection => (
                <span key={collection} className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">{collection}</span>
              ))}
            </div>
            {!(capability?.backend.stateCollections || stateStatus?.collections || []).length && (
              <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-500">暂无后端 collection 返回，按本地兼容缓存处理。</div>
            )}
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

      <section>
        <Panel title="数据备份与导入导出" icon={<UploadCloud size={18} className="text-zinc-400" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InfoBlock label="备份对象" value="资产、方向、任务模型、编译记录、运行记录、反馈事件、资产补丁和资产图谱都属于本地 JSON state。" />
            <InfoBlock label="迁移方式" value="优先使用资产库或能力包的 JSON 导入导出；必要时备份 data/ 下对应 collection JSON 文件。" />
            <InfoBlock label="降级策略" value="后端 state 不可用时，前端仍可读取兼容 localStorage keys；恢复后再同步到后端 state。" />
          </div>
        </Panel>
      </section>

      {capabilityUnavailable && (
        <section>
          <Panel title="降级模式" icon={<ShieldCheck size={18} className="text-zinc-400" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoBlock label="后端检测" value="当前没有拿到 `/api/capabilities/check` 响应，设置页保留静态说明和本地缓存信息。" />
              <InfoBlock label="模型运行" value="无法确认 provider 配置时，默认不执行模型调用，只显示编译预览或安全降级文案。" />
              <InfoBlock label="工具能力" value="未知 MCP/SDK/Tool/Connector 状态全部按 context_only 处理，不显示真实执行入口。" />
            </div>
          </Panel>
        </section>
      )}
    </div>
  </div>
  );
};
