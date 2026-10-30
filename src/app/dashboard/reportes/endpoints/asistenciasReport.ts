import { getValidToken } from "@/lib/login/get-valid-token";
import { asistenciasReport } from "../types/report";
import { API_ENDPOINTS } from "@/config/api";

export const getReportAsistencias = async ({ dateRange, locations, groupBy, month, year, dateFrom, dateTo }: asistenciasReport) => {
    try {
        const payload = {
            option: "get_report",
            script_name: "asistencia_report.py",
            date_range: dateRange,
            locations,
            group_by: groupBy,
            month,
            year,
            date_from: dateFrom,
            date_to: dateTo,
        };

        const userJwt = await getValidToken();
        const response = await fetch(API_ENDPOINTS.runScript, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userJwt}`,
            },
            body: JSON.stringify(payload),
        });


        const data = await response.json();
        const format_data = data?.response?.data ?? [];
        return format_data;
    } catch (error) {
        console.error("Error al ejecutar el reporte:", error);
        throw error;
    }
};

export const getReportLocations = async () => {
    try {
        const payload = {
            option: "get_locations",
            script_name: "asistencia_report.py",
        };

        const userJwt = await getValidToken();
        const response = await fetch(API_ENDPOINTS.runScript, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userJwt}`,
            },
            body: JSON.stringify(payload),
        });


        const data = await response.json();
        const format_data = data?.response?.data ?? [];
        return format_data;
    } catch (error) {
        console.error("Error al ejecutar el reporte:", error);
        throw error;
    }
};

export const getAttendanceDetail = async (userIds: number[], selectedDay: number, location: string) => {
    try {
        const payload = {
            option: "get_guard_turn_details",
            script_name: "asistencia_report.py",
            user_ids: userIds,
            selected_day: selectedDay,
            location
        };

        const userJwt = await getValidToken();
        const response = await fetch(API_ENDPOINTS.runScript, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userJwt}`,
            },
            body: JSON.stringify(payload),
        });


        const data = await response.json();
        const format_data = data?.response?.data ?? [];
        return format_data;
    } catch (error) {
        console.error("Error al ejecutar el reporte:", error);
        throw error;
    }
};
 
export const getAttendanceData = async ({
    locations = [],
    limit = 100,
    offset = 0,
    dateFrom,
    dateTo,
  }: {
    locations?: string[];
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    try {
      const payload = {
        option: "get_attendance_data",
        script_name: "asistencia_report.py",
        locations,
        limit,
        offset,
        date_from: dateFrom,
        date_to: dateTo,
      };
      const userJwt = await getValidToken();
      const response = await fetch(API_ENDPOINTS.runScript, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userJwt}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      // Registros + paginación (total_records, total_pages, actual_page, records_on_page)
      return data?.response?.data ?? null;
    } catch (error) {
      console.error("Error al obtener attendance data:", error);
      throw error;
    }
  };
export const getAttendanceDayDetail = async (userId: number, fecha: string) => {
  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${userJwt}`,
    },
    body: JSON.stringify({
      option: "get_attendance_day_detail",
      script_name: "asistencia_report.py",
      user_id: userId,
      fecha,
    }),
  });
  const data = await response.json();
  return data?.response?.data ?? {};
};
