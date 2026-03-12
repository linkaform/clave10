import { create } from "zustand";
import type { FilterConfig } from "@/types/bitacoras";

interface BitacoraFiltersState {
  filters: FilterConfig[];
  setFilters: (filters: FilterConfig[]) => void;
  clearFilters: () => void;
}

export const useBitacoraFiltersStore = create<BitacoraFiltersState>((set) => ({
  filters: [],
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: [] }),
}));