import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Pellet, PelletState } from '@/types';

type PelletStore = PelletState & {
  addPellet: (pellet: Pellet) => void;
  removePellet: (pelletId: string) => void;
  getPelletsByLicensePlate: (licensePlate: string, type?: 'negative' | 'positive') => Pellet[];
  getPelletsCreatedByUser: (userId: string, type?: 'negative' | 'positive') => Pellet[];
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
};

const usePelletStore = create<PelletStore>()(
  persist(
    (set, get) => ({
      pellets: [],
      isLoading: false,
      error: null,
      addPellet: (pellet) => set((state) => ({ 
        pellets: [...state.pellets, pellet],
        error: null
      })),
      removePellet: (pelletId) => set((state) => ({
        pellets: state.pellets.filter(p => p.id !== pelletId),
      })),
      getPelletsByLicensePlate: (licensePlate, type) => {
        const pellets = get().pellets.filter(
          (pellet) => pellet.targetLicensePlate.toLowerCase() === licensePlate.toLowerCase()
        );
        
        if (type) {
          return pellets.filter(pellet => pellet.type === type);
        }
        
        return pellets;
      },
      getPelletsCreatedByUser: (userId, type) => {
        const pellets = get().pellets.filter(
          (pellet) => pellet.createdBy === userId
        );
        
        if (type) {
          return pellets.filter(pellet => pellet.type === type);
        }
        
        return pellets;
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'pellet-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default usePelletStore;