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
          const cached = get().cache[key];
          // Si ya existe y es un array válido con datos, no volver a fetchear
          if (Array.isArray(cached) && cached.length) return;
        
          set((state) => ({ loading: { ...state.loading, [key]: true } }));
          try {
            const data = await fetcher();
            // Garantizar que siempre guardamos un array
            const safeData = Array.isArray(data) ? data : [];
            set((state) => ({ cache: { ...state.cache, [key]: safeData } }));
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
