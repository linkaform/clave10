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

  const filteredRecords = records;

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters.dynamic || {}).reduce(
      (acc: number, [, value]) => {
        if (Array.isArray(value)) return acc + (value.length > 0 ? 1 : 0);
        return acc + (value ? 1 : 0);
      },
      0,
    );
  }, [filters]);

  return { filters, setFilters, filteredRecords, activeFiltersCount };
};
