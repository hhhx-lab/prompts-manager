import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, Check, FileText, Save, Wand2 } from 'lucide-react';
import { AssetBuilderDraft, AssetType, OptimizationDirection, PromptAsset, ScenarioType, TaskModel } from '../../types';
import { analyzeTaskRemote, buildAssetDraftRemote } from '../../services/apiClient';
import { analyzeTaskLocally } from '../../services/taskAnalysis';
import { ALL_ASSET_TYPES, assetBuilderDraftToPromptAsset, buildLocalAssetDraft } from '../../services/assetDrafts';
import { ASSET_TYPE_LABELS } from '../../services/library';
import { InfoBlock, Panel } from '../ops/OpsPrimitives';
import { Badge, Button, PageHeader, StatusPill } from '../ui/DesignSystem';

interface BuilderWorkbenchProps {
  assets: PromptAsset[];
  directions: OptimizationDirection[];
  scenario: ScenarioType;
  onAssetCreate: (asset: PromptAsset) => void;
}

const starterInput = '我想把一个反复出现的 AI 任务封装成可复用资产，能自动补齐触发条件、输入输出、边界、示例和评估标准。';

export const BuilderWorkbench: React.FC<BuilderWorkbenchProps> = ({
  assets,
  directions,
  scenario,
  onAssetCreate
}) => {
  const [input, setInput] = useState(starterInput);
  const [buildMode, setBuildMode] = useState<'manual' | 'agent'>('agent');
  const [sourceText, setSourceText] = useState('');
  const [handoffContext, setHandoffContext] = useState<{ assetType?: AssetType; prompt?: string; packId?: string; slotKey?: string } | null>(null);
  const [assetType, setAssetType] = useState<AssetType>('skill');
  const [taskModel, setTaskModel] = useState<TaskModel | null>(null);
  const [draft, setDraft] = useState<AssetBuilderDraft | null>(null);
  const [notice, setNotice] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const selectedTypeHint = useMemo(() => typeHints[assetType], [assetType]);
  const completion = draft ? calculateDraftCompletion(draft) : 0;
  const runtimeDraft = ['mcp', 'sdk', 'tool', 'connector'].includes(assetType);
  const agentInput = [input, sourceText ? `\n\n---\n来源资料:\n${sourceText}` : ''].join('');

  useEffect(() => {
    const raw = sessionStorage.getItem('promptmaster_builder_handoff_v1');
    if (!raw) return;
    try {
      const context = JSON.parse(raw) as { assetType?: AssetType; prompt?: string; packId?: string; slotKey?: string };
      setHandoffContext(context);
      if (context.assetType) setAssetType(context.assetType);
      if (context.prompt) {
        setInput(`请把以下提示词上下文封装为可复用 ${context.assetType || 'asset'}：`);
        setSourceText(context.prompt);
      }
      setBuildMode('agent');
      sessionStorage.removeItem('promptmaster_builder_handoff_v1');
    } catch {
      sessionStorage.removeItem('promptmaster_builder_handoff_v1');
    }
  }, []);

  const handleAnalyze = async () => {
    setIsBusy(true);
    setNotice('');
    try {
      const remote = await analyzeTaskRemote({ input: agentInput, assets, directions, scenario });
      setTaskModel(remote);
    } catch {
      setTaskModel(analyzeTaskLocally(agentInput, assets, directions, scenario));
    } finally {
      setIsBusy(false);
    }
  };

  const handleBuildDraft = async () => {
    if (!agentInput.trim()) {
      setNotice('请先描述你想构建的资产，或粘贴一段来源资料。');
      return;
    }
    const task = taskModel || analyzeTaskLocally(agentInput, assets, directions, scenario);
    if (!taskModel) setTaskModel(task);
    setIsBusy(true);
    setNotice('');
    try {
      setDraft(await buildAssetDraftRemote({ assetType, task, input: agentInput }));
    } catch {
      setDraft(buildLocalAssetDraft(assetType, task, agentInput));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveDraft = () => {
    if (!draft) return;
    const asset = {
      ...assetBuilderDraftToPromptAsset(draft),
      source: handoffContext ? 'builder-handoff' : 'builder',
      tags: handoffContext?.slotKey
        ? ['builder', draft.assetType, `slot:${handoffContext.slotKey}`]
        : ['builder', draft.assetType]
    };
    onAssetCreate(asset);
    setNotice(`已保存为项目库资产：${asset.title}`);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-zinc-950">
      <PageHeader
        eyebrow="Asset Builder"
        title="资产包构建器"
        description="从任务生成结构化资产草稿，按类型检查完成度、注入规格和保存状态。"
        actions={
          <>
            <Badge tone="neutral">{assets.length} 资产</Badge>
            {draft && <Badge tone={completion >= 80 ? 'good' : 'warn'}>完成度 {completion}%</Badge>}
            <Badge tone={buildMode === 'agent' ? 'accent' : 'neutral'}>{buildMode === 'agent' ? 'Agent 构建' : '手动构建'}</Badge>
          </>
        }
      />
      <div className="max-w-7xl mx-auto p-4 lg:p-5 space-y-6">

        {notice && (
          <div className="bg-emerald-400/10 border border-emerald-300/30 text-emerald-100 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <Check size={16} /> {notice}
          </div>
        )}

        {handoffContext && (
          <div className="rounded-lg border border-teal-900/60 bg-teal-950/25 px-4 py-3 text-sm text-teal-100">
            来自能力包/工作台的构建上下文：目标类型 {handoffContext.assetType ? ASSET_TYPE_LABELS[handoffContext.assetType] : '未指定'}
            {handoffContext.slotKey ? `，槽位 ${handoffContext.slotKey}` : ''}。保存后会保留 handoff 来源，便于后续回填。
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <Panel title="1. 从任务生成资产" icon={<Wand2 size={18} className="text-zinc-400" />}>
            <div className="mb-3 flex rounded-md border border-zinc-800 bg-zinc-900 p-1">
              <button onClick={() => setBuildMode('agent')} className={`flex-1 rounded px-3 py-2 text-xs font-semibold ${buildMode === 'agent' ? 'bg-zinc-700 text-zinc-50' : 'text-zinc-500 hover:text-zinc-200'}`}>Agent 构建</button>
              <button onClick={() => setBuildMode('manual')} className={`flex-1 rounded px-3 py-2 text-xs font-semibold ${buildMode === 'manual' ? 'bg-zinc-700 text-zinc-50' : 'text-zinc-500 hover:text-zinc-200'}`}>手动构建</button>
            </div>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="field-input min-h-[150px] resize-y"
              placeholder={buildMode === 'agent' ? '用一句话告诉 Agent 你想搭建什么资产。' : '手动写下资产目标、使用场景和边界。'}
            />
            {buildMode === 'agent' && (
              <div className="mt-3">
                <textarea
                  value={sourceText}
                  onChange={(event) => setSourceText(event.target.value)}
                  className="field-input min-h-28 resize-y"
                  placeholder="可选：粘贴文档、链接摘要、API/MCP/SDK 说明或现有提示词，Agent 会据此提炼字段。"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button onClick={handleAnalyze} disabled={isBusy || !input.trim()} icon={<FileText size={16} />}>生成任务卡</Button>
              <Button variant="primary" onClick={handleBuildDraft} disabled={isBusy || !input.trim()} icon={<Boxes size={16} />}>生成 {ASSET_TYPE_LABELS[assetType]} 草稿</Button>
              <Button onClick={handleSaveDraft} disabled={!draft} icon={<Save size={16} />}>保存到项目库</Button>
            </div>

            {taskModel && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoBlock label="目标" value={taskModel.goal} />
                <InfoBlock label="受众" value={taskModel.audience} />
                <InfoBlock label="风险" value={`${taskModel.riskLevel} · ${(taskModel.confidence * 100).toFixed(0)}% confidence`} />
                <InfoBlock label="建议资产" value={taskModel.suggestedAssetTypes.map(type => ASSET_TYPE_LABELS[type]).join(' / ')} />
                <InfoBlock label="缺口" value={taskModel.missingInfo.join('；') || '暂无'} wide />
              </div>
            )}
          </Panel>

          <Panel title="2. 选择资产类型" icon={<Boxes size={18} className="text-zinc-400" />}>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ASSET_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setAssetType(type)}
                  className={`rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors ${assetType === type ? 'border-teal-800 bg-teal-950/45 text-teal-100' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'}`}
                >
                  {ASSET_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs font-bold text-teal-200">{ASSET_TYPE_LABELS[assetType]} 结构提示</div>
              <p className="text-xs text-zinc-500 leading-relaxed mt-2">{selectedTypeHint}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
                {buildMode === 'manual'
                  ? '手动模式适合你已经知道字段结构时逐项补齐；保存前仍可检查注入规格。'
                  : 'Agent 模式会先生成草稿，用户确认前不会写入资产库。'}
              </p>
            </div>
          </Panel>
        </section>

        {draft && (
          <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
            <Panel title="3. 草稿预览" icon={<Boxes size={18} className="text-zinc-400" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <InfoBlock label="标题" value={draft.title} />
                <InfoBlock label="类型" value={ASSET_TYPE_LABELS[draft.assetType]} />
                <InfoBlock label="完成度" value={`${completion}%`} />
                <InfoBlock label="能力状态" value="schema_ready" />
                <InfoBlock label="摘要" value={draft.summary} wide />
                <InfoBlock label="缺失/下一步" value={draft.nextSteps.join('；') || '暂无'} wide />
              </div>
              <pre className="max-h-[520px] overflow-auto custom-scrollbar whitespace-pre-wrap break-words rounded-md border border-zinc-800 bg-zinc-950 p-5 text-xs leading-relaxed text-zinc-300">
                {draft.content}
              </pre>
            </Panel>

            <Panel title="4. 注入规格" icon={<FileText size={18} className="text-zinc-400" />}>
              <div className="space-y-3">
                <InfoBlock label="entryName" value={draft.integration.entryName} />
                <InfoBlock label="capabilities" value={draft.integration.capabilities.join('；')} />
                <InfoBlock label="inputs" value={draft.integration.inputs.join('；')} />
                <InfoBlock label="outputs" value={draft.integration.outputs.join('；')} />
                <InfoBlock label="constraints" value={draft.integration.constraints.join('；')} />
                <InfoBlock label="schema" value={draft.schemaPreview.join(' / ')} />
                <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                  <StatusPill status={runtimeDraft ? 'context_only' : 'schema_ready'} />
                  {runtimeDraft ? '该类型保存后仅作为上下文或 schema，不代表已连接或可执行。' : '保存后可立即回到工作台被推荐、注入和编译。'}
                </div>
                <div className="text-[11px] text-amber-100 bg-amber-400/10 border border-amber-300/20 rounded-lg p-3">
                  {draft.warnings.join('；')}
                </div>
              </div>
            </Panel>
          </section>
        )}
      </div>
    </div>
  );
};

const typeHints: Record<AssetType, string> = {
  prompt: '最适合封装单次或短流程任务，重点是角色、任务、变量、输出格式和评估标准。',
  skill: '适合高频、复杂、需要固定流程和资源渐进加载的任务，可以导出为 SKILL.md。',
  mcp: '适合描述 MCP server、tools、resources、prompts、权限和失败处理，当前只作为上下文。',
  sdk: '适合沉淀 API/SDK 接入方式、认证、核心方法、示例和测试建议。',
  workflow: '适合多阶段、多角色、有质量门和失败回退的任务编排。',
  reference: '适合存放领域资料、术语、标准、案例和引用规则。',
  agent: '适合具备身份、目标、工具、记忆、计划策略和停止条件的执行体。',
  tool: '适合单个函数、命令或脚本能力，关注参数、返回、副作用和回退。',
  template: '适合复用结构骨架、变量槽位和输出格式。',
  evaluator: '适合定义评分维度、通过阈值、失败案例和评估报告格式。',
  dataset: '适合保存 few-shot 样例、正反例、标签和质量备注。',
  policy: '适合沉淀安全、合规、品牌、事实边界和拒答/降级策略。',
  memory: '适合保存长期事实、项目约定、用户偏好和失效规则。',
  connector: '适合描述外部系统连接、认证、权限、速率限制和数据边界。',
  parser: '适合定义文件或文本抽取字段、清洗规则、输出 schema 和失败处理。',
  benchmark: '适合为 Prompt、Skill、Agent 或 Workflow 做回归测试和版本对比。'
};

const calculateDraftCompletion = (draft: AssetBuilderDraft): number => {
  const checks = [
    draft.title.trim(),
    draft.summary.trim(),
    draft.content.trim().length > 120,
    draft.integration.entryName.trim(),
    draft.integration.capabilities.length > 0,
    draft.integration.inputs.length > 0,
    draft.integration.outputs.length > 0,
    draft.integration.constraints.length > 0,
    draft.schemaPreview.length > 0,
    draft.nextSteps.length > 0
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};
