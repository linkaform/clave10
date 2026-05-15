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

export function applyIncidenciasFilters(
  data: any[],
  filters: IncidenciasExternalFilters
): any[] {
  if (!data?.length) return [];
  if (!filters) return data;

  const dynamic = filters.dynamic || {};
  const dateFilter = filters.dateFilter || "";
  const date1 = filters.date1;
  const date2 = filters.date2;

  const normalize = (text: any) =>
    String(text ?? "").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/_/g, " ").trim();

  const hasActiveFilters =
    Object.values(dynamic).some((v) => Array.isArray(v) ? v.length > 0 : Boolean(v)) ||
    (dateFilter && dateFilter !== "");

  if (!hasActiveFilters) return data;


  return data.filter((item) => {

    if (dynamic.estatus_incidencia) {
      const estatusFilter = Array.isArray(dynamic.estatus_incidencia) 
        ? dynamic.estatus_incidencia 
        : [dynamic.estatus_incidencia];
      const itemEstatus = normalize(item.estatus);
      if (!estatusFilter.some((e: string) => normalize(e) === itemEstatus)) return false;
    }
  
    if (dynamic.prioridad_incidencia) {
      const prioridadFilter = Array.isArray(dynamic.prioridad_incidencia)
        ? dynamic.prioridad_incidencia : [dynamic.prioridad_incidencia];
      const itemPrioridad = normalize(item.prioridad_incidencia);
      if (!prioridadFilter.some((p: string) => normalize(p) === itemPrioridad)) return false;
    }

    if (dynamic.categoria) {
      const categoriaFilter = Array.isArray(dynamic.categoria)
        ? dynamic.categoria : [dynamic.categoria];
      const itemCategoria = normalize(item.categoria);
      if (!categoriaFilter.some((c: string) => normalize(c) === itemCategoria)) return false;
    }

    if (dynamic.ubicacion) {
      const itemUbicacion = normalize(item.ubicacion_incidencia);
      if (Array.isArray(dynamic.ubicacion)) {
        if (dynamic.ubicacion.length > 0) {
          if (!dynamic.ubicacion.some((u: string) => normalize(u) === itemUbicacion)) return false;
        }
      } else if (typeof dynamic.ubicacion === "string" && dynamic.ubicacion !== "") {
        if (normalize(dynamic.ubicacion) !== itemUbicacion) return false;
      }
    }

    // Lugar del incidente
    if (dynamic.area) {
      const areaFilter = Array.isArray(dynamic.area)
        ? dynamic.area : [dynamic.area];
      const itemArea = normalize(item.area_incidencia);
      if (!areaFilter.some((a: string) => normalize(a) === itemArea)) return false;
    }

    // Incidente
    if (dynamic.tipo_incidencia) {
      const incidenciaFilter = Array.isArray(dynamic.incidencia)
        ? dynamic.tipo_incidencia : [dynamic.tipo_incidencia];
      const itemIncidencia = normalize(item.incidencia);
      if (!incidenciaFilter.some((i: string) => normalize(i) === itemIncidencia)) return false;
    }

    // Subcategoría
    if (dynamic.sub_categoria) {
      const subFilter = Array.isArray(dynamic.sub_categoria)
        ? dynamic.sub_categoria : [dynamic.sub_categoria];
      const itemSub = normalize(item.sub_categoria);
      if (!subFilter.some((s: string) => normalize(s) === itemSub)) return false;
    }

    // Reporta
    if (dynamic.reportado_por) {
      const reportaFilter = Array.isArray(dynamic.reportado_por)
        ? dynamic.reportado_por : [dynamic.reportado_por];
      const itemReporta = normalize(item.reporta_incidencia);
      if (!reportaFilter.some((r: string) => normalize(r) === itemReporta)) return false;
    }

    if (dateFilter && dateFilter !== "" && dateFilter !== "all_records") {
      const rawFecha = item.fecha_hora_incidencia;
      if (!rawFecha) return false;
      const itemDate = new Date(rawFecha.replace(" ", "T"));
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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