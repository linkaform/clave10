import { getStats } from "@/lib/get-stats";
import {
  crearIncidencia,
  editarIncidencia,
  getListIncidencias,
  InputIncidencia,
} from "@/lib/incidencias";
import { errorMsj } from "@/lib/utils";
import { useShiftStore } from "@/store/useShiftStore";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FacetListParams } from "@/lib/facet-search";
import { toast } from "sonner";

export const useInciencias = (
  location: string | string[],
  area: string,
  prioridades: string[],
  dateFrom: string,
  dateTo: string,
  filterDate: string,
  estatus?: string,
  // Con paging, el listado viene paginado del back con los filtros del buscador.
  paging?: FacetListParams,
) => {
  const queryClient = useQueryClient();
  // Lógica extra para el Drawer de filtros externos
  const { isLoading: loading, setLoading } = useShiftStore();
  //Obtener lista de Incidencias
  const {
    data: listIncidencias,
    isLoading: isLoadingQueryIncidencias,
    isFetching: isFetchingIncidencias,
    isPlaceholderData: isPlaceholderIncidencias,
    error: errorListIncidencias,
    refetch: refetchTableIncidencias,
  } = useQuery<any>({
    queryKey: [
      "getListIncidencias",
      location,
      area,
      prioridades,
      dateFrom,
      dateTo,
      filterDate,
      estatus,
      paging,
    ],
    enabled: location.length > 0,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const data = await getListIncidencias(
        location,
        area,
        prioridades,
        dateFrom,
        dateTo,
        filterDate,
        estatus,
        paging,
      );
      const result = data.response?.data;
      if (paging) return result ?? { records: [], total_records: 0, total_pages: 1, actual_page: 1, records_on_page: 0 };
      return Array.isArray(result) ? result : [];
    },
  });

  //Crear Incidencia
  const createIncidenciaMutation = useMutation({
    mutationFn: async ({
      data_incidencia,
    }: {
      data_incidencia: InputIncidencia;
    }) => {
      const response = await crearIncidencia(data_incidencia);
      const hasError =
        !response?.success || response?.response?.data?.status_code === 400;
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al crear seguimiento, Error: ${textMsj?.text}`);
      } else {
        return response.response?.data;
      }
    },
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getListIncidencias"] });
      queryClient.invalidateQueries({ queryKey: ["getStatsIncidencias"] });
      toast.success("Incidencia creada correctamente.");
    },
    onError: (err) => {
      toast.error(err.message || "Hubo un error al crear la incidencia.", {
        style: {
          background: "#dc2626",
          color: "#fff",
          border: "none",
        },
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  //Editar Incidencia
  const editarIncidenciaMutation = useMutation({
    mutationFn: async ({
      data_incidencia,
      folio,
    }: {
      data_incidencia: InputIncidencia;
      folio: string;
    }) => {
      const response = await editarIncidencia(data_incidencia, folio);
      const hasError =
        !response?.success || response?.response?.data?.status_code === 400;
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al crear seguimiento, Error: ${textMsj?.text}`);
      } else {
        return response.response?.data;
      }
    },
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getListIncidencias"] });
      queryClient.invalidateQueries({ queryKey: ["getStatsIncidencias"] });
      toast.success("Incidencia editada correctamente.");
    },
    onError: (err) => {
      console.error("Error al editar incidencia:", err);
      toast.error(err.message || "Hubo un error al editar la incidencia.", {
        style: {
          background: "#dc2626",
          color: "#fff",
          border: "none",
        },
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery<any>({
    queryKey: ["getStatsIncidencias", area, location],
    enabled: location.length > 0,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const data = await getStats(location, area, "Incidencias");
      const responseData = data.response?.data || {};
      return responseData;
    },
  });

  return {
    //Obtener Incidencias
    listIncidencias,
    // Cargando = datos nuevos (cambió búsqueda, filtro o página).
    isLoadingListIncidencias: isLoadingQueryIncidencias || (isFetchingIncidencias && isPlaceholderIncidencias),
    loading,
    setLoading,
    errorListIncidencias,
    refetchTableIncidencias,
    //Crear Incidencia
    createIncidenciaMutation,
    //EditarIncidencia
    editarIncidenciaMutation,
    //Stats Incidencias
    stats,
    isStatsLoading,
    statsError,
  };
};
