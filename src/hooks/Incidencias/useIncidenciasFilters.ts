"use client";

import { useState, useMemo } from "react";
import { useFilters } from "../bitacora/useFilters";
import { getIncidenciasFilters } from "@/services/endpoints";
import { dateToString } from "@/lib/utils";

export type IncidenciasExternalFilters = {
  dynamic: Record<string, any>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
};

// Los filtros del panel ya no se aplican en cliente: la página los manda al
// back como facets (useFacetSection).
export function useIncidenciasFilters() {
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { filters: filtersConfig, loadingFilters } = useFilters({
    key: "incidencias-filters",
    endpoint: getIncidenciasFilters,
  });

  const dynamicFiltersArray = useMemo(() => {
    return Object.entries(dynamicFilters)
      .filter(([, value]) =>
        value !== undefined && value !== null && value !== "" &&
        (!Array.isArray(value) || value.length > 0),
      )
      .map(([key, value]) => ({ key, value }));
  }, [dynamicFilters]);

  const dates = useMemo(() => {
    if (date1 && date2) {
      return [dateToString(new Date(date1)), dateToString(new Date(date2))];
    }
    return [];
  }, [date1, date2]);

  const externalFilters = useMemo(() => ({
    dynamic: dynamicFilters,
    dateFilter,
    date1,
    date2,
  }), [dynamicFilters, dateFilter, date1, date2]);

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


  const onExternalFiltersChange = (newFilters: any) => {
    console.log("newFilters:", newFilters); 
    if (
      !newFilters.dynamic ||
      (Object.keys(newFilters.dynamic).length === 0 && newFilters.dateFilter === "")
    ) {
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
    dynamicFilters,
    dynamicFiltersArray,
    dates,
    dateFilter,
    date1,
    date2,
  };
}