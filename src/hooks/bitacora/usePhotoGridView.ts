import { useState, useMemo } from "react";
import type { PhotoRecord } from "@/types/bitacoras";
import { FilterState } from "@/types/bitacoras";

export const usePhotoGridView = (
  records: PhotoRecord[],
  externalFilters?: FilterState,
  onExternalFiltersChange?: (filters: FilterState) => void,
) => {
  const [internalFilters, setInternalFilters] = useState<FilterState>({
    dynamic: {},
    dateFilter: "today",
    date1: "",
    date2: "",
  });

  const filters = externalFilters || internalFilters;
  const setFilters = onExternalFiltersChange || setInternalFilters;

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // 1. Filtros dinámicos (Categorías, Ubicaciones, etc)
      const dynamicEntries = Object.entries(filters.dynamic || {});

      const matchesDynamic = dynamicEntries.every(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;

        // Intentar obtener el valor del registro de múltiples fuentes
        let recordValue =
          record.rawData?.[key] || record[key as keyof PhotoRecord];

        // Manejo especial para objetos (como visita_a que a veces es un array de objetos)
        if (key === "visita_a" && Array.isArray(recordValue)) {
          recordValue = recordValue[0]?.nombre || "";
        }

        // Si el valor del filtro es un array (MultiSelect), verificar inclusión
        if (Array.isArray(value)) {
          return value.some(
            (v) =>
              String(v).toLowerCase() === String(recordValue).toLowerCase(),
          );
        }

        // Comparación simple
        return (
          String(recordValue).toLowerCase() === String(value).toLowerCase()
        );
      });

      if (!matchesDynamic) return false;

      // 2. Filtro de Fecha
      if (filters.dateFilter) {
        const recordDateStr =
          record.rawData?.fecha_entrada || record.rawData?.fecha;
        if (!recordDateStr) return true; // Si no hay fecha, no filtramos por ella

        const recordDate = new Date(recordDateStr);
        const now = new Date();

        // Helper para comparar solo fechas (sin hora)
        const isSameDay = (d1: Date, d2: Date) =>
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate();

        switch (filters.dateFilter) {
          case "today":
            return isSameDay(recordDate, now);
          case "yesterday": {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return isSameDay(recordDate, yesterday);
          }
          case "range": {
            if (filters.date1 && filters.date2) {
              const start = new Date(filters.date1);
              const end = new Date(filters.date2);
              // Normalizar a inicio/fin de día
              start.setHours(0, 0, 0, 0);
              end.setHours(23, 59, 59, 999);
              return recordDate >= start && recordDate <= end;
            }
            return true;
          }
          case "all":
            return true;
          default:
            return true;
        }
      }

      return true;
    });
  }, [records, filters]);

  const activeFiltersCount = Object.values(filters.dynamic || {}).reduce(
    (acc: number, curr) => {
      if (Array.isArray(curr)) return acc + curr.length;
      return acc + (curr ? 1 : 0);
    },
    filters.dateFilter && filters.dateFilter !== "today" ? 1 : 0,
  );

  return { filters, setFilters, filteredRecords, activeFiltersCount };
};
