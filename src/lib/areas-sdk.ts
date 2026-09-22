import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

// Llamadas para el explorador de Áreas del front web — mismo endpoint/shape
// que el resto del script-runner. get_catalog_areas_formatted apunta
// temporalmente a rondines.py (back legacy) porque el SDK nuevo
// (lkf-sanic-apps) no se pudo levantar; revertir a rondines_sdk.py cuando
// Sanic esté disponible. Ver knowledge/patterns/clave10_front_explorer_screen.md.

export const getAreasCatalogSdk = async (
  locations: string[],
  dynamicFilters: { key: string; value: any }[] = [],
  limit: number = 25,
  skip: number = 0,
  search: string = "",
  searchFields: string[] = [],
) => {
  const payload = {
    locations,
    dynamic_filters: dynamicFilters,
    limit,
    // El dispatcher de rondines.py lee "offset", no "skip".
    offset: skip,
    search,
    search_fields: searchFields,
    option: "get_catalog_areas_formatted",
    script_name: "rondines.py",
  };

  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};

export const getAreaByIdSdk = async (record_id: string) => {
  const payload = {
    record_id,
    option: "get_area_by_id",
    script_name: "rondines_sdk.py",
  };

  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};

export const getAreaPdfSdk = async (record_id: string) => {
  const payload = {
    qr_code: record_id,
    option: "get_area_pdf",
    script_name: "rondines_sdk.py",
  };

  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};

export const getFallasByAreaSdk = async (
  ubicacion: string,
  area: string,
  dateFrom: string,
  dateTo: string,
) => {
  const payload = {
    location: ubicacion,
    area,
    dateFrom,
    dateTo,
    filterDate: "range",
    option: "get_fallas",
    script_name: "fallas_sdk.py",
  };

  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};

export const updateAreaEstadoSdk = async (record_id: string, estado: string) => {
  const payload = {
    record_id,
    estado,
    option: "update_area_estado",
    script_name: "rondines_sdk.py",
  };

  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};

export const getChecksByAreaSdk = async (
  ubicacion: string,
  area: string,
  dateFrom?: string,
  dateTo?: string,
  limit: number = 500,
) => {
  const payload = {
    ubicacion,
    area,
    date_from: dateFrom || "",
    date_to: dateTo || "",
    limit,
    option: "get_all_checks",
    script_name: "rondines_sdk.py",
  };

  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};

export const updateAreaDisponibilidadSdk = async (record_id: string, disponibilidad: string) => {
  const payload = {
    record_id,
    disponibilidad,
    option: "update_area_disponibilidad",
    script_name: "rondines_sdk.py",
  };

  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};

export interface CreateAreaData {
  ubicacion: string;
  nombre: string;
  tipo_de_area: string;
  foto_area?: any[];
  qr_area?: string;
  geolocalizacion?: { latitude: number; longitude: number };
}

export const createAreaSdk = async (data: CreateAreaData) => {
  const payload = {
    ...data,
    option: "create_area",
    script_name: "rondines_sdk.py",
  };

  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};

export const getFiltersAreasSdk = async () => {
  const payload = {
    option: "filters_areas",
    script_name: "rondines_sdk.py",
  };

  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};
