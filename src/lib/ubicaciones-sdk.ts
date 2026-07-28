import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

// Llamadas al SDK nuevo (lkf-sanic-apps) para el explorador de Ubicaciones del
// front web — mismo endpoint/shape que el resto del script-runner, script_name
// "location_sdk.py". Ver knowledge/patterns/clave10_front_explorer_screen.md.

export interface UbicacionFormData {
  nombre?: string;
  direccion?: string;
  colonia?: string;
  ciudad?: string;
  estado?: string;
  pais?: string;
  codigo_postal?: string;
  telefono?: string;
  email?: string;
  geolocalizacion?: { latitude: number; longitude: number };
}

const runScript = async (payload: Record<string, any>) => {
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

export const getUbicacionesCatalogSdk = async (ubicacion: string) => {
  return runScript({
    ubicacion,
    option: "get_catalog_ubicaciones_formatted",
    script_name: "location_sdk.py",
  });
};

export const getUbicacionByIdSdk = async (record_id: string) => {
  return runScript({
    record_id,
    option: "get_ubicacion_by_id",
    script_name: "location_sdk.py",
  });
};

export const createUbicacionSdk = async (data: UbicacionFormData) => {
  return runScript({
    ...data,
    option: "create_ubicacion",
    script_name: "location_sdk.py",
  });
};

export const updateUbicacionSdk = async (
  recordId: string,
  data: UbicacionFormData,
) => {
  return runScript({
    record_id: recordId,
    ...data,
    option: "update_ubicacion",
    script_name: "location_sdk.py",
  });
};
