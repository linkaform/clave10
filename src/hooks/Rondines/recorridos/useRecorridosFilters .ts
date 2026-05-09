"use client";

import { useState, useCallback, useMemo } from "react";
import { useFilters } from "../../bitacora/useFilters";
import { getRecorridosFilters } from "@/services/endpoints";

export type RecorridosExternalFilters = {
  dynamic: Record<string, any>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
};

const initialFilters: RecorridosExternalFilters = {
  dynamic: {},
  dateFilter: "",
  date1: "",
  date2: "",
};

// Filtra el array raw antes de formatear — case-insensitive en todos los campos
export function applyRecorridosFilters(
  data: any[],
  filters: RecorridosExternalFilters
): any[] {
  if (!data?.length) return [];

  const dynamic = filters.dynamic || {};
  const dateFilter = filters.dateFilter || "";
  const date1 = filters.date1;
  const date2 = filters.date2;

  const hasActiveFilters =
    Object.values(dynamic).some((v) => Array.isArray(v) ? v.length > 0 : Boolean(v)) ||
    (dateFilter && dateFilter !== "");

  if (!hasActiveFilters) return data;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return data.filter((item) => {
    // Filtro por estatus
    if (dynamic.estatus_recorrido) {
      const itemEstatus = item.estatus_recorrido?.toLowerCase() || "";
      if (itemEstatus !== dynamic.estatus_recorrido.toLowerCase()) return false;
    }

    // Filtro por tipo
    if (dynamic.tipo_rondin) {
      const itemTipo = item.tipo_rondin?.toLowerCase() || "";
      if (itemTipo !== dynamic.tipo_rondin.toLowerCase()) return false;
    }

    // Filtro por recurrencia
    if (dynamic.recurrencia) {
      const normalize = (text: string) =>
        text
          ?.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") 
          .replace(/\s+/g, "_"); 

      const recurrencias = Array.isArray(item.sucede_recurrencia)
        ? item.sucede_recurrencia.map((r: string) => normalize(r))
        : [];

      const filtro = normalize(dynamic.recurrencia);

      if (!recurrencias.includes(filtro)) {
        return false;
      }
    }
    // Filtro por ubicación
    if (dynamic.ubicacion) {
      const itemUbicacion = (item.ubicacion || "").toLowerCase();
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
    if (dynamic.asignado_a) {
      const itemAsignado = (item.asignado_a || "").toLowerCase();
      if (Array.isArray(dynamic.asignado_a)) {
        if (dynamic.asignado_a.length > 0) {
          const match = dynamic.asignado_a.some(
            (a: string) => a.toLowerCase() === itemAsignado
          );
          if (!match) return false;
        }
      } else if (typeof dynamic.asignado_a === "string" && dynamic.asignado_a !== "") {
        if (itemAsignado !== dynamic.asignado_a.toLowerCase()) return false;
      }
    }
    
    // Filtro por area
    if (dynamic.area) {
      const itemAreas = Array.isArray(item.areas_name)
        ? item.areas_name.map((a: string) => a.toLowerCase())
        : [];
    
      if (Array.isArray(dynamic.area)) {
        if (dynamic.area.length > 0) {
          const match = dynamic.area.some((a: string) =>
            itemAreas.includes(a.toLowerCase())
          );
    
          if (!match) return false;
        }
      } else if (typeof dynamic.area === "string" && dynamic.area !== "") {
        if (!itemAreas.includes(dynamic.area.toLowerCase())) {
          return false;
        }
      }
    }
    // Filtro por fecha usando fecha_inicio_rondin
    if (dateFilter && dateFilter !== "" && dateFilter !== "all_records") {
      const rawFecha = item.fecha_inicio_rondin;
      if (!rawFecha) return false;
      const itemDate = new Date(rawFecha.replace(" ", "T"));

      if (dateFilter === "today") {
        if (itemDate < startOfToday || itemDate >= new Date(startOfToday.getTime() + 86400000))
          return false;

      } else if (dateFilter === "yesterday") {
        const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
        const endOfYesterday = startOfToday;
        if (itemDate < startOfYesterday || itemDate >= endOfYesterday) return false;

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

export function useRecorridosFilters() {
  const [externalFilters, setExternalFilters] =
    useState<RecorridosExternalFilters>(initialFilters);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { filters: filtersConfig, loadingFilters } = useFilters({
    key: "recorridos-filters",
    endpoint: getRecorridosFilters,
  });

  const onExternalFiltersChange = useCallback(
    (newFilters: RecorridosExternalFilters) => {
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