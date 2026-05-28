"use client";
import { useState, useMemo, useCallback } from "react";
import { useFilters } from "../bitacora/useFilters";
import { getNotasFilters } from "@/services/endpoints";

export function applyNotasFilters(data: any[], externalFilters: any) {
  if (!data?.length) return [];
  const { dynamic, dateFilter, date1, date2 } = externalFilters;

  const normalize = (text: any) =>
    String(text ?? "").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").trim();

  return data.filter((item) => {

    if (dynamic?.estatus?.length > 0) {
      const filter = Array.isArray(dynamic.estatus) ? dynamic.estatus : [dynamic.estatus];
      if (!filter.some((f: string) => normalize(f) === normalize(item.note_status || ""))) return false;
    }

    if (dynamic?.creador_por?.length > 0) {
      const filter = Array.isArray(dynamic.creador_por) ? dynamic.creador_por : [dynamic.creador_por];
      if (!filter.some((f: string) => normalize(f) === normalize(item.created_by_name || ""))) return false;
    }

    if (dateFilter && date1) {
      const fecha = new Date(item[dateFilter]);
      const d1 = new Date(date1);
      const d2 = date2 ? new Date(date2) : null;
      if (d2) {
        if (fecha < d1 || fecha > d2) return false;
      } else {
        if (fecha < d1) return false;
      }
    }

    return true;
  });
}

export function useNotasFilters() {
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { filters: filtersConfig, loadingFilters } = useFilters({
    key: "notas",
    endpoint: getNotasFilters,
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
    const dynamicCount = Object.values(dynamicFilters).flat().filter(Boolean).length;
    const dateCount = dateFilter && dateFilter !== "" ? 1 : 0;
    return dynamicCount + dateCount;
  }, [dynamicFilters, dateFilter]);

  return {
    externalFilters, onExternalFiltersChange, activeFiltersCount,
    filtersConfig, loadingFilters, searchTags, setSearchTags,
    isSidebarOpen, setIsSidebarOpen,
  };
}