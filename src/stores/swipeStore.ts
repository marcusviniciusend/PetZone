import { create } from 'zustand';
import { Pet } from '../types';

interface SwipeState {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  maxDistanceKm: number | null;
  setPets: (pets: Pet[]) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  removePet: (petId: string) => void;
  setMaxDistance: (km: number | null) => void;
  reset: () => void;
}

export const useSwipeStore = create<SwipeState>((set) => ({
  pets: [],
  loading: false,
  error: null,
  maxDistanceKm: null,
  setPets: (pets) => set({ pets }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  removePet: (petId) =>
    set((s) => ({ pets: s.pets.filter((p) => p.id !== petId) })),
  setMaxDistance: (maxDistanceKm) => set({ maxDistanceKm }),
  reset: () => set({ pets: [], loading: false, error: null, maxDistanceKm: null }),
}));
