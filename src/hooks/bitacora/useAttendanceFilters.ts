"use client";

import { useState, useCallback, useMemo } from "react";
import { FilterConfig } from "@/types/bitacoras";

export type AttendanceExternalFilters = {
  dynamic: Record<string, any>;
};

const initialFilters: AttendanceExternalFilters = {
  dynamic: {},
};

export const ATTENDANCE_FILTERS_CONFIG: FilterConfig[] = [
  {
    defaultDisplayOpen: true,
    key: "attendance_status",
    label: "Estatus",
    type: "single",
    options: [
      { label: "Asistencia",        value: "Asistencia" },
      { label: "Retardo",           value: "Retardo" },
      { label: "Falta",             value: "Falta" },
      { label: "Falta por retardo", value: "Falta por retardo" },
      { label: "Sin Asistencia",    value: "" },
    ],
  },
];

export function applyAttendanceFilters(
  data: any[],
  filters: AttendanceExternalFilters
): any[] {
  if (!data?.length) return [];

  const dynamic = filters.dynamic || {};
  const hasActive = Object.values(dynamic).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== ""
  );
  if (!hasActive) return data;

  return data.filter((item) => {
    if (dynamic.attendance_status !== undefined && dynamic.attendance_status !== null) {
      const itemStatus = item.attendance_status || "";
      if (itemStatus !== dynamic.attendance_status) return false;
    }
    return true;
  });
}

export function useAttendanceFilters() {
  const [externalFilters, setExternalFilters] =
    useState<AttendanceExternalFilters>(initialFilters);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const onExternalFiltersChange = useCallback(
    (newFilters: AttendanceExternalFilters) => {
      if (
        !newFilters.dynamic ||
        Object.keys(newFilters.dynamic).length === 0
      ) {
        setExternalFilters(initialFilters);
        return;
      }
      setExternalFilters(newFilters);
    },
    []
  );

  const activeFiltersCount = useMemo(() => {
    return Object.values(externalFilters.dynamic || {}).filter((v) =>
      Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== ""
    ).length;
  }, [externalFilters]);

  return {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
    filtersConfig: ATTENDANCE_FILTERS_CONFIG,
    searchTags,
    setSearchTags,
    isSidebarOpen,
    setIsSidebarOpen,
  };
}