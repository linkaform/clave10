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
  /** Al crear una ubicación: address_name del contacto elegido en el catálogo. */
  contacto?: string;
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

export const getUbicacionesCatalogSdk = async (
  locations: string[],
  dynamicFilters: { key: string; value: any }[] = [],
  limit: number = 25,
  skip: number = 0,
  search: string = "",
  searchFields: string[] = [],
) => {
  return runScript({
    locations,
    dynamic_filters: dynamicFilters,
    limit,
    offset: skip,
    search,
    search_fields: searchFields,
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

// La edición solo apunta la ubicación a otro contacto del catálogo (el
// catálogo no se modifica desde aquí; ver update_ubicacion en el back).
export interface UbicacionUpdateData {
  nombre?: string;
  /** address_name del contacto elegido en el catálogo "contacto". */
  contacto?: string;
}

export const updateUbicacionSdk = async (
  recordId: string,
  data: UbicacionUpdateData,
) => {
  return runScript({
    record_id: recordId,
    ...data,
    option: "update_ubicacion",
    script_name: "location_sdk.py",
  });
};

// Alta de un contacto (dirección) en el catálogo "contacto", desde el botón
// "+" del selector de dirección de la ubicación.
export const createContactoSdk = async (data: UbicacionFormData) => {
  return runScript({
    ...data,
    tipo: "Direccion",
    option: "create_contacto",
    script_name: "location_sdk.py",
  });
};

// Empleados asignados a la ubicación (tab "Empleados" del detalle).
// Pendiente en el back: option "get_empleados_by_ubicacion" en location_sdk.py.
export const getEmpleadosByUbicacionSdk = async (ubicacion: string) => {
  return runScript({
    ubicacion,
    option: "get_empleados_by_ubicacion",
    script_name: "location_sdk.py",
  });
};
