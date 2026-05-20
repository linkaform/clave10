import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { MenuConfig } from "@/types/menu-types";

export interface MenuItem {
  id:string;
  label:string;
  excludes:Excludes;
}
export type Excludes = Record<string, string[]>;
interface MenuStore {
  menuItems:MenuItem[];
  labels:string[];
  excludes:Excludes | null;
  menuConfig: MenuConfig | null;
  setLabels: (items:string[])=>void;
  setMenuItems: (items:MenuItem[]) =>void;
  setExcludes: (excludes:Excludes) => void;
  setMenuConfig: (config: MenuConfig) => void;
  clearMenu: () => void;
}

export const useMenuStore = create(
  persist<MenuStore>(
    (set) => ({
      menuItems: [],
      labels:[],
      excludes: null,
      menuConfig: null,
      setLabels: (items) => set({ labels: items }),
      setMenuItems: (items) => set({ menuItems: items }),
      setExcludes: (items) => set({ excludes: items }),
      setMenuConfig: (config) => set({ menuConfig: config }),
      clearMenu: () => set({ menuItems: [], labels: [], excludes: null, menuConfig: null }),
    }),
    {
      name: "menu-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
