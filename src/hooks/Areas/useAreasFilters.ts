"use client";

import { useCallback, useMemo, useState } from "react";
import { useFilters } from "@/hooks/bitacora/useFilters";
import { getAreasFilters } from "@/services/endpoints";

export type AreasExternalFilters = {
  dynamic: Record<string, any>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
};

const DEFAULT_DYNAMIC_FILTERS = { estado: ["activa"] };

export function useAreasFilters(initialDynamic: Record<string, any> = {}) {
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({
    ...DEFAULT_DYNAMIC_FILTERS,
    ...initialDynamic,
  });
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { filters: filtersConfig, loadingFilters } = useFilters({
    key: "areas-filters",
    endpoint: getAreasFilters,
  });

  const externalFilters: AreasExternalFilters = useMemo(
    () => ({ dynamic: dynamicFilters, dateFilter: "", date1: "", date2: "" }),
    [dynamicFilters],
  );

  const onExternalFiltersChange = useCallback((newFilters: AreasExternalFilters) => {
    if (newFilters.dynamic !== undefined) setDynamicFilters(newFilters.dynamic);
  }, []);

  const activeFiltersCount = useMemo(() => {
    return Object.values(dynamicFilters || {}).reduce((acc: number, v) => {
      if (Array.isArray(v)) return acc + (v.length > 0 ? 1 : 0);
      return acc + (v ? 1 : 0);
    }, 0);
  }, [dynamicFilters]);

  // Shape {key, value}[] que consume el backend (mismo patrón que
  // useBitacoraFilters.dynamicFiltersArray -> list_bitacora).
  const dynamicFiltersArray = useMemo(() => {
    return Object.entries(dynamicFilters)
      .filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== "" &&
          (!Array.isArray(value) || value.length > 0),
      )
      .map(([key, value]) => ({ key, value }));
  }, [dynamicFilters]);

  return {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
    dynamicFiltersArray,
    searchTags,
    setSearchTags,
    isSidebarOpen,
    setIsSidebarOpen,
    filtersConfig,
    loadingFilters,
  };
}
