"use client";

import { useState, useCallback, useMemo } from "react";
import { useFilters } from "./useFilters";
import { getBitacoraFilters } from "@/services/endpoints";

export type IncidenciasExternalFilters = {
  dynamic: Record<string, any>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
};

const initialFilters: IncidenciasExternalFilters = {
  dynamic: {},
  dateFilter: "",
  date1: "",
  date2: "",
};

export function applyIncidenciasFilters(
  data: any[],
  filters: IncidenciasExternalFilters
): any[] {
  if (!data?.length) return [];

  const dynamic = filters.dynamic || {};
  const dateFilter = filters.dateFilter || "";
  const date1 = filters.date1;
  const date2 = filters.date2;

  return data.filter((item) => {
    // Filtro por estatus
    if (dynamic.estatus) {
      const itemEstatus = item.estatus?.toLowerCase() || "";
      if (itemEstatus !== dynamic.estatus.toLowerCase()) return false;
    }

    // Filtro por prioridad
    if (dynamic.prioridad_incidencia) {
      const itemPrioridad = item.prioridad_incidencia?.toLowerCase() || "";
      if (itemPrioridad !== dynamic.prioridad_incidencia.toLowerCase()) return false;
    }

    // Filtro por categoría
    if (dynamic.categoria) {
      if (item.categoria !== dynamic.categoria) return false;
    }

    // Filtro por ubicación
    if (dynamic.ubicacion) {
      const itemUbicacion = (item.ubicacion_incidencia || "").toLowerCase();
      if (Array.isArray(dynamic.ubicacion)) {
        if (dynamic.ubicacion.length > 0) {
          const match = dynamic.ubicacion.some(
            (u: string) => u.toLowerCase() === itemUbicacion
          );
          if (!match) return false;
        }
      } else if (typeof dynamic.ubicacion === "string" && dynamic.ubicacion !== "") {
        if (itemUbicacion !== dynamic.ubicacion.toLowerCase()) return false;
      }
    }

    // Filtro por fecha usando fecha_hora_incidencia
    if (dateFilter && dateFilter !== "" && dateFilter !== "all_records") {
      const rawFecha = item.fecha_hora_incidencia;
      if (!rawFecha) return false;
      const itemDate = new Date(rawFecha.replace(" ", "T"));
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      if (dateFilter === "today") {
        if (itemDate < startOfToday || itemDate >= new Date(startOfToday.getTime() + 86400000))
          return false;
      } else if (dateFilter === "yesterday") {
        const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
        if (itemDate < startOfYesterday || itemDate >= startOfToday) return false;
      } else if (dateFilter === "this_week") {
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        if (itemDate < startOfWeek || itemDate > now) return false;
      } else if (dateFilter === "last_week") {
        const startOfThisWeek = new Date(startOfToday);
        startOfThisWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 86400000);
        if (itemDate < startOfLastWeek || itemDate >= startOfThisWeek) return false;
      } else if (dateFilter === "last_fifteen_days") {
        const fifteenDaysAgo = new Date(now.getTime() - 15 * 86400000);
        if (itemDate < fifteenDaysAgo || itemDate > now) return false;
      } else if (dateFilter === "this_month") {
        if (itemDate < startOfMonth || itemDate > now) return false;
      } else if (dateFilter === "last_month") {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (itemDate < startOfLastMonth || itemDate >= endOfLastMonth) return false;
      } else if (dateFilter === "this_year") {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        if (itemDate < startOfYear || itemDate > now) return false;
      } else if (dateFilter === "range" && date1 && date2) {
        const from = new Date(date1);
        const to = new Date(date2);
        to.setHours(23, 59, 59, 999);
        if (itemDate < from || itemDate > to) return false;
      }
    }

    return true;
  });
}

export function useIncidenciasFilters() {
  const [externalFilters, setExternalFilters] =
    useState<IncidenciasExternalFilters>(initialFilters);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { filters: filtersConfig, loadingFilters } = useFilters({
    key: "incidencias-filters",
    endpoint: getBitacoraFilters,
  });

  const onExternalFiltersChange = useCallback(
    (newFilters: IncidenciasExternalFilters) => {
      if (
        !newFilters.dynamic ||
        (Object.keys(newFilters.dynamic).length === 0 &&
          newFilters.dateFilter === "")
      ) {
        setExternalFilters(initialFilters);
        return;
      }
      setExternalFilters(newFilters);
    },
    []
  );

  const activeFiltersCount = useMemo(() => {
    const dynamicCount = Object.entries(externalFilters.dynamic || {})
      .filter(([key]) => key !== "ubicacion")
      .map(([, v]) => v)
      .flat()
      .filter(Boolean).length;

    const ubicacionCount = Array.isArray(externalFilters.dynamic?.ubicacion)
      ? externalFilters.dynamic.ubicacion.length
      : externalFilters.dynamic?.ubicacion ? 1 : 0;

    const dateCount =
      externalFilters.dateFilter && externalFilters.dateFilter !== "" ? 1 : 0;

    return dynamicCount + ubicacionCount + dateCount;
  }, [externalFilters]);

  return {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
    filtersConfig,
    loadingFilters,
    searchTags,
    setSearchTags,
    isSidebarOpen,
    setIsSidebarOpen,
  };
}