/* eslint-disable @typescript-eslint/no-explicit-any */
import { getMyPases } from "@/lib/get-my-pases";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SearchFacet } from "@/components/common/FacetSearch";

interface UseGetMyPasesProps {
  limit?: number;
  skip?: number;
  searchName?: string;
  tab?: string;
  location?: string;
  locations?: string[];
  dynamicFilters?: Record<string, string | string[]>;
  dateFilter?: string;
  dateFrom?: string;
  dateTo?: string;
  facets?: SearchFacet[];
}

export const useGetMyPases = ({
  limit,
  skip,
  searchName,
  tab = "Todos",
  location = "",
  locations = [],
  dynamicFilters = {},
  dateFilter = "",
  dateFrom = "",
  dateTo = "",
  facets = [],
}: UseGetMyPasesProps) => {
  const {
    data: data,
    isLoading: isLoadingQuery,
    error,
    isFetching,
    isPlaceholderData,
  } = useQuery<any>({
    queryKey: ["getMyPases", tab, limit, skip, searchName, location, locations, dynamicFilters, dateFilter, dateFrom, dateTo, facets],
    queryFn: async () => {
      const data = await getMyPases({ tab, limit, skip, searchName, location, locations, dynamicFilters, dateFilter, dateFrom, dateTo, facets });
      if (data?.error) {
        toast.error("Error al obtener pases");
      }
      return data.response?.data || [];
    },
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  return {
    data,
    // Cargando = datos nuevos (cambió búsqueda, filtro, pestaña o página).
    isLoading: isLoadingQuery || (isFetching && isPlaceholderData),
    error,
    isFetching,
  };
};
