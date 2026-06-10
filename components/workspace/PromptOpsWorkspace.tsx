import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clipboard, FileText, GitBranch, Play, RefreshCw, Save, UploadCloud, Wand2 } from 'lucide-react';
import {
  AssetType,
  AssetPatch,
  Attachment,
  CapabilityCheck,
  FeedbackEvent,
  OptimizationDirection,
  PromptAsset,
  PromptCompilation,
  PromptRun,
  RunLabRunResult,
  ScenarioType,
  StyleMode,
  TaskModel
} from '../../types';
import {
  analyzeTaskRemote,
  applyAssetPatchRemote,
  diagnoseFeedbackRemote,
  getCapabilityCheck,
  runPromptRemote
} from '../../services/apiClient';
import { optimizePrompt } from '../../modelService';
import { assetBuilderDraftToPromptAsset, buildLocalAssetDraft } from '../../services/assetDrafts';
import { analyzeTaskLocally } from '../../services/taskAnalysis';
import { compilePrompt } from '../../services/promptCompiler';
import { diagnoseFeedback } from '../../services/feedbackDiagnosis';
import { recommendAssets, ASSET_TYPE_LABELS } from '../../services/library';
import { MAX_ATTACHMENTS, parseOptimizationAttachment } from '../../services/fileParsing';
import { useAssetPatches } from '../../hooks/useAssetPatches';
import { useFeedbackEvents } from '../../hooks/useFeedbackEvents';
import { usePromptCompilations } from '../../hooks/usePromptCompilations';
import { usePromptRuns } from '../../hooks/usePromptRuns';
import { useTaskModels } from '../../hooks/useTaskModels';
import { Badge, Button, EmptyState, Field, MetricCard, PageHeader, Panel, StatusPill } from '../ui/DesignSystem';

interface PromptOpsWorkspaceProps {
  assets: PromptAsset[];
  directions: OptimizationDirection[];
  scenario: ScenarioType;
  setAssets: React.Dispatch<React.SetStateAction<PromptAsset[]>>;
  onOpenLibrary: () => void;
  onOpenBuilder: () => void;
}

export const PromptOpsWorkspace: React.FC<PromptOpsWorkspaceProps> = ({
  assets,
  directions,
  scenario,
  setAssets,
  onOpenLibrary,
  onOpenBuilder
}) => {
  const [input, setInput] = useState('');
  const [referenceFiles, setReferenceFiles] = useState<Attachment[]>([]);
  const [testInput, setTestInput] = useState('');
  const [taskModel, setTaskModel] = useState<TaskModel | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [compilation, setCompilation] = useState<PromptCompilation | null>(null);
  const [editablePrompt, setEditablePrompt] = useState('');
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState('');
  const [optimizationHighlights, setOptimizationHighlights] = useState<string[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<string[]>([]);
  const [runResult, setRunResult] = useState<RunLabRunResult | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [patches, setPatches] = useState<AssetPatch[]>([]);
  const [capability, setCapability] = useState<CapabilityCheck | null>(null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');

  const { saveTaskModel } = useTaskModels();
  const { promptCompilations, savePromptCompilation } = usePromptCompilations();
  const { promptRuns, savePromptRun } = usePromptRuns();
  const { feedbackEvents, saveFeedbackEvents } = useFeedbackEvents();
  const { saveAssetPatches } = useAssetPatches();

  const referenceContext = useMemo(() => referenceFiles
    .filter(file => file.textContent)
    .map(file => `参考文件 ${file.name}:\n${file.textContent}`)
    .join('\n\n'), [referenceFiles]);

  const analysisSource = useMemo(() => [
    input,
    referenceContext ? `\n\n---\n本轮参考资料:\n${referenceContext}` : ''
  ].join(''), [input, referenceContext]);

  const recommendedAssets = useMemo(() => recommendAssets(
    assets,
    [analysisSource, taskModel?.goal, taskModel?.suggestedAssetTypes.join(' ')].filter(Boolean).join(' '),
    directions.map(direction => direction.name),
    10
  ), [assets, directions, analysisSource, taskModel]);

  const selectedAssets = assets.filter(asset => selectedAssetIds.includes(asset.id));
  const activePrompt = editablePrompt || compilation?.compiledPrompt || '';

  useEffect(() => {
    getCapabilityCheck().then(setCapability).catch(() => setCapability(null));
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('promptmaster_workspace_pack_use_v1');
    if (!raw) return;
    try {
      const handoff = JSON.parse(raw) as { packName?: string; assetIds?: string[] };
      const assetIds = Array.isArray(handoff.assetIds) ? handoff.assetIds : [];
      if (assetIds.length > 0) {
        setSelectedAssetIds(previous => Array.from(new Set([...assetIds, ...previous])).slice(0, 8));
        setNotice(`已使用能力包“${handoff.packName || '未命名能力包'}”，关联资产已加入本轮提示词优化。`);
      }
    } finally {
      sessionStorage.removeItem('promptmaster_workspace_pack_use_v1');
    }
  }, []);

  const handleAnalyze = async () => {
    setBusy('analyze');
    setNotice('');
    try {
      const remote = await analyzeTaskRemote({ input: analysisSource, assets, directions, scenario });
      setTaskModel(remote);
      saveTaskModel(remote);
    } catch {
      const local = analyzeTaskLocally(analysisSource, assets, directions, scenario);
      setTaskModel(local);
      saveTaskModel(local);
    } finally {
      setBusy('');
    }
  };

  const optimizeFromSource = async (
    sourceText: string,
    options: { isRefinement?: boolean; previousVersion?: string } = {}
  ) => {
    const task = taskModel && sourceText === input ? taskModel : analyzeTaskLocally([sourceText, referenceContext].filter(Boolean).join('\n\n'), assets, directions, scenario);
    if (!taskModel || sourceText !== input) {
      setTaskModel(task);
      saveTaskModel(task);
    }
    setBusy('optimize');
    setNotice('');
    try {
      const optimizedData = await optimizePrompt(sourceText, {
        scenario,
        style: StyleMode.BUSINESS,
        useThinking: true,
        useSearch: false,
        attachments: referenceFiles.map(file => ({
          data: file.data,
          mimeType: file.mimeType,
          textContent: file.textContent
        })),
        isRefinement: Boolean(options.isRefinement),
        previousVersion: options.previousVersion,
        selectedAssets,
        recommendedAssets,
        directions,
        allowLocalFallback: false
      });
      const baseCompilation = compilePrompt(task, selectedAssets, directions, 'strict');
      const nextCompilation: PromptCompilation = {
        ...baseCompilation,
        compiledPrompt: optimizedData.optimized,
        warnings: baseCompilation.warnings
      };
      setCompilation(nextCompilation);
      setEditablePrompt(nextCompilation.compiledPrompt);
      setLastGeneratedPrompt(nextCompilation.compiledPrompt);
      setOptimizationHighlights(optimizedData.highlights);
      setOptimizationSuggestions(optimizedData.suggestions);
      savePromptCompilation(nextCompilation);
      setNotice(options.isRefinement
        ? '已基于你当前编辑后的版本继续优化，并尽量保留人工修改意图。'
        : '已生成优化后的提示词，可以继续手动编辑或迭代下一版。');
    } catch (error) {
      setOptimizationHighlights([]);
      setOptimizationSuggestions([]);
      setNotice(`模型优化失败：${error instanceof Error ? error.message : String(error)}。请检查 LLM_BASE_URL、LLM_API_KEY、LLM_MODEL 或网络；当前未生成本地降级草稿。`);
    } finally {
      setBusy('');
    }
  };

  const handleOptimize = async () => optimizeFromSource(input);

  const handleContinueIteration = async () => {
    if (!activePrompt.trim()) return;
    await optimizeFromSource(activePrompt, {
      isRefinement: true,
      previousVersion: lastGeneratedPrompt || compilation?.compiledPrompt || input
    });
  };

  const handleRun = async () => {
    if (!activePrompt.trim()) {
      setNotice('请先优化出一版提示词，再进入运行/预览。');
      return;
    }
    const compiled = compilation || compilePrompt(taskModel || analyzeTaskLocally(analysisSource, assets, directions, scenario), selectedAssets, directions, 'strict');
    if (!compilation) {
      setCompilation(compiled);
      setEditablePrompt(compiled.compiledPrompt);
      savePromptCompilation(compiled);
    }
    setBusy('run');
    try {
      const result = await runPromptRemote({ compilation: { ...compiled, compiledPrompt: activePrompt || compiled.compiledPrompt }, input: testInput });
      setRunResult(result);
      savePromptRun(toPromptRun(result, []));
      setNotice(result.message);
    } catch (error) {
      setNotice(`运行失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy('');
    }
  };

  const handleReferenceUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy('references');
    const nextFiles = Array.from(files).slice(0, Math.max(0, MAX_ATTACHMENTS - referenceFiles.length));
    const parsed = await Promise.all(nextFiles.map(async file => {
      try {
        return await parseOptimizationAttachment(file);
      } catch (error) {
        return {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
          name: file.name,
          mimeType: file.type,
          type: 'other' as const,
          data: '',
          textContent: `解析失败：${error instanceof Error ? error.message : String(error)}`
        };
      }
    }));
    setReferenceFiles(previous => [...previous, ...parsed].slice(0, MAX_ATTACHMENTS));
    setNotice(`已加入 ${parsed.length} 个参考文件，本轮优化会把可解析文本作为上下文。`);
    setBusy('');
  };

  const handleSaveAsAsset = (assetType: AssetType) => {
    if (!activePrompt.trim()) return;
    const draft = buildLocalAssetDraft(assetType, taskModel || analyzeTaskLocally(activePrompt, assets, directions, scenario), activePrompt);
    if (assetType === 'prompt' || assetType === 'template') {
      const asset = {
        ...assetBuilderDraftToPromptAsset(draft),
        source: 'workspace',
        tags: ['workspace', assetType, ...draft.assetType === 'template' ? ['template'] : ['prompt']]
      };
      setAssets(previous => [asset, ...previous]);
      setNotice(`已保存为${ASSET_TYPE_LABELS[assetType]}资产草稿：${asset.title}`);
      return;
    }
    sessionStorage.setItem('promptmaster_builder_handoff_v1', JSON.stringify({
      assetType,
      prompt: activePrompt,
      taskModel,
      selectedAssetIds,
      referenceFiles: referenceFiles.map(file => ({ id: file.id, name: file.name, type: file.type }))
    }));
    setNotice(`已准备${ASSET_TYPE_LABELS[assetType]}构建上下文，即将进入资产构建室。`);
    onOpenBuilder();
  };

  const handleCopy = async () => {
    if (!activePrompt) return;
    await navigator.clipboard.writeText(activePrompt);
    const event = createEvent('copy_result', '用户复制了优化后的提示词', { length: activePrompt.length });
    saveFeedbackEvents([event]);
    setNotice('已复制，并记录 copy_result 反馈事件。');
  };

  const handleRecordEdit = () => {
    const event = createEvent('manual_edit', '用户手动编辑了优化结果', { length: editablePrompt.length });
    saveFeedbackEvents([event]);
    setNotice('已记录 manual_edit 反馈事件。');
  };

  const handleDiagnose = async () => {
    const events = [
      createEvent('follow_up', feedbackNote || '用户补充了反馈说明', { note: feedbackNote }),
      ...feedbackEvents.slice(0, 6)
    ];
    setBusy('diagnose');
    try {
      const remote = await diagnoseFeedbackRemote({ events, compilation: compilation || undefined });
      setPatches(remote);
      saveFeedbackEvents(events);
      saveAssetPatches(remote);
    } catch {
      const local = diagnoseFeedback(events, compilation || undefined);
      setPatches(local);
      saveFeedbackEvents(events);
      saveAssetPatches(local);
    } finally {
      setBusy('');
    }
  };

  const handleApplyPatch = async (patch: AssetPatch) => {
    setBusy(`patch-${patch.id}`);
    try {
      const result = await applyAssetPatchRemote({ patch, assets });
      if (result.asset) {
        setAssets(previous => [result.asset!, ...previous.filter(asset => asset.id !== result.asset!.id)]);
      }
      setNotice(result.message);
    } finally {
      setBusy('');
    }
  };

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds(previous => previous.includes(assetId)
      ? previous.filter(id => id !== assetId)
      : previous.length >= 8
        ? previous
        : [...previous, assetId]);
  };

  const capabilityStatus = capability?.model.status === 'connected'
    ? 'connected'
    : capability?.model.configured
      ? 'testable'
      : 'context_only';

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 custom-scrollbar">
      <PageHeader
        eyebrow="PromptOps Workbench"
        title="工作台"
        description="粘贴你原本准备发给 AI 的提示词，按需插入资产和参考资料，生成更清晰、精准、可执行的优化版提示词。"
        actions={
          <>
            <StatusPill status={capabilityStatus} />
            <Button variant="ghost" onClick={onOpenLibrary}>资产库</Button>
            <Button variant="ghost" onClick={onOpenBuilder}>构建器</Button>
          </>
        }
      />

      <div className="grid min-h-[calc(100vh-112px)] grid-cols-1 gap-4 p-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <aside className="space-y-4">
          <Panel title="原始提示词与测试输入" eyebrow="Intake" actions={<Badge tone="neutral">{scenario}</Badge>}>
            <div className="space-y-4">
              <Field label="原始提示词内容">
                <textarea value={input} onChange={(event) => setInput(event.target.value)} className="field-input min-h-36 resize-y" placeholder="粘贴你原本准备发给 AI 的提示词。" />
              </Field>
              <Field label="Run Lab 测试输入">
                <textarea value={testInput} onChange={(event) => setTestInput(event.target.value)} className="field-input min-h-24 resize-y" placeholder="可选：填写一段测试输入，用来运行优化后的提示词。" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleAnalyze} disabled={busy === 'analyze'} icon={<FileText size={15} />}>分析提示词</Button>
                <Button variant="primary" onClick={handleOptimize} disabled={busy === 'optimize'} icon={<Wand2 size={15} />}>优化提示词</Button>
              </div>
            </div>
          </Panel>

          <Panel title="参考文件" eyebrow="References" actions={<Badge tone="neutral">{referenceFiles.length}/{MAX_ATTACHMENTS}</Badge>}>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-zinc-800 bg-zinc-950 px-3 py-3 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200">
                <UploadCloud size={15} />
                上传 MD/TXT/JSON/Word/Excel
                <input
                  type="file"
                  multiple
                  accept=".md,.markdown,.txt,.json,.docx,.xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(event) => handleReferenceUpload(event.target.files)}
                />
              </label>
              <div className="space-y-2">
                {referenceFiles.map(file => (
                  <div key={file.id} className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-zinc-200">{file.name}</span>
                      <Badge tone={file.textContent?.startsWith('解析失败') ? 'warn' : file.textContent ? 'accent' : 'muted'}>{file.type}</Badge>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[11px] text-zinc-600">{file.textContent || '该文件暂未抽取可用文本。'}</div>
                  </div>
                ))}
                {referenceFiles.length === 0 && <EmptyState title="暂无参考文件" description="参考文件只在本地解析为优化上下文，不上传远程存储。" />}
              </div>
            </div>
          </Panel>

          <Panel title="优化 Agent" eyebrow="Agent">
            <div className="space-y-2 text-xs leading-relaxed text-zinc-400">
              <div className="rounded-md border border-teal-900/60 bg-teal-950/20 px-3 py-2 text-teal-100">
                内部提示词工程 Agent 会先诊断左侧原始提示词，再融合你勾选的资产和参考文件，输出可直接发给其他 AI 的优化版提示词。
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Badge tone="accent">意图澄清</Badge>
                <Badge tone="accent">结构重构</Badge>
                <Badge tone="accent">资产融合</Badge>
                <Badge tone="accent">质量门</Badge>
              </div>
            </div>
          </Panel>

          <Panel title="提示词理解卡" eyebrow="Diagnosis">
            {taskModel ? (
              <div className="space-y-3 text-xs">
                <MetricRow label="目标" value={taskModel.goal} />
                <MetricRow label="受众" value={taskModel.audience} />
                <MetricRow label="风险" value={`${taskModel.riskLevel} / ${(taskModel.confidence * 100).toFixed(0)}%`} />
                <MetricRow label="缺口" value={taskModel.missingInfo.join('；') || '暂无'} />
              </div>
            ) : <EmptyState title="尚未分析提示词" description="点击“分析提示词”后会生成目标、受众、风险和推荐资产类型。" />}
          </Panel>
        </aside>

        <main className="min-w-0 space-y-4">
          <Panel
            title="优化后的提示词"
            eyebrow="Optimizer"
            actions={
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleCopy} disabled={!activePrompt} icon={<Clipboard size={15} />}>复制</Button>
                <Button onClick={handleRecordEdit} disabled={!activePrompt} icon={<Save size={15} />}>记录编辑</Button>
                <Button onClick={handleContinueIteration} disabled={!activePrompt || busy === 'optimize'} icon={<GitBranch size={15} />}>继续优化新版</Button>
                <Button variant="primary" onClick={handleRun} disabled={!activePrompt || busy === 'run'} icon={<Play size={15} />}>运行/预览</Button>
              </div>
            }
          >
            {compilation ? (
              <div className="space-y-3">
                {compilation.warnings.length > 0 && (
                  <div className="rounded-md border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-xs text-amber-100">
                    {compilation.warnings.join('；')}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <MetricCard label="注入资产" value={`${selectedAssets.length}`} detail={selectedAssets.length ? selectedAssets.map(asset => asset.title).slice(0, 2).join('、') : '本次未使用外部资产'} />
                  <MetricCard label="参考文件" value={`${referenceFiles.filter(file => file.textContent).length}`} detail="已解析文本会进入本轮上下文" />
                  <MetricCard label="版本" value={`V${promptCompilations.length + 1}`} detail={new Date(compilation.createdAt).toLocaleString()} />
                </div>
                {(optimizationHighlights.length > 0 || optimizationSuggestions.length > 0) && (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {optimizationHighlights.length > 0 && (
                      <div className="rounded-md border border-teal-900/60 bg-teal-950/20 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-300">优化亮点</div>
                        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-teal-50/90">
                          {optimizationHighlights.slice(0, 5).map((item, index) => <li key={`${item}-${index}`}>- {item}</li>)}
                        </ul>
                      </div>
                    )}
                    {optimizationSuggestions.length > 0 && (
                      <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">继续改进建议</div>
                        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-zinc-300">
                          {optimizationSuggestions.slice(0, 5).map((item, index) => <li key={`${item}-${index}`}>- {item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <textarea
                  value={editablePrompt}
                  onChange={(event) => setEditablePrompt(event.target.value)}
                  className="field-input min-h-[520px] resize-y font-mono text-xs leading-relaxed"
                />
              </div>
            ) : (
              <EmptyState
                title="还没有优化结果"
                description="选择或跳过资产后点击“开始优化”，系统会把左侧原始提示词改写成更清晰、精准、可执行的版本。"
                action={<Button variant="primary" onClick={handleOptimize}>开始优化</Button>}
              />
            )}
          </Panel>

          {runResult && (
            <Panel title="运行结果" eyebrow="Run Lab" actions={<StatusPill status={runResult.status} />}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <MetricCard label="Prompt" value={`${runResult.metrics.promptLength || 0}`} detail="chars" />
                <MetricCard label="输出" value={`${runResult.metrics.outputLength || 0}`} detail="chars" />
                <MetricCard label="模型" value={runResult.model} detail={runResult.provider} />
              </div>
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-300 custom-scrollbar">{runResult.output}</pre>
            </Panel>
          )}
        </main>

        <aside className="space-y-4">
          {notice && <div className="rounded-md border border-teal-900/60 bg-teal-950/30 px-3 py-2 text-xs text-teal-100">{notice}</div>}

          <Panel title="推荐资产" eyebrow="Assets" actions={<Badge tone="accent">{selectedAssets.length}/8</Badge>}>
            <div className="space-y-2">
              {(recommendedAssets.length ? recommendedAssets : assets.slice(0, 8)).map(asset => (
                <button
                  key={asset.id}
                  onClick={() => toggleAsset(asset.id)}
                  className={`w-full rounded-md border p-3 text-left transition-colors ${selectedAssetIds.includes(asset.id) ? 'border-teal-700 bg-teal-950/25' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-zinc-100">{asset.title || '未命名资产'}</span>
                    <StatusPill status={asset.status || 'context_only'} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge tone="neutral">{ASSET_TYPE_LABELS[asset.type]}</Badge>
                    <span className="truncate text-[11px] text-zinc-600">{asset.summary || asset.integration.usageNotes}</span>
                  </div>
                </button>
              ))}
              {assets.length === 0 && <EmptyState title="资产库为空" description="先通过构建器创建 Skill、Policy、Evaluator 或 Reference。" />}
            </div>
          </Panel>

          <Panel title="反馈与补丁队列" eyebrow="Evolution" actions={<Button onClick={handleDiagnose} disabled={busy === 'diagnose'} icon={<RefreshCw size={14} />}>诊断</Button>}>
            <Field label="反馈说明">
              <textarea value={feedbackNote} onChange={(event) => setFeedbackNote(event.target.value)} className="field-input min-h-24 resize-y" placeholder="可选：描述你对当前优化结果的修改意见、偏好或问题。" />
            </Field>
            <div className="mt-3 space-y-2">
              {patches.map(patch => (
                <div key={patch.id} className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-100">{ASSET_TYPE_LABELS[patch.suggestedAssetType]} 补丁</div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">{patch.reason}</p>
                    </div>
                    <Button className="shrink-0 px-2 py-1 text-xs" onClick={() => handleApplyPatch(patch)} disabled={busy === `patch-${patch.id}`} icon={<Check size={13} />}>接受</Button>
                  </div>
                </div>
              ))}
              {patches.length === 0 && <EmptyState title="暂无补丁" description="复制、编辑或补充反馈后点击诊断，会生成可接受的 AssetPatch。" />}
            </div>
          </Panel>

          <Panel title="沉淀为资产" eyebrow="Save">
            <div className="grid grid-cols-2 gap-2">
              {(['prompt', 'template', 'skill', 'evaluator', 'workflow'] as AssetType[]).map(type => (
                <Button key={type} disabled={!activePrompt} onClick={() => handleSaveAsAsset(type)}>
                  {ASSET_TYPE_LABELS[type]}
                </Button>
              ))}
            </div>
          </Panel>

          <Panel title="版本迭代" eyebrow="Versions">
            <div className="space-y-2">
              {promptCompilations.slice(0, 5).map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCompilation(item);
                    setEditablePrompt(item.compiledPrompt);
                    setLastGeneratedPrompt(item.compiledPrompt);
                    setNotice(`已切回 V${promptCompilations.length - index}，可继续生成下一版。`);
                  }}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-3 text-left hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-200">V{promptCompilations.length - index}</span>
                    <span className="text-[11px] text-zinc-600">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-[11px] text-zinc-500">{item.compiledPrompt}</div>
                </button>
              ))}
              {promptCompilations.length === 0 && <EmptyState title="暂无版本" description="每次优化都会保存为可回看的提示词版本。" />}
            </div>
          </Panel>

          <Panel title="最近运行" eyebrow="History">
            <div className="space-y-2">
              {promptRuns.slice(0, 4).map(run => (
                <div key={run.id} className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-zinc-200">{run.model}</span>
                    <StatusPill status={run.status || 'completed'} />
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-600">{new Date(run.createdAt).toLocaleString()}</div>
                </div>
              ))}
              {promptRuns.length === 0 && <EmptyState title="暂无运行记录" description="点击运行/预览后会保存到后端 state。" />}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
};

const MetricRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">{label}</div>
    <div className="mt-1 leading-relaxed text-zinc-300">{value}</div>
  </div>
);

const createEvent = (type: FeedbackEvent['type'], label: string, payload: Record<string, unknown>): FeedbackEvent => ({
  id: `event_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  runId: 'workspace',
  type,
  label,
  payload,
  timestamp: Date.now()
});

const toPromptRun = (result: RunLabRunResult, events: FeedbackEvent[]): PromptRun => ({
  id: result.id,
  compilationId: result.compilationId,
  model: result.model,
  input: result.input,
  output: result.output,
  metrics: result.metrics,
  feedbackEvents: events,
  status: result.status,
  provider: result.provider,
  error: result.status === 'failed' ? result.message : undefined,
  createdAt: result.createdAt
});
