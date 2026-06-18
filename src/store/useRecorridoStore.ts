import { Recorrido } from "@/components/table/rondines/recorridos/recorridos-columns";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecorridoStore {
  recorridoSeleccionado: Recorrido | null;
  setRecorridoSeleccionado: (recorrido: Recorrido | null) => void;
}

export const useRecorridoStore = create<RecorridoStore>()(
  persist(
    (set) => ({
      recorridoSeleccionado: null,
      setRecorridoSeleccionado: (recorrido) => set({ recorridoSeleccionado: recorrido }),
    }),
    { name: "recorrido-store" }
  )
);