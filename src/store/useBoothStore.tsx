import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BoothState {
  area?: string;
  location?: string;
  setBooth: (area: string, location: string) => void;
  clearBooth: () => void;
}

export const useBoothStore = create<BoothState>()(
  persist(
    (set) => ({
      area: undefined,
      location: undefined,

      setBooth: (area, location) =>
        set({ area, location }),

      clearBooth: () =>
        set({ area: undefined, location: undefined }),
    }),
    {
      name: "booth-storage", 
    }
  )
);
