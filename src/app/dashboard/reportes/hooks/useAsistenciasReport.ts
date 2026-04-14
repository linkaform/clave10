import { useQuery } from "@tanstack/react-query";
import { getAttendanceData, getAttendanceDetail, getReportAsistencias, getReportLocations } from "../endpoints/asistenciasReport";
import { asistenciasReport } from "../types/report";

export const useReportAsistencias = ({ enabled = false, dateRange, locations, groupBy, month, year }: asistenciasReport) => {
    const {
        data: reportAsistencias,
        isLoading: isLoadingReportAsistencias,
        error: errorReportAsistencias,
        refetch: refetchReportAsistencias,
        isFetching: isFetchingReportAsistencias,
    } = useQuery<any>({
        queryKey: ["getReportAsistencias", { dateRange, locations, groupBy, month, year }],
        enabled,
        queryFn: async () => {
            const data = await getReportAsistencias({
                dateRange,
                locations,
                groupBy,
                month,
                year
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
  }: {
    enabled?: boolean;
    locations?: string[];
    limit?: number;
    offset?: number;
  }) => {
    const {
      data,
      isLoading: isLoadingAttendance,
      error: errorAttendance,
      refetch: refetchAttendance,
    } = useQuery<any>({
      queryKey: ["getAttendanceData", { locations, limit, offset }],
      enabled,
      queryFn: async () => {
        const records = await getAttendanceData({ locations, limit, offset });
        return records ?? [];
      },
      refetchOnWindowFocus: false,
      retry: 1,
    });
   
    return {
      attendanceData: data ?? [],
      isLoadingAttendance,
      errorAttendance,
      refetchAttendance,
    };
  };
   