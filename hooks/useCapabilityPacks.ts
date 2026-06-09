import { CapabilityPack } from '../types';
import { CAPABILITY_PACKS_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';
import { refreshCapabilityPackQuality } from '../services/capabilityPacks';

export const useCapabilityPacks = () => {
  const [capabilityPacks, setCapabilityPacks] = useBackendState<CapabilityPack[]>(CAPABILITY_PACKS_STORAGE_KEY, 'capabilityPacks', []);

  const saveCapabilityPack = (pack: CapabilityPack) => {
    const normalized = refreshCapabilityPackQuality(pack);
    setCapabilityPacks(previous => [normalized, ...previous.filter(item => item.id !== normalized.id)]);
  };

  const deleteCapabilityPack = (id: string) => {
    setCapabilityPacks(previous => previous.filter(pack => pack.id !== id));
  };

  return { capabilityPacks, setCapabilityPacks, saveCapabilityPack, deleteCapabilityPack };
};
