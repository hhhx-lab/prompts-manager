import { useEffect } from 'react';
import { OptimizationDirection, PromptAsset } from '../types';
import { getStarterAssetIntroducedVersion, STARTER_ASSET_PACK_VERSION, STARTER_ASSETS } from '../services/starterAssets';
import { ASSET_LIBRARY_SEEDED_STORAGE_KEY, ASSET_LIBRARY_STORAGE_KEY, DIRECTIONS_STORAGE_KEY, readJson, writeJson } from '../services/storage';
import { usePersistentState } from './usePersistentState';

const readStarterAssetPackVersion = () => {
  const saved = readJson<number | boolean>(ASSET_LIBRARY_SEEDED_STORAGE_KEY, 0);
  if (saved === true) return 1;
  return typeof saved === 'number' ? saved : 0;
};

export const useAssetLibrary = () => {
  const [assets, setAssets] = usePersistentState<PromptAsset[]>(ASSET_LIBRARY_STORAGE_KEY, []);
  const [customDirections, setCustomDirections] = usePersistentState<OptimizationDirection[]>(DIRECTIONS_STORAGE_KEY, []);

  useEffect(() => {
    const seededVersion = readStarterAssetPackVersion();
    if (seededVersion >= STARTER_ASSET_PACK_VERSION) return;

    setAssets(currentAssets => {
      const byId = new Map<string, PromptAsset>(currentAssets.map(asset => [asset.id, asset] as const));
      STARTER_ASSETS.forEach(asset => {
        if (seededVersion > 0 && getStarterAssetIntroducedVersion(asset) <= seededVersion) return;
        if (!byId.has(asset.id)) byId.set(asset.id, asset);
      });
      return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    });
    writeJson(ASSET_LIBRARY_SEEDED_STORAGE_KEY, STARTER_ASSET_PACK_VERSION);
  }, [setAssets]);

  return {
    assets,
    setAssets,
    customDirections,
    setCustomDirections
  };
};
