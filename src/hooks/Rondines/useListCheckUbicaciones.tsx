import { CheckAreasSearch, getListCheckUbicaciones } from "@/lib/get-all-checks";
import { errorMsj } from "@/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useGetListCheckUbicaciones = (
  enableList: boolean,
  ubicacion?: string,
  nombreRondin?: string,
  // Con search, el back pagina y aplica los filtros del buscador (trae total_records).
  search?: CheckAreasSearch,
) => {
  const { data, isLoading: isLoadingQuery, isFetching, isPlaceholderData, error: errorListCheckUbicaciones } = useQuery({
    queryKey: ["getListCheckUbicaciones", ubicacion, nombreRondin, search],
    enabled: enableList,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const data = await getListCheckUbicaciones(ubicacion, nombreRondin, search);
      const textMsj = errorMsj(data);
      if (textMsj) {
        throw new Error(`Error al obtener lista de check ubicaciones, Error: ${data.error}`);
      } else {
        const result = data.response?.data?.data;
        const records = Array.isArray(result) ? result : [];
        return { records, total: data.response?.data?.total_records ?? records.length };
      }
    },
  });

  return {
    listCheckUbicaciones: data?.records,
    totalCheckUbicaciones: data?.total ?? 0,
    // Cargando = datos nuevos (cambió búsqueda, filtro o página).
    isLoadingListCheckUbicaciones: isLoadingQuery || (isFetching && isPlaceholderData),
    errorListCheckUbicaciones,
    
  };
};