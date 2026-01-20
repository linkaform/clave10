import { asistenciasReport } from "../types/report";
import { API_ENDPOINTS } from "@/config/api";

export const getReportAsistencias = async ({ dateRange, locations, groupBy }: asistenciasReport) => {
    try {
        const payload = {
            option: "get_report",
            script_name: "asistencia_report.py",
            date_range: dateRange,
            locations,
            group_by: groupBy
        };

        const userJwt = localStorage.getItem("access_token");
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

        const userJwt = localStorage.getItem("access_token");
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

        const userJwt = localStorage.getItem("access_token");
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
