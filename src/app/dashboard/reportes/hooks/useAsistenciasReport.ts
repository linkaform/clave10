import { useQuery } from "@tanstack/react-query";
import { getAttendanceData, getAttendanceDayDetail, getAttendanceDetail, getPlantilla, getReportAsistencias, getReportLocations } from "../endpoints/asistenciasReport";
import { PlantillaRow } from "../reporte_asistencias/lib/plantilla";
import { asistenciasReport } from "../types/report";

// El reporte cambia poco mientras se navega: se reusa la respuesta 5 min por periodo y se guarda 30 min.
// "Recargar" sigue pidiendo de nuevo (refetch ignora staleTime).
const CACHE = { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 };

export const useReportAsistencias = ({ enabled = false, dateRange, locations, groupBy, month, year, dateFrom, dateTo }: asistenciasReport) => {
    const {
        data: reportAsistencias,
        isLoading: isLoadingReportAsistencias,
        error: errorReportAsistencias,
        refetch: refetchReportAsistencias,
        isFetching: isFetchingReportAsistencias,
    } = useQuery<any>({
        // El back solo usa month/year si no llega el rango; con el rango basta para la llave
        queryKey: ["getReportAsistencias", { locations, groupBy, dateFrom, dateTo }],
        enabled,
        ...CACHE,
        queryFn: async () => {
            const data = await getReportAsistencias({
                dateRange,
                locations,
                groupBy,
                month,
                year,
                dateFrom,
                dateTo,
            });
            return data ?? [];
        },
        refetchOnWindowFocus: false,
        retry: 1,
    });

    return {
        reportAsistencias,
        isLoadingReportAsistencias,
        isFetchingReportAsistencias,
        errorReportAsistencias,
        refetchReportAsistencias,
    };
};

export const useReportLocations = ({ enabled = false }: { enabled?: boolean }) => {
    const {
        data: reportLocations,
        isLoading: isLoadingReportLocations,
        error: errorReportLocations,
        refetch: refetchReportLocations,
    } = useQuery<any>({
        queryKey: ["getReportLocations"],
        enabled,
        queryFn: async () => {
            const data = await getReportLocations();
            return data ?? [];
        },
        refetchOnWindowFocus: false,
        retry: 1,
    });

    return {
        reportLocations,
        isLoadingReportLocations,
        errorReportLocations,
        refetchReportLocations,
    };
};

export const useAttendanceDetail = ({ enabled = false, userIds, selectedDay, location }: { enabled?: boolean; userIds: number[]; selectedDay: number; location: string }) => {
    const {
        data: attendanceDetail,
        isLoading: isLoadingAttendanceDetail,
        error: errorAttendanceDetail,
        refetch: refetchAttendanceDetail,
    } = useQuery<any>({
        queryKey: ["getAttendanceDetail", { userIds, selectedDay, location }],
        enabled,
        queryFn: async () => {
            const data = await getAttendanceDetail(userIds, selectedDay, location);
            return data ?? [];
        },
        refetchOnWindowFocus: false,
        retry: 1,
    });

    return {
        attendanceDetail,
        isLoadingAttendanceDetail,
        errorAttendanceDetail,
        refetchAttendanceDetail,
    };
};

export const useAttendanceData = ({
    enabled = true,
    locations = [],
    limit = 100,
    offset = 0,
    dateFrom,
    dateTo,
  }: {
    enabled?: boolean;
    locations?: string[];
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const {
      data,
      isLoading: isLoadingAttendance,
      isFetching: isFetchingAttendance,
      error: errorAttendance,
      refetch: refetchAttendance,
    } = useQuery<any>({
      queryKey: ["getAttendanceData", { locations, limit, offset, dateFrom, dateTo }],
      enabled,
      ...CACHE,
      queryFn: () => getAttendanceData({ locations, limit, offset, dateFrom, dateTo }),
      refetchOnWindowFocus: false,
      retry: 1,
    });

    return {
      attendanceData: data?.records ?? [],
      pagination: {
        total_records: data?.total_records ?? 0,
        total_pages: data?.total_pages ?? 1,
        actual_page: data?.actual_page ?? 1,
        records_on_page: data?.records_on_page ?? 0,
      },
      // Solo la primera carga de una página; al regresar a una ya vista se muestra lo guardado
      isLoadingAttendance,
      isFetchingAttendance,
      errorAttendance,
      refetchAttendance,
    };
  };

export const useAttendanceDayDetail = (userId?: number, fecha?: string) => {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["getAttendanceDayDetail", { userId, fecha }],
    enabled: !!userId && !!fecha,
    ...CACHE,
    queryFn: () => getAttendanceDayDetail(userId!, fecha!),
    refetchOnWindowFocus: false,
    retry: 1,
  });
  return { dayDetail: data ?? {}, isLoadingDayDetail: isLoading };
};

// Plantilla por caseta del rango (Cobertura y "Ver plazas")
export const usePlantilla = ({ enabled = false, dateFrom, dateTo }: { enabled?: boolean; dateFrom?: string; dateTo?: string }) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery<PlantillaRow[]>({
    queryKey: ["getPlantilla", { dateFrom, dateTo }],
    enabled: enabled && !!dateFrom && !!dateTo,
    ...CACHE,
    queryFn: async () => (await getPlantilla(dateFrom!, dateTo!)) ?? [],
    refetchOnWindowFocus: false,
    retry: 1,
  });
  return {
    plantilla: Array.isArray(data) ? data : [],
    isLoadingPlantilla: isLoading,
    isFetchingPlantilla: isFetching,
    errorPlantilla: error,
    refetchPlantilla: refetch,
  };
};
