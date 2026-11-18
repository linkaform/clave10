import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const AUTO_RELOAD_INTERVALS = [60, 300, 600] as const;

export interface AutoReloadConfig {
  enabled: boolean;
  intervalSec: number;
  /** Seguir recargando con la pestaña en segundo plano. */
  inBackground: boolean;
}

// Todas las vistas arrancan con el auto-refresh apagado.
export const getDefaultAutoReload = (_viewKey: string): AutoReloadConfig => ({
  enabled: false,
  intervalSec: 60,
  inBackground: false,
});

interface AutoReloadState {
  /** Ajuste por vista (clave = viewKey). Solo guarda lo que el usuario cambió. */
  views: Record<string, Partial<AutoReloadConfig>>;
  setView: (viewKey: string, patch: Partial<AutoReloadConfig>) => void;
}

export const useAutoReloadStore = create<AutoReloadState>()(
  persist(
    (set) => ({
      views: {},
      setView: (viewKey, patch) =>
        set((s) => ({ views: { ...s.views, [viewKey]: { ...s.views[viewKey], ...patch } } })),
    }),
    {
      name: "auto-reload-views-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
