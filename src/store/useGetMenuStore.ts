import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  setLabels: (items:string[])=>void;
  setMenuItems: (items:MenuItem[]) =>void;
  clearMenu: () => void;
  setExcludes: (excludes:Excludes) => void;
}

export const useMenuStore = create(
  persist<MenuStore>(
    (set) => ({
      menuItems: [],
      labels:[],
      excludes: null,
      setLabels: (items) => set({ labels: items }),
      setMenuItems: (items) => set({ menuItems: items }),
      clearMenu: () => set({ menuItems: [], labels: [], excludes:null }),
      setExcludes: (items) => set({ excludes: items }),
    }),
    {
      name: "menu-store",
      storage: createJSONStorage(() => localStorage), 
    }
  )
);
