// store/useShiftStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ShiftStore {

	area: string;
  location: string;
  checkin_id: string | undefined;
  isLoading:boolean;
  tab: string;
  filter: string;
  option: string[];
  from: string;
  
  setArea: (area: string) => void;
  setLocation: (location: string) => void;
  setLoading:(loading:boolean)=>void;
  setCheckin_id: (id: string | undefined) => void;
  setTab: (tab: string) => void;
  setFilter: (filter: string) => void;
  setOption: (option: string[]) => void;
  setFrom: (from: string) => void;
  clearShift: () => void;
}

export const useShiftStore = create(
  persist<ShiftStore>(
    (set) => ({
      area: "",
      location: "",
      checkin_id: undefined,
      tab: "",
      filter: "",
      option: [],
      from: "",
      isLoading:false,
      
      setLoading:(isLoading)=> set({isLoading}),
      setArea: (area) => set({ area }),
      setLocation: (location) => set({ location }),
      setCheckin_id: (id) => set({ checkin_id: id }),
      setTab: (tab) => set({ tab }),
      setFilter: (filter) => set({ filter }),
      setOption: (option) => set({ option }),
      setFrom: (from) => set({ from }),
      
      clearShift: () => set({
        area: "",
        location: "",
        checkin_id: undefined,
        tab: "",
        filter: "",
        option: [],
        from: "",
      }),
    }),
    {
      name: "shift-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);