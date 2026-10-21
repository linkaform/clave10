import { getValidToken } from "@/lib/login/get-valid-token";
import { asistenciasReport } from "../types/report";
import { API_ENDPOINTS } from "@/config/api";

export const getReportAsistencias = async ({ dateRange, locations, groupBy, month, year }: asistenciasReport) => {
    try {
        const payload = {
            option: "reporte_asistencia",
            script_name: "asistencia_sdk.py",
            date_range: dateRange,
            locations,
            group_by: groupBy,
            month,
            year
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
            option: "reporte_ubicaciones",
            script_name: "asistencia_sdk.py",
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

export const getAttendanceDetail = async (
    userIds: number[],
    selectedDay: number,
    location: string,
    month?: number,
    year?: number,
) => {
    try {
        const payload = {
            option: "reporte_detalle",
            script_name: "asistencia_sdk.py",
            user_ids: userIds,
            selected_day: selectedDay,
            location,
            month,
            year,
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
    month,
    year,
    limit = 100,
    offset = 0,
  }: {
    locations?: string[];
    month?: number;
    year?: number;
    limit?: number;
    offset?: number;
  }) => {
    try {
      const payload = {
        option: "reporte_registros",
        script_name: "asistencia_sdk.py",
        locations,
        month,
        year,
        limit,
        offset,
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
      return data?.response?.data?.records ?? [];
    } catch (error) {
      console.error("Error al obtener attendance data:", error);
      throw error;
    }
  };