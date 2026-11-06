export interface GeolocalizacionUbicacion {
  latitude: number;
  longitude: number;
}

export interface UbicacionRow {
  _id?: string;
  record_id?: string;
  folio?: string;
  location: string;
  address_name?: string;
  address?: string;
  address2?: string;
  address_type?: string;
  address_geolocation?: GeolocalizacionUbicacion | null;
  state?: string;
  city?: string;
  zip_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  areas_count?: number;
}

export interface NormalizedUbicacion {
  id: string;
  recordId: string;
  folio: string;
  nombre: string;
  direccion: string;
  colonia: string;
  ciudad: string;
  estado: string;
  pais: string;
  codigoPostal: string;
  telefono: string;
  email: string;
  geolocalizacion: GeolocalizacionUbicacion | null;
  areasCount: number;
  /** address_name del contacto (catálogo "contacto") al que apunta. */
  contacto: string;
  /** Tipo del contacto: "Direccion", "Empresa" o "Persona". */
  tipoContacto: string;
  raw: UbicacionRow;
}

export const firstOrString = (value: unknown): string => {
  if (Array.isArray(value)) return (value.find(Boolean) as string) ?? "";
  return (value as string) || "";
};

export function normalizeUbicacion(row: UbicacionRow, index: number): NormalizedUbicacion {
  const nombre = firstOrString(row.location) || "-";
  const geo = row.address_geolocation;
  const tieneGeo = !!geo && (geo.latitude !== 0 || geo.longitude !== 0);

  return {
    id: `ubicacion-${index}-${nombre}`,
    recordId: row.record_id || row._id || "",
    folio: row.folio || "",
    nombre,
    direccion: firstOrString(row.address),
    colonia: firstOrString(row.address2),
    ciudad: firstOrString(row.city),
    estado: firstOrString(row.state),
    pais: firstOrString(row.country),
    codigoPostal: firstOrString(row.zip_code),
    telefono: firstOrString(row.phone),
    email: firstOrString(row.email),
    geolocalizacion: tieneGeo ? geo! : null,
    areasCount: row.areas_count ?? 0,
    contacto: firstOrString(row.address_name),
    tipoContacto: firstOrString(row.address_type),
    raw: row,
  };
}

// Shape esperado de get_empleados_by_ubicacion (location_sdk.py).
export interface EmpleadoUbicacionRow {
  _id?: string;
  record_id?: string;
  user_id?: number | string;
  nombre?: string | string[];
  puesto?: string | string[];
  departamento?: string | string[];
  email?: string | string[];
  telefono?: string | string[];
  foto?: { file_url?: string }[] | string;
  estatus?: string | string[];
}

export interface NormalizedEmpleadoUbicacion {
  id: string;
  recordId: string;
  nombre: string;
  puesto: string;
  departamento: string;
  email: string;
  telefono: string;
  foto: string;
  estatus: string;
}

export function normalizeEmpleadoUbicacion(row: EmpleadoUbicacionRow, index: number): NormalizedEmpleadoUbicacion {
  const nombre = firstOrString(row.nombre) || "-";
  const foto = Array.isArray(row.foto) ? row.foto[0]?.file_url ?? "" : row.foto || "";
  return {
    id: `empleado-${index}-${nombre}`,
    recordId: row.record_id || row._id || String(row.user_id ?? ""),
    nombre,
    puesto: firstOrString(row.puesto),
    departamento: firstOrString(row.departamento),
    email: firstOrString(row.email),
    telefono: firstOrString(row.telefono),
    foto,
    estatus: firstOrString(row.estatus),
  };
}

// ── Opciones avanzadas: configuración del módulo de seguridad por ubicación ──
// Es una sola fila del grupo "Requisitos de Accesos" de la forma
// configuracion_modulo_seguridad (un registro por cuenta, una fila por
// ubicación). El front solo ve la fila de esta ubicación; al guardar manda
// únicamente los campos que cambiaron y el back los mezcla sobre la fila.
// Los valores de las opciones son los de la forma (con acentos tal cual).

export type ArchivoConfig = { file_url?: string; file_name?: string };

export interface ConfigSeguridadUbicacion {
  datos_requeridos: string[];
  envio_por: string[];
  configuracion_de_accesos: string[];
  /** Minutos; vacío = el back usa 15. */
  tolerancia_de_entrada_previa: number | null;
  tolerancia_de_entrada_posterior: number | null;
  prefijo_telefonico: number | null;
  opcion_condiciones_servicio: string[];
  desc_condiciones_servicio: string;
  doc_condiciones_servicio: ArchivoConfig[];
  url_condiciones_servicio: string;
  auto_activacion: "sí" | "no";
  acompanantes_requeridos: "sí" | "no";
  logo_por_ubicacion: ArchivoConfig[];
}

export type ConfigSeguridadUbicacionRow = Partial<Record<keyof ConfigSeguridadUbicacion, unknown>>;

export const OPCIONES_CONFIG_SEGURIDAD = {
  datos_requeridos: [
    { value: "identificacion", label: "Identificación" },
    { value: "fotografia", label: "Fotografía" },
    { value: "correo", label: "Correo" },
    { value: "telefono", label: "Teléfono" },
  ],
  envio_por: [
    { value: "correo", label: "Correo" },
    { value: "sms", label: "SMS" },
  ],
  configuracion_de_accesos: [
    { value: "impresion_de_pase", label: "Impresión de pase" },
    { value: "auto_acceso", label: "Auto acceso" },
  ],
  opcion_condiciones_servicio: [
    { value: "descripción", label: "Descripción" },
    { value: "vídeo", label: "Vídeo" },
    { value: "documento", label: "Documento" },
  ],
};

const toList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && !!v);
  return typeof value === "string" && value ? [value] : [];
};

const toNumber = (value: unknown): number | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === null || raw === undefined || raw === "" || raw === "None") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const toArchivos = (value: unknown): ArchivoConfig[] => {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.filter((a): a is ArchivoConfig => !!a && typeof a === "object" && !!(a as ArchivoConfig).file_url);
};

const toSiNo = (value: unknown): "sí" | "no" => {
  const v = firstOrString(value).trim().toLowerCase();
  return v === "sí" || v === "si" ? "sí" : "no";
};

export function normalizeConfigSeguridad(row: ConfigSeguridadUbicacionRow | null | undefined): ConfigSeguridadUbicacion {
  const r = row ?? {};
  return {
    datos_requeridos: toList(r.datos_requeridos),
    envio_por: toList(r.envio_por),
    configuracion_de_accesos: toList(r.configuracion_de_accesos),
    tolerancia_de_entrada_previa: toNumber(r.tolerancia_de_entrada_previa),
    tolerancia_de_entrada_posterior: toNumber(r.tolerancia_de_entrada_posterior),
    prefijo_telefonico: toNumber(r.prefijo_telefonico),
    opcion_condiciones_servicio: toList(r.opcion_condiciones_servicio),
    desc_condiciones_servicio: firstOrString(r.desc_condiciones_servicio),
    doc_condiciones_servicio: toArchivos(r.doc_condiciones_servicio),
    url_condiciones_servicio: firstOrString(r.url_condiciones_servicio),
    auto_activacion: toSiNo(r.auto_activacion),
    acompanantes_requeridos: toSiNo(r.acompanantes_requeridos),
    logo_por_ubicacion: toArchivos(r.logo_por_ubicacion),
  };
}

/** Solo los campos que cambiaron respecto a lo que se cargó. */
export function diffConfigSeguridad(
  original: ConfigSeguridadUbicacion,
  actual: ConfigSeguridadUbicacion,
): Partial<ConfigSeguridadUbicacion> {
  // Las listas de opciones se comparan sin importar el orden en que se marcaron.
  const canon = (v: unknown) =>
    JSON.stringify(Array.isArray(v) && v.every((x) => typeof x === "string") ? [...v].sort() : v);
  const cambios: Partial<ConfigSeguridadUbicacion> = {};
  (Object.keys(actual) as (keyof ConfigSeguridadUbicacion)[]).forEach((key) => {
    if (canon(original[key]) !== canon(actual[key])) {
      (cambios as Record<string, unknown>)[key] = actual[key];
    }
  });
  return cambios;
}
