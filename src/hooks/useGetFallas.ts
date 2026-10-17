import { getListFallas } from "@/lib/get-list-fallas";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FacetListParams } from "@/lib/facet-search";

// Con paging, el listado viene paginado del back ({records, total_records...})
// con los filtros del buscador; sin paging, la lista de antes.
export const useGetFallas= (location:string | string[], area:string, status:string, dateFrom:string, dateTo:string, filterDate:string, paging?: FacetListParams, enabled: boolean = true) => {
  const { data: data, isLoading: isLoadingQuery, error, isFetching, isPlaceholderData, refetch } = useQuery<any>({
    queryKey: ["getListFallas", location, area, status, dateFrom, dateTo, filterDate, paging], 
    refetchOnWindowFocus: false,
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
        const data = await getListFallas(location, area , status,  dateFrom, dateTo, filterDate, paging); 
        const result = data.response?.data;
        if (paging) return result ?? { records: [], total_records: 0, total_pages: 1, actual_page: 1, records_on_page: 0 };
        return Array.isArray(result) ? result : []; 
    },
  });

  return {
    data,
    // Cargando = datos nuevos (cambió búsqueda, filtro o página).
    isLoading: isLoadingQuery || (isFetching && isPlaceholderData),
    error,
    isFetching,
    refetch
  };
};
