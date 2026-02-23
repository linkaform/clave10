import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface MenuItem {
  id:string;
  label:string;
  excludes:Excludes;
  includes:Includes;
}
export type Excludes = Record<string, string[]>;
export type Includes = Record<string, string[]>;

interface MenuStore {
  menuItems:MenuItem[];
  labels:string[];
  excludes:Excludes | null;
  includes:Includes| null;
  setLabels: (items:string[])=>void;
  setMenuItems: (items:MenuItem[]) =>void;
  clearMenu: () => void;
  setExcludes: (excludes:Excludes) => void;
  setIncludes: (includes:Includes) => void;
}

export const useMenuStore = create(
  persist<MenuStore>(
    (set) => ({
      menuItems: [],
      labels:[],
      excludes: null,
      includes: null,
      setLabels: (items) => set({ labels: items }),
      setMenuItems: (items) => set({ menuItems: items }),
      clearMenu: () => set({ menuItems: [], labels: [], excludes:null }),
      setExcludes: (items) => set({ excludes: items }),
      setIncludes: (items) => set({ includes: items }),
    }),
    {
      name: "menu-store",
      storage: createJSONStorage(() => localStorage), 
    }
  )
);
