"use client";

import { useCallback, useMemo, useState } from "react";
import { useFilters } from "@/hooks/bitacora/useFilters";
import { getUbicacionesFilters } from "@/services/endpoints";

export type UbicacionesExternalFilters = {
  dynamic: Record<string, any>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
};

// Igual que useAreasFilters: la config viene del back (filters_sdk.py,
// option "ubicaciones") y los filtros elegidos se mandan en la petición de
// get_catalog_ubicaciones_formatted como dynamic_filters.
export function useUbicacionesFilters() {
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { filters: filtersConfig, loadingFilters } = useFilters({
    key: "ubicaciones-filters",
    endpoint: getUbicacionesFilters,
  });

  const externalFilters: UbicacionesExternalFilters = useMemo(
    () => ({ dynamic: dynamicFilters, dateFilter: "", date1: "", date2: "" }),
    [dynamicFilters],
  );

  const onExternalFiltersChange = useCallback((newFilters: UbicacionesExternalFilters) => {
    if (newFilters.dynamic !== undefined) setDynamicFilters(newFilters.dynamic);
  }, []);

  const activeFiltersCount = useMemo(() => {
    return Object.values(dynamicFilters || {}).reduce((acc: number, v) => {
      if (Array.isArray(v)) return acc + (v.length > 0 ? 1 : 0);
      return acc + (v ? 1 : 0);
    }, 0);
  }, [dynamicFilters]);

  // Shape {key, value}[] que consume el backend.
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
    isSidebarOpen,
    setIsSidebarOpen,
    filtersConfig,
    loadingFilters,
  };
}
