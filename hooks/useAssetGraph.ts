import { AssetGraphEdge } from '../types';
import { mergeAssetGraphEdges } from '../services/assetGraph';
import { ASSET_GRAPH_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';

export const useAssetGraph = () => {
  const [assetGraphEdges, setAssetGraphEdges] = useBackendState<AssetGraphEdge[]>(ASSET_GRAPH_STORAGE_KEY, 'assetGraph', []);

  const saveAssetGraphEdges = (edges: AssetGraphEdge[]) => {
    setAssetGraphEdges(prev => mergeAssetGraphEdges(prev, edges));
  };

  return { assetGraphEdges, setAssetGraphEdges, saveAssetGraphEdges };
};
