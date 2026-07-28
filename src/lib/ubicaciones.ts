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
    raw: row,
  };
}
