import { useQuery } from "@tanstack/react-query";
import { getAttendanceData, getAttendanceDayDetail, getAttendanceDetail, getReportAsistencias, getReportLocations } from "../endpoints/asistenciasReport";
import { asistenciasReport } from "../types/report";

export const useReportAsistencias = ({ enabled = false, dateRange, locations, groupBy, month, year, dateFrom, dateTo }: asistenciasReport) => {
    const {
        data: reportAsistencias,
        isLoading: isLoadingReportAsistencias,
        error: errorReportAsistencias,
        refetch: refetchReportAsistencias,
        isFetching: isFetchingReportAsistencias,
    } = useQuery<any>({
        queryKey: ["getReportAsistencias", { dateRange, locations, groupBy, month, year, dateFrom, dateTo }],
        enabled,
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
      isLoadingAttendance: isLoadingAttendance || isFetchingAttendance,
      errorAttendance,
      refetchAttendance,
    };
  };

export const useAttendanceDayDetail = (userId?: number, fecha?: string) => {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["getAttendanceDayDetail", { userId, fecha }],
    enabled: !!userId && !!fecha,
    queryFn: () => getAttendanceDayDetail(userId!, fecha!),
    refetchOnWindowFocus: false,
    retry: 1,
  });
  return { dayDetail: data ?? {}, isLoadingDayDetail: isLoading };
};
