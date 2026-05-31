import { AssetGraphEdge, AssetPatch, PromptAsset, PromptCompilation } from '../types';
import { resolveSlotId } from './assetSlots';

export const deriveAssetGraphEdges = (
  assets: PromptAsset[],
  compilation?: PromptCompilation | null,
  patches: AssetPatch[] = []
): AssetGraphEdge[] => {
  const edges: AssetGraphEdge[] = [];
  if (compilation) {
    compilation.promptIR.assetBindings.forEach(binding => {
      edges.push({
        id: `edge_${compilation.id}_${binding.assetId}_${binding.slot}`,
        sourceAssetId: binding.assetId,
        targetAssetId: compilation.id,
        relation: relationForSlot(binding.slot),
        note: `${binding.assetTitle} 注入 ${binding.appliedToSections.join('、')} 区块。`
      });
    });
  }

  patches.forEach(patch => {
    if (!patch.targetAssetId) return;
    edges.push({
      id: `edge_${patch.id}_${patch.targetAssetId}`,
      sourceAssetId: patch.id,
      targetAssetId: patch.targetAssetId,
      relation: 'derived_from',
      note: patch.reason
    });
  });

  assets.forEach(asset => {
    if (asset.type === 'evaluator' || asset.type === 'benchmark') {
      assets
        .filter(target => target.id !== asset.id && ['prompt', 'skill', 'workflow', 'agent'].includes(target.type))
        .slice(0, 3)
        .forEach(target => {
          edges.push({
            id: `edge_${asset.id}_${target.id}_evaluates`,
            sourceAssetId: asset.id,
            targetAssetId: target.id,
            relation: 'evaluates',
            note: `${asset.title} 可用于评估 ${target.title}。`
          });
        });
    }
  });

  return dedupeEdges(edges);
};

export const mergeAssetGraphEdges = (current: AssetGraphEdge[], incoming: AssetGraphEdge[]) => {
  return dedupeEdges([...incoming, ...current]).slice(0, 200);
};

export const summarizeAssetGraph = (edges: AssetGraphEdge[]) => {
  return edges.reduce<Record<string, number>>((acc, edge) => {
    acc[edge.relation] = (acc[edge.relation] || 0) + 1;
    return acc;
  }, {});
};

const relationForSlot = (slot: string): AssetGraphEdge['relation'] => {
  if (slot === 'knowledge') return 'provides_context';
  if (slot === 'guardrail') return 'constrains';
  if (slot === 'tooling') return 'implements';
  if (slot === 'work-method') return 'uses';
  return 'uses';
};

const dedupeEdges = (edges: AssetGraphEdge[]) => {
  const seen = new Set<string>();
  return edges.filter(edge => {
    const key = `${edge.sourceAssetId}:${edge.targetAssetId}:${edge.relation}:${resolveSlotIdFromNote(edge.note)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const resolveSlotIdFromNote = (note: string) => {
  if (note.includes('toolRules')) return resolveSlotId('mcp');
  if (note.includes('evaluationCriteria')) return resolveSlotId('evaluator');
  if (note.includes('context')) return resolveSlotId('reference');
  return 'generic';
};
