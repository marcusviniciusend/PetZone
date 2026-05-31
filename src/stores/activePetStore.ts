import { create } from 'zustand';

interface ActivePetState {
  activePetId: string | null;
  setActivePetId: (id: string | null) => void;
  reset: () => void;
}

export const useActivePetStore = create<ActivePetState>((set) => ({
  activePetId: null,
  setActivePetId: (activePetId) => set({ activePetId }),
  reset: () => set({ activePetId: null }),
}));
