"use client";

import { getPerdidosFilters } from "@/services/endpoints";
import { useState, useCallback, useMemo } from "react";
import { useFilters } from "../bitacora/useFilters";

export type ArticulosPerdidosExternalFilters = {
  dynamic: Record<string, any>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
};

export function applyArticulosPerdidosFilters(data: any[], filters: ArticulosPerdidosExternalFilters): any[] {
  if (!data?.length) return [];

  const dynamic = filters.dynamic || {};
  const dateFilter = filters.dateFilter || "";
  const date1 = filters.date1;
  const date2 = filters.date2;

  const hasActiveFilters =
    Object.values(dynamic).some((v) => Array.isArray(v) ? v.length > 0 : Boolean(v)) ||
    (dateFilter && dateFilter !== "");

  if (!hasActiveFilters) return data;

  const normalize = (text: any) =>
    String(text ?? "").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/_/g, " ").trim();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return data.filter((item) => {

    if (dynamic.estatus_p) {
      const filter = Array.isArray(dynamic.estatus_p) ? dynamic.estatus_p : [dynamic.estatus_p];
      if (!filter.some((f: string) => normalize(f) === normalize(item.estatus_perdido || ""))) return false;
    }
  
    if (dynamic.categoria) {
      const filter = Array.isArray(dynamic.categoria) ? dynamic.categoria : [dynamic.categoria];
      if (!filter.some((f: string) => normalize(f) === normalize(item.tipo_articulo_perdido || ""))) return false;
    }
  
    if (dynamic.articulo) {
      const filter = Array.isArray(dynamic.articulo) ? dynamic.articulo : [dynamic.articulo];
      if (!filter.some((f: string) => normalize(f) === normalize(item.articulo_seleccion || ""))) return false;
    }
  
    if (dynamic.color) {
      const filter = Array.isArray(dynamic.color) ? dynamic.color : [dynamic.color];
      if (!filter.some((f: string) => normalize(f) === normalize(item.color_perdido || ""))) return false;
    }
  
    if (dynamic.area_paqueteria) {
      const filter = Array.isArray(dynamic.area_paqueteria) ? dynamic.area_paqueteria : [dynamic.area_paqueteria];
      if (!filter.some((f: string) => normalize(f) === normalize(item.area_perdido || ""))) return false;
    }
    if (dateFilter && dateFilter !== "" && dateFilter !== "all_records") {
      const rawFecha = item.date_hallazgo_perdido;
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

// @/hooks/Articulos/usePaqueteriaFilters.ts
export function usePerdidosFilters() {
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
    const [date1, setDate1] = useState<Date | "">("");
    const [date2, setDate2] = useState<Date | "">("");
    const [dateFilter, setDateFilter] = useState<string>("");
    const [searchTags, setSearchTags] = useState<string[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
    const { filters: filtersConfig, loadingFilters } = useFilters({
      key: "perdidos",
      endpoint: getPerdidosFilters,
    });
  
    const externalFilters = useMemo(() => ({
      dynamic: dynamicFilters, dateFilter, date1, date2,
    }), [dynamicFilters, dateFilter, date1, date2]);
  
    const onExternalFiltersChange = useCallback((newFilters: any) => {
      const dynamicVacio = !newFilters.dynamic ||
        Object.values(newFilters.dynamic).every(
          (v) => Array.isArray(v) ? v.length === 0 : !v
        );
      if (dynamicVacio && !newFilters.dateFilter) {
        setDynamicFilters({}); setDateFilter(""); setDate1(""); setDate2(""); return;
      }
      if (newFilters.dateFilter !== undefined) setDateFilter(newFilters.dateFilter);
      if (newFilters.date1 !== undefined) setDate1(newFilters.date1);
      if (newFilters.date2 !== undefined) setDate2(newFilters.date2);
      if (newFilters.dynamic !== undefined) setDynamicFilters(newFilters.dynamic);
    }, []);
  
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
      externalFilters, onExternalFiltersChange, activeFiltersCount,
      filtersConfig, loadingFilters, searchTags, setSearchTags,
      isSidebarOpen, setIsSidebarOpen,
    };
  }