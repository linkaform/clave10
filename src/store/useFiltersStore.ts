import { toast } from "sonner";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface FiltersStore {
  cache: Record<string, any[]>;
  loading: Record<string, boolean>;
  isLoading: (key: string) => boolean;
  clearCache: (key?: string) => void;
  fetchFilter: (key: string, fetcher: () => Promise<any>) => Promise<void>;
}

export const useFiltersStore = create(
  persist<FiltersStore>(
    (set, get) => ({
      cache: {},
      loading: {},

      isLoading: (key) => get().loading[key] ?? false,

      clearCache: (key) =>
        set((state) => {
          if (!key) return { cache: {} };
          const next = { ...state.cache };
          delete next[key];
          return { cache: next };
        }),

      fetchFilter: async (key, fetcher) => {
        if (get().cache[key]?.length) return;

        set((state) => ({ loading: { ...state.loading, [key]: true } }));
        try {
          const data = await fetcher();
          set((state) => ({ cache: { ...state.cache, [key]: data } }));
        } catch (err) {
          toast.error(`Error al cargar filtro [${key}]: ${err}`);
        } finally {
          set((state) => ({ loading: { ...state.loading, [key]: false } }));
        }
      },
    }),
    {
      name: "filters-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
