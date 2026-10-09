import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

/** Buscador avanzado de Check de áreas: con esto el back pagina y filtra. */
export interface CheckAreasSearch {
  facets: { key: string; values: string[]; exact?: boolean }[];
  locations: string[];
  filterDate: string;
  dateFrom: string;
  dateTo: string;
  limit: number;
  skip: number;
}

export const getListCheckUbicaciones = async (
    ubicacion?: string,
    nombreRondin?: string,
    search?: CheckAreasSearch,
  ) => {
    const payload = {
      ubicacion: ubicacion || "",
      nombre_rondin: nombreRondin || "",
      ...(search ? { ...search, limit_checks: search.limit } : {}),
      option: "get_all_checks",
      script_name: "rondines.py",
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
    return data;
  };