import { MarketItem } from '../types';
import { MARKET_ITEMS_STORAGE_KEY } from '../services/storage';
import { useBackendState } from './useBackendState';
import { normalizeImportedMarketItem } from '../services/marketplace';

export const useMarketplace = () => {
  const [marketItems, setMarketItems, meta] = useBackendState<MarketItem[]>(MARKET_ITEMS_STORAGE_KEY, 'marketItems', []);

  const saveMarketItem = (item: MarketItem) => {
    const normalized = normalizeImportedMarketItem(item);
    setMarketItems(previous => [normalized, ...previous.filter(existing => existing.id !== normalized.id)]);
  };

  const saveMarketItems = (items: MarketItem[]) => {
    const normalized = items.map(normalizeImportedMarketItem);
    setMarketItems(previous => [
      ...normalized,
      ...previous.filter(existing => !normalized.some(item => item.id === existing.id))
    ]);
  };

  const deleteMarketItem = (id: string) => {
    setMarketItems(previous => previous.filter(item => item.id !== id));
  };

  return { marketItems, setMarketItems, saveMarketItem, saveMarketItems, deleteMarketItem, ...meta };
};
