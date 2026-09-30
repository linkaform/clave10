import { getAreasCatalogSdk } from "@/lib/areas-sdk";
import { errorMsj } from "@/lib/utils";
import { AreaRow } from "@/lib/areas";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface AreasCatalogPage {
  records: AreaRow[];
  total_records: number;
  total_pages: number;
  actual_page: number;
  records_on_page: number;
}

const EMPTY_PAGE: AreasCatalogPage = {
  records: [],
  total_records: 0,
  total_pages: 1,
  actual_page: 1,
  records_on_page: 0,
};

export const useAreasCatalog = (
  locations: string[],
  dynamicFilters: { key: string; value: any }[] = [],
  limit: number = 25,
  skip: number = 0,
  search: string = "",
  searchFields: string[] = [],
  enabled: boolean = true,
) => {
  const {
    data: areasCatalog,
    isLoading: isLoadingQuery,
    isFetching,
    error,
    refetch,
  } = useQuery<AreasCatalogPage>({
    queryKey: ["areasCatalog", locations, dynamicFilters, limit, skip, search, searchFields],
    enabled: locations.length > 0 && enabled,
    // Igual que en Concesionados: al cambiar de página/búsqueda, mantiene la
    // página anterior visible en vez de vaciar la tabla mientras llega la nueva.
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<AreasCatalogPage> => {
      const data = await getAreasCatalogSdk(locations, dynamicFilters, limit, skip, search, searchFields);
      const textMsj = errorMsj(data);
      if (textMsj) {
        throw new Error(`Error al obtener áreas: ${data.error}`);
      }
      return data.response?.data ?? EMPTY_PAGE;
    },
  });

  return {
    areasCatalog: areasCatalog ?? EMPTY_PAGE,
    isLoading: isLoadingQuery || isFetching,
    error,
    refetch,
  };
};
