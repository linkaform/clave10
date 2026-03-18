import { FilterConfig } from "@/types/bitacoras";
import { PhotoRecord } from "@/types/bitacoras";

export const BITACORAS_FILTERS: FilterConfig[] = [
  {
    label: 'Estatus',
    type: 'multiple',
    key: 'status',
    options: [
      { label: 'Entrada', value: 'entrada' },
      { label: 'Salida', value: 'salida' },
    ],
  },
]

export function generateFiltersConfig(records: PhotoRecord[]): FilterConfig[] {
  const dynamicConfigs: FilterConfig[] = [];

  const statuses = Array.from(new Set(records.map(r => r.status))).filter(Boolean);
  if (statuses.length > 0) {
    dynamicConfigs.push({
      label: "Estatus",
      key: "status",
      type: "multiple",
      options: statuses.map(s => ({
        label: s.charAt(0).toUpperCase() + s.slice(1),
        value: s
      }))
    });
  }

  const locations = Array.from(new Set(records.map(r => r.rawData?.ubicacion))).filter(Boolean);
  if (locations.length > 0) {
    dynamicConfigs.push({
      label: "Ubicación",
      key: "ubicacion",
      type: "multiple",
      options: locations.map(l => ({ label: String(l), value: String(l) }))
    });
  }

  const perfiles = Array.from(new Set(records.map(r => r.rawData?.perfil_visita))).filter(Boolean);
  if (perfiles.length > 0) {
    dynamicConfigs.push({
      label: "Perfil",
      key: "perfil_visita",
      type: "multiple",
      options: perfiles.map(p => ({ label: String(p), value: String(p) }))
    });
  }

  const visitas = Array.from(new Set(records.map(r => {
    const visita = r.rawData?.visita_a;
    return Array.isArray(visita) ? visita[0]?.nombre : "";
  }))).filter(Boolean);
  
  if (visitas.length > 0) {
    dynamicConfigs.push({
      label: "Visita a",
      key: "visita_a",
      type: "multiselect",
      options: visitas.map(v => ({ label: String(v), value: String(v) }))
    });
  }

  return dynamicConfigs;
}