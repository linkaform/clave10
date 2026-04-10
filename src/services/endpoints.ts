import { apiPost } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import { ApiResponse } from "@/types/api";

export const getBitacoraFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "in_and_out",
  });

export const getRondinesFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "rondines",
  });