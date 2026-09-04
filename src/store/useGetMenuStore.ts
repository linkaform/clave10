import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { MenuConfig } from "@/types/menu-types";

export interface MenuItem {
  id: string;
  label: string;
  excludes: Excludes;
}

export type Excludes = Record<string, string[]>;

export interface GrupoRequisito {
  datos_requeridos: string[];
  /**
   * El back manda una lista de nombres (el requisito puede aplicar a varias
   * ubicaciones o a ninguna); las sesiones con el menú viejo persistido en
   * localStorage todavía traen un string o un `[]`. Compárala siempre con
   * `requisitoAplicaA`, nunca con `.toLowerCase()` directo.
   */
  ubicacion: string | string[];
  envio_por: string[];
  prefijo_telefonico: number;
  tolerancia_de_entrada_previa: number;
  tolerancia_de_entrada_posterior: number;
}

interface MenuStore {
  menuItems: MenuItem[];
  labels: string[];
  excludes: Excludes | null;
  menuConfig: MenuConfig | null;
  grupoRequisitos: GrupoRequisito[];
  setLabels: (items: string[]) => void;
  setMenuItems: (items: MenuItem[]) => void;
  setExcludes: (excludes: Excludes) => void;
  setMenuConfig: (config: MenuConfig) => void;
  setGrupoRequisitos: (items: GrupoRequisito[]) => void;
  clearMenu: () => void;
}

export const useMenuStore = create(
  persist<MenuStore>(
    (set) => ({
      menuItems: [],
      labels: [],
      excludes: null,
      menuConfig: null,
      grupoRequisitos: [],
      setLabels: (items) => set({ labels: items }),
      setMenuItems: (items) => set({ menuItems: items }),
      setExcludes: (items) => set({ excludes: items }),
      setMenuConfig: (config) => set({ menuConfig: config }),
      setGrupoRequisitos: (items) => set({ grupoRequisitos: items }),
      clearMenu: () => set({ menuItems: [], labels: [], excludes: null, menuConfig: null, grupoRequisitos: []}),
    }),
    {
      name: "menu-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);