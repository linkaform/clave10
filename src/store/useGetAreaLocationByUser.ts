import { getCatalogoPasesArea, getCatalogoPasesLocation } from "@/lib/get-catalogos-pase-area-location";
import { errorMsj } from "@/lib/utils";
import { toast } from "sonner";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AreaDetalle {
  nombre_area: string | null;
  es_default: boolean;
}

interface UbicacionDetalle {
  ubicacion: string;
  es_default: boolean;
  areas: AreaDetalle[];
}

interface locationAreaStore {
  areas: string[];
  locations: string[];
  defaultLocations: string[];
  locationDetails: UbicacionDetalle[];
  loading: boolean;
  setAreas: (items: string[]) => void;
  setLocations: (items: string[]) => void;
  clearAreasLocation: () => void;
  fetchAreas: (location: string) => Promise<void>;
  fetchLocations: () => Promise<void>;
  setLoading: (value: boolean) => void;
  getDefaultLocation: () => string;
  getDefaultAreaForLocation: (location: string) => string | null;
}

export const useAreasLocationStore = create(
  persist<locationAreaStore>(
    (set, get) => ({
      areas: [],
      locations: [],
      defaultLocations: [],
      locationDetails: [],
      loading: false,

      setLoading: (value) => set({ loading: value }),
      setAreas: (items) => set({ areas: items }),
      setLocations: (items) => set({ locations: items }),

      clearAreasLocation: () =>
        set({ areas: [], locations: [], defaultLocations: [], locationDetails: [] }),

      fetchAreas: async (location: string) => {
        set({ loading: true });
        try {
          const { locationDetails } = get();

          const detalle = locationDetails.find(
            (d) => d.ubicacion?.toLowerCase() === location?.toLowerCase()
          );

          if (detalle) {
            const nombresAreas = detalle.areas
              .map((a) => a.nombre_area)
              .filter((n): n is string => Boolean(n));

            const orderedAreas = [...new Set(nombresAreas)].sort((a, b) =>
              a.localeCompare(b, "es", { sensitivity: "base" })
            );

            set({ areas: orderedAreas });
            return;
          }

          // Fallback al endpoint viejo si no hay detalle cargado para esa ubicación
          const fetched = await getCatalogoPasesArea({ location });
          const error = errorMsj(fetched);
          if (error) throw new Error(error.text);

          const orderedAreas = (fetched?.response?.data?.areas_by_location ?? [])
            .slice()
            .sort((a: string, b: any) => a.localeCompare(b, "es", { sensitivity: "base" }));

          set({ areas: fetched ? orderedAreas : [] });
        } catch (err) {
          toast.error("Ocurrio un error al cargar las areas: " + err);
        } finally {
          set({ loading: false });
        }
      },

      fetchLocations: async () => {
        const { locations } = get();
        if (locations.length) return;

        set({ loading: true });
        try {
          const fetched = await getCatalogoPasesLocation();

          const orderedLocation = (fetched?.response?.data?.ubicaciones_user ?? [])
            .slice()
            .sort((a: string, b: any) => a.localeCompare(b, "es", { sensitivity: "base" }));

          const orderedDefault = (fetched?.response?.data?.ubicaciones_default ?? [])
            .slice()
            .sort((a: string, b: any) => a.localeCompare(b, "es", { sensitivity: "base" }));

          const detalle: UbicacionDetalle[] = fetched?.response?.data?.ubicaciones_detalle ?? [];

          set({
            locations: fetched ? orderedLocation : [],
            defaultLocations: fetched ? orderedDefault : [],
            locationDetails: fetched ? detalle : [],
          });
        } catch (err) {
          toast.error("Ocurrio un error al cargar las ubicaciones: " + err);
        } finally {
          set({ loading: false });
        }
      },

      // --- Helpers centralizados ---

      getDefaultLocation: () => {
        const { defaultLocations } = get();
        return defaultLocations?.[0] ?? "";
      },

      getDefaultAreaForLocation: (location: string) => {
        if (!location) return null;
        const { locationDetails } = get();
        const detalle = locationDetails.find(
          (d) => d.ubicacion?.toLowerCase() === location.toLowerCase()
        );
        return detalle?.areas?.find((a) => a.es_default)?.nombre_area ?? null;
      },
    }),
    {
      name: "areaLocation-store",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);