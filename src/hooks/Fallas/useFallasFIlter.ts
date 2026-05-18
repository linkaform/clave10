"use client";

import { useState, useMemo } from "react";
import { getFallasFilters } from "@/services/endpoints";
import { useFilters } from "../bitacora/useFilters";
import { normalizeText } from "@/lib/utils";

export type FallasExternalFilters = {
  dynamic: Record<string, any>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
};


export function applyFallasFilters(
  data: any[],
  filters: FallasExternalFilters
): any[] {
  if (!data?.length) return [];

  const dynamic = filters.dynamic || {};
  const dateFilter = filters.dateFilter || "";
  const date1 = filters.date1;
  const date2 = filters.date2;

  return data.filter((item) => {
    // Filtro por estatus
    if (dynamic.estatus_falla) {
      const estatusFilter = Array.isArray(dynamic.estatus_falla) ? dynamic.estatus_falla : [dynamic.estatus_falla];
      const itemEstatus = normalizeText(item.falla_estatus);
      if (!estatusFilter.some((e: string) => normalizeText(e) === itemEstatus)) return false;
    }
    // Filtro por ubicación
    if (dynamic.ubicacion) {
      const itemUbicacion = (item.falla_ubicacion || "").toLowerCase();
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
    
    if (dynamic.reportado_por) {
      const reportaFilter = Array.isArray(dynamic.reportado_por) ? dynamic.reportado_por : [dynamic.reportado_por];
      const itemReporta = normalizeText(item.falla_reporta_nombre);
      if (!reportaFilter.some((r: string) => normalizeText(r) === itemReporta)) return false;
    }

    if (dynamic.area) {
      const areaFilter = Array.isArray(dynamic.area) ? dynamic.area : [dynamic.area];
      const itemArea = normalizeText(item.falla_caseta);
      if (!areaFilter.some((a: string) => normalizeText(a) === itemArea)) return false;
    }
    
    if (dynamic.tipo_falla) {
      const tipoFilter = Array.isArray(dynamic.tipo_falla) ? dynamic.tipo_falla : [dynamic.tipo_falla];
      const itemTipo = normalizeText(item.falla);
      if (!tipoFilter.some((t: string) => normalizeText(t) === itemTipo)) return false;
    }

    // Filtro por fecha usando falla_fecha_hora
    if (dateFilter && dateFilter !== "" && dateFilter !== "all_records") {
      const rawFecha = item.falla_fecha_hora;
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

export function useFallasFilters() {
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { filters: filtersConfig, loadingFilters } = useFilters({
    key: "fallas-filters",
    endpoint: getFallasFilters,
  });

  const externalFilters = useMemo(() => ({
    dynamic: dynamicFilters,
    dateFilter,
    date1,
    date2,
  }), [dynamicFilters, dateFilter, date1, date2]);

  const onExternalFiltersChange = (newFilters: any) => {
    const dynamicVacio = !newFilters.dynamic ||
      Object.values(newFilters.dynamic).every(
        (v) => Array.isArray(v) ? v.length === 0 : !v
      );

    if (dynamicVacio && !newFilters.dateFilter) {
      setDynamicFilters({});
      setDateFilter("");
      setDate1("");
      setDate2("");
      return;
    }

    if (newFilters.dateFilter !== undefined) setDateFilter(newFilters.dateFilter);
    if (newFilters.date1 !== undefined) setDate1(newFilters.date1);
    if (newFilters.date2 !== undefined) setDate2(newFilters.date2);
    if (newFilters.dynamic !== undefined) setDynamicFilters(newFilters.dynamic);
  };

  const activeFiltersCount = useMemo(() => {
    const dynamicCount = Object.entries(dynamicFilters)
      .filter(([key]) => key !== "ubicacion")
      .map(([, v]) => v).flat().filter(Boolean).length;

    const ubicacionCount = Array.isArray(dynamicFilters?.ubicacion)
      ? dynamicFilters.ubicacion.length
      : dynamicFilters?.ubicacion ? 1 : 0;

    const dateCount = dateFilter && dateFilter !== "" ? 1 : 0;

    return dynamicCount + ubicacionCount + dateCount;
  }, [dynamicFilters, dateFilter]);

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