import { apiPost } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import { ApiResponse } from "@/types/api";

export const getBitacoraFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "in_and_out",
    public_script: true,
  });

export const getRecorridosFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "recorridos",
    public_script: true,
  });

export const getRondinesFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "rondines",
    public_script: true,
  });

export const getCheckAreasFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "check_areas",
    public_script: true,
  });

export const getIncidenciasFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "incidencias",
    public_script: true,
  });

export const getFallasFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "fallas",
    public_script: true,
  });

export const getPasesFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "pases",
    public_script: true,
  });
