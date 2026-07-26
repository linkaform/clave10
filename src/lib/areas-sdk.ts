import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

// Llamadas al SDK nuevo (lkf-sanic-apps) para el explorador de Áreas del
// front web — mismo endpoint/shape que el resto del script-runner, solo
// cambia el script_name para que la plataforma lo corra en el contenedor
// de Sanic en vez del legacy. Ver knowledge/patterns/clave10_front_explorer_screen.md.

export const getAreasCatalogSdk = async (
  ubicacion: string,
  dynamicFilters: { key: string; value: any }[] = [],
) => {
  const payload = {
    ubicacion,
    dynamic_filters: dynamicFilters,
    option: "get_catalog_areas_formatted",
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
