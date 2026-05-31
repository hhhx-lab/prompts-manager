import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BookOpen, Boxes, BrainCircuit, GitBranch, RefreshCw, Server, Sparkles } from 'lucide-react';
import {
  AssetPatch,
  AssetBuilderDraft,
  AssetType,
  BackendHealth,
  CompileMode,
  DocsIndexItem,
  FeedbackEvent,
  FeedbackInsights,
  OptimizationDirection,
  PromptAsset,
  PromptCompilation,
  PromptRun,
  RunLabComparison,
  ScenarioType,
  TaskModel
} from '../../types';
import {
  analyzeTaskRemote,
  buildAssetDraftRemote,
  compareRunLabRemote,
  compilePromptRemote,
  diagnoseFeedbackRemote,
  getBackendHealth,
  getDocsIndex,
  getFeedbackInsightsRemote
} from '../../services/apiClient';
import { analyzeTaskLocally } from '../../services/taskAnalysis';
import { compilePrompt } from '../../services/promptCompiler';
import { buildAssetSlots } from '../../services/assetSlots';
import { diagnoseFeedback } from '../../services/feedbackDiagnosis';
import { createFeedbackEventsFromText } from '../../services/feedbackEvents';
import { buildFeedbackInsights } from '../../services/assetPatches';
import { deriveAssetGraphEdges, summarizeAssetGraph } from '../../services/assetGraph';
import { ASSET_TYPE_LABELS, recommendAssets } from '../../services/library';
import { buildLocalAssetDraft } from '../../services/assetDrafts';
import { useAssetGraph } from '../../hooks/useAssetGraph';
import { useAssetPatches } from '../../hooks/useAssetPatches';
import { useFeedbackEvents } from '../../hooks/useFeedbackEvents';
import { usePromptCompilations } from '../../hooks/usePromptCompilations';
import { usePromptRuns } from '../../hooks/usePromptRuns';
import { useTaskModels } from '../../hooks/useTaskModels';
import { AssetBuilderPanel } from '../builders/AssetBuilderPanel';
import { FeedbackDiagnosisPanel } from '../feedback/FeedbackDiagnosisPanel';
import { FeedbackInsightsPanel } from '../feedback/FeedbackInsightsPanel';
import { StatusCard } from './OpsPrimitives';
import { RunLabPanel } from '../run-lab/RunLabPanel';
import { AssetSlotBoard } from '../workspace/AssetSlotBoard';
import { PromptCompilerPanel } from '../workspace/PromptCompilerPanel';
import { TaskModelPanel } from '../workspace/TaskModelPanel';

interface OpsWorkbenchProps {
  assets: PromptAsset[];
  directions: OptimizationDirection[];
  scenario: ScenarioType;
}

const sampleTask = '我想把用户的模糊需求封装成可执行 Prompt，并且能自动插入 Skill、MCP、SDK、Reference、Policy、Evaluator 等资产，执行后根据用户编辑和追问自动迭代。';

export const OpsWorkbench: React.FC<OpsWorkbenchProps> = ({ assets, directions, scenario }) => {
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [docsIndex, setDocsIndex] = useState<DocsIndexItem[]>([]);
  const [backendError, setBackendError] = useState('');
  const [input, setInput] = useState(sampleTask);
  const [taskModel, setTaskModel] = useState<TaskModel | null>(null);
  const [compileMode, setCompileMode] = useState<CompileMode>('strict');
  const [compilation, setCompilation] = useState<PromptCompilation | null>(null);
  const [feedbackText, setFeedbackText] = useState('用户连续补充“请用表格输出”，并删除了 2 处未提供来源的内容。');
  const [feedbackEvents, setFeedbackEvents] = useState<FeedbackEvent[]>([]);
  const [patches, setPatches] = useState<AssetPatch[]>([]);
  const [builderType, setBuilderType] = useState<AssetType>('skill');
  const [builderDraft, setBuilderDraft] = useState<AssetBuilderDraft | null>(null);
  const [runComparison, setRunComparison] = useState<RunLabComparison | null>(null);
  const [feedbackInsights, setFeedbackInsights] = useState<FeedbackInsights | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const { taskModels, saveTaskModel } = useTaskModels();
  const { promptCompilations, savePromptCompilation } = usePromptCompilations();
  const { promptRuns, savePromptRun } = usePromptRuns();
  const { feedbackEvents: storedFeedbackEvents, saveFeedbackEvents } = useFeedbackEvents();
  const { assetPatches, saveAssetPatches } = useAssetPatches();
  const { assetGraphEdges, saveAssetGraphEdges } = useAssetGraph();

  const suggestedAssets = useMemo(() => {
    const query = [input, taskModel?.goal, taskModel?.suggestedAssetTypes.join(' ')].filter(Boolean).join(' ');
    return recommendAssets(assets, query, directions.map(direction => direction.name), 8);
  }, [assets, directions, input, taskModel]);

  const slots = useMemo(() => buildAssetSlots(suggestedAssets, taskModel?.suggestedAssetTypes || []), [suggestedAssets, taskModel]);
  const graphSummary = useMemo(() => summarizeAssetGraph(assetGraphEdges), [assetGraphEdges]);

  useEffect(() => {
    refreshBackend();
  }, []);

  const refreshBackend = async () => {
    try {
      const [health, docs] = await Promise.all([getBackendHealth(), getDocsIndex()]);
      setBackendHealth(health);
      setDocsIndex(docs);
      setBackendError('');
    } catch (error) {
      setBackendError(error instanceof Error ? error.message : String(error));
      setBackendHealth(null);
      setDocsIndex([]);
    }
  };

  const handleAnalyze = async () => {
    setIsBusy(true);
    try {
      const remote = await analyzeTaskRemote({ input, assets, directions, scenario });
      setTaskModel(remote);
      saveTaskModel(remote);
      setCompilation(null);
      setPatches([]);
    } catch {
      const local = analyzeTaskLocally(input, assets, directions, scenario);
      setTaskModel(local);
      saveTaskModel(local);
      setCompilation(null);
      setPatches([]);
    } finally {
      setIsBusy(false);
    }
  };

  const handleCompile = async () => {
    const task = taskModel || analyzeTaskLocally(input, assets, directions, scenario);
    if (!taskModel) setTaskModel(task);
    setIsBusy(true);
    try {
      const remote = await compilePromptRemote({ task, selectedAssets: suggestedAssets, directions, mode: compileMode });
      setCompilation(remote);
      savePromptCompilation(remote);
      saveAssetGraphEdges(deriveAssetGraphEdges(suggestedAssets, remote, patches));
    } catch {
      const local = compilePrompt(task, suggestedAssets, directions, compileMode);
      setCompilation(local);
      savePromptCompilation(local);
      saveAssetGraphEdges(deriveAssetGraphEdges(suggestedAssets, local, patches));
    } finally {
      setIsBusy(false);
    }
  };

  const handleDiagnose = async () => {
    const events = createFeedbackEventsFromText(feedbackText);
    setFeedbackEvents(events);
    saveFeedbackEvents(events);
    setIsBusy(true);
    try {
      const remotePatches = await diagnoseFeedbackRemote({ events, compilation: compilation || undefined });
      setPatches(remotePatches);
      saveAssetPatches(remotePatches);
      saveAssetGraphEdges(deriveAssetGraphEdges(suggestedAssets, compilation, remotePatches));
      setFeedbackInsights(await getFeedbackInsightsRemote({ events, patches: remotePatches }));
    } catch {
      const localPatches = diagnoseFeedback(events, compilation || undefined);
      setPatches(localPatches);
      saveAssetPatches(localPatches);
      saveAssetGraphEdges(deriveAssetGraphEdges(suggestedAssets, compilation, localPatches));
      setFeedbackInsights(buildFeedbackInsights(events, localPatches));
    } finally {
      setIsBusy(false);
    }
  };

  const handleBuildAssetDraft = async () => {
    const task = taskModel || analyzeTaskLocally(input, assets, directions, scenario);
    if (!taskModel) setTaskModel(task);
    setIsBusy(true);
    try {
      setBuilderDraft(await buildAssetDraftRemote({ assetType: builderType, task, input }));
    } catch {
      setBuilderDraft(buildLocalAssetDraft(builderType, task, input));
    } finally {
      setIsBusy(false);
    }
  };

  const handleRunLabCompare = async () => {
    const task = taskModel || analyzeTaskLocally(input, assets, directions, scenario);
    if (!taskModel) setTaskModel(task);
    setIsBusy(true);
    try {
      const remote = await compareRunLabRemote({ task, selectedAssets: suggestedAssets, directions, mode: compileMode });
      setRunComparison(remote);
      savePromptRun(createPromptRunFromComparison(remote, input, feedbackEvents));
    } catch {
      const local = compareRunLabLocal(task, suggestedAssets, directions, compileMode);
      setRunComparison(local);
      savePromptRun(createPromptRunFromComparison(local, input, feedbackEvents));
    } finally {
      setIsBusy(false);
    }
  };

  const handleRefreshInsights = async () => {
    const events = feedbackEvents.length ? feedbackEvents : createFeedbackEventsFromText(feedbackText);
    const currentPatches = patches.length ? patches : diagnoseFeedback(events, compilation || undefined);
    setFeedbackEvents(events);
    saveFeedbackEvents(events);
    if (!patches.length) setPatches(currentPatches);
    if (!patches.length) saveAssetPatches(currentPatches);
    setIsBusy(true);
    try {
      setFeedbackInsights(await getFeedbackInsightsRemote({ events, patches: currentPatches }));
    } catch {
      setFeedbackInsights(buildFeedbackInsights(events, currentPatches));
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
              <Sparkles size={14} /> PromptOps Engine 2.0
            </div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <BrainCircuit className="text-cyan-300" /> AI 任务封装与自动迭代引擎
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-3xl">
              把人的模糊需求转成 TaskModel，再插入资产包，编译 PromptIR，执行后用用户行为反推 Prompt、Skill、Policy、Evaluator 的迭代补丁。
            </p>
          </div>
          <button onClick={refreshBackend} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-bold">
            <RefreshCw size={16} /> 刷新后端状态
          </button>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <StatusCard icon={<Server size={18} />} label="后端 API" value={backendHealth?.ok ? '已连接' : '离线降级'} tone={backendHealth?.ok ? 'good' : 'warn'} detail={backendHealth ? `docs=${backendHealth.docsCount} · data=${backendHealth.dataDirReady ? 'ready' : 'missing'}` : backendError || '将使用前端本地 fallback'} />
          <StatusCard icon={<BookOpen size={18} />} label="文档库" value={`${docsIndex.length || backendHealth?.docsCount || 0} 份`} tone="neutral" detail="product / knowledge / asset-spec / plan 分离索引" />
          <StatusCard icon={<Boxes size={18} />} label="资产包" value={`${assets.length} 个`} tone="neutral" detail="Prompt、Skill、MCP、SDK、Workflow 等 16 类" />
          <StatusCard icon={<GitBranch size={18} />} label="编译模式" value={compileMode} tone="neutral" detail="Readable / Strict / Tool / Agent / Eval" />
          <StatusCard icon={<Activity size={18} />} label="本地闭环" value={`${taskModels.length} 任务`} tone="neutral" detail={`comp=${promptCompilations.length} · run=${promptRuns.length} · event=${storedFeedbackEvents.length} · patch=${assetPatches.length}`} />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] gap-6">
          <div className="space-y-4">
            <TaskModelPanel
              input={input}
              isBusy={isBusy}
              taskModel={taskModel}
              onInputChange={setInput}
              onAnalyze={handleAnalyze}
              onCompile={handleCompile}
            />

            <AssetSlotBoard slots={slots} suggestedAssets={suggestedAssets} />
          </div>

          <div className="space-y-4">
            <PromptCompilerPanel
              compileMode={compileMode}
              compilation={compilation}
              onModeChange={setCompileMode}
            />

            <FeedbackDiagnosisPanel
              feedbackText={feedbackText}
              isBusy={isBusy}
              patches={patches}
              onFeedbackTextChange={setFeedbackText}
              onDiagnose={handleDiagnose}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <AssetBuilderPanel
            builderType={builderType}
            builderDraft={builderDraft}
            isBusy={isBusy}
            onBuilderTypeChange={setBuilderType}
            onBuildDraft={handleBuildAssetDraft}
          />

          <RunLabPanel
            isBusy={isBusy}
            runComparison={runComparison}
            onCompare={handleRunLabCompare}
          />

          <FeedbackInsightsPanel
            isBusy={isBusy}
            feedbackInsights={feedbackInsights}
            graphSummary={graphSummary}
            onRefresh={handleRefreshInsights}
          />
        </section>
      </div>
    </div>
  );
};

const buildAssetDraftLocal = (assetType: AssetType, task: TaskModel, input: string): AssetBuilderDraft => {
  const title = `${ASSET_TYPE_LABELS[assetType]}：${task.goal}`.slice(0, 80);
  return {
    id: `asset_draft_${Date.now().toString(36)}`,
    assetType,
    title,
    summary: `围绕“${task.goal}”生成的 ${ASSET_TYPE_LABELS[assetType]} 资产草稿。`,
    content: buildDraftContent(assetType, task, input),
    integration: {
      entryName: `${assetType}.${task.id}`,
      capabilities: buildDraftCapabilities(assetType),
      inputs: ['用户目标', '输入材料', '约束', '验收标准'],
      outputs: buildDraftOutputs(assetType),
      constraints: assetType === 'mcp' || assetType === 'sdk'
        ? ['仅作为工程上下文，不代表已经真实连接或调用。', '真实执行前需要 Connector、权限和人工确认。']
        : ['保存前需要补充正例、反例和评估标准。'],
      usageNotes: '本地 fallback 生成的草稿，需要用户确认后再写入资产库。'
    },
    schemaPreview: buildSchemaPreview(assetType),
    nextSteps: ['确认适用场景', '补充 examples', '绑定 Evaluator 或 Benchmark'],
    warnings: assetType === 'mcp' || assetType === 'sdk'
      ? ['工具类资产当前只参与提示词上下文，不真实执行。']
      : ['草稿只是起点，建议补齐边界和失败处理。'],
    createdAt: Date.now()
  };
};

const compareRunLabLocal = (
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
    baselineMetrics: compilationMetrics(baseline),
    variantMetrics: compilationMetrics(variant),
    differences: [
      `资产注入: ${baseline.assetIds.length} -> ${variant.assetIds.length}`,
      `Prompt 长度: ${baseline.compiledPrompt.length} -> ${variant.compiledPrompt.length}`,
      `警告数量: ${baseline.warnings.length} -> ${variant.warnings.length}`,
      selectedAssets.length ? `新增资产绑定: ${selectedAssets.slice(0, 6).map(asset => asset.title).join('、')}` : '未注入资产'
    ],
    recommendation: selectedAssets.length
      ? '建议检查资产绑定说明、工具边界和输出格式，再进入模型运行或 A/B 测试。'
      : '建议先注入任务骨架、工作方法或评估资产，再进行比较。',
    createdAt: Date.now()
  };
};

const createPromptRunFromComparison = (
  comparison: RunLabComparison,
  input: string,
  feedbackEvents: FeedbackEvent[]
): PromptRun => ({
  id: `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  compilationId: comparison.id,
  model: 'promptops-local-compiler',
  input,
  output: comparison.variantPrompt,
  metrics: {
    promptLength: comparison.variantMetrics.promptLength,
    assetCount: comparison.variantMetrics.assetCount,
    warningCount: comparison.variantMetrics.warningCount
  },
  feedbackEvents,
  createdAt: Date.now()
});

const compilationMetrics = (compilation: PromptCompilation) => ({
  promptLength: compilation.compiledPrompt.length,
  assetCount: compilation.assetIds.length,
  sectionCount: Object.keys(compilation.promptIR.sections).length,
  warningCount: compilation.warnings.length
});

const buildDraftCapabilities = (type: AssetType) => {
  const map: Partial<Record<AssetType, string[]>> = {
    prompt: ['结构化任务封装', '输出格式约束', '自检与澄清'],
    skill: ['触发判断', '资源渐进加载', '分步骤执行', '质量门验证'],
    mcp: ['工具 schema 描述', '资源上下文', '错误处理和权限边界'],
    sdk: ['初始化与认证说明', '核心方法映射', '代码示例和测试策略'],
    workflow: ['多阶段编排', '状态流转', '失败回退', '最终交付约束']
  };
  return map[type] || ['可复用上下文'];
};

const buildDraftOutputs = (type: AssetType) => {
  const map: Partial<Record<AssetType, string[]>> = {
    prompt: ['最终 Prompt', '变量说明', '评估标准'],
    skill: ['SKILL.md 草稿', '资源目录建议', '验证清单'],
    mcp: ['MCP Server 规格', 'Tool/Resource/Prompt 列表', '安全说明'],
    sdk: ['SDK 接入说明', '示例代码结构', '测试和错误处理'],
    workflow: ['阶段流程', '质量门', '运行记录结构']
  };
  return map[type] || ['资产说明'];
};

const buildSchemaPreview = (type: AssetType) => {
  const map: Partial<Record<AssetType, string[]>> = {
    prompt: ['role', 'context', 'task', 'variables', 'constraints', 'outputFormat'],
    skill: ['trigger', 'resources', 'workflow', 'boundaries', 'validation'],
    mcp: ['server', 'tools', 'resources', 'prompts', 'security'],
    sdk: ['package', 'initialization', 'auth', 'coreMethods', 'examples'],
    workflow: ['goal', 'actors', 'triggers', 'stages', 'failureHandling']
  };
  return map[type] || ['title', 'summary', 'content', 'integration'];
};

const buildDraftContent = (type: AssetType, task: TaskModel, input: string) => {
  if (type === 'skill') {
    return `# Skill 草稿\n\n## Trigger\n当用户需要“${task.goal}”且任务会重复出现、涉及资料/工具/质量门时使用。\n\n## Workflow\n1. 判断触发条件和不适用场景。\n2. 读取必要 references/scripts/assets。\n3. 分阶段执行并在关键节点自检。\n4. 输出结果、风险和后续建议。\n\n## Validation\n- 覆盖目标。\n- 遵守边界。\n- 留下可复用资产。`;
  }
  if (type === 'mcp') {
    return `# MCP 规格草稿\n\nServer goal: ${task.goal}\n\nTools:\n- tool_name: 描述用途、输入 schema、输出 schema、错误处理。\n\nSecurity:\n- 默认只读。\n- 写操作需要人工确认。\n- 不保存密钥。`;
  }
  if (type === 'sdk') {
    return `# SDK 接入草稿\n\nGoal: ${task.goal}\n\nInstall:\n- npm / pip / uv 命令待补充。\n\nInitialization:\n- 从环境变量读取密钥。\n- 声明超时、重试和错误处理。\n\nExamples:\n- 最小可运行示例。\n- 常见失败用例。`;
  }
  if (type === 'workflow') {
    return `# Workflow 草稿\n\nGoal: ${task.goal}\n\nStages:\n1. Intake: 明确输入和缺口。\n2. Build: 插入资产并编译 PromptIR。\n3. Run: 执行或预览输出。\n4. Review: 评分、诊断和生成 AssetPatch。\n5. Save: 沉淀为可复用资产。`;
  }
  return `# Prompt 草稿\n\nRole: 你是提示词工程助手。\nTask: ${task.goal || input}\nConstraints:\n- 明确输入、输出、约束和验收标准。\n- 缺少信息时先提出澄清问题。\nOutput:\n- 可执行 Prompt\n- 资产融合说明\n- 评估清单`;
};
