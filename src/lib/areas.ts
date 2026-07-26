import { AreaItem } from "@/types/bitacoras";

export interface AreaRow extends AreaItem {
  ubicacion: string;
}

export interface NormalizedArea {
  id: string;
  folio: string;
  recordId: string;
  nombre: string;
  ubicacion: string;
  tipo: string;
  estado: string;
  disponibilidad: string;
  tagId: string;
  foto: string | null;
  raw: AreaRow;
}

export const firstOrString = (value: unknown): string => {
  if (Array.isArray(value)) return (value.find(Boolean) as string) ?? "";
  return (value as string) || "";
};

export function normalizeArea(area: AreaRow, index: number): NormalizedArea {
  const nombre = firstOrString(area.rondin_area) || "-";
  const ubicacion = area.ubicacion || "-";
  const tipo = firstOrString(area.tipo_de_area) || "-";
  const estado = firstOrString(area.area_state);
  const disponibilidad = firstOrString(area.area_status);
  const tagId = firstOrString(area.area_tag_id);
  const foto =
    Array.isArray(area.foto_area) && area.foto_area.length > 0
      ? area.foto_area[0]?.file_url ?? null
      : null;

  return {
    id: `area-${index}-${ubicacion}-${nombre}`,
    folio: area.folio || "",
    recordId: area.record_id || "",
    nombre,
    ubicacion,
    tipo,
    estado,
    disponibilidad,
    tagId,
    foto,
    raw: area,
  };
}
