import { getCatalogoPasesLocation } from "@/lib/get-catalogos-pase-area-location";
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

/** Clave del cache de areas: una lista distinta por ubicacion y por modulo. */
export const areasKey = (location: string, uso?: string) =>
  `${location ?? ""}|${uso ?? ""}`;

interface locationAreaStore {
  /** Cache de areas indexado por `ubicacion|uso`. Se usa como valor inicial
   *  mientras react-query revalida; nunca para saltarse la peticion. */
  areasPorUso: Record<string, string[]>;
  locations: string[];
  defaultLocations: string[];
  locationDetails: UbicacionDetalle[];
  roles: string[];
  loading: boolean;
  setAreasPorUso: (location: string, uso: string | undefined, items: string[]) => void;
  getAreasPorUso: (location: string, uso?: string) => string[] | undefined;
  setLocations: (items: string[]) => void;
  setRoles: (items: string[]) => void;
  clearAreasLocation: () => void;
  fetchLocations: () => Promise<void>;
  setLoading: (value: boolean) => void;
  getDefaultLocation: () => string;
  getDefaultAreaForLocation: (location: string) => string | null;
}

export const useAreasLocationStore = create(
  persist<locationAreaStore>(
    (set, get) => ({
      areasPorUso: {},
      locations: [],
      defaultLocations: [],
      locationDetails: [],
      roles: [],
      loading: false,

      setLoading: (value) => set({ loading: value }),
      setLocations: (items) => set({ locations: items }),
      setRoles: (items) => set({ roles: items }),

      setAreasPorUso: (location, uso, items) =>
        set((state) => ({
          areasPorUso: { ...state.areasPorUso, [areasKey(location, uso)]: items },
        })),

      getAreasPorUso: (location, uso) => get().areasPorUso[areasKey(location, uso)],

      clearAreasLocation: () =>
        set({
          areasPorUso: {},
          locations: [],
          defaultLocations: [],
          locationDetails: [],
          roles: [],
        }),

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
          const roles: string[] = fetched?.response?.data?.roles_usuario ?? [];

          set({
            locations: fetched ? orderedLocation : [],
            defaultLocations: fetched ? orderedDefault : [],
            locationDetails: fetched ? detalle : [],
            roles: fetched ? roles : [],
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
      // v1: `areas` era un solo array global compartido por todas las pantallas.
      // Se tira: ahora el cache va indexado por `ubicacion|uso`.
      version: 1,
      migrate: (persisted: any) => {
        if (persisted && "areas" in persisted) delete persisted.areas;
        return { ...persisted, areasPorUso: {} };
      },
    }
  )
);
