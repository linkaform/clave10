import { FilterConfig } from "@/types/bitacoras";
import { PhotoRecord } from "@/types/bitacoras";

/**
 * Define qué campos del registro queremos mapear a filtros dinámicos
 */
export interface FilterMapping {
  key: string;
  label: string;
  type: "multiple" | "single" | "multiselect" | "search";
  defaultDisplayOpen?: boolean;
  // Lógica custom para extraer el valor del registro (opcional)
  getValue?: (record: PhotoRecord) => string | string[] | undefined;
}

/**
 * Configuración dinámica para la sección de Bitácoras
 */
export const BITACORA_MAPPINGS: FilterMapping[] = [
  {
    key: "status",
    label: "Estatus",
    type: "multiple",
    defaultDisplayOpen: true,
  },
  {
    key: "perfil_visita",
    label: "Perfil",
    type: "multiple",
  },
  {
    key: "visita_a",
    label: "Visita a",
    type: "multiselect",
    getValue: (r) => {
      const v = r.rawData?.visita_a;
      return Array.isArray(v) ? v[0]?.nombre : "";
    },
  },
];

export const BITACORAS_FILTERS: FilterConfig[] = [
  // Este se mantiene como base estática si es necesario
];

/**
 * Genera una configuración de filtros dinámica basada en mappings
 */
export function generateFiltersConfig(
  records: PhotoRecord[],
  mappings: FilterMapping[] = BITACORA_MAPPINGS,
): FilterConfig[] {
  const dynamicConfigs: FilterConfig[] = [];

  // Generar filtros basados en los mappings proporcionados
  mappings.forEach((mapping) => {
    // Extraer valores únicos basándose en la key o la función getValue
    const uniqueValues = Array.from(
      new Set(
        records.map((r) => {
          if (mapping.getValue) return mapping.getValue(r);
          return r.rawData?.[mapping.key] || (r as any)[mapping.key];
        }),
      ),
    )
      .flat() // Por si hay arrays
      .filter(Boolean) as string[];

    if (uniqueValues.length > 0) {
      dynamicConfigs.push({
        key: mapping.key,
        label: mapping.label,
        type: mapping.type,
        defaultDisplayOpen: mapping.defaultDisplayOpen,
        options: uniqueValues.map((val) => ({
          label: val.charAt(0).toUpperCase() + val.slice(1),
          value: val,
        })),
      });
    }
  });

  return dynamicConfigs;
}
