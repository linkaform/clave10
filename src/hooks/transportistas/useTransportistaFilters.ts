"use client";

import { useState, useMemo } from "react";
import { useFilters } from "../bitacora/useFilters";
import { getTransportistaFilters } from "@/services/endpoints";
import { FilterConfig } from "@/types/bitacoras";

// Filtros estáticos usados como fallback mientras el backend no tiene la option lista
const STATIC_FILTERS_CONFIG: FilterConfig[] = [
  {
    key: "estatus",
    label: "Estatus",
    type: "multiple",
    options: [
      { label: "Programado",       value: "programado" },
      { label: "Arribo",           value: "arribo" },
      { label: "Insp. entrada",    value: "inspeccion_entrada" },
      { label: "Carga / Descarga", value: "carga_/_descarga" },
      { label: "Insp. salida",     value: "inspeccion_salida" },
      { label: "Terminado",        value: "terminado" },
    ],
  },
  {
    key: "tipo_de_operacion",
    label: "Operación",
    type: "multiple",
    options: [
      { label: "Entrega",      value: "entrega" },
      { label: "Recolección",  value: "recoleccion" },
    ],
  },
];

export type TransportistaExternalFilters = {
  dynamic: Record<string, any>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
};

export function applyTransportistaFilters(
  data: any[],
  filters: TransportistaExternalFilters
): any[] {
  if (!data?.length) return [];
  if (!filters) return data;

  const dynamic = filters.dynamic || {};
  const dateFilter = filters.dateFilter || "";
  const date1 = filters.date1;
  const date2 = filters.date2;

  const normalize = (text: any) =>
    String(text ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/_/g, " ")
      .trim();

  const hasActiveFilters =
    Object.values(dynamic).some((v) =>
      Array.isArray(v) ? v.length > 0 : Boolean(v)
    ) || (dateFilter && dateFilter !== "");

  if (!hasActiveFilters) return data;

  return data.filter((item) => {
    if (dynamic.estatus) {
      const estatusFilter = Array.isArray(dynamic.estatus)
        ? dynamic.estatus
        : [dynamic.estatus];
      if (!estatusFilter.some((e: string) => normalize(e) === normalize(item.estatus)))
        return false;
    }

    if (dynamic.tipo_de_operacion) {
      const opFilter = Array.isArray(dynamic.tipo_de_operacion)
        ? dynamic.tipo_de_operacion
        : [dynamic.tipo_de_operacion];
      if (!opFilter.some((o: string) => normalize(o) === normalize(item.tipo_de_operacion)))
        return false;
    }

    if (dynamic.proveedor_cliente) {
      const pFilter = Array.isArray(dynamic.proveedor_cliente)
        ? dynamic.proveedor_cliente
        : [dynamic.proveedor_cliente];
      if (!pFilter.some((p: string) => normalize(p) === normalize(item.proveedor_cliente)))
        return false;
    }

    if (dynamic.conductor) {
      const cFilter = Array.isArray(dynamic.conductor)
        ? dynamic.conductor
        : [dynamic.conductor];
      if (!cFilter.some((c: string) => normalize(c) === normalize(item.conductor)))
        return false;
    }

    if (dynamic.material) {
      const mFilter = Array.isArray(dynamic.material)
        ? dynamic.material
        : [dynamic.material];
      if (!mFilter.some((m: string) => normalize(m) === normalize(item.material)))
        return false;
    }

    if (dynamic.anden_asignado) {
      const aFilter = Array.isArray(dynamic.anden_asignado)
        ? dynamic.anden_asignado
        : [dynamic.anden_asignado];
      if (!aFilter.some((a: string) => normalize(a) === normalize(item.anden_asignado)))
        return false;
    }

    if (dateFilter && dateFilter !== "" && dateFilter !== "all_records") {
      const rawFecha = item.fecha_hora_ingreso;
      if (!rawFecha) return false;
      const itemDate = new Date(rawFecha.replace(" ", "T"));
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
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

export function useTransportistaFilters() {
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { filters: apiFiltersConfig, loadingFilters } = useFilters({
    key: "transportistas-bitacora-filters",
    endpoint: getTransportistaFilters,
  });

  // Usa la config del API cuando esté disponible, si no cae en la config estática
  const filtersConfig: FilterConfig[] =
    apiFiltersConfig.length > 0 ? apiFiltersConfig : STATIC_FILTERS_CONFIG;

  const externalFilters = useMemo(
    () => ({ dynamic: dynamicFilters, dateFilter, date1, date2 }),
    [dynamicFilters, dateFilter, date1, date2]
  );

  const activeFiltersCount = useMemo(() => {
    const dynamicCount = Object.values(dynamicFilters)
      .flat()
      .filter(Boolean).length;
    const dateCount = dateFilter && dateFilter !== "" ? 1 : 0;
    return dynamicCount + dateCount;
  }, [dynamicFilters, dateFilter]);

  const onExternalFiltersChange = (newFilters: any) => {
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
    isSidebarOpen,
    setIsSidebarOpen,
  };
}
