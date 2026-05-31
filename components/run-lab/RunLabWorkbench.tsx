import React, { useMemo, useState } from 'react';
import { Activity, Check, FileText, GitBranch, Split, Wand2 } from 'lucide-react';
import { CompileMode, OptimizationDirection, PromptAsset, RunLabComparison, ScenarioType, TaskModel } from '../../types';
import { analyzeTaskRemote, compareRunLabRemote } from '../../services/apiClient';
import { analyzeTaskLocally } from '../../services/taskAnalysis';
import { compilePrompt } from '../../services/promptCompiler';
import { ASSET_TYPE_LABELS, recommendAssets } from '../../services/library';
import { InfoBlock, Panel } from '../ops/OpsPrimitives';

interface RunLabWorkbenchProps {
  assets: PromptAsset[];
  directions: OptimizationDirection[];
  scenario: ScenarioType;
}

const starterInput = '验证一个“合同风险审查”提示词：比较不插入资产与插入 Reference、Policy、Evaluator 后的提示词差异。';
const compileModes: CompileMode[] = ['readable', 'strict', 'tool-ready', 'agent-ready', 'eval-ready'];

export const RunLabWorkbench: React.FC<RunLabWorkbenchProps> = ({ assets, directions, scenario }) => {
  const [input, setInput] = useState(starterInput);
  const [taskModel, setTaskModel] = useState<TaskModel | null>(null);
  const [compileMode, setCompileMode] = useState<CompileMode>('strict');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<RunLabComparison | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const candidates = useMemo(() => recommendAssets(assets, input, directions.map(direction => direction.name), 10), [assets, directions, input]);
  const selectedAssets = assets.filter(asset => selectedAssetIds.includes(asset.id));

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
    try {
      setComparison(await compareRunLabRemote({ task, selectedAssets, directions, mode: compileMode }));
    } catch {
      setComparison(compareLocally(task, selectedAssets, directions, compileMode));
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
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-900/20">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
        <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-400/10 border border-emerald-300/20 text-emerald-100 text-xs font-bold mb-3">
              <Activity size={14} /> Run Lab
            </div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <GitBranch className="text-emerald-300" /> 运行实验室
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-3xl">
              在保存 Prompt 或资产组合前先比较差异：无资产基线、资产注入版本、编译模式、警告和后续评估建议。
            </p>
          </div>
          <button onClick={handleCompare} disabled={isBusy || !input.trim()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-sm font-bold">
            <Split size={17} /> 运行资产开关对比
          </button>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
          <Panel title="1. 测试任务" icon={<FileText size={18} className="text-cyan-300" />}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="w-full min-h-[130px] bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 outline-none focus:border-emerald-300 resize-y"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={handleAnalyze} disabled={isBusy || !input.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:text-slate-500 border border-slate-700 text-sm font-bold">
                <Wand2 size={16} /> 生成任务卡
              </button>
              {compileModes.map(mode => (
                <button key={mode} onClick={() => setCompileMode(mode)} className={`px-3 py-2 rounded-lg text-xs font-bold border ${compileMode === mode ? 'bg-emerald-400 text-slate-950 border-emerald-300' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}>
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

          <Panel title="2. 资产开关" icon={<Check size={18} className="text-emerald-300" />}>
            <div className="text-xs text-slate-500 mb-3">最多选择 8 个资产进入变体版本；未选择时只生成基线。</div>
            <div className="space-y-2 max-h-[420px] overflow-auto custom-scrollbar pr-1">
              {(candidates.length ? candidates : assets.slice(0, 10)).map(asset => (
                <button
                  key={asset.id}
                  onClick={() => toggleAsset(asset.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedAssetIds.includes(asset.id) ? 'bg-emerald-400/10 border-emerald-300/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-100 truncate">{asset.title || '未命名资产'}</span>
                    <span className="text-[10px] text-cyan-300 shrink-0">{ASSET_TYPE_LABELS[asset.type]}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{asset.summary}</p>
                </button>
              ))}
              {assets.length === 0 && (
                <div className="text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-lg p-4">
                  项目库暂无资产。可先到“构建器”生成 Prompt、Skill、Policy、Evaluator 等资产。
                </div>
              )}
            </div>
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
            <Panel title="3. 基线 Prompt" icon={<FileText size={18} className="text-slate-300" />}>
              <pre className="max-h-[520px] overflow-auto custom-scrollbar whitespace-pre-wrap break-words bg-slate-900 border border-slate-800 rounded-lg p-4 text-[11px] leading-relaxed text-slate-300">{comparison.baselinePrompt}</pre>
            </Panel>
            <div className="xl:col-span-2">
              <Panel title="4. 资产注入版本" icon={<GitBranch size={18} className="text-emerald-300" />}>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 mb-3 space-y-1">
                  {comparison.differences.map(item => <div key={item}>- {item}</div>)}
                </div>
                <pre className="max-h-[520px] overflow-auto custom-scrollbar whitespace-pre-wrap break-words bg-slate-900 border border-slate-800 rounded-lg p-4 text-[11px] leading-relaxed text-slate-300">{comparison.variantPrompt}</pre>
              </Panel>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

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
