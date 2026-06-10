import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, ShieldCheck, Users, Workflow, XCircle } from 'lucide-react';
import { ApprovalRequest, CapabilityPack, PromptAsset, TeamSpace, ToolAdapterSummary, ToolExecutionResult } from '../../types';
import { bootstrapTeamSpaceRemote, createApprovalRequestRemote, executeToolRemote, getToolAdaptersRemote } from '../../services/apiClient';
import { useTeamOps } from '../../hooks/useTeamOps';
import { ASSET_TYPE_LABELS } from '../../services/library';
import { Badge, Button, EmptyState, Field, MetricCard, PageHeader, Panel, StatusPill } from '../ui/DesignSystem';
import { InfoBlock } from '../ops/OpsPrimitives';

interface GovernanceWorkbenchProps {
  assets: PromptAsset[];
  packs: CapabilityPack[];
}

export const GovernanceWorkbench: React.FC<GovernanceWorkbenchProps> = ({ assets, packs }) => {
  const {
    teamSpaces,
    saveTeamSpace,
    approvalRequests,
    saveApprovalRequest,
    updateApprovalRequest,
    backendReady,
    backendError
  } = useTeamOps();
  const [adapters, setAdapters] = useState<ToolAdapterSummary[]>([]);
  const [teamName, setTeamName] = useState('PromptOps 内部能力团队');
  const [ownerEmail, setOwnerEmail] = useState('owner@local.promptmaster');
  const [activeTeamId, setActiveTeamId] = useState('');
  const [targetKind, setTargetKind] = useState<ApprovalRequest['targetKind']>('asset');
  const [targetId, setTargetId] = useState(assets[0]?.id || '');
  const [approvalComment, setApprovalComment] = useState('请求审核后发布到内部市场。');
  const [adapterId, setAdapterId] = useState('tool.json_extract');
  const [toolAssetId, setToolAssetId] = useState('synthetic');
  const [toolInput, setToolInput] = useState(defaultToolInput('tool.json_extract'));
  const [toolConfirm, setToolConfirm] = useState(false);
  const [toolResult, setToolResult] = useState<ToolExecutionResult | null>(null);
  const [notice, setNotice] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    getToolAdaptersRemote().then(items => {
      setAdapters(items);
      if (items[0]) {
        setAdapterId(items[0].id);
        setToolInput(defaultToolInput(items[0].id));
      }
    }).catch(() => setAdapters([]));
  }, []);

  useEffect(() => {
    if (!activeTeamId && teamSpaces[0]) setActiveTeamId(teamSpaces[0].id);
  }, [activeTeamId, teamSpaces]);

  useEffect(() => {
    if (targetKind === 'asset') setTargetId(assets[0]?.id || '');
    if (targetKind === 'capability_pack') setTargetId(packs[0]?.id || '');
  }, [assets, packs, targetKind]);

  const activeTeam = teamSpaces.find(team => team.id === activeTeamId) || teamSpaces[0];
  const executableAssets = useMemo(
    () => assets.filter(asset => ['mcp', 'sdk', 'tool', 'connector', 'parser'].includes(asset.type)),
    [assets]
  );
  const selectedAdapter = adapters.find(adapter => adapter.id === adapterId);
  const selectedToolAsset = executableAssets.find(asset => asset.id === toolAssetId);
  const pendingApprovals = approvalRequests.filter(request => request.status === 'pending');
  const activeTeamApprovals = activeTeam
    ? approvalRequests.filter(request => request.teamId === activeTeam.id)
    : approvalRequests;

  const handleCreateTeam = async () => {
    setIsBusy(true);
    setNotice('');
    try {
      const team = await bootstrapTeamSpaceRemote({
        name: teamName,
        ownerEmail,
        assetIds: assets.slice(0, 12).map(asset => asset.id),
        packIds: packs.slice(0, 8).map(pack => pack.id),
        summary: '用于团队资产共享、内部市场和审批流的本地协作空间。'
      });
      saveTeamSpace(team);
      setActiveTeamId(team.id);
      setNotice(`团队空间已创建：${team.name}`);
    } catch (error) {
      setNotice(`团队空间创建失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateApproval = async () => {
    if (!activeTeam) {
      setNotice('请先创建或选择团队空间。');
      return;
    }
    if (!targetId) {
      setNotice('请选择要提交审批的资产、能力包或市场条目。');
      return;
    }
    setIsBusy(true);
    setNotice('');
    try {
      const request = await createApprovalRequestRemote({
        teamId: activeTeam.id,
        targetKind,
        targetId,
        requestedBy: activeTeam.members[0]?.email || ownerEmail,
        comment: approvalComment
      });
      saveApprovalRequest(request);
      setNotice(`审批请求已创建：${request.id}`);
    } catch (error) {
      setNotice(`审批请求创建失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleAdapterChange = (nextAdapterId: string) => {
    setAdapterId(nextAdapterId);
    setToolInput(defaultToolInput(nextAdapterId));
    setToolResult(null);
  };

  const handleExecuteTool = async () => {
    setIsBusy(true);
    setNotice('');
    try {
      const parsed = JSON.parse(toolInput || '{}');
      const asset = selectedToolAsset || createSyntheticToolAsset(selectedAdapter || adapterId);
      const result = await executeToolRemote({
        asset,
        input: { adapterId, ...parsed },
        confirm: toolConfirm
      });
      setToolResult(result);
      setNotice(result.message);
    } catch (error) {
      setNotice(`工具执行失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 custom-scrollbar">
      <PageHeader
        eyebrow="Governance"
        title="协作治理"
        description="把团队空间、审批流和工具执行门控放到一个可操作页面；真实云端账号和组织权限接入前，所有记录先写入本地 JSON state。"
        actions={
          <>
            <StatusPill status={backendReady ? 'online' : 'offline'} />
            <Badge tone={backendReady ? 'good' : 'warn'}>{backendReady ? 'backend state' : backendError || 'local fallback'}</Badge>
          </>
        }
      />

      <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-5">
        {notice && (
          <div className="rounded-md border border-teal-900/60 bg-teal-950/25 px-4 py-3 text-sm text-teal-100">
            {notice}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="团队空间" value={`${teamSpaces.length}`} detail="teamSpaces" icon={<Users size={16} />} />
          <MetricCard label="待审批" value={`${pendingApprovals.length}`} detail="approvalRequests" icon={<ShieldCheck size={16} />} tone={pendingApprovals.length ? 'warn' : 'neutral'} />
          <MetricCard label="工具资产" value={`${executableAssets.length}`} detail="MCP / SDK / Tool" icon={<Activity size={16} />} />
          <MetricCard label="Adapters" value={`${adapters.length}`} detail={`${adapters.filter(adapter => adapter.enabled).length} enabled`} icon={<Workflow size={16} />} />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Panel title="团队空间与审批流" eyebrow="Team Ops" icon={<Users size={18} className="text-zinc-400" />}>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <div className="space-y-4">
                <Field label="团队空间名称">
                  <input value={teamName} onChange={(event) => setTeamName(event.target.value)} className="field-input" />
                </Field>
                <Field label="Owner 邮箱">
                  <input value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} className="field-input" />
                </Field>
                <Button variant="primary" onClick={handleCreateTeam} disabled={isBusy || !teamName.trim()} icon={<Users size={16} />}>创建团队空间</Button>

                <div className="border-t border-zinc-900 pt-4 space-y-3">
                  <Field label="选择团队">
                    <select value={activeTeam?.id || ''} onChange={(event) => setActiveTeamId(event.target.value)} className="field-input">
                      <option value="">暂无团队</option>
                      {teamSpaces.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                    </select>
                  </Field>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <InfoBlock label="成员" value={`${activeTeam?.members.length || 0}`} />
                    <InfoBlock label="内部市场" value={activeTeam?.internalMarketEnabled ? '开启' : '未开启'} />
                    <InfoBlock label="资产" value={`${activeTeam?.assetIds.length || 0}`} />
                    <InfoBlock label="能力包" value={`${activeTeam?.packIds.length || 0}`} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">提交审批</div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                    <select value={targetKind} onChange={(event) => setTargetKind(event.target.value as ApprovalRequest['targetKind'])} className="field-input">
                      <option value="asset">资产</option>
                      <option value="capability_pack">能力包</option>
                      <option value="market_item">市场条目</option>
                    </select>
                    <select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="field-input">
                      <option value="">选择目标...</option>
                      {targetKind === 'asset' && assets.map(asset => <option key={asset.id} value={asset.id}>{asset.title} · {ASSET_TYPE_LABELS[asset.type]}</option>)}
                      {targetKind === 'capability_pack' && packs.map(pack => <option key={pack.id} value={pack.id}>{pack.name}</option>)}
                      {targetKind === 'market_item' && <option value="market-item-placeholder">市场条目占位</option>}
                    </select>
                  </div>
                  <textarea value={approvalComment} onChange={(event) => setApprovalComment(event.target.value)} className="field-input mt-3 min-h-20 resize-y" />
                  <Button className="mt-3" onClick={handleCreateApproval} disabled={isBusy || !activeTeam || !targetId} icon={<ShieldCheck size={16} />}>提交审批</Button>
                </div>

                {activeTeamApprovals.length === 0 ? (
                  <EmptyState title="暂无审批请求" description="提交一个资产或能力包审批后，会在这里进入 pending 队列。" />
                ) : (
                  <div className="max-h-[440px] space-y-2 overflow-auto pr-1 custom-scrollbar">
                    {activeTeamApprovals.map(request => (
                      <div key={request.id} className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-zinc-100">{request.targetKind} · {request.targetId}</div>
                            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{request.comment}</p>
                          </div>
                          <Badge tone={request.status === 'approved' ? 'good' : request.status === 'rejected' ? 'danger' : 'warn'}>{request.status}</Badge>
                        </div>
                        {request.status === 'pending' && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button onClick={() => updateApprovalRequest(request.id, 'approved')} icon={<CheckCircle2 size={16} />}>通过</Button>
                            <Button variant="danger" onClick={() => updateApprovalRequest(request.id, 'rejected')} icon={<XCircle size={16} />}>拒绝</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="工具执行门控" eyebrow="Adapter Gate" icon={<Activity size={18} className="text-zinc-400" />}>
            <div className="space-y-3">
              <Field label="Adapter">
                <select value={adapterId} onChange={(event) => handleAdapterChange(event.target.value)} className="field-input">
                  {adapters.length === 0 && <option value="tool.json_extract">tool.json_extract</option>}
                  {adapters.map(adapter => <option key={adapter.id} value={adapter.id}>{adapter.id} · {adapter.enabled ? 'enabled' : 'disabled'}</option>)}
                </select>
              </Field>
              <Field label="资产">
                <select value={toolAssetId} onChange={(event) => setToolAssetId(event.target.value)} className="field-input">
                  <option value="synthetic">临时 executable 测试资产</option>
                  {executableAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.title} · {asset.status || 'context_only'}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoBlock label="风险" value={selectedAdapter?.risk || 'unknown'} />
                <InfoBlock label="状态" value={selectedAdapter?.enabled ? '已启用' : '未启用'} />
              </div>
              <textarea value={toolInput} onChange={(event) => setToolInput(event.target.value)} className="field-input min-h-[200px] resize-y font-mono text-xs leading-relaxed" />
              <label className="flex items-start gap-2 text-xs leading-relaxed text-zinc-400">
                <input type="checkbox" checked={toolConfirm} onChange={(event) => setToolConfirm(event.target.checked)} />
                <span>确认执行本次 adapter。后端仍会检查 ENABLE_TOOL_EXECUTION、资产 executable、allowlist 和风险边界。</span>
              </label>
              <Button variant="primary" onClick={handleExecuteTool} disabled={isBusy} icon={<Activity size={16} />}>执行 / Dry-run</Button>
              {toolResult && (
                <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-zinc-800 bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-300 custom-scrollbar">
                  {JSON.stringify(toolResult, null, 2)}
                </pre>
              )}
            </div>
          </Panel>
        </section>
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
    id: `governance_tool_asset_${now.toString(36)}`,
    type: assetType,
    title: `临时 Adapter 测试资产：${adapterId}`,
    summary: '治理页生成的临时 executable 测试资产，不会写入资产库。',
    content: `adapterId: ${adapterId}`,
    tags: ['governance', 'adapter-test'],
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
