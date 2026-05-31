import React, { useState } from 'react';
import { CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';
import { AssetPatch, FeedbackEvent, FeedbackInsights, OptimizationDirection, PromptAsset, PromptCompilation, ScenarioType, TaskModel } from '../../types';
import { analyzeTaskRemote, compilePromptRemote, diagnoseFeedbackRemote, getFeedbackInsightsRemote } from '../../services/apiClient';
import { analyzeTaskLocally } from '../../services/taskAnalysis';
import { compilePrompt } from '../../services/promptCompiler';
import { createFeedbackEventsFromText } from '../../services/feedbackEvents';
import { diagnoseFeedback } from '../../services/feedbackDiagnosis';
import { buildFeedbackInsights } from '../../services/assetPatches';
import { ASSET_TYPE_LABELS, recommendAssets } from '../../services/library';
import { InfoBlock, Panel, StatusCard } from '../ops/OpsPrimitives';

interface FeedbackWorkbenchProps {
  assets: PromptAsset[];
  directions: OptimizationDirection[];
  scenario: ScenarioType;
}

const starterTask = '把会议纪要整理成行动计划，要求输出表格、负责人、截止时间、风险和待确认事项。';
const starterFeedback = '用户连续补充“请用表格输出”，删除了未标注来源的行动项，并重新生成 1 次。';

export const FeedbackWorkbench: React.FC<FeedbackWorkbenchProps> = ({ assets, directions, scenario }) => {
  const [input, setInput] = useState(starterTask);
  const [feedbackText, setFeedbackText] = useState(starterFeedback);
  const [taskModel, setTaskModel] = useState<TaskModel | null>(null);
  const [compilation, setCompilation] = useState<PromptCompilation | null>(null);
  const [events, setEvents] = useState<FeedbackEvent[]>([]);
  const [patches, setPatches] = useState<AssetPatch[]>([]);
  const [insights, setInsights] = useState<FeedbackInsights | null>(null);
  const [isBusy, setIsBusy] = useState(false);

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

  const handleDiagnose = async () => {
    const nextEvents = createFeedbackEventsFromText(feedbackText);
    setEvents(nextEvents);
    setIsBusy(true);
    try {
      const nextPatches = await diagnoseFeedbackRemote({ events: nextEvents, compilation: compilation || undefined });
      setPatches(nextPatches);
      setInsights(await getFeedbackInsightsRemote({ events: nextEvents, patches: nextPatches }));
    } catch {
      const nextPatches = diagnoseFeedback(nextEvents, compilation || undefined);
      setPatches(nextPatches);
      setInsights(buildFeedbackInsights(nextEvents, nextPatches));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-900/20">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
        <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs font-bold mb-3">
              <CheckCircle2 size={14} /> Feedback Loop
            </div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Sparkles className="text-cyan-300" /> 反馈洞察与自动迭代
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-3xl">
              把用户后续行为翻译成 FeedbackEvent，再归因到 Prompt、Template、Policy、Skill、Evaluator 等资产补丁。
            </p>
          </div>
          <button onClick={handleDiagnose} disabled={isBusy || !feedbackText.trim()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-sm font-bold">
            <RefreshCw size={17} /> 诊断反馈
          </button>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <StatusCard icon={<CheckCircle2 size={18} />} label="事件" value={`${events.length}`} tone="neutral" detail="manual_edit / follow_up / regenerate 等行为事件" />
          <StatusCard icon={<Sparkles size={18} />} label="补丁" value={`${patches.length}`} tone={patches.length ? 'good' : 'neutral'} detail="AssetPatch 只生成建议，不自动覆盖资产" />
          <StatusCard icon={<RefreshCw size={18} />} label="项目库" value={`${assets.length}`} tone="neutral" detail="用于把失败归因到已有资产或新资产类型" />
          <StatusCard icon={<CheckCircle2 size={18} />} label="闭环状态" value={insights ? '已生成洞察' : '待诊断'} tone={insights ? 'good' : 'warn'} detail="建议结合多次运行和 Benchmark 证据" />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] gap-6">
          <Panel title="1. 运行任务上下文" icon={<CheckCircle2 size={18} className="text-cyan-300" />}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="w-full min-h-[120px] bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 outline-none focus:border-cyan-400 resize-y"
            />
            <button onClick={handleBuildContext} disabled={isBusy || !input.trim()} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:text-slate-500 border border-slate-700 text-sm font-bold">
              <Sparkles size={16} /> 生成可诊断上下文
            </button>
            {taskModel && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <InfoBlock label="目标" value={taskModel.goal} />
                <InfoBlock label="受众" value={taskModel.audience} />
                <InfoBlock label="资产绑定" value={`${compilation?.assetIds.length || 0} 个`} />
                <InfoBlock label="风险" value={taskModel.risks.join('；') || taskModel.riskLevel} />
              </div>
            )}
          </Panel>

          <Panel title="2. 用户行为记录" icon={<RefreshCw size={18} className="text-amber-300" />}>
            <textarea
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
              className="w-full min-h-[150px] bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 outline-none focus:border-cyan-400 resize-y"
              placeholder="描述用户修改、追问、复制、保存、重新生成、补资料等行为。"
            />
            <div className="text-xs text-slate-500 mt-3">
              支持自然语言输入，系统会自动映射为 FeedbackEvent。
            </div>
          </Panel>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
          <Panel title="3. AssetPatch Review" icon={<Sparkles size={18} className="text-cyan-300" />}>
            {patches.length === 0 ? (
              <div className="text-sm text-slate-500 bg-slate-900 border border-slate-800 rounded-lg p-5">还没有补丁建议。先输入行为记录并点击“诊断反馈”。</div>
            ) : (
              <div className="space-y-3">
                {patches.map(patch => (
                  <div key={patch.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-100">{ASSET_TYPE_LABELS[patch.suggestedAssetType]} 补丁</div>
                        <p className="text-xs text-slate-400 mt-1">{patch.reason}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">{patch.risk}</span>
                    </div>
                    <div className="mt-3 bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300">
                      <div className="font-bold text-cyan-300 mb-1">{patch.changes[0]?.fieldPath}</div>
                      <div>{patch.changes[0]?.after}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2">证据：{patch.evidenceEvents.join('；')}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="4. 洞察与下一步" icon={<CheckCircle2 size={18} className="text-emerald-300" />}>
            {insights ? (
              <div className="space-y-3">
                <InfoBlock label="主要信号" value={insights.topSignals.join('；')} />
                <InfoBlock label="下一步" value={insights.nextActions.join('；') || '继续积累反馈事件'} />
                <InfoBlock label="风险备注" value={insights.riskNotes.join('；')} />
                <div className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 rounded-lg p-3">
                  {Object.entries(insights.patchTypes).map(([type, count]) => `${ASSET_TYPE_LABELS[type as keyof typeof ASSET_TYPE_LABELS] || type} ${count}`).join(' / ') || '暂无补丁类型'}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-lg p-4">
                系统会判断该改 Prompt、Template、Policy、Skill、Evaluator、Dataset 还是 Benchmark。
              </div>
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
};
