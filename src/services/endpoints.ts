import { apiPost } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import { ApiResponse } from "@/types/api";

export const getBitacoraFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "script_turnos.py",
    option: "get_bitacora_filters",
  });