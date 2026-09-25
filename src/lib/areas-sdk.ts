import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

// Llamadas para el explorador de Áreas del front web — mismo endpoint/shape
// que el resto del script-runner. Ver knowledge/patterns/clave10_front_explorer_screen.md.

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
    offset: skip,
    search,
    search_fields: searchFields,
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

// ---------------------------------------------------------------------------
// Crear área
// ---------------------------------------------------------------------------

/** Estado del área. Al crear siempre se manda "activa"; se cambia después. */
export type AreaState = "activa" | "inactiva";

/**
 * Disponibilidad del área (catálogo `disponibilidad` de filters_areas). Hoy
 * trae: disponible, abierta, cerrada, mantenimiento. Es un catálogo del back,
 * por eso el tipo acepta cualquier string además de los valores conocidos.
 */
export type AreaStatus = "disponible" | "abierta" | "cerrada" | "mantenimiento" | (string & {});

/** Módulos en los que se puede usar un área (key que se manda en `usos`). */
export type AreaUso =
  | "pases"
  | "incidencias"
  | "paqueteria"
  | "fallas"
  | "articulos_concesionados"
  | "articulos_perdidos"
  | "rondines"
  | "notas"
  | "casetas";

export const AREA_USOS: { value: AreaUso; label: string }[] = [
  { value: "pases", label: "Pases" },
  { value: "incidencias", label: "Incidencias" },
  { value: "paqueteria", label: "Paquetería" },
  { value: "fallas", label: "Fallas" },
  { value: "articulos_concesionados", label: "Artículos Concesionados" },
  { value: "articulos_perdidos", label: "Artículos Perdidos" },
  { value: "rondines", label: "Rondines" },
  { value: "notas", label: "Notas" },
  { value: "casetas", label: "Casetas" },
];

export interface GeolocalizacionArea {
  latitude: number;
  longitude: number;
}

/** Archivo ya subido (mismo shape que regresa LoadImage / upload-Image). */
export interface ArchivoArea {
  file_url?: string;
  file_name?: string;
}

/** Datos del formulario "Nueva área". */
export interface CreateAreaData {
  nombre: string;
  ubicacion: string;
  tipo_de_area: string;
  /** Default "disponible". */
  area_status?: AreaStatus;
  /** Default "activa". */
  area_state?: AreaState;
  tag_id?: string;
  direccion?: string;
  geolocalizacion?: GeolocalizacionArea | null;
  /** Default []. */
  usos?: AreaUso[];
  /** Default []. */
  foto_area?: ArchivoArea[];
}

/**
 * Payload tal cual lo recibe create_area (rondines_sdk.py → /accesos/create_area
 * → create_new_area).
 *
 * Qué guarda hoy el back:
 * - Sí: nombre, ubicacion, tipo_de_area, foto_area, qr_area (Tag ID →
 *   area_tag_id) y geolocalizacion.
 * - Todavía no: area_state/area_status (create_new_area los tiene fijos en
 *   "activa"/"disponible"), direccion (sale del contacto de la ubicación) y
 *   usos (no hay campo). Además el wrapper create_area de rondines_sdk.py
 *   solo reenvía los campos del primer grupo. Se mandan igual para que el
 *   front no cambie cuando el back los reciba.
 */
export interface CreateAreaPayload {
  nombre: string;
  ubicacion: string;
  tipo_de_area: string;
  area_status: AreaStatus;
  area_state: AreaState;
  /** Tag ID del área: el back lo guarda en area_tag_id. */
  qr_area: string;
  direccion: string;
  geolocalizacion?: GeolocalizacionArea;
  usos: AreaUso[];
  foto_area: ArchivoArea[];
}

export const buildCreateAreaPayload = (data: CreateAreaData): CreateAreaPayload => ({
  nombre: data.nombre.trim(),
  ubicacion: data.ubicacion,
  tipo_de_area: data.tipo_de_area,
  area_status: data.area_status || "disponible",
  area_state: data.area_state || "activa",
  qr_area: data.tag_id?.trim() ?? "",
  direccion: data.direccion ?? "",
  ...(data.geolocalizacion ? { geolocalizacion: data.geolocalizacion } : {}),
  usos: data.usos ?? [],
  foto_area: (data.foto_area ?? []).filter((f) => f.file_url),
});

export const createAreaSdk = async (data: CreateAreaData) => {
  const payload = {
    ...buildCreateAreaPayload(data),
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

export const getRondinesByAreaSdk = async (area_id: string, limit: number = 5, skip: number = 0) => {
  const payload = {
    area_id,
    limit,
    offset: skip,
    option: "get_rondines_by_area",
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

export const getIncidenciasByAreaSdk = async (area_id: string, limit: number = 5, skip: number = 0) => {
  const payload = {
    area_id,
    limit,
    offset: skip,
    option: "get_incidencias_by_area",
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
