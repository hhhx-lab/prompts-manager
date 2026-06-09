import { AssetPatch } from '../types';
import { mergeAssetPatches } from '../services/assetPatches';
import { ASSET_PATCHES_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';

export const useAssetPatches = () => {
  const [assetPatches, setAssetPatches] = useBackendState<AssetPatch[]>(ASSET_PATCHES_STORAGE_KEY, 'assetPatches', []);

  const saveAssetPatches = (patches: AssetPatch[]) => {
    setAssetPatches(prev => mergeAssetPatches(prev, patches).slice(0, 200));
  };

  return { assetPatches, setAssetPatches, saveAssetPatches };
};
