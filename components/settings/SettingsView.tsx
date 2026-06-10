import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Database, FileText, KeyRound, ShieldCheck, Store, UploadCloud, Workflow } from 'lucide-react';
import { ApprovalRequest, CapabilityCheck, CapabilityStatus, OnlineExperiment, PromptAsset, TeamSpace, ToolAdapterSummary, ToolExecutionResult } from '../../types';
import { bootstrapTeamSpaceRemote, createApprovalRequestRemote, createOnlineExperimentRemote, executeToolRemote, getCapabilityCheck, getToolAdaptersRemote, trackOnlineExperimentRemote } from '../../services/apiClient';
import { InfoBlock, Panel, StatusCard } from '../ops/OpsPrimitives';
import { Badge, Button, PageHeader, StatusPill } from '../ui/DesignSystem';
import { ASSET_TYPE_LABELS } from '../../services/library';

interface SettingsViewProps {
  assets: PromptAsset[];
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
  'promptmaster_asset_patches_v1',
  'promptmaster_capability_packs_v1',
  'promptmaster_market_items_v1',
  'promptmaster_remote_market_items_v1',
  'promptmaster_market_accounts_v1',
  'promptmaster_market_orders_v1',
  'promptmaster_evaluator_results_v1',
  'promptmaster_benchmark_runs_v1',
  'promptmaster_team_spaces_v1',
  'promptmaster_approval_requests_v1',
  'promptmaster_online_experiments_v1'
];

const capabilityStatusOrder: CapabilityStatus[] = ['context_only', 'schema_ready', 'testable', 'connected', 'executable'];

const capabilityStatusCopy: Record<CapabilityStatus, { label: string; description: string }> = {
  context_only: {
    label: '仅上下文',
    description: '只参与提示词上下文，不代表可连接或可运行。'
  },
  schema_ready: {
    label: '结构就绪',
    description: '结构字段完整，可用于提示词优化和校验，但不代表运行时已连接。'
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

export const SettingsView: React.FC<SettingsViewProps> = ({ assets, assetCount, directionCount, historyCount }) => {
  const [capability, setCapability] = useState<CapabilityCheck | null>(null);
  const [adapters, setAdapters] = useState<ToolAdapterSummary[]>([]);
  const [selectedAdapterId, setSelectedAdapterId] = useState('tool.json_extract');
  const [selectedToolAssetId, setSelectedToolAssetId] = useState('synthetic');
  const [toolInput, setToolInput] = useState('{\n  "adapterId": "tool.json_extract",\n  "json": { "a": { "b": 1 } },\n  "path": "a.b"\n}');
  const [toolConfirm, setToolConfirm] = useState(false);
  const [toolResult, setToolResult] = useState<ToolExecutionResult | null>(null);
  const [teamName, setTeamName] = useState('本地 PromptOps 团队空间');
  const [teamResult, setTeamResult] = useState<TeamSpace | null>(null);
  const [approvalResult, setApprovalResult] = useState<ApprovalRequest | null>(null);
  const [experimentName, setExperimentName] = useState('资产注入版本线上实验草稿');
  const [experimentResult, setExperimentResult] = useState<OnlineExperiment | null>(null);
  const [opsNotice, setOpsNotice] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    getCapabilityCheck().then(setCapability).catch(() => setCapability(null));
    getToolAdaptersRemote().then((items) => {
      setAdapters(items);
      if (items[0]) setSelectedAdapterId(items[0].id);
    }).catch(() => setAdapters([]));
  }, []);

  const capabilityUnavailable = capability === null;
  const modelConfigured = Boolean(capability?.model?.configured);
  const modelStatus = safeCapabilityStatus(capability?.model?.status || (modelConfigured ? 'testable' : 'context_only'));
  const backendOk = Boolean(capability?.backend?.ok);
  const stateStatus = capability?.backend?.state;
  const marketStatus = capability?.market;
  const importStatus = capability?.imports;
  const executionStatus = capability?.execution;
  const modelValue = capabilityUnavailable ? '未检测' : modelStatus === 'connected' ? '已连通' : modelConfigured ? '待修复' : '缺密钥';
  const modelDetail = capabilityUnavailable
    ? '后端未返回能力检测；模型运行按安全预览处理。'
    : capability?.model?.message || '等待后端能力检测';
  const modelProvider = capability?.model?.provider || 'openai-compatible';
  const modelTlsState = capability?.model?.tlsRejectUnauthorized === false
    ? '当前模型网关请求已临时关闭 TLS 证书校验；只建议用于本地开发或自建网关证书链未修复时。'
    : '默认校验 TLS 证书链；若自建网关证书链不完整，请优先修复证书。';
  const executableAssetCandidates = useMemo(
    () => assets.filter(asset => ['mcp', 'sdk', 'tool', 'connector', 'parser'].includes(asset.type)),
    [assets]
  );
  const selectedAdapter = adapters.find(adapter => adapter.id === selectedAdapterId);
  const selectedToolAsset = executableAssetCandidates.find(asset => asset.id === selectedToolAssetId);

  const handleAdapterChange = (adapterId: string) => {
    setSelectedAdapterId(adapterId);
    setToolInput(defaultToolInput(adapterId));
    setToolResult(null);
  };

  const handleExecuteTool = async () => {
    setIsBusy(true);
    setOpsNotice('');
    try {
      const parsedInput = JSON.parse(toolInput || '{}');
      const adapter = adapters.find(item => item.id === selectedAdapterId);
      const asset = selectedToolAsset || createSyntheticToolAsset(adapter || selectedAdapterId);
      const result = await executeToolRemote({
        asset,
        input: { adapterId: selectedAdapterId, ...parsedInput },
        confirm: toolConfirm
      });
      setToolResult(result);
      setOpsNotice(result.message);
    } catch (error) {
      setOpsNotice(`工具执行请求失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleBootstrapTeam = async () => {
    setIsBusy(true);
    setOpsNotice('');
    try {
      const team = await bootstrapTeamSpaceRemote({
        name: teamName,
        summary: '由设置页创建的本地团队协作空间，用于验证成员、角色、内部市场和审批流契约。',
        assetIds: assets.slice(0, 8).map(asset => asset.id)
      });
      setTeamResult(team);
      setOpsNotice(`团队空间已创建：${team.name}`);
    } catch (error) {
      setOpsNotice(`团队空间创建失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateApproval = async () => {
    if (!teamResult) {
      setOpsNotice('请先创建团队空间，再提交审批请求。');
      return;
    }
    const targetAsset = assets[0];
    if (!targetAsset) {
      setOpsNotice('当前没有资产可提交审批。');
      return;
    }
    setIsBusy(true);
    setOpsNotice('');
    try {
      const approval = await createApprovalRequestRemote({
        teamId: teamResult.id,
        targetKind: 'asset',
        targetId: targetAsset.id,
        requestedBy: teamResult.members[0]?.email || 'local-user',
        comment: `请求审核资产：${targetAsset.title}`
      });
      setApprovalResult(approval);
      setOpsNotice(`审批请求已创建：${approval.id}`);
    } catch (error) {
      setOpsNotice(`审批请求创建失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateExperiment = async () => {
    setIsBusy(true);
    setOpsNotice('');
    try {
      const experiment = await createOnlineExperimentRemote({
        name: experimentName,
        variants: [
          { id: 'baseline', name: 'Baseline Prompt', weight: 50 },
          { id: 'asset_variant', name: 'Asset Injected Prompt', weight: 50 }
        ],
        metrics: ['manual_win', 'quality_score', 'conversion']
      });
      setExperimentResult(experiment);
      setOpsNotice(`线上实验契约已创建：${experiment.name}`);
    } catch (error) {
      setOpsNotice(`线上实验创建失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleTrackExperiment = async () => {
    if (!experimentResult) return;
    setIsBusy(true);
    setOpsNotice('');
    try {
      const updated = await trackOnlineExperimentRemote({
        experimentId: experimentResult.id,
        variantId: 'asset_variant',
        metric: 'manual_win',
        value: 1
      });
      setExperimentResult(updated);
      setOpsNotice(`已写入实验事件，当前事件数 ${updated.events.length}。`);
    } catch (error) {
      setOpsNotice(`实验事件写入失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsBusy(false);
    }
  };

  return (
  <div className="h-full overflow-y-auto custom-scrollbar bg-zinc-950">
    <PageHeader
      eyebrow="Settings"
      title="设置与运行边界"
      description="展示后端 state、统一模型网关和工具类资产能力状态。不可用能力不会伪装成可执行。"
      actions={<div className="flex flex-wrap gap-2"><StatusPill status={backendOk ? 'online' : 'offline'} /><StatusPill status={modelStatus === 'connected' ? 'connected' : modelConfigured ? 'testable' : 'missing_provider_config'} /></div>}
    />
    <div className="max-w-7xl mx-auto p-4 lg:p-5 space-y-6">

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatusCard icon={<Database size={18} />} label="后端 API" value={backendOk ? '在线' : '待检测'} tone={backendOk ? 'good' : 'warn'} detail={capability?.backend?.apiBaseUrl || '等待本地 API 能力检测'} />
        <StatusCard icon={<ShieldCheck size={18} />} label="模型网关" value={modelValue} tone={modelStatus === 'connected' ? 'good' : 'warn'} detail={`${modelProvider} · ${modelDetail}`} />
        <StatusCard icon={<Database size={18} />} label="本地 State" value={stateStatus?.mode === 'backend_json' ? 'JSON State' : '兜底模式'} tone={stateStatus?.ok ? 'good' : 'neutral'} detail={stateStatus?.message || '后端 state 未返回时保留 localStorage 兼容说明'} />
        <StatusCard icon={<Store size={18} />} label="市场模式" value={marketStatus?.mode === 'remote' ? '远程契约' : marketStatus?.mode === 'local' ? '本地市场' : '未配置'} tone={marketStatus?.configured ? 'neutral' : 'warn'} detail={marketStatus?.message || '默认不启用远程市场账号'} />
        <StatusCard icon={<Workflow size={18} />} label="工具执行" value={executionStatus?.toolExecutionAllowed ? '可执行' : '不可执行'} tone={executionStatus?.toolExecutionAllowed ? 'good' : 'warn'} detail={executionStatus?.message || 'MCP/SDK/Tool/Connector 默认仅作为上下文'} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Panel title="前后端与文档库分离" icon={<Database size={18} className="text-zinc-400" />}>
          <div className="space-y-3">
            <InfoBlock label="前端" value="React + Vite 负责工作台、资产库、构建器、Run Lab、反馈洞察和本地状态。" />
            <InfoBlock label="后端" value="Node 本地 API 负责 docs 索引、任务分析、提示词优化辅助、反馈诊断和 JSON 状态接口。" />
            <InfoBlock label="文档库" value="docs/ 保存产品方案、提示词工程知识、资产包规格和实施计划。" />
          </div>
        </Panel>

        <Panel title="环境变量" icon={<KeyRound size={18} className="text-zinc-400" />}>
          <div className="space-y-3">
            <InfoBlock label="LLM_MODEL" value="默认 gpt-5.5；如你的模型网关使用其他模型名，可在 .env.local 中修改。" />
            <InfoBlock label="LLM_BASE_URL / LLM_API_KEY" value={capabilityUnavailable ? '后端未返回能力检测：暂按未配置处理，Run Lab 只做安全预览。' : modelStatus === 'connected' ? '已真实连通：工作台、Run Lab、Evaluator 和 Builder Agent 可尝试真实模型调用。' : modelConfigured ? '已填写但探测失败：请修复 base URL、key、模型名或网络后再运行。' : '未配置：模型相关能力将明确降级为安全预览或本地草稿。'} />
            <InfoBlock label="LLM_CANDIDATE_MODELS" value="Run Lab 多模型实验候选列表，用英文逗号分隔；默认跟随 LLM_MODEL。" />
            <InfoBlock label="MODEL_TLS_REJECT_UNAUTHORIZED" value={modelTlsState} />
            <InfoBlock label="ENABLE_TOOL_EXECUTION" value="默认 false。开启后仍要求资产 executable、绑定 adapter，并由用户显式确认。" />
            <InfoBlock label="API_PORT" value={`默认 8787；当前检测地址：${capability?.backend?.apiBaseUrl || '等待后端返回'}`} />
            <InfoBlock label="VITE_API_BASE_URL" value="默认 http://127.0.0.1:8787，前端用于调用本地 API；修改端口时需要同步。" />
          </div>
        </Panel>

        <Panel title="能力状态" icon={<ShieldCheck size={18} className="text-zinc-400" />}>
          <div className="space-y-3">
            <InfoBlock label="模型" value={`${capabilityStatusCopy[modelStatus].label}：${capability?.model?.message || capabilityStatusCopy[modelStatus].description}`} />
            <InfoBlock label="模型 TLS" value={modelTlsState} />
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
            <InfoBlock label="模型运行" value={capabilityUnavailable ? '后端能力检测不可用；工作台和 Run Lab 暂按安全预览处理。' : modelStatus === 'connected' ? '统一模型网关已真实连通；工作台、Run Lab 和 Evaluator 可尝试真实模型调用。' : modelConfigured ? '模型网关配置存在但真实探测失败；工作台不会生成本地降级草稿。' : '缺少 LLM_BASE_URL 或 LLM_API_KEY；工作台和 Run Lab 降级为安全预览。'} />
            <InfoBlock label="市场" value={marketStatus?.message || '本地市场模式；不代表远程账号、审核或执行权限。'} />
            <InfoBlock label="导入" value={importStatus?.message || '文件、JSON、外部链接和市场导入默认作为上下文或 schema 使用。'} />
            <InfoBlock label="执行确认" value={executionStatus?.requiresExplicitConfirmation ? '任何真实 MCP/SDK/Tool/Connector 执行都需要配置检测和用户显式确认。' : '未返回执行确认状态，按不可执行处理。'} wide />
            <InfoBlock label="不可直接提升" value="context_only 或 schema_ready 只能参与提示词优化和校验；未检测到连接证据时，设置页不提供提升为 executable 的入口。" wide />
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

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6">
        <Panel title="Tool / MCP / SDK Adapter 测试台" icon={<Activity size={18} className="text-zinc-400" />}>
          <div className="space-y-3">
            {opsNotice && (
              <div className="rounded-md border border-teal-900/60 bg-teal-950/25 px-3 py-2 text-xs leading-relaxed text-teal-100">
                {opsNotice}
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select value={selectedAdapterId} onChange={(event) => handleAdapterChange(event.target.value)} className="field-input">
                {adapters.length === 0 && <option value="tool.json_extract">tool.json_extract</option>}
                {adapters.map(adapter => (
                  <option key={adapter.id} value={adapter.id}>{adapter.id} · {adapter.enabled ? 'enabled' : 'disabled'}</option>
                ))}
              </select>
              <select value={selectedToolAssetId} onChange={(event) => setSelectedToolAssetId(event.target.value)} className="field-input">
                <option value="synthetic">临时 executable 测试资产</option>
                {executableAssetCandidates.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.title} · {ASSET_TYPE_LABELS[asset.type]} · {asset.status || 'context_only'}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <InfoBlock label="Adapter" value={selectedAdapter?.label || selectedAdapterId} />
              <InfoBlock label="风险" value={selectedAdapter?.risk || 'unknown'} />
              <InfoBlock label="状态" value={selectedAdapter?.enabled ? '已启用' : '未启用或缺配置'} />
            </div>
            <textarea
              value={toolInput}
              onChange={(event) => setToolInput(event.target.value)}
              className="field-input min-h-[180px] resize-y font-mono text-xs leading-relaxed"
              placeholder={selectedAdapter?.inputHint || '{ }'}
            />
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input type="checkbox" checked={toolConfirm} onChange={(event) => setToolConfirm(event.target.checked)} />
              我确认本次 adapter 调用可以真实执行；写操作和高风险工具仍应由后端拒绝或降级。
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={handleExecuteTool} disabled={isBusy} icon={<Activity size={16} />}>执行 / Dry-run</Button>
              <Badge tone={capability?.execution?.toolExecutionAllowed ? 'good' : 'warn'}>
                ENABLE_TOOL_EXECUTION={String(Boolean(capability?.execution?.toolExecutionAllowed))}
              </Badge>
              {(capability?.execution?.adapterAllowlist || []).map(adapter => <Badge key={adapter} tone="muted">{adapter}</Badge>)}
            </div>
            {toolResult && (
              <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-zinc-800 bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-300 custom-scrollbar">
                {JSON.stringify(toolResult, null, 2)}
              </pre>
            )}
          </div>
        </Panel>

        <Panel title="团队与线上实验契约" icon={<Workflow size={18} className="text-zinc-400" />}>
          <div className="space-y-4">
            <div className="space-y-2">
              <input value={teamName} onChange={(event) => setTeamName(event.target.value)} className="field-input" placeholder="团队空间名称" />
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleBootstrapTeam} disabled={isBusy} icon={<ShieldCheck size={16} />}>创建团队空间</Button>
                <Button onClick={handleCreateApproval} disabled={isBusy || !teamResult || assets.length === 0} icon={<ShieldCheck size={16} />}>提交资产审批</Button>
              </div>
              {teamResult && (
                <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-400">
                  {teamResult.name} · {teamResult.members.length} 成员 · {teamResult.assetIds.length} 资产 · 内部市场 {teamResult.internalMarketEnabled ? '开启' : '关闭'}
                </div>
              )}
              {approvalResult && (
                <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-400">
                  审批 {approvalResult.id} · {approvalResult.status} · target {approvalResult.targetKind}:{approvalResult.targetId}
                </div>
              )}
            </div>
            <div className="border-t border-zinc-900 pt-4 space-y-2">
              <input value={experimentName} onChange={(event) => setExperimentName(event.target.value)} className="field-input" placeholder="线上实验名称" />
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleCreateExperiment} disabled={isBusy} icon={<Activity size={16} />}>创建实验契约</Button>
                <Button onClick={handleTrackExperiment} disabled={isBusy || !experimentResult} icon={<Activity size={16} />}>写入一次胜出事件</Button>
              </div>
              {experimentResult && (
                <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-400">
                  {experimentResult.name} · {experimentResult.status} · variants {experimentResult.variants.length} · events {experimentResult.events.length}
                </div>
              )}
            </div>
            <InfoBlock label="边界说明" value={`${capability?.collaboration?.message || '团队协作当前为本地 state 契约。'} ${capability?.experiments?.message || '线上实验当前为本地 state 契约。'}`} />
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
            <InfoBlock label="备份对象" value="资产、方向、任务模型、优化版本记录、运行记录、反馈事件、资产补丁、能力包、市场条目、评估结果、Benchmark 和团队空间都属于本地 JSON state。" />
            <InfoBlock label="迁移方式" value="优先使用资产库或能力包的 JSON 导入导出；必要时备份 data/ 下对应 collection JSON 文件。" />
            <InfoBlock label="降级策略" value="后端 state 不可用时，前端仍可读取兼容 localStorage keys；恢复后再同步到后端 state。" />
          </div>
        </Panel>
      </section>

      <section>
        <Panel title="远程市场与团队边界" icon={<Store size={18} className="text-zinc-400" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InfoBlock label="团队空间" value="当前只预留 teamSpaces 本地 JSON state；成员、角色、权限、组织内审核需要云端账号系统。" />
            <InfoBlock label="远程市场" value="本地市场已支持发布、审核状态、评论评分和安装；跨用户下载、远程同步、审核后台仍需云端服务。" />
            <InfoBlock label="支付能力" value="市场条目已保留免费/付费占位字段；真实支付、订单、结算和退款必须接入支付服务后再启用。" />
          </div>
        </Panel>
      </section>

      {capabilityUnavailable && (
        <section>
          <Panel title="降级模式" icon={<ShieldCheck size={18} className="text-zinc-400" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoBlock label="后端检测" value="当前没有拿到 `/api/capabilities/check` 响应，设置页保留静态说明和本地缓存信息。" />
              <InfoBlock label="模型运行" value="无法确认 provider 配置时，默认不执行模型调用，只显示安全预览或安全降级文案。" />
              <InfoBlock label="工具能力" value="未知 MCP/SDK/Tool/Connector 状态全部按 context_only 处理，不显示真实执行入口。" />
            </div>
          </Panel>
        </section>
      )}
    </div>
  </div>
  );
};

const defaultToolInput = (adapterId: string): string => {
  if (adapterId === 'tool.ripgrep') return '{\n  "pattern": "MODEL_BASE_URL",\n  "cwd": ".",\n  "glob": "*.ts",\n  "maxResults": 20\n}';
  if (adapterId === 'tool.http_get') return '{\n  "url": "https://example.com",\n  "maxBytes": 4000\n}';
  if (adapterId === 'sdk.openai.chat') return '{\n  "prompt": "请用一句话回复 OK。",\n  "temperature": 0.2\n}';
  if (adapterId === 'mcp.stdio.call') return '{\n  "command": "node path/to/mcp-server.mjs",\n  "toolName": "tool_name",\n  "arguments": {}\n}';
  return '{\n  "json": { "a": { "b": 1 } },\n  "path": "a.b"\n}';
};

const createSyntheticToolAsset = (adapter: ToolAdapterSummary | string): PromptAsset => {
  const adapterId = typeof adapter === 'string' ? adapter : adapter.id;
  const assetType = typeof adapter === 'string' ? 'tool' : adapter.assetTypes[0] || 'tool';
  const now = Date.now();
  return {
    id: `settings_tool_asset_${now.toString(36)}`,
    type: assetType,
    title: `临时 Adapter 测试资产：${adapterId}`,
    summary: '设置页生成的临时 executable 测试资产，不会写入资产库。',
    content: `adapterId: ${adapterId}`,
    tags: ['settings', 'adapter-test'],
    useCases: ['验证本地 adapter 执行链路'],
    integration: {
      entryName: adapterId,
      capabilities: ['adapter execution test'],
      inputs: ['JSON input'],
      outputs: ['adapter result'],
      constraints: ['仅用于本地调试', '需要 ENABLE_TOOL_EXECUTION=true 和显式确认'],
      usageNotes: '临时测试资产只在本次请求中使用。'
    },
    examples: [],
    status: 'executable',
    qualityScore: 80,
    usageCount: 0,
    source: 'local',
    version: 1,
    createdAt: now,
    updatedAt: now
  };
};
