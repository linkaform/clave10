import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SelectedLocationsState {
  selectedLocations: string[];
  setSelectedLocations: (locations: string[]) => void;
  toggleLocation: (location: string) => void;
  clearSelectedLocations: () => void;
}

export const useSelectedLocationsStore = create<SelectedLocationsState>()(
  persist(
    (set, get) => ({
      selectedLocations: [],
      setSelectedLocations: (locations) => set({ selectedLocations: locations }),
      toggleLocation: (location) => {
        const { selectedLocations } = get();
        const next = selectedLocations.includes(location)
          ? selectedLocations.filter((l) => l !== location)
          : [...selectedLocations, location];
        set({ selectedLocations: next });
      },
      clearSelectedLocations: () => set({ selectedLocations: [] }),
    }),
    {
      name: "selected-locations-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.selectedLocations.length === 0) {
          const boothLocation = JSON.parse(
            localStorage.getItem("booth-storage") ?? "{}"
          )?.state?.location;
          if (boothLocation) {
            state.selectedLocations = [boothLocation];
          }
        }
      },
    }
  )
);
