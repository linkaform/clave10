import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSelectedLocationsStore } from "./useSelectedLocationsStore";

interface BoothState {
  area?: string;
  location?: string;
  // Ubicaciones extra de una caseta "Multiple Ubicacion" (la base sigue en `location`).
  extra_locations: string[];
  setBooth: (area: string, location: string, extra_locations?: string[]) => void;
  clearBooth: () => void;
}

export const useBoothStore = create<BoothState>()(
  persist(
    (set, get) => ({
      area: undefined,
      location: undefined,
      extra_locations: [],

      setBooth: (area, location, extra_locations = []) => {
        const prev = get();
        const prevExtras = prev.extra_locations ?? [];
        const boothChanged = prev.area !== area || prev.location !== location;
        const extrasChanged = prevExtras.join("|") !== extra_locations.join("|");
        set({ area, location, extra_locations });
        const { selectedLocations, setSelectedLocations } = useSelectedLocationsStore.getState();
        // Al entrar o salir de una caseta multiubicación (o al llegar sus extras tras el login),
        // el selector del header toma todas sus ubicaciones. No se repite en cada re-sync del
        // turno para no pisar la selección manual.
        const involvesMulti = extra_locations.length > 0 || prevExtras.length > 0;
        if (location && involvesMulti && (boothChanged || extrasChanged)) {
          setSelectedLocations([location, ...extra_locations]);
        } else if (selectedLocations.length === 0 && location) {
          setSelectedLocations([location]);
        }
      },

      clearBooth: () =>
        set({ area: undefined, location: undefined, extra_locations: [] }),
    }),
    {
      name: "booth-storage", 
    }
  )
);
