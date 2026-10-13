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

// Este hook solo guarda el estado del panel. Los filtros "dynamic" se
// manejan como facets del buscador (useFacetSection) y la fecha va en la
// petición; todo se resuelve en el back.
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