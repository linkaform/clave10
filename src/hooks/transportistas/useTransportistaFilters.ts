"use client";

import { useState, useMemo } from "react";
import { useFilters } from "../bitacora/useFilters";
import { getTransportistaFilters } from "@/services/endpoints";
import { FilterConfig } from "@/types/bitacoras";
import { resolveDateRange } from "@/lib/utils";

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

  const dateRange = useMemo(
    () => resolveDateRange(dateFilter, date1, date2),
    [dateFilter, date1, date2]
  );

  // Filtros que se resuelven server-side (van al backend, no se filtran en el cliente)
  const asArray = (v: any): string[] | undefined =>
    v === undefined || v === "" ? undefined : Array.isArray(v) ? v : [v];

  const serverFilters = useMemo(
    () => ({
      tipo_de_vehiculo: asArray(dynamicFilters.tipo_de_vehiculo),
      proveedor_cliente: asArray(dynamicFilters.proveedor_cliente),
      anden_asignado: asArray(dynamicFilters.anden_asignado),
    }),
    [dynamicFilters.tipo_de_vehiculo, dynamicFilters.proveedor_cliente, dynamicFilters.anden_asignado]
  );

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
    dateRange,
    serverFilters,
  };
}
