import { useState, useMemo } from "react";
import type { PhotoRecord } from "@/types/bitacoras";
import { FilterState } from "@/types/bitacoras";

export const usePhotoListView = (
  records: PhotoRecord[],
  externalFilters?: FilterState,
  onExternalFiltersChange?: (filters: FilterState) => void,
) => {
  const [internalFilters, setInternalFilters] = useState<FilterState>({
    dynamic: {},
  });

  const filters = externalFilters || internalFilters;
  const setFilters = onExternalFiltersChange || setInternalFilters;

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // 1. Filtros dinámicos (Categorías, Ubicaciones, etc)
      const dynamicEntries = Object.entries(filters.dynamic || {});

      return dynamicEntries.every(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;

        // Intentar obtener el valor del registro de múltiples fuentes
        let recordValue =
          record.rawData?.[key] || record[key as keyof PhotoRecord];

        // Manejo especial para objetos
        if (key === "visita_a" && Array.isArray(recordValue)) {
          recordValue = recordValue[0]?.nombre || "";
        }

        // Si el valor del filtro es un array (MultiSelect), verificar inclusión insensitiva a mayúsculas
        if (Array.isArray(value)) {
          return value.some(
            (v) =>
              String(v).toLowerCase() === String(recordValue).toLowerCase(),
          );
        }

        return (
          String(recordValue).toLowerCase() === String(value).toLowerCase()
        );
      });
    });
  }, [records, filters]);

  const activeFiltersCount = Object.values(filters.dynamic || {}).reduce(
    (acc: number, curr) => {
      if (Array.isArray(curr)) return acc + curr.length;
      return acc + (curr ? 1 : 0);
    },
    0,
  );

  return { filters, setFilters, filteredRecords, activeFiltersCount };
};
