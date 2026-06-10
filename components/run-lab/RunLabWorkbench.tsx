import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Check, FileText, GitBranch, Save, Split, Wand2 } from 'lucide-react';
import { CapabilityCheck, CapabilityPack, CompileMode, EvaluatorAssetSchema, EvaluatorResult, OnlineExperiment, OptimizationDirection, PromptAsset, PromptRun, RunLabComparison, RunLabMultiRunResult, RunLabRunResult, ScenarioType, TaskModel } from '../../types';
import { analyzeTaskRemote, compareRunLabRemote, createOnlineExperimentRemote, getCapabilityCheck, runMultiModelRemote, runPromptRemote, scoreEvaluatorRemote, trackOnlineExperimentRemote } from '../../services/apiClient';
import { analyzeTaskLocally } from '../../services/taskAnalysis';
import { compilePrompt } from '../../services/promptCompiler';
import { ASSET_TYPE_LABELS, recommendAssets } from '../../services/library';
import { InfoBlock, Panel } from '../ops/OpsPrimitives';
import { Badge, Button, EmptyState, PageHeader, StatusPill } from '../ui/DesignSystem';
import { usePromptRuns } from '../../hooks/usePromptRuns';
import { useBenchmarkRuns } from '../../hooks/useBenchmarkRuns';
import { useEvaluatorResults } from '../../hooks/useEvaluatorResults';
import { getPackAssetIds } from '../../services/capabilityPacks';
import { useOnlineExperiments } from '../../hooks/useOnlineExperiments';

interface RunLabWorkbenchProps {
  assets: PromptAsset[];
  capabilityPacks: CapabilityPack[];
  directions: OptimizationDirection[];
  scenario: ScenarioType;
}

const compileModes: CompileMode[] = ['readable', 'strict', 'tool-ready', 'agent-ready', 'eval-ready'];
type ComparisonTarget = 'baseline' | 'assets' | 'capability_pack';

export const RunLabWorkbench: React.FC<RunLabWorkbenchProps> = ({ assets, capabilityPacks, directions, scenario }) => {
  const [input, setInput] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [taskModel, setTaskModel] = useState<TaskModel | null>(null);
  const [compileMode, setCompileMode] = useState<CompileMode>('strict');
  const [comparisonTarget, setComparisonTarget] = useState<ComparisonTarget>('assets');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<RunLabComparison | null>(null);
  const [runResult, setRunResult] = useState<RunLabRunResult | null>(null);
  const [multiRunResult, setMultiRunResult] = useState<RunLabMultiRunResult | null>(null);
  const [evaluatorResult, setEvaluatorResult] = useState<EvaluatorResult | null>(null);
  const [candidateModels, setCandidateModels] = useState('');
  const [activeExperiment, setActiveExperiment] = useState<OnlineExperiment | null>(null);
  const [notice, setNotice] = useState('');
  const [capability, setCapability] = useState<CapabilityCheck | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const { promptRuns, savePromptRun } = usePromptRuns();
  const { benchmarkRuns, saveBenchmarkRun } = useBenchmarkRuns();
  const { evaluatorResults, saveEvaluatorResult } = useEvaluatorResults();
  const { onlineExperiments, saveOnlineExperiment } = useOnlineExperiments();

  const candidates = useMemo(() => recommendAssets(assets, input, directions.map(direction => direction.name), 10), [assets, directions, input]);
  const selectedPack = capabilityPacks.find(pack => pack.id === selectedPackId) || capabilityPacks[0];
  const packAssetIds = selectedPack ? getPackAssetIds(selectedPack) : [];
  const variantAssetIds = comparisonTarget === 'baseline'
    ? []
    : comparisonTarget === 'capability_pack'
      ? packAssetIds.slice(0, 8)
      : selectedAssetIds;
  const selectedAssets = assets.filter(asset => variantAssetIds.includes(asset.id));
  const selectedEvaluatorAssets = selectedAssets.filter(asset => asset.type === 'evaluator');
  const missingPackAssetIds = comparisonTarget === 'capability_pack' ? packAssetIds.filter(id => !assets.some(asset => asset.id === id)) : [];
  const packCoverage = selectedPack ? Math.round(((selectedPack.slots.length - selectedPack.missingSlots.length) / Math.max(selectedPack.slots.length, 1)) * 100) : 0;

  useEffect(() => {
    getCapabilityCheck().then(setCapability).catch(() => setCapability(null));
  }, []);

  const handleAnalyze = async () => {
    setIsBusy(true);
    try {
      setTaskModel(await analyzeTaskRemote({ input, assets, directions, scenario }));
    } catch {
      setTaskModel(analyzeTaskLocally(input, assets, directions, scenario));
    } finally {
      setIsBusy(false);
    }
  };

  const handleCompare = async () => {
    const task = taskModel || analyzeTaskLocally(input, assets, directions, scenario);
    if (!taskModel) setTaskModel(task);
    setIsBusy(true);
    setNotice('');
    try {
      setComparison(await compareRunLabRemote({ task, selectedAssets, directions, mode: compileMode }));
    } catch {
      setComparison(compareLocally(task, selectedAssets, directions, compileMode));
    } finally {
      setIsBusy(false);
    }
  };

  const handleRun = async () => {
    const task = taskModel || analyzeTaskLocally(input, assets, directions, scenario);
    const localComparison = comparison || compareLocally(task, selectedAssets, directions, compileMode);
    if (!comparison) setComparison(localComparison);
    const compilation = compilePrompt(task, selectedAssets, directions, compileMode);
    setIsBusy(true);
    setNotice('');
    try {
      const result = await runPromptRemote({ compilation, input });
      setRunResult(result);
      savePromptRun(toPromptRun(result));
      let nextEvaluatorResult: EvaluatorResult;
      try {
        nextEvaluatorResult = await scoreEvaluatorRemote({ run: result, evaluators: selectedEvaluatorAssets, expectedOutput });
      } catch {
        nextEvaluatorResult = buildEvaluatorResult(result.id, selectedEvaluatorAssets, capability?.model.configured || false);
      }
      setEvaluatorResult(nextEvaluatorResult);
      saveEvaluatorResult(nextEvaluatorResult);
    } finally {
      setIsBusy(false);
    }
  };

  const handleMultiRun = async () => {
    const task = taskModel || analyzeTaskLocally(input, assets, directions, scenario);
    const compilation = compilePrompt(task, selectedAssets, directions, compileMode);
    const models = candidateModels.split(',').map(model => model.trim()).filter(Boolean);
    setIsBusy(true);
    setNotice('');
    try {
      const result = await runMultiModelRemote({ compilation, input, models });
      setMultiRunResult(result);
      result.runs.forEach(run => savePromptRun(toPromptRun(run)));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveBenchmark = () => {
    if (!comparison && !runResult) {
      setNotice('请先生成对比或运行结果，再保存 Benchmark。');
      return;
    }
    const benchmark = {
      id: `benchmark_run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      targetType: comparisonTarget,
      packId: comparisonTarget === 'capability_pack' ? selectedPack?.id : undefined,
      packTitle: comparisonTarget === 'capability_pack' ? selectedPack?.name : undefined,
      assetIds: selectedAssets.map(asset => asset.id),
      input,
      expectedOutput,
      actualOutput: runResult?.output || comparison?.variantPrompt || '',
      metrics: {
        promptLength: comparison?.variantMetrics.promptLength || runResult?.metrics.promptLength || 0,
        assetCount: selectedAssets.length,
        warningCount: comparison?.variantMetrics.warningCount || 0,
        status: runResult?.status || 'compile_preview'
      },
      compilationId: runResult?.compilationId,
      runId: runResult?.id,
      createdAt: Date.now()
    };
    saveBenchmarkRun(benchmark);
    setNotice('已保存 Benchmark 记录，可用于后续回归比较。');
  };

  const handleCreateOnlineExperiment = async () => {
    if (!comparison) {
      setNotice('请先生成资产开关对比，再创建线上实验契约。');
      return;
    }
    setIsBusy(true);
    setNotice('');
    try {
      const experiment = await createOnlineExperimentRemote({
        name: `Run Lab 实验：${taskModel?.goal || input.slice(0, 32)}`,
        variants: [
          { id: 'baseline', name: '无资产基线', weight: 50 },
          { id: 'asset_variant', name: comparisonTarget === 'capability_pack' ? '能力包注入版本' : '资产注入版本', weight: 50 }
        ],
        metrics: ['manual_win', 'quality_score', 'conversion']
      });
      setActiveExperiment(experiment);
      saveOnlineExperiment(experiment);
      setNotice('已创建线上实验契约，可继续记录人工胜出事件。');
    } catch (error) {
      setNotice(`创建线上实验失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleTrackExperiment = async (variantId: string) => {
    const targetExperiment = activeExperiment || onlineExperiments[0];
    if (!targetExperiment) {
      setNotice('请先创建线上实验契约。');
      return;
    }
    setIsBusy(true);
    setNotice('');
    try {
      const updated = await trackOnlineExperimentRemote({
        experimentId: targetExperiment.id,
        variantId,
        metric: 'manual_win',
        value: 1
      });
      setActiveExperiment(updated);
      saveOnlineExperiment(updated);
      setNotice(`已记录 ${variantId} 胜出事件，当前事件数 ${updated.events.length}。`);
    } catch (error) {
      setNotice(`记录实验事件失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsBusy(false);
    }
  };

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds(previous => previous.includes(assetId)
      ? previous.filter(id => id !== assetId)
      : previous.length >= 8
        ? previous
        : [...previous, assetId]);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-zinc-950">
      <PageHeader
        eyebrow="Run Lab"
        title="运行实验室"
        description="比较不插资产与插入资产后的优化提示词表现；未配置模型密钥时只做安全预览，不伪装真实运行。"
        actions={
          <>
            <StatusPill status={capability?.model.status === 'connected' ? 'connected' : capability?.model.configured ? 'testable' : 'missing_provider_config'} />
            <Button onClick={handleCompare} disabled={isBusy || !input.trim()} icon={<Split size={16} />}>资产开关对比</Button>
            <Button variant="primary" onClick={handleRun} disabled={isBusy || !input.trim()} icon={<Activity size={16} />}>真实运行/预览</Button>
            <Button onClick={handleMultiRun} disabled={isBusy || !input.trim()} icon={<Activity size={16} />}>多模型实验</Button>
          </>
        }
      />
      <div className="max-w-7xl mx-auto p-4 lg:p-5 space-y-6">

        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
          <Panel title="1. 测试任务" icon={<FileText size={18} className="text-zinc-400" />}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="field-input min-h-[130px] resize-y"
            />
            <textarea
              value={expectedOutput}
              onChange={(event) => setExpectedOutput(event.target.value)}
              className="field-input mt-3 min-h-[74px] resize-y"
              placeholder="Benchmark 期望输出或验收要点"
            />
            <input
              value={candidateModels}
              onChange={(event) => setCandidateModels(event.target.value)}
              className="field-input mt-3"
              placeholder="多模型候选，例如：gpt-5.5,gpt-5.5-mini"
            />
            <div className="flex flex-wrap gap-2 mt-3">
            <Button onClick={handleAnalyze} disabled={isBusy || !input.trim()} icon={<Wand2 size={16} />}>生成任务卡</Button>
              <Button onClick={handleSaveBenchmark} disabled={isBusy} icon={<Save size={16} />}>保存 Benchmark</Button>
              <Button onClick={handleCreateOnlineExperiment} disabled={isBusy || !comparison} icon={<Activity size={16} />}>创建线上实验</Button>
              {compileModes.map(mode => (
                <button key={mode} onClick={() => setCompileMode(mode)} className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${compileMode === mode ? 'border-teal-800 bg-teal-950/50 text-teal-100' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'}`}>
                  {mode}
                </button>
              ))}
            </div>
            {taskModel && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <InfoBlock label="目标" value={taskModel.goal} />
                <InfoBlock label="受众" value={taskModel.audience} />
                <InfoBlock label="期望输出" value={taskModel.expectedOutputs.join('；')} />
                <InfoBlock label="风险" value={taskModel.risks.join('；') || taskModel.riskLevel} />
              </div>
            )}
          </Panel>

          <Panel title="2. 对比目标" icon={<Check size={18} className="text-zinc-400" />}>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {([
                ['baseline', '无资产'],
                ['assets', '选择资产'],
                ['capability_pack', '能力包']
              ] as Array<[ComparisonTarget, string]>).map(([target, label]) => (
                <button key={target} onClick={() => setComparisonTarget(target)} className={`rounded-md border px-3 py-2 text-xs font-semibold ${comparisonTarget === target ? 'border-teal-800 bg-teal-950/50 text-teal-100' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'}`}>
                  {label}
                </button>
              ))}
            </div>
            {comparisonTarget === 'capability_pack' ? (
              <div className="space-y-3">
                <select value={selectedPack?.id || ''} onChange={(event) => setSelectedPackId(event.target.value)} className="field-input">
                  {capabilityPacks.map(pack => <option key={pack.id} value={pack.id}>{pack.name}</option>)}
                </select>
                {selectedPack ? (
                  <div className="space-y-3 rounded-md border border-zinc-800 bg-zinc-950 p-3">
                    <InfoBlock label="槽位覆盖" value={`${packCoverage}% · 缺失 ${selectedPack.missingSlots.length} 个必填槽位`} />
                    <InfoBlock label="资产数量" value={`${selectedAssets.length}/${packAssetIds.length}`} />
                    <InfoBlock label="风险提示" value={[
                      selectedPack.missingSlots.length ? `缺失槽位: ${selectedPack.missingSlots.join('、')}` : '',
                      missingPackAssetIds.length ? `缺失资产快照: ${missingPackAssetIds.length} 个` : '',
                      selectedAssets.some(asset => ['mcp', 'sdk', 'tool', 'connector'].includes(asset.type)) ? '包含工具类资产，仅作为上下文/schema。' : ''
                    ].filter(Boolean).join('；') || '能力包槽位可用于本轮测试。'} wide />
                  </div>
                ) : <EmptyState title="暂无能力包" description="先到能力包模块组合资产，再回到 Run Lab 验证。" />}
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-auto custom-scrollbar pr-1">
                <div className="text-xs text-zinc-500">最多选择 8 个资产进入变体版本；无资产模式会忽略这里的选择。</div>
                {(candidates.length ? candidates : assets.slice(0, 10)).map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => toggleAsset(asset.id)}
                    disabled={comparisonTarget === 'baseline'}
                    className={`w-full rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${selectedAssetIds.includes(asset.id) ? 'border-teal-800 bg-teal-950/35' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-zinc-100 truncate">{asset.title || '未命名资产'}</span>
                      <Badge tone="neutral">{ASSET_TYPE_LABELS[asset.type]}</Badge>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{asset.summary}</p>
                  </button>
                ))}
                {assets.length === 0 && (
                  <EmptyState title="项目库暂无资产" description="可先到构建器生成 Prompt、Skill、Policy、Evaluator 等资产。" />
                )}
              </div>
            )}
          </Panel>
        </section>

        {notice && (
          <div className="rounded-md border border-teal-900/60 bg-teal-950/30 px-4 py-3 text-sm text-teal-100">
            {notice}
          </div>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel title="Evaluator 评分上下文" icon={<Check size={18} className="text-zinc-400" />} actions={<Badge tone="muted">{evaluatorResults.length} results</Badge>}>
            {selectedEvaluatorAssets.length === 0 ? (
              <EmptyState title="未选择 Evaluator" description="选择 Evaluator 资产或包含 Evaluator 的能力包后，会显示评分维度和通过阈值。" />
            ) : (
              <div className="space-y-3">
                {selectedEvaluatorAssets.map(asset => {
                  const schema = asset.schema as EvaluatorAssetSchema | undefined;
                  return (
                    <div key={asset.id} className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-zinc-100">{asset.title}</span>
                        <Badge tone="accent">{schema?.reviewMode || 'manual'}</Badge>
                      </div>
                      <div className="mt-2 text-xs leading-relaxed text-zinc-500">维度：{schema?.dimensions?.join('、') || asset.integration.capabilities.join('、') || '未定义'}</div>
                      <div className="mt-1 text-xs text-zinc-500">通过阈值：{schema?.passThreshold || '未定义，建议人工设定'}</div>
                    </div>
                  );
                })}
                {evaluatorResult && (
                  <div className="rounded-md border border-teal-900/70 bg-teal-950/20 p-3 text-xs leading-relaxed text-teal-100">
                    {evaluatorResult.summary}
                    {evaluatorResult.unavailableReason ? ` · ${evaluatorResult.unavailableReason}` : ''}
                  </div>
                )}
                {capability?.model.status !== 'connected' && (
                  <div className="rounded-md border border-amber-900/60 bg-amber-950/15 p-3 text-xs text-amber-100/80">
                    模型网关未真实连通，当前只展示 Evaluator 维度和本地/manual 评分占位，不声称真实模型评分。
                  </div>
                )}
                {evaluatorResult?.issues?.length ? (
                  <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                    <div className="font-semibold text-zinc-200">模型发现的问题</div>
                    <div className="mt-2 space-y-1">{evaluatorResult.issues.map(issue => <div key={issue}>- {issue}</div>)}</div>
                  </div>
                ) : null}
                {evaluatorResult?.recommendations?.length ? (
                  <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                    <div className="font-semibold text-zinc-200">改进建议</div>
                    <div className="mt-2 space-y-1">{evaluatorResult.recommendations.map(item => <div key={item}>- {item}</div>)}</div>
                  </div>
                ) : null}
              </div>
            )}
          </Panel>

          <Panel title="Benchmark 记录" icon={<Save size={18} className="text-zinc-400" />}>
            {benchmarkRuns.length === 0 ? (
              <EmptyState title="暂无 Benchmark" description="生成对比或运行结果后点击保存 Benchmark。" />
            ) : (
              <div className="max-h-[320px] space-y-2 overflow-auto pr-1 custom-scrollbar">
                {benchmarkRuns.slice(0, 6).map(run => (
                  <div key={run.id} className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-zinc-100">{run.packTitle || run.targetType}</span>
                      <Badge tone="neutral">{run.assetIds.length} assets</Badge>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[11px] text-zinc-500">{run.expectedOutput}</div>
                    <div className="mt-1 text-[11px] text-zinc-600">{new Date(run.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </section>

        {comparison && (
          <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-1 grid grid-cols-2 xl:grid-cols-1 gap-3 content-start">
              <InfoBlock label="基线长度" value={`${comparison.baselineMetrics.promptLength}`} />
              <InfoBlock label="资产版长度" value={`${comparison.variantMetrics.promptLength}`} />
              <InfoBlock label="基线资产" value={`${comparison.baselineMetrics.assetCount}`} />
              <InfoBlock label="资产版资产" value={`${comparison.variantMetrics.assetCount}`} />
              <InfoBlock label="建议" value={comparison.recommendation} wide />
            </div>
            <Panel title="3. 基线 Prompt" icon={<FileText size={18} className="text-zinc-400" />}>
              <pre className="max-h-[520px] overflow-auto custom-scrollbar whitespace-pre-wrap break-words rounded-md border border-zinc-800 bg-zinc-950 p-4 text-[11px] leading-relaxed text-zinc-300">{comparison.baselinePrompt}</pre>
            </Panel>
            <div className="xl:col-span-2">
              <Panel title="4. 资产注入版本" icon={<GitBranch size={18} className="text-zinc-400" />}>
                <div className="bg-zinc-950 border border-zinc-800 rounded-md p-3 text-xs text-zinc-300 mb-3 space-y-1">
                  {comparison.differences.map(item => <div key={item}>- {item}</div>)}
                </div>
                <pre className="max-h-[520px] overflow-auto custom-scrollbar whitespace-pre-wrap break-words rounded-md border border-zinc-800 bg-zinc-950 p-4 text-[11px] leading-relaxed text-zinc-300">{comparison.variantPrompt}</pre>
              </Panel>
            </div>
          </section>
        )}

        {runResult && (
          <Panel title="5. 模型运行状态" icon={<Activity size={18} className="text-zinc-400" />}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusPill status={runResult.status} />
              <span className="text-xs text-zinc-500">{runResult.message}</span>
            </div>
            <pre className="max-h-[420px] overflow-auto custom-scrollbar whitespace-pre-wrap break-words bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-[11px] leading-relaxed text-zinc-300">{runResult.output}</pre>
          </Panel>
        )}

        {multiRunResult && (
          <Panel title="多模型实验结果" icon={<Activity size={18} className="text-zinc-400" />}>
            <div className="mb-3 rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
              {multiRunResult.summary}
            </div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {multiRunResult.runs.map(run => (
                <div key={`${run.id}-${run.model}`} className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-zinc-100">{run.model}</span>
                    <StatusPill status={run.status} />
                  </div>
                  <p className="mb-2 text-xs text-zinc-500">{run.message}</p>
                  <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-zinc-300 custom-scrollbar">{run.output}</pre>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <Panel title="线上实验契约" icon={<Activity size={18} className="text-zinc-400" />}>
          {(activeExperiment || onlineExperiments[0]) ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <div className="space-y-3">
                <InfoBlock label="当前实验" value={(activeExperiment || onlineExperiments[0])?.name || ''} />
                <InfoBlock label="状态" value={(activeExperiment || onlineExperiments[0])?.status || 'draft'} />
                <InfoBlock label="事件数" value={`${(activeExperiment || onlineExperiments[0])?.events.length || 0}`} />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleTrackExperiment('baseline')} disabled={isBusy}>记录基线胜出</Button>
                  <Button variant="primary" onClick={() => handleTrackExperiment('asset_variant')} disabled={isBusy}>记录资产版胜出</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {((activeExperiment || onlineExperiments[0])?.variants || []).map(variant => {
                  const stats = experimentStats(activeExperiment || onlineExperiments[0], variant.id);
                  return (
                    <div key={variant.id} className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-semibold text-zinc-100">{variant.name}</div>
                        <Badge tone="neutral">{variant.weight}%</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <InfoBlock label="wins" value={`${stats.wins}`} />
                        <InfoBlock label="score" value={`${stats.score}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState title="暂无线上实验契约" description="先生成资产开关对比，然后点击“创建线上实验”。这里记录的是本地实验契约，不代表线上流量已经接入。" />
          )}
        </Panel>

        <Panel title="6. 最近运行记录" icon={<Activity size={18} className="text-zinc-400" />}>
          {promptRuns.length === 0 ? (
            <EmptyState title="还没有运行记录" description="点击真实运行/预览后，结果会保存到后端 runs 集合。" />
          ) : (
            <div className="divide-y divide-zinc-900 rounded-lg border border-zinc-800">
              {promptRuns.slice(0, 6).map(run => (
                <div key={run.id} className="flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-100">{run.input || '无输入'}</div>
                    <div className="mt-1 text-xs text-zinc-500">{run.provider || 'local'} · {run.model || 'preview'} · {new Date(run.createdAt).toLocaleString()}</div>
                  </div>
                  <StatusPill status={run.status || 'preview_only'} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

const toPromptRun = (result: RunLabRunResult): PromptRun => ({
  id: result.id,
  compilationId: result.compilationId,
  model: result.model,
  input: result.input,
  output: result.output,
  metrics: result.metrics,
  feedbackEvents: [],
  status: result.status,
  provider: result.provider,
  error: result.status === 'failed' ? result.message : undefined,
  createdAt: result.createdAt
});

const compareLocally = (
  task: TaskModel,
  selectedAssets: PromptAsset[],
  directions: OptimizationDirection[],
  mode: CompileMode
): RunLabComparison => {
  const baseline = compilePrompt(task, [], directions, mode);
  const variant = compilePrompt(task, selectedAssets, directions, mode);
  return {
    id: `runlab_${Date.now().toString(36)}`,
    taskId: task.id,
    baselinePrompt: baseline.compiledPrompt,
    variantPrompt: variant.compiledPrompt,
    baselineMetrics: metricOf(baseline.compiledPrompt, baseline.assetIds.length, baseline.warnings.length),
    variantMetrics: metricOf(variant.compiledPrompt, variant.assetIds.length, variant.warnings.length),
    differences: [
      `资产注入: ${baseline.assetIds.length} -> ${variant.assetIds.length}`,
      `Prompt 长度: ${baseline.compiledPrompt.length} -> ${variant.compiledPrompt.length}`,
      selectedAssets.length ? `新增资产绑定: ${selectedAssets.map(asset => asset.title).slice(0, 6).join('、')}` : '未选择资产'
    ],
    recommendation: selectedAssets.length
      ? '建议检查资产绑定说明、工具边界和输出格式，再进入模型 A/B 运行。'
      : '当前只形成基线 Prompt；建议补充任务骨架、工作方法或评估资产。',
    createdAt: Date.now()
  };
};

const metricOf = (prompt: string, assetCount: number, warningCount: number) => ({
  promptLength: prompt.length,
  assetCount,
  sectionCount: (prompt.match(/^#/gm) || []).length,
  warningCount
});

const experimentStats = (experiment: OnlineExperiment | null | undefined, variantId: string) => {
  const events = experiment?.events.filter(event => event.variantId === variantId) || [];
  const wins = events.filter(event => event.metric === 'manual_win').reduce((sum, event) => sum + Number(event.value || 0), 0);
  const scoreEvents = events.filter(event => event.metric === 'quality_score');
  const score = scoreEvents.length
    ? Math.round(scoreEvents.reduce((sum, event) => sum + Number(event.value || 0), 0) / scoreEvents.length)
    : 0;
  return { wins, score };
};

const buildEvaluatorResult = (
  runId: string,
  evaluatorAssets: PromptAsset[],
  modelConfigured: boolean
): EvaluatorResult => {
  const evaluator = evaluatorAssets[0];
  const schema = evaluator?.schema as EvaluatorAssetSchema | undefined;
  const dimensions = schema?.dimensions?.length
    ? schema.dimensions
    : evaluator?.integration.capabilities?.length
      ? evaluator.integration.capabilities
      : ['完整性', '可执行性', '事实边界', '输出格式'];
  const scores = Object.fromEntries(dimensions.map((dimension, index) => [dimension, modelConfigured ? Math.max(72, 88 - index * 3) : 0]));
  return {
    id: `evaluator_result_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    runId,
    evaluatorAssetId: evaluator?.id,
    evaluatorTitle: evaluator?.title,
    dimensions,
    passThreshold: schema?.passThreshold || '未设置',
    scores,
    summary: evaluator
      ? `已基于 Evaluator「${evaluator.title}」生成${modelConfigured ? '评分摘要' : '本地/manual 评分占位'}。`
      : '未选择 Evaluator，无法生成评分。',
    unavailableReason: evaluator
      ? modelConfigured ? undefined : '缺少 MODEL_BASE_URL 或 MODEL_API_KEY，未执行真实模型评分。'
      : '未选择 Evaluator 资产。',
    createdAt: Date.now()
  };
};
