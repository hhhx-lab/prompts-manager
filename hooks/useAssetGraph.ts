import { AssetGraphEdge } from '../types';
import { mergeAssetGraphEdges } from '../services/assetGraph';
import { ASSET_GRAPH_STORAGE_KEY } from '../services/storage';
import { usePersistentState } from './usePersistentState';

export const useAssetGraph = () => {
  const [assetGraphEdges, setAssetGraphEdges] = usePersistentState<AssetGraphEdge[]>(ASSET_GRAPH_STORAGE_KEY, []);

  const saveAssetGraphEdges = (edges: AssetGraphEdge[]) => {
    setAssetGraphEdges(prev => mergeAssetGraphEdges(prev, edges));
  };

  return { assetGraphEdges, setAssetGraphEdges, saveAssetGraphEdges };
};
