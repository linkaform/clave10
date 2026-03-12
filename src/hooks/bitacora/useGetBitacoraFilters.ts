// hooks/bitacora/useGetBitacoraFilters.ts
import { useQuery } from "@tanstack/react-query";
import { getBitacoraFilters } from "@/services/endpoints";
import { useBitacoraFiltersStore } from "@/store/useBitacoraFiltersStore";
import { BITACORAS_FILTERS } from "@/config/filters/bitacora";
import type { FilterConfig } from "@/types/bitacoras";

const THRESHOLD = 200;

export const useGetBitacoraFilters = (enable: boolean, totalRecords: number) => {
  const { setFilters } = useBitacoraFiltersStore();
  const shouldFetch = totalRecords >= THRESHOLD;

  const { data, isLoading, error, isFetching, refetch } = useQuery<FilterConfig[]>({
    queryKey: ["bitacora-filters"],
    enabled: enable && shouldFetch,
    placeholderData: BITACORAS_FILTERS,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<FilterConfig[]> => {
        const result = await getBitacoraFilters();
        if (result?.error) {
            throw new Error(`Error al obtener filtros: ${result.error}`);
        }
        const filters: FilterConfig[] = result?.response?.data;
        setFilters(filters);
        return filters;
    },
    refetchOnWindowFocus: false,
  });

  const filters = shouldFetch ? (data ?? BITACORAS_FILTERS) : BITACORAS_FILTERS;
  return { filters, isLoading, error, isFetching, refetch };
};