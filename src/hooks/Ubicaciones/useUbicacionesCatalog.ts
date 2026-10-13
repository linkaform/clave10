import { getUbicacionesCatalogSdk } from "@/lib/ubicaciones-sdk";
import { errorMsj } from "@/lib/utils";
import { UbicacionRow } from "@/lib/ubicaciones";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface UbicacionesCatalogPage {
  records: UbicacionRow[];
  total_records: number;
  total_pages: number;
  actual_page: number;
  records_on_page: number;
}

const EMPTY_PAGE: UbicacionesCatalogPage = {
  records: [],
  total_records: 0,
  total_pages: 1,
  actual_page: 1,
  records_on_page: 0,
};

export const useUbicacionesCatalog = (
  locations: string[],
  dynamicFilters: { key: string; value: any }[] = [],
  limit: number = 25,
  skip: number = 0,
  search: string = "",
  searchFields: string[] = [],
  enabled: boolean = true,
) => {
  const {
    data: ubicacionesCatalog,
    isLoading: isLoadingQuery,
    isFetching,
    error,
    refetch,
  } = useQuery<UbicacionesCatalogPage>({
    queryKey: ["ubicacionesCatalog", locations, dynamicFilters, limit, skip, search, searchFields],
    // locations vacío es válido: el back regresa todas las de la cuenta.
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<UbicacionesCatalogPage> => {
      const data = await getUbicacionesCatalogSdk(locations, dynamicFilters, limit, skip, search, searchFields);
      const textMsj = errorMsj(data);
      if (textMsj) {
        throw new Error(`Error al obtener ubicaciones: ${data.error}`);
      }
      return data.response?.data ?? EMPTY_PAGE;
    },
  });

  return {
    ubicacionesCatalog: ubicacionesCatalog ?? EMPTY_PAGE,
    isLoading: isLoadingQuery || isFetching,
    error,
    refetch,
  };
};
