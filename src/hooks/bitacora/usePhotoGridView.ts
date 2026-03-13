import { useState, useMemo } from "react";
import type { PhotoRecord } from "@/types/bitacoras";
import { FilterState } from "@/types/bitacoras";

export const usePhotoGridView = (records: PhotoRecord[]) => {
  const [filters, setFilters] = useState<FilterState>({ dynamic: {} });

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      return Object.entries(filters.dynamic || {}).every(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;

        let recordValue = record.rawData?.[key] || record[key as keyof PhotoRecord];

        if (key === "visita_a" && Array.isArray(recordValue)) {
          recordValue = recordValue[0]?.nombre || "";
        }

        if (Array.isArray(value)) return value.includes(String(recordValue));
        return String(recordValue) === String(value);
      });
    });
  }, [records, filters]);

  const activeFiltersCount = Object.values(filters.dynamic || {}).reduce(
    (acc: number, curr) => {
      if (Array.isArray(curr)) return acc + curr.length;
      return acc + (curr ? 1 : 0);
    },
    0
  );

  return { filters, setFilters, filteredRecords, activeFiltersCount };
};