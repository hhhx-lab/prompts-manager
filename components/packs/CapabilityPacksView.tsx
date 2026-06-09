import React, { useMemo, useState } from 'react';
import { Download, PackageCheck, PackagePlus, Plus, Save, Trash2, Upload, Wand2, X } from 'lucide-react';
import { AssetType, CapabilityPack, CapabilityPackSlot, CapabilityPackSlotKey, PromptAsset } from '../../types';
import {
  CAPABILITY_PACK_SLOTS,
  createCapabilityPackDraft,
  exportCapabilityPack,
  getPackAssetIds,
  refreshCapabilityPackQuality,
  slotAcceptsType
} from '../../services/capabilityPacks';
import { ASSET_TYPE_LABELS, mergeImportedAssets, normalizeImportedAsset, parseList } from '../../services/library';
import { Badge, Button, EmptyState, Field, MetricCard, PageHeader, Panel, StatusPill } from '../ui/DesignSystem';

interface CapabilityPacksViewProps {
  assets: PromptAsset[];
  packs: CapabilityPack[];
  onSave: (pack: CapabilityPack) => void;
  onDelete: (id: string) => void;
  onUse: (pack: CapabilityPack) => void;
  onImportAssets: (assets: PromptAsset[]) => void;
  onOpenBuilder: (assetType: AssetType, pack: CapabilityPack, slot: CapabilityPackSlot) => void;
}

const starterInput = '面向合同风险审查：组合 Prompt、Reference、Policy、Evaluator 和可选 Workflow，形成可一键注入的审查能力包。';

export const CapabilityPacksView: React.FC<CapabilityPacksViewProps> = ({
  assets,
  packs,
  onSave,
  onDelete,
  onUse,
  onImportAssets,
  onOpenBuilder
}) => {
  const [draftInput, setDraftInput] = useState(starterInput);
  const [activePackId, setActivePackId] = useState(packs[0]?.id || '');
  const [notice, setNotice] = useState('');

  const activePack = useMemo(() => packs.find(pack => pack.id === activePackId) || packs[0], [activePackId, packs]);
  const packAssets = useMemo(() => activePack ? assets.filter(asset => getPackAssetIds(activePack).includes(asset.id)) : [], [activePack, assets]);

  const handleCreateDraft = () => {
    const pack = createCapabilityPackDraft(draftInput, assets);
    onSave(pack);
    setActivePackId(pack.id);
    setNotice('Agent 已根据一句话生成能力包草稿，可继续调整槽位资产。');
  };

  const handleUpdatePack = (patch: Partial<CapabilityPack>) => {
    if (!activePack) return;
    onSave(refreshCapabilityPackQuality({ ...activePack, ...patch, updatedAt: Date.now() }));
  };

  const handleUpdateSlot = (slotKey: CapabilityPackSlotKey, patch: Partial<CapabilityPackSlot>) => {
    if (!activePack) return;
    const slots = activePack.slots.map(slot => slot.key === slotKey ? { ...slot, ...patch } : slot);
    onSave(refreshCapabilityPackQuality({ ...activePack, slots, updatedAt: Date.now() }));
  };

  const handleAddSlotAsset = (slot: CapabilityPackSlot, assetId: string) => {
    if (!assetId || slot.assetIds.includes(assetId)) return;
    handleUpdateSlot(slot.key, { assetIds: [...slot.assetIds, assetId] });
  };

  const handleRemoveSlotAsset = (slot: CapabilityPackSlot, assetId: string) => {
    handleUpdateSlot(slot.key, { assetIds: slot.assetIds.filter(id => id !== assetId) });
  };

  const handleExportPack = (pack: CapabilityPack) => {
    downloadJson(exportCapabilityPack(pack, assets), `capability-pack-${safeName(pack.name)}.json`);
  };

  const handleExportAll = () => {
    const assetIds = new Set(packs.flatMap(pack => getPackAssetIds(pack)));
    downloadJson({
      version: 1,
      kind: 'capability-pack-bundle',
      packs,
      assets: assets.filter(asset => assetIds.has(asset.id))
    }, `capability-packs-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImport = async (files: FileList | null) => {
    if (!files?.length) return;
    let importedPacks = 0;
    let importedAssets = 0;
    for (const file of Array.from(files)) {
      const parsed = JSON.parse(await file.text());
      const nextPacks: CapabilityPack[] = [];
      if (parsed.kind === 'capability-pack' && parsed.pack) nextPacks.push(normalizePack(parsed.pack));
      if (Array.isArray(parsed.packs)) nextPacks.push(...parsed.packs.map(normalizePack));
      if (Array.isArray(parsed.assets)) {
        onImportAssets(mergeImportedAssets([], parsed.assets.map(normalizeImportedAsset)));
        importedAssets += parsed.assets.length;
      }
      nextPacks.forEach(pack => {
        onSave(pack);
        setActivePackId(pack.id);
      });
      importedPacks += nextPacks.length;
    }
    setNotice(`已导入 ${importedPacks} 个能力包${importedAssets ? `，并同步 ${importedAssets} 个关联资产` : ''}。`);
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 custom-scrollbar">
      <PageHeader
        eyebrow="Capability Packs"
        title="能力包"
        description="从资产库任意挑选 Prompt、Skill、Reference、Policy、Evaluator、MCP/SDK/Tool 等资产，组合成可一键使用或导出的场景能力包。"
        actions={
          <>
            <input id="capability-pack-import" type="file" className="hidden" multiple accept=".json,application/json" onChange={(event) => handleImport(event.target.files)} />
            <label htmlFor="capability-pack-import" className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800">
              <Upload size={16} /> 导入
            </label>
            <Button onClick={handleExportAll} disabled={packs.length === 0} icon={<Download size={16} />}>导出全部</Button>
            <Button variant="primary" onClick={handleCreateDraft} icon={<Wand2 size={16} />}>生成草稿</Button>
          </>
        }
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 lg:p-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          {notice && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-teal-900/60 bg-teal-950/30 px-3 py-2 text-xs text-teal-100">
              <span>{notice}</span>
              <button onClick={() => setNotice('')}><X size={14} /></button>
            </div>
          )}

          <Panel title="Agent 生成能力包" eyebrow="Draft">
            <Field label="一句话描述场景">
              <textarea value={draftInput} onChange={(event) => setDraftInput(event.target.value)} className="field-input min-h-28 resize-y" />
            </Field>
            <div className="mt-3 flex gap-2">
              <Button variant="primary" onClick={handleCreateDraft} disabled={!draftInput.trim()} icon={<PackagePlus size={16} />}>生成草稿</Button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              系统会优先按关键词匹配已有资产；缺失的槽位可直接跳转构建器，让 Agent 生成新资产后再回填。
            </p>
          </Panel>

          <Panel title="能力包列表" eyebrow="Library" actions={<Badge tone="neutral">{packs.length}</Badge>}>
            {packs.length === 0 ? (
              <EmptyState title="还没有能力包" description="输入一句话生成草稿，或从 JSON 导入现有能力包。" />
            ) : (
              <div className="space-y-2">
                {packs.map(pack => (
                  <button
                    key={pack.id}
                    onClick={() => setActivePackId(pack.id)}
                    className={`w-full rounded-md border p-3 text-left transition-colors ${activePack?.id === pack.id ? 'border-teal-800 bg-teal-950/30' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-zinc-100">{pack.name}</span>
                      <Badge tone={pack.missingSlots.length ? 'warn' : 'good'}>{pack.qualityScore}%</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{pack.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {pack.tags.slice(0, 3).map(tag => <Badge key={tag} tone="muted">{tag}</Badge>)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        </aside>

        <main className="min-w-0 space-y-4">
          {!activePack ? (
            <EmptyState title="请选择或创建能力包" description="能力包会把多类资产编排成一个可复用上下文，适合常见业务场景一键注入工作台。" />
          ) : (
            <>
              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard label="质量分" value={`${activePack.qualityScore}%`} tone={activePack.missingSlots.length ? 'warn' : 'good'} detail={activePack.missingSlots.length ? `缺失 ${activePack.missingSlots.length} 个必填槽位` : '必填槽位完整'} />
                <MetricCard label="关联资产" value={`${packAssets.length}`} detail="一键使用时最多注入前 8 个" />
                <MetricCard label="使用次数" value={`${activePack.usageCount || 0}`} detail={activePack.lastUsedAt ? new Date(activePack.lastUsedAt).toLocaleString() : '尚未使用'} />
                <MetricCard label="版本" value={`v${activePack.version}`} detail={activePack.source} />
              </section>

              <Panel
                title="能力包详情"
                eyebrow="Inspector"
                actions={
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleExportPack(activePack)} icon={<Download size={16} />}>导出</Button>
                    <Button onClick={() => onUse(activePack)} icon={<PackageCheck size={16} />}>一键使用</Button>
                    <Button variant="danger" onClick={() => onDelete(activePack.id)} icon={<Trash2 size={16} />}>删除</Button>
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Field label="名称">
                    <input value={activePack.name} onChange={(event) => handleUpdatePack({ name: event.target.value })} className="field-input" />
                  </Field>
                  <Field label="场景">
                    <input value={activePack.scenario} onChange={(event) => handleUpdatePack({ scenario: event.target.value })} className="field-input" />
                  </Field>
                  <Field label="摘要">
                    <textarea value={activePack.summary} onChange={(event) => handleUpdatePack({ summary: event.target.value })} className="field-input min-h-24 resize-y" />
                  </Field>
                  <Field label="标签">
                    <textarea value={activePack.tags.join('\n')} onChange={(event) => handleUpdatePack({ tags: parseList(event.target.value) })} className="field-input min-h-24 resize-y" />
                  </Field>
                  <Field label="典型输入">
                    <textarea value={activePack.typicalInputs.join('\n')} onChange={(event) => handleUpdatePack({ typicalInputs: parseList(event.target.value) })} className="field-input min-h-24 resize-y" />
                  </Field>
                  <Field label="期望输出">
                    <textarea value={activePack.expectedOutputs.join('\n')} onChange={(event) => handleUpdatePack({ expectedOutputs: parseList(event.target.value) })} className="field-input min-h-24 resize-y" />
                  </Field>
                </div>
              </Panel>

              <Panel title="槽位编排" eyebrow="Slots" actions={<Badge tone={activePack.missingSlots.length ? 'warn' : 'good'}>{activePack.missingSlots.length ? '有缺口' : '已完整'}</Badge>}>
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {activePack.slots.map(slot => (
                    <SlotEditor
                      key={slot.key}
                      slot={slot}
                      assets={assets}
                      onAddAsset={assetId => handleAddSlotAsset(slot, assetId)}
                      onRemoveAsset={assetId => handleRemoveSlotAsset(slot, assetId)}
                      onOpenBuilder={() => onOpenBuilder(slot.acceptedTypes[0], activePack, slot)}
                    />
                  ))}
                </div>
              </Panel>

              <Panel title="运行边界" eyebrow="Safety">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <BoundaryNote title="资产包不是执行环境" body="能力包只负责把资产作为工程上下文注入工作台，不会自动调用 MCP、SDK、Tool 或 Connector。" />
                  <BoundaryNote title="可执行能力需显式确认" body="只有资产状态达到 executable，并且后续运行链路要求用户确认时，才允许真实外部执行。" />
                  <BoundaryNote title="导入内容默认保守" body="从市场、URL 或 JSON 导入的工具类资产默认 context_only，避免把文档伪装成已连接能力。" />
                </div>
              </Panel>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const SlotEditor: React.FC<{
  slot: CapabilityPackSlot;
  assets: PromptAsset[];
  onAddAsset: (assetId: string) => void;
  onRemoveAsset: (assetId: string) => void;
  onOpenBuilder: () => void;
}> = ({ slot, assets, onAddAsset, onRemoveAsset, onOpenBuilder }) => {
  const selectableAssets = assets.filter(asset => slotAcceptsType(slot, asset.type));
  const selectedAssets = assets.filter(asset => slot.assetIds.includes(asset.id));
  return (
    <div className={`rounded-lg border p-4 ${slot.required && slot.assetIds.length === 0 ? 'border-amber-900/70 bg-amber-950/10' : 'border-zinc-800 bg-zinc-950/70'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">{slot.label}</span>
            {slot.required && <Badge tone={slot.assetIds.length ? 'good' : 'warn'}>必填</Badge>}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{slot.role}</p>
        </div>
        <Button className="shrink-0 px-2 py-1 text-xs" onClick={onOpenBuilder} icon={<Plus size={13} />}>新建</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {slot.acceptedTypes.map(type => <Badge key={type} tone="muted">{ASSET_TYPE_LABELS[type]}</Badge>)}
      </div>
      <select className="field-input mt-3" value="" onChange={(event) => onAddAsset(event.target.value)}>
        <option value="">选择已有资产加入槽位...</option>
        {selectableAssets.map(asset => (
          <option key={asset.id} value={asset.id}>{asset.title || '未命名资产'} · {ASSET_TYPE_LABELS[asset.type]}</option>
        ))}
      </select>
      <div className="mt-3 space-y-2">
        {selectedAssets.map(asset => (
          <div key={asset.id} className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-zinc-200">{asset.title || '未命名资产'}</div>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone="neutral">{ASSET_TYPE_LABELS[asset.type]}</Badge>
                <StatusPill status={asset.status || 'context_only'} />
              </div>
            </div>
            <button className="shrink-0 text-zinc-500 hover:text-red-200" onClick={() => onRemoveAsset(asset.id)}><X size={15} /></button>
          </div>
        ))}
        {selectedAssets.length === 0 && (
          <div className="rounded-md border border-dashed border-zinc-800 bg-zinc-950 px-3 py-3 text-xs text-zinc-600">
            暂未绑定资产。可从上方选择已有资产，或点击“新建”进入构建器。
          </div>
        )}
      </div>
    </div>
  );
};

const BoundaryNote: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
    <div className="text-xs font-semibold text-zinc-200">{title}</div>
    <p className="mt-2 text-xs leading-relaxed text-zinc-500">{body}</p>
  </div>
);

const normalizePack = (pack: Partial<CapabilityPack>): CapabilityPack => {
  const now = Date.now();
  const slots = CAPABILITY_PACK_SLOTS.map(slot => {
    const incoming = pack.slots?.find(item => item.key === slot.key);
    return {
      ...slot,
      ...incoming,
      acceptedTypes: incoming?.acceptedTypes?.length ? incoming.acceptedTypes : slot.acceptedTypes,
      assetIds: Array.isArray(incoming?.assetIds) ? incoming.assetIds : []
    };
  });
  return refreshCapabilityPackQuality({
    id: pack.id || `pack_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: pack.name || '导入能力包',
    summary: pack.summary || '',
    scenario: pack.scenario || '',
    tags: Array.isArray(pack.tags) ? pack.tags : ['capability-pack'],
    typicalInputs: Array.isArray(pack.typicalInputs) ? pack.typicalInputs : [],
    expectedOutputs: Array.isArray(pack.expectedOutputs) ? pack.expectedOutputs : [],
    slots,
    missingSlots: [],
    qualityScore: 0,
    usageCount: pack.usageCount || 0,
    lastUsedAt: pack.lastUsedAt,
    source: pack.source || 'import',
    version: pack.version || 1,
    createdAt: pack.createdAt || now,
    updatedAt: now
  });
};

const downloadJson = (payload: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const safeName = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') || 'pack';
