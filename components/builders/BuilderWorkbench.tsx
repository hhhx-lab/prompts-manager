import React, { useMemo, useState } from 'react';
import { Boxes, Check, FileText, Save, Sparkles, Wand2 } from 'lucide-react';
import { AssetBuilderDraft, AssetType, OptimizationDirection, PromptAsset, ScenarioType, TaskModel } from '../../types';
import { analyzeTaskRemote, buildAssetDraftRemote } from '../../services/apiClient';
import { analyzeTaskLocally } from '../../services/taskAnalysis';
import { ALL_ASSET_TYPES, assetBuilderDraftToPromptAsset, buildLocalAssetDraft } from '../../services/assetDrafts';
import { ASSET_TYPE_LABELS } from '../../services/library';
import { InfoBlock, Panel } from '../ops/OpsPrimitives';

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
  const [assetType, setAssetType] = useState<AssetType>('skill');
  const [taskModel, setTaskModel] = useState<TaskModel | null>(null);
  const [draft, setDraft] = useState<AssetBuilderDraft | null>(null);
  const [notice, setNotice] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const selectedTypeHint = useMemo(() => typeHints[assetType], [assetType]);

  const handleAnalyze = async () => {
    setIsBusy(true);
    setNotice('');
    try {
      const remote = await analyzeTaskRemote({ input, assets, directions, scenario });
      setTaskModel(remote);
    } catch {
      setTaskModel(analyzeTaskLocally(input, assets, directions, scenario));
    } finally {
      setIsBusy(false);
    }
  };

  const handleBuildDraft = async () => {
    const task = taskModel || analyzeTaskLocally(input, assets, directions, scenario);
    if (!taskModel) setTaskModel(task);
    setIsBusy(true);
    setNotice('');
    try {
      setDraft(await buildAssetDraftRemote({ assetType, task, input }));
    } catch {
      setDraft(buildLocalAssetDraft(assetType, task, input));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveDraft = () => {
    if (!draft) return;
    const asset = assetBuilderDraftToPromptAsset(draft);
    onAssetCreate(asset);
    setNotice(`已保存为项目库资产：${asset.title}`);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-900/20">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
        <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-300/10 border border-amber-300/20 text-amber-100 text-xs font-bold mb-3">
              <Sparkles size={14} /> Asset Builder
            </div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Boxes className="text-amber-300" /> 资产包构建器
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-3xl">
              不要求用户理解 Prompt、Skill、MCP、SDK、Agent 的全部细节，先从任务出发，系统生成可保存、可编辑、可注入的结构化资产草稿。
            </p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3">
            当前项目库：<span className="text-cyan-300 font-bold">{assets.length}</span> 个资产
          </div>
        </section>

        {notice && (
          <div className="bg-emerald-400/10 border border-emerald-300/30 text-emerald-100 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <Check size={16} /> {notice}
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <Panel title="1. 从任务生成资产" icon={<Wand2 size={18} className="text-amber-300" />}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="w-full min-h-[150px] bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 outline-none focus:border-amber-300 resize-y"
              placeholder="描述你想反复复用、封装或交给 AI 稳定完成的任务。"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={handleAnalyze} disabled={isBusy || !input.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:text-slate-500 border border-slate-700 text-sm font-bold">
                <FileText size={16} /> 生成任务卡
              </button>
              <button onClick={handleBuildDraft} disabled={isBusy || !input.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-300 hover:bg-amber-200 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-sm font-bold">
                <Sparkles size={16} /> 生成 {ASSET_TYPE_LABELS[assetType]} 草稿
              </button>
              <button onClick={handleSaveDraft} disabled={!draft} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 disabled:opacity-40 text-cyan-200 text-sm font-bold hover:bg-cyan-500/30">
                <Save size={16} /> 保存到项目库
              </button>
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

          <Panel title="2. 选择资产类型" icon={<Boxes size={18} className="text-cyan-300" />}>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ASSET_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setAssetType(type)}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all ${assetType === type ? 'bg-amber-300 text-slate-950 border-amber-200' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                >
                  {ASSET_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            <div className="mt-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs font-bold text-amber-200">{ASSET_TYPE_LABELS[assetType]} 适合什么</div>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">{selectedTypeHint}</p>
            </div>
          </Panel>
        </section>

        {draft && (
          <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
            <Panel title="3. 草稿预览" icon={<Sparkles size={18} className="text-amber-300" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <InfoBlock label="标题" value={draft.title} />
                <InfoBlock label="类型" value={ASSET_TYPE_LABELS[draft.assetType]} />
                <InfoBlock label="摘要" value={draft.summary} wide />
              </div>
              <pre className="max-h-[520px] overflow-auto custom-scrollbar whitespace-pre-wrap break-words bg-slate-900 border border-slate-800 rounded-lg p-5 text-xs leading-relaxed text-slate-300">
                {draft.content}
              </pre>
            </Panel>

            <Panel title="4. 注入规格" icon={<FileText size={18} className="text-cyan-300" />}>
              <div className="space-y-3">
                <InfoBlock label="entryName" value={draft.integration.entryName} />
                <InfoBlock label="capabilities" value={draft.integration.capabilities.join('；')} />
                <InfoBlock label="inputs" value={draft.integration.inputs.join('；')} />
                <InfoBlock label="outputs" value={draft.integration.outputs.join('；')} />
                <InfoBlock label="constraints" value={draft.integration.constraints.join('；')} />
                <InfoBlock label="schema" value={draft.schemaPreview.join(' / ')} />
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
