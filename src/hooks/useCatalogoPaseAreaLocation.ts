/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAreasByLocations } from "@/lib/endpoints";
import { getCatalogoPasesAreaNoApi } from "@/lib/get-catalogos-pase-area";
import { getCatalogoPasesLocationNoApi } from "@/lib/get-catalogos-pase-location";
import { errorMsj } from "@/lib/utils";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

/** Modulos que pueden marcar areas en "Utilizar Area en:". */
export type UsoArea =
  | "pases"
  | "incidencias"
  | "paqueteria"
  | "fallas"
  | "articulos_perdidos"
  | "rondines"
  | "articulos_concesionados"
  | "notas"
  | "casetas";

interface OpcionesAreas {
  /** Modulo que pregunta. Sin esto el back regresa todas las areas. */
  uso?: UsoArea;
}

export const useCatalogoPaseAreaLocation = (
  location: string,
  enableLocation: boolean,
  enableArea: boolean,
  { uso }: OpcionesAreas = {},
) => {
  const { setLocations, locations: locationsStore, setAreasPorUso, getAreasPorUso } =
    useAreasLocationStore();

  const [ubicacionesDefault, setUbicacionesDefault] = useState<string[]>([]);
  const [ubicacionesDefaultFormatted, setubicacionesDefaultFormatted] = useState<any[]>([]);

  const { data: dataAreas, isLoading: isLoadingAreas, error: errorAreas, isFetching: isFetchingAreas, refetch: refetchAreas } = useQuery<any>({
    // uso y tipoArea van en la llave: cada modulo tiene su propia lista por ubicacion
    queryKey: ["areasPorUso", location, uso ?? null],
    enabled: enableArea,
    // pinta de inmediato lo ultimo que se guardo en localStorage y revalida
    placeholderData: () => getAreasPorUso(location, uso),
    queryFn: async () => {
      const data = await getCatalogoPasesAreaNoApi(location, uso);
      const textMsj = errorMsj(data);
      if (textMsj) throw new Error(`Error al obtener catalogo de areas, Error: ${data.error}`);
      const areas = data.response?.data.areas_by_location ?? [];
      setAreasPorUso(location, uso, areas);
      return areas;
    },
  });

  const { data: dataLocations, isLoading: isLoadingLocations, error: errorLocations, isFetching: isFetchingLocations, refetch: refetchLocations } = useQuery<any>({
    queryKey: ["getCatalogoPasesLocationNoApi"],
    enabled: enableLocation && !locationsStore?.length, // ← guard
    queryFn: async () => {
      const data = await getCatalogoPasesLocationNoApi();
      const textMsj = errorMsj(data);
      if (textMsj) throw new Error(`Error al obtener catalogo de locations, Error: ${data.error}`);
      setLocations(data.response?.data.ubicaciones_user);
      setUbicacionesDefault(data.response?.data.ubicaciones_default);
      setubicacionesDefaultFormatted(data.response?.data.ubicaciones_default?.map((u: any) => ({ id: u, name: u })));
      return data.response?.data.ubicaciones_user;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  return {
    dataAreas,
    dataLocations: locationsStore?.length ? locationsStore : dataLocations,
    isLoadingAreas,
    errorAreas,
    isFetchingAreas,
    refetchAreas,
    ubicacionesDefault,
    ubicacionesDefaultFormatted,
    isLoadingLocations,
    errorLocations,
    isFetchingLocations,
    refetchLocations,
  };
};

export const useGetAreasByLocations = (enable: boolean, locations: string[]) => {
  const { data, isLoading, error, isFetching, refetch } = useQuery<any>({
    queryKey: ["useGetAreasByLocations", locations],
    enabled: enable,
    queryFn: async () => {
      if (!locations || locations.length === 0) return [];
      const data = await getAreasByLocations(locations);
      const textMsj = errorMsj(data);
      if (textMsj) {
        throw new Error(`Error al obtener catalogo de areas, Error: ${data.error}`);
      }
      return data?.response?.data?.areas_by_location;
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return { data, isLoading, error, isFetching, refetch };
};
