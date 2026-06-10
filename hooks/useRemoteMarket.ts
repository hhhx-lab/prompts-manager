import { MarketItem } from '../types';
import { REMOTE_MARKET_ITEMS_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';
import { normalizeImportedMarketItem } from '../services/marketplace';

export const useRemoteMarket = () => {
  const [remoteMarketItems, setRemoteMarketItems, meta] = useBackendState<MarketItem[]>(
    REMOTE_MARKET_ITEMS_STORAGE_KEY,
    'remoteMarketItems',
    []
  );

  const saveRemoteMarketItem = (item: MarketItem) => {
    const normalized = normalizeImportedMarketItem({ ...item, source: 'remote' });
    setRemoteMarketItems(previous => [normalized, ...previous.filter(existing => existing.id !== normalized.id)]);
  };

  return { remoteMarketItems, setRemoteMarketItems, saveRemoteMarketItem, ...meta };
};
