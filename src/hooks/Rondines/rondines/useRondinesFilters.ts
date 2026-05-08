"use client";

import { useState, useCallback, useMemo } from "react";
import { useFilters } from "../../bitacora/useFilters";
import { getRondinesFilters } from "@/services/endpoints";

export type RondinesExternalFilters = {
  dynamic: Record<string, any>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
};

const initialFilters: RondinesExternalFilters = {
  dynamic: {},
  dateFilter: "",
  date1: "",
  date2: "",
};

// Filtra el array raw antes de formatear — case-insensitive en todos los campos
export function applyRondinesFilters(
  data: any[],
  filters: RondinesExternalFilters
): any[] {
  if (!data?.length) return [];
  console.log("ITEMM" , data, filters)
  const dynamic = filters.dynamic || {};
  const dateFilter = filters.dateFilter || "";
  const date1 = filters.date1;
  const date2 = filters.date2;

  const hasActiveFilters =
    Object.values(dynamic).some((v) => Array.isArray(v) ? v.length > 0 : Boolean(v)) ||
    (dateFilter && dateFilter !== "");

  if (!hasActiveFilters) return data;

  const normalize = (text: string) =>
    text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/_/g, " ").replace(/\s+/g, " ").trim() || "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return data.filter((item) => {
    console.log("ITEMM" , item)
    if (dynamic.estatus_rondin) {
      console.log("HELLO")
      if (normalize(item.estatus_recorrido || "") !== normalize(dynamic.estatus_rondin)) return false;
    }

    if (dynamic.incidencias) {
      const tieneIncidencias = Array.isArray(item.incidencias) && item.incidencias.length > 0;
      if (dynamic.incidencias === "Si" && !tieneIncidencias) return false;
      if (dynamic.incidencias === "No" && tieneIncidencias) return false;
    }

    if (Array.isArray(dynamic.asignado_a) && dynamic.asignado_a.length > 0) {
      const itemAsignado = normalize(item.asignado_a || "");
      const match = dynamic.asignado_a.some((a: string) => normalize(a) === itemAsignado);
      if (!match) return false;
    }

    if (Array.isArray(dynamic.area) && dynamic.area.length > 0) {
      const itemAreas = (item.areas || []).map((a: any) =>
        normalize(a.area || a.detalle?.area || "")
      );
      const match = dynamic.area.some((a: string) => itemAreas.includes(normalize(a)));
      if (!match) return false;
    }

    if (dateFilter && dateFilter !== "" && dateFilter !== "all_records") {
      const rawFecha = item.fecha_hora_inicio || item.fecha_hora_programada_inicio;
      if (!rawFecha) return false;
      const itemDate = new Date(rawFecha.replace(" ", "T"));

      if (dateFilter === "today") {
        if (itemDate < startOfToday || itemDate >= new Date(startOfToday.getTime() + 86400000)) return false;
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

export function useRondinesFilters() {
  const [externalFilters, setExternalFilters] =
    useState<RondinesExternalFilters>(initialFilters);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { filters: filtersConfig, loadingFilters } = useFilters({
    key: "rondines-filters",
    endpoint: getRondinesFilters,
  });

  const onExternalFiltersChange = useCallback(
    (newFilters: RondinesExternalFilters) => {
      if (
        !newFilters.dynamic ||
        (Object.keys(newFilters.dynamic).length === 0 &&
          newFilters.dateFilter === "")
      ) {
        console.log("FILTROS RECIBIDOS:", newFilters)
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