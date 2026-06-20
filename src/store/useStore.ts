import { create } from 'zustand';
import { Store } from '@/types';
import { stores } from '@/data/stores';

interface StoreState {
  selectedStoreId: string | null;
  selectedStore: Store | null;
  setSelectedStore: (storeId: string | null) => void;
  clearSelectedStore: () => void;
}

export const useStore = create<StoreState>((set) => ({
  selectedStoreId: null,
  selectedStore: null,
  setSelectedStore: (storeId) => {
    const store = stores.find((s) => s.id === storeId) || null;
    set({ selectedStoreId: storeId, selectedStore: store });
  },
  clearSelectedStore: () => {
    set({ selectedStoreId: null, selectedStore: null });
  },
}));
