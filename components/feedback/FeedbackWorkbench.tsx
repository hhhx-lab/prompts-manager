import React, { useState } from 'react';
import { Activity, CheckCircle2, ClipboardList, GitPullRequest, RefreshCw } from 'lucide-react';
import { AssetPatch, CapabilityPack, FeedbackEvent, FeedbackInsights, OptimizationDirection, PatchReviewStatus, PatchTargetKind, PromptAsset, PromptCompilation, ScenarioType, TaskModel } from '../../types';
import { analyzeTaskRemote, applyAssetPatchRemote, compilePromptRemote, diagnoseFeedbackRemote, getFeedbackInsightsRemote } from '../../services/apiClient';
import { analyzeTaskLocally } from '../../services/taskAnalysis';
import { compilePrompt } from '../../services/promptCompiler';
import { createFeedbackEventsFromText } from '../../services/feedbackEvents';
import { diagnoseFeedback } from '../../services/feedbackDiagnosis';
import { buildFeedbackInsights } from '../../services/assetPatches';
import { applyCapabilityPackPatch } from '../../services/capabilityPacks';
import { ASSET_TYPE_LABELS, recommendAssets } from '../../services/library';
import { useAssetPatches } from '../../hooks/useAssetPatches';
import { useFeedbackEvents } from '../../hooks/useFeedbackEvents';
import { InfoBlock } from '../ops/OpsPrimitives';
import { Badge, Button, EmptyState, MetricCard, PageHeader, Panel, StatusPill } from '../ui/DesignSystem';

interface FeedbackWorkbenchProps {
  assets: PromptAsset[];
  directions: OptimizationDirection[];
  scenario: ScenarioType;
  setAssets: React.Dispatch<React.SetStateAction<PromptAsset[]>>;
  capabilityPacks: CapabilityPack[];
  setCapabilityPacks: React.Dispatch<React.SetStateAction<CapabilityPack[]>>;
}

const starterTask = '把会议纪要整理成行动计划，要求输出表格、负责人、截止时间、风险和待确认事项。';
const starterFeedback = '用户连续补充“请用表格输出”，删除了未标注来源的行动项，并重新生成 1 次。';

export const FeedbackWorkbench: React.FC<FeedbackWorkbenchProps> = ({ assets, directions, scenario, setAssets, capabilityPacks, setCapabilityPacks }) => {
  const [input, setInput] = useState(starterTask);
  const [feedbackText, setFeedbackText] = useState(starterFeedback);
  const [patchTargetKind, setPatchTargetKind] = useState<PatchTargetKind>('asset');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [taskModel, setTaskModel] = useState<TaskModel | null>(null);
  const [compilation, setCompilation] = useState<PromptCompilation | null>(null);
  const [events, setEvents] = useState<FeedbackEvent[]>([]);
  const [patches, setPatches] = useState<AssetPatch[]>([]);
  const [insights, setInsights] = useState<FeedbackInsights | null>(null);
  const [notice, setNotice] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const { feedbackEvents, saveFeedbackEvents } = useFeedbackEvents();
  const { assetPatches, saveAssetPatches, setAssetPatches } = useAssetPatches();
  const selectedPack = capabilityPacks.find(pack => pack.id === selectedPackId) || capabilityPacks[0];

  const handleBuildContext = async () => {
    setIsBusy(true);
    try {
      const task = await analyzeTaskRemote({ input, assets, directions, scenario });
      const selectedAssets = recommendAssets(assets, input, directions.map(direction => direction.name), 6);
      const compiled = await compilePromptRemote({ task, selectedAssets, directions, mode: 'strict' });
      setTaskModel(task);
      setCompilation(compiled);
    } catch {
      const task = analyzeTaskLocally(input, assets, directions, scenario);
      const selectedAssets = recommendAssets(assets, input, directions.map(direction => direction.name), 6);
      setTaskModel(task);
      setCompilation(compilePrompt(task, selectedAssets, directions, 'strict'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleApplyPatch = async (patch: AssetPatch) => {
    setIsBusy(true);
    try {
      if ((patch.targetKind || 'asset') === 'capability_pack') {
        const targetPack = capabilityPacks.find(pack => pack.id === patch.targetPackId) || selectedPack;
        if (!targetPack) {
          setNotice('没有找到可应用的能力包。');
          return;
        }
        const updatedPack = applyCapabilityPackPatch(targetPack, patch);
        setCapabilityPacks(previous => [updatedPack, ...previous.filter(pack => pack.id !== updatedPack.id)]);
        updatePatchStatus(patch.id, 'accepted');
        setNotice(`补丁已应用到能力包「${updatedPack.name}」，质量分已刷新为 ${updatedPack.qualityScore}%。`);
        return;
      }
      const result = await applyAssetPatchRemote({ patch, assets });
      if (result.asset) {
        setAssets(previous => [{
          ...result.asset!,
          source: result.asset!.source || 'feedback-patch'
        }, ...previous.filter(asset => asset.id !== result.asset!.id)]);
      }
      updatePatchStatus(patch.id, 'accepted');
      saveFeedbackEvents([{
        id: `feedback_apply_${Date.now().toString(36)}`,
        runId: compilation?.id || 'feedback-workbench',
        type: 'mark_reusable',
        label: `接受资产补丁：${patch.targetAssetTitle || ASSET_TYPE_LABELS[patch.suggestedAssetType]}`,
        payload: { patchId: patch.id, targetAssetId: patch.targetAssetId },
        timestamp: Date.now()
      }]);
      setNotice(result.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDiagnose = async () => {
    const nextEvents = createFeedbackEventsFromText(feedbackText);
    setEvents(nextEvents);
    saveFeedbackEvents(nextEvents);
    setIsBusy(true);
    try {
      const nextPatches = decoratePatches(await diagnoseFeedbackRemote({ events: nextEvents, compilation: compilation || undefined }));
      setPatches(nextPatches);
      saveAssetPatches(nextPatches);
      setInsights(await getFeedbackInsightsRemote({ events: nextEvents, patches: nextPatches }));
    } catch {
      const nextPatches = decoratePatches(diagnoseFeedback(nextEvents, compilation || undefined));
      setPatches(nextPatches);
      saveAssetPatches(nextPatches);
      setInsights(buildFeedbackInsights(nextEvents, nextPatches));
    } finally {
      setIsBusy(false);
    }
  };

  const decoratePatches = (incoming: AssetPatch[]): AssetPatch[] => incoming.map(patch => ({
    ...patch,
    targetKind: patchTargetKind,
    targetPackId: patchTargetKind === 'capability_pack' ? selectedPack?.id : undefined,
    targetPackTitle: patchTargetKind === 'capability_pack' ? selectedPack?.name : undefined,
    status: patch.status || 'pending',
    source: patch.source || 'feedback-ops'
  }));

  const updatePatchStatus = (patchId: string, status: PatchReviewStatus) => {
    const reviewedAt = Date.now();
    const mark = (patch: AssetPatch) => patch.id === patchId ? { ...patch, status, reviewedAt } : patch;
    setPatches(current => current.map(mark));
    setAssetPatches(current => current.map(mark));
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-zinc-950">
      <PageHeader
        eyebrow="Feedback Ops"
        title="反馈洞察"
        description="把复制、编辑、追问、重新生成、删除片段等行为沉淀为 FeedbackEvent，再生成可审查的 AssetPatch。"
        actions={
          <>
            <Badge tone="muted">{feedbackEvents.length} events</Badge>
            <Button onClick={handleDiagnose} disabled={isBusy || !feedbackText.trim()} icon={<RefreshCw size={16} />}>诊断反馈</Button>
          </>
        }
      />

      <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-5">
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard icon={<ClipboardList size={16} />} label="本次事件" value={`${events.length}`} detail="manual_edit / follow_up / regenerate" />
          <MetricCard icon={<GitPullRequest size={16} />} label="本次补丁" value={`${patches.length}`} tone={patches.length ? 'good' : 'neutral'} detail="需人工接受后才更新资产" />
          <MetricCard icon={<Activity size={16} />} label="累计补丁" value={`${assetPatches.length}`} detail="backend state assetPatches" />
          <MetricCard icon={<CheckCircle2 size={16} />} label="闭环状态" value={insights ? '已诊断' : '待诊断'} tone={insights ? 'good' : 'warn'} detail="建议结合 Run Lab 与 Benchmark" />
        </section>

        {notice && (
          <div className="rounded-md border border-teal-900/60 bg-teal-950/30 px-4 py-3 text-sm text-teal-100">
            {notice}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-5">
            <Panel title="运行任务上下文" icon={<ClipboardList size={16} className="text-zinc-400" />}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="field-input min-h-[128px] resize-y"
              />
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <FieldLite label="补丁目标">
                  <select value={patchTargetKind} onChange={(event) => setPatchTargetKind(event.target.value as PatchTargetKind)} className="field-input">
                    <option value="asset">资产</option>
                    <option value="capability_pack">能力包</option>
                  </select>
                </FieldLite>
                <FieldLite label="目标能力包">
                  <select value={selectedPack?.id || ''} onChange={(event) => setSelectedPackId(event.target.value)} disabled={patchTargetKind !== 'capability_pack'} className="field-input disabled:opacity-45">
                    {capabilityPacks.map(pack => <option key={pack.id} value={pack.id}>{pack.name}</option>)}
                  </select>
                </FieldLite>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={handleBuildContext} disabled={isBusy || !input.trim()} icon={<Activity size={16} />}>生成可诊断上下文</Button>
                {compilation && <StatusPill status="schema_ready" />}
              </div>
              {taskModel && (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoBlock label="目标" value={taskModel.goal} />
                  <InfoBlock label="受众" value={taskModel.audience} />
                  <InfoBlock label="资产绑定" value={`${compilation?.assetIds.length || 0} 个`} />
                  <InfoBlock label="风险" value={taskModel.risks.join('；') || taskModel.riskLevel} />
                </div>
              )}
            </Panel>

            <Panel title="用户行为记录" icon={<RefreshCw size={16} className="text-zinc-400" />}>
              <textarea
                value={feedbackText}
                onChange={(event) => setFeedbackText(event.target.value)}
                className="field-input min-h-[152px] resize-y"
                placeholder="描述用户修改、追问、复制、保存、重新生成、补资料等行为。"
              />
              <p className="mt-2 text-xs text-zinc-500">
                支持自然语言输入，系统会映射为 FeedbackEvent 并写入本地后端 state。
              </p>
            </Panel>

            <Panel title="AssetPatch Review" icon={<GitPullRequest size={16} className="text-zinc-400" />}>
              {patches.length === 0 ? (
                <EmptyState title="还没有补丁建议" description="先生成上下文，然后输入行为记录并诊断反馈。" />
              ) : (
                <div className="space-y-3">
                  {patches.map(patch => (
                    <div key={patch.id} className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="accent">{ASSET_TYPE_LABELS[patch.suggestedAssetType]}</Badge>
                            <Badge tone={(patch.status || 'pending') === 'accepted' ? 'good' : (patch.status || 'pending') === 'rejected' ? 'danger' : (patch.status || 'pending') === 'snoozed' ? 'warn' : 'neutral'}>{patch.status || 'pending'}</Badge>
                            <span className="text-sm font-semibold text-zinc-100">{patch.targetPackTitle || patch.targetAssetTitle || '新建议'}</span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-zinc-500">{patch.reason}</p>
                        </div>
                        <Badge tone="muted">{(patch.targetKind || 'asset') === 'capability_pack' ? '能力包' : '资产'}</Badge>
                      </div>
                      <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
                        <div className="mb-1 font-semibold text-teal-300">{patch.changes[0]?.fieldPath || 'content'}</div>
                        <div className="leading-relaxed">{patch.changes[0]?.after || patch.expectedImpact}</div>
                      </div>
                      <div className="mt-2 text-[11px] text-zinc-500">证据：{patch.evidenceEvents.join('；') || '本次反馈事件'}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button onClick={() => handleApplyPatch(patch)} disabled={isBusy || (patch.status || 'pending') !== 'pending'} icon={<CheckCircle2 size={16} />}>接受补丁</Button>
                        <Button variant="ghost" onClick={() => updatePatchStatus(patch.id, 'snoozed')} disabled={(patch.status || 'pending') !== 'pending'}>稍后</Button>
                        <Button variant="danger" onClick={() => updatePatchStatus(patch.id, 'rejected')} disabled={(patch.status || 'pending') !== 'pending'}>拒绝</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="洞察检查器" icon={<CheckCircle2 size={16} className="text-zinc-400" />}>
            {insights ? (
              <div className="space-y-3">
                <InfoBlock label="主要信号" value={insights.topSignals.join('；')} />
                <InfoBlock label="下一步" value={insights.nextActions.join('；') || '继续积累反馈事件'} />
                <InfoBlock label="风险备注" value={insights.riskNotes.join('；')} />
                <div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-3 text-xs leading-relaxed text-zinc-400">
                  {Object.entries(insights.patchTypes).map(([type, count]) => `${ASSET_TYPE_LABELS[type as keyof typeof ASSET_TYPE_LABELS] || type} ${count}`).join(' / ') || '暂无补丁类型'}
                </div>
              </div>
            ) : (
              <EmptyState title="等待反馈诊断" description="系统会判断应该修改 Prompt、Template、Policy、Skill、Evaluator、Dataset 还是 Benchmark。" />
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
};

const FieldLite: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <div className="mb-1 text-xs font-semibold text-zinc-300">{label}</div>
    {children}
  </label>
);
