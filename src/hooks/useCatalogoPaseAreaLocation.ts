/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAreasByLocations } from "@/lib/endpoints";
import { getCatalogoPasesAreaNoApi } from "@/lib/get-catalogos-pase-area";
import { getCatalogoPasesLocationNoApi } from "@/lib/get-catalogos-pase-location";
import { errorMsj } from "@/lib/utils";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const useCatalogoPaseAreaLocation = (location: string, enableLocation: boolean, enableArea: boolean) => {
  const { setAreas, setLocations, areas: areasStore, locations: locationsStore } = useAreasLocationStore();
  
  const [ubicacionesDefault, setUbicacionesDefault] = useState<string[]>([]);
  const [ubicacionesDefaultFormatted, setubicacionesDefaultFormatted] = useState<any[]>([]);

  const { data: dataAreas, isLoading: isLoadingAreas, error: errorAreas, isFetching: isFetchingAreas, refetch: refetchAreas } = useQuery<any>({
    queryKey: ["getCatalogoPasesAreaNoApi", location],
    enabled: enableArea && !areasStore?.length, // ← guard
    queryFn: async () => {
      const data = await getCatalogoPasesAreaNoApi(location);
      const textMsj = errorMsj(data);
      if (textMsj) throw new Error(`Error al obtener catalogo de areas, Error: ${data.error}`);
      setAreas(data.response?.data.areas_by_location);
      return data.response?.data.areas_by_location;
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
    dataAreas: areasStore?.length ? areasStore : dataAreas,    
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
  const { setAreas } = useAreasLocationStore();
  const { data, isLoading, error, isFetching, refetch } = useQuery<any>({
    queryKey: ["useGetAreasByLocations", locations],
    enabled: enable,
    queryFn: async () => {
      if (!locations || locations.length === 0) return [];
      const data = await getAreasByLocations(locations);
      const textMsj = errorMsj(data)
      if (textMsj) {
        throw new Error(`Error al obtener catalogo de areas, Error: ${data.error}`);
      } else {
        setAreas(data?.response?.data?.areas_by_location)
        return data?.response?.data?.areas_by_location
      }
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return {
    data,
    isLoading,
    error,
    isFetching,
    refetch,
  }
};