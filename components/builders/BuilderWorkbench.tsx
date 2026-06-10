import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, Check, FileText, MessageSquare, Save, Send, UploadCloud, Wand2 } from 'lucide-react';
import { AssetBuilderDraft, AssetType, OptimizationDirection, PromptAsset, ScenarioType, TaskModel } from '../../types';
import { analyzeTaskRemote, autofillAssetDraftRemote, buildAssetDraftRemote, chatAssetBuilderRemote } from '../../services/apiClient';
import { analyzeTaskLocally } from '../../services/taskAnalysis';
import { ALL_ASSET_TYPES, assetBuilderDraftToPromptAsset, buildLocalAssetDraft } from '../../services/assetDrafts';
import { ASSET_TYPE_LABELS } from '../../services/library';
import { extractAssetText } from '../../services/fileParsing';
import { InfoBlock, Panel } from '../ops/OpsPrimitives';
import { Badge, Button, PageHeader, StatusPill } from '../ui/DesignSystem';

interface BuilderWorkbenchProps {
  assets: PromptAsset[];
  directions: OptimizationDirection[];
  scenario: ScenarioType;
  onAssetCreate: (asset: PromptAsset) => void;
}

export const BuilderWorkbench: React.FC<BuilderWorkbenchProps> = ({
  assets,
  directions,
  scenario,
  onAssetCreate
}) => {
  const [input, setInput] = useState('');
  const [buildMode, setBuildMode] = useState<'manual' | 'agent'>('agent');
  const [sourceText, setSourceText] = useState('');
  const [handoffContext, setHandoffContext] = useState<{ assetType?: AssetType; prompt?: string; packId?: string; slotKey?: string } | null>(null);
  const [assetType, setAssetType] = useState<AssetType>('skill');
  const [taskModel, setTaskModel] = useState<TaskModel | null>(null);
  const [draft, setDraft] = useState<AssetBuilderDraft | null>(null);
  const [notice, setNotice] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [builderChatInput, setBuilderChatInput] = useState('');
  const [builderMessages, setBuilderMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);

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
      const nextDraft = await buildAssetDraftRemote({ assetType, task, input: agentInput });
      setDraft(nextDraft);
      setMissingFields([]);
      setSuggestedActions(nextDraft.nextSteps || []);
    } catch {
      const nextDraft = buildLocalAssetDraft(assetType, task, agentInput);
      setDraft(nextDraft);
      setMissingFields([]);
      setSuggestedActions(nextDraft.nextSteps || []);
    } finally {
      setIsBusy(false);
    }
  };

  const handleAutofillDraft = async () => {
    if (!agentInput.trim() && builderMessages.length === 0) {
      setNotice('请先用一句话或资料告诉 Agent 要构建什么资产。');
      return;
    }
    setIsBusy(true);
    setNotice('');
    try {
      const nextDraft = await autofillAssetDraftRemote({
        assetType,
        messages: builderMessages.map(message => ({ role: message.role, content: message.text })),
        input: agentInput,
        sourceText,
        currentDraft: draft
      });
      setDraft(nextDraft);
      setMissingFields([]);
      setSuggestedActions(nextDraft.nextSteps || []);
      setNotice('Agent 已根据当前对话和资料自动回填草稿。');
    } catch (error) {
      setNotice(`自动回填失败：${error instanceof Error ? error.message : '未知错误'}。可继续使用本地草稿生成。`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleBuilderChat = async () => {
    if (!builderChatInput.trim()) return;
    const current = builderChatInput;
    const nextMessages = [...builderMessages, { role: 'user' as const, text: current }];
    setBuilderMessages(nextMessages);
    setBuilderChatInput('');
    setIsBusy(true);
    try {
      const response = await chatAssetBuilderRemote({
        messages: nextMessages.map(message => ({ role: message.role, content: message.text })),
        assetType,
        assets,
        currentDraft: draft,
        sourceText,
        input
      });
      setBuilderMessages(previous => [...previous, { role: 'assistant', text: response.reply || response.message }]);
      if (response.draft) setDraft(response.draft);
      setMissingFields(response.missingFields || []);
      setSuggestedActions(response.suggestedActions || response.draft?.nextSteps || []);
      if (response.message && !response.ok) setNotice(response.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBuilderMessages(previous => [...previous, { role: 'assistant', text: `构建 Agent 暂不可用：${message}` }]);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSourceFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.currentTarget.files;
    const files: File[] = fileList ? Array.from(fileList) : [];
    event.target.value = '';
    if (!files.length) return;
    setIsBusy(true);
    setNotice('');
    try {
      const chunks: string[] = [];
      for (const file of files) {
        const text = await extractAssetText(file);
        chunks.push(`## ${file.name}\n${text.slice(0, 20000)}`);
      }
      setSourceText(previous => [previous, ...chunks].filter(Boolean).join('\n\n---\n\n'));
      setNotice(`已导入 ${files.length} 个文件，Agent 会把它们作为来源资料提炼资产。`);
    } catch (error) {
      setNotice(`文件导入失败：${error instanceof Error ? error.message : '未知错误'}`);
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

  const updateDraft = (patch: Partial<AssetBuilderDraft>) => {
    setDraft(previous => previous ? { ...previous, ...patch } : previous);
  };

  const updateDraftIntegrationText = (field: 'capabilities' | 'inputs' | 'outputs' | 'constraints', value: string) => {
    setDraft(previous => previous ? {
      ...previous,
      integration: {
        ...previous.integration,
        [field]: value.split(/\n|；|;/).map(item => item.trim()).filter(Boolean)
      }
    } : previous);
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
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <input id="builder-source-file" type="file" multiple className="hidden" accept=".md,.txt,.json,.docx,.xlsx,.xls,.csv,application/json,text/plain,text/markdown" onChange={handleSourceFileUpload} />
                  <label htmlFor="builder-source-file" className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800">
                    <UploadCloud size={16} /> 上传资料给 Agent
                  </label>
                  <span className="text-xs text-zinc-600">支持 Markdown / TXT / JSON / Word / Excel / CSV</span>
                </div>
                <textarea
                  value={sourceText}
                  onChange={(event) => setSourceText(event.target.value)}
                  className="field-input min-h-28 resize-y"
                  placeholder="可选：粘贴文档、链接摘要、API/MCP/SDK 说明或现有提示词，Agent 会据此提炼字段。"
                />
                <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <MessageSquare size={14} /> 构建 Agent 对话
                  </div>
                  <div className="max-h-56 space-y-2 overflow-auto pr-1 custom-scrollbar">
                    {builderMessages.length === 0 ? (
                      <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-xs leading-relaxed text-zinc-500">
                        你可以用自然语言继续补充：比如“把这份文档提炼成 Skill”“帮我生成一个只读 GitHub MCP 规格”“这个 Workflow 要增加人工审核节点”。
                      </div>
                    ) : builderMessages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`rounded-md border p-3 text-xs leading-relaxed ${message.role === 'user' ? 'border-teal-900/60 bg-teal-950/25 text-teal-100' : 'border-zinc-800 bg-zinc-900/70 text-zinc-300'}`}>
                        {message.text}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={builderChatInput}
                      onChange={(event) => setBuilderChatInput(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleBuilderChat()}
                      className="field-input"
                      placeholder="继续告诉 Agent 你的资产目标或修改要求..."
                    />
                    <Button onClick={handleBuilderChat} disabled={isBusy || !builderChatInput.trim()} icon={<Send size={16} />}>发送</Button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button onClick={handleAnalyze} disabled={isBusy || !input.trim()} icon={<FileText size={16} />}>生成任务卡</Button>
              <Button variant="primary" onClick={handleBuildDraft} disabled={isBusy || !input.trim()} icon={<Boxes size={16} />}>生成 {ASSET_TYPE_LABELS[assetType]} 草稿</Button>
              <Button onClick={handleAutofillDraft} disabled={isBusy || (!agentInput.trim() && builderMessages.length === 0)} icon={<Wand2 size={16} />}>Agent 自动回填</Button>
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
              {(missingFields.length > 0 || suggestedActions.length > 0) && (
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoBlock label="Agent 识别缺口" value={missingFields.join('；') || '暂无明显缺口'} />
                  <InfoBlock label="建议动作" value={suggestedActions.join('；') || '草稿可保存，建议人工复核。'} />
                </div>
              )}
              <div className="space-y-3">
                <input
                  value={draft.title}
                  onChange={(event) => updateDraft({ title: event.target.value })}
                  className="field-input"
                  placeholder="资产标题"
                />
                <textarea
                  value={draft.summary}
                  onChange={(event) => updateDraft({ summary: event.target.value })}
                  className="field-input min-h-20 resize-y"
                  placeholder="资产摘要"
                />
                <textarea
                  value={draft.content}
                  onChange={(event) => updateDraft({ content: event.target.value })}
                  className="field-input min-h-[360px] resize-y font-mono text-xs leading-relaxed"
                  placeholder="资产正文"
                />
              </div>
            </Panel>

            <Panel title="4. 注入规格" icon={<FileText size={18} className="text-zinc-400" />}>
              <div className="space-y-3">
                <input
                  value={draft.integration.entryName}
                  onChange={(event) => setDraft(previous => previous ? { ...previous, integration: { ...previous.integration, entryName: event.target.value } } : previous)}
                  className="field-input"
                  placeholder="entryName，例如 skill.contract_risk_review"
                />
                <textarea
                  value={draft.integration.capabilities.join('\n')}
                  onChange={(event) => updateDraftIntegrationText('capabilities', event.target.value)}
                  className="field-input min-h-20 resize-y"
                  placeholder="capabilities，每行一条"
                />
                <textarea
                  value={draft.integration.inputs.join('\n')}
                  onChange={(event) => updateDraftIntegrationText('inputs', event.target.value)}
                  className="field-input min-h-20 resize-y"
                  placeholder="inputs，每行一条"
                />
                <textarea
                  value={draft.integration.outputs.join('\n')}
                  onChange={(event) => updateDraftIntegrationText('outputs', event.target.value)}
                  className="field-input min-h-20 resize-y"
                  placeholder="outputs，每行一条"
                />
                <textarea
                  value={draft.integration.constraints.join('\n')}
                  onChange={(event) => updateDraftIntegrationText('constraints', event.target.value)}
                  className="field-input min-h-20 resize-y"
                  placeholder="constraints，每行一条"
                />
                <InfoBlock label="schema" value={draft.schemaPreview.join(' / ')} />
                <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                  <StatusPill status={runtimeDraft ? 'context_only' : 'schema_ready'} />
                  {runtimeDraft ? '该类型保存后仅作为上下文或 schema，不代表已连接或可执行。' : '保存后可立即回到工作台被推荐，并作为上下文参与提示词优化。'}
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
