"use client";

import { useState, useCallback, useMemo } from "react";
import { useFilters } from "../bitacora/useFilters";
import { getConcesionadosFilters } from "@/services/endpoints";

export type ArticulosConcesionadosExternalFilters = {
  dynamic: Record<string, any>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
};

// El filtro de fecha (dateFilter/date1/date2) NO se aplica aqu\u00ed: se manda al
// backend como parte de la petici\u00f3n (ver useArticulosConcesionados, llamado
// desde dashboard/articulos/page.tsx con estos mismos valores), para que
// filtre sobre todos los registros y no solo sobre la p\u00e1gina ya tra\u00edda.
// status_concesion (abierto/devuelto/parcial) s\u00ed se queda en cliente por
// decisi\u00f3n expl\u00edcita: filtra solo sobre la p\u00e1gina ya cargada.
export function applyArticulosConcesionadosFilters(data: any[], filters: ArticulosConcesionadosExternalFilters): any[] {
  if (!data?.length) return [];

  const dynamic = filters.dynamic || {};

  const hasActiveFilters =
    Object.values(dynamic).some((v) => Array.isArray(v) ? v.length > 0 : Boolean(v));

  if (!hasActiveFilters) return data;

  const normalize = (text: any) =>
    String(text ?? "").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/_/g, " ").trim();

  return data.filter((item) => {

    if (dynamic.status_concesion) {
      const filter = Array.isArray(dynamic.status_concesion) ? dynamic.status_concesion : [dynamic.status_concesion];
      if (!filter.some((f: string) => normalize(f) === normalize(item.status_concesion || ""))) return false;
    }

    if (dynamic.persona_nombre_concesion) {
      const filter = Array.isArray(dynamic.persona_nombre_concesion) ? dynamic.persona_nombre_concesion : [dynamic.persona_nombre_concesion];
      const persona = item.persona_nombre_concesion || item.persona_nombre_otro || "";
      if (!filter.some((f: string) => normalize(f) === normalize(persona))) return false;
    }
  
    if (dynamic.categoria_equipo_concesion) {
      const filter = Array.isArray(dynamic.categoria_equipo_concesion) ? dynamic.categoria_equipo_concesion : [dynamic.categoria_equipo_concesion];
      const categorias = (item.grupo_equipos || []).map((e: any) => normalize(e.categoria_equipo_concesion || ""));
      if (!filter.some((f: string) => categorias.includes(normalize(f)))) return false;
    }
  
    if (dynamic.nombre_equipo) {
      const filter = Array.isArray(dynamic.nombre_equipo) ? dynamic.nombre_equipo : [dynamic.nombre_equipo];
      const equipoNames = (item.grupo_equipos || []).map((e: any) => normalize(e.nombre_equipo || ""));
      if (!filter.some((f: string) => equipoNames.includes(normalize(f)))) return false;
    }
  
    if (dynamic.area_paqueteria) {
      const filter = Array.isArray(dynamic.area_paqueteria) ? dynamic.area_paqueteria : [dynamic.area_paqueteria];
      if (!filter.some((f: string) => normalize(f) === normalize(item.caseta_concesion || ""))) return false;
    }

    if (dynamic.created_by) {
      const filter = Array.isArray(dynamic.created_by) ? dynamic.created_by : [dynamic.created_by];
      if (!filter.some((f: string) => normalize(f) === normalize(item.created_by || ""))) return false;
    }

    return true;
  });
}
// @/hooks/Articulos/usePaqueteriaFilters.ts
export function useArticulosConcesionadosFilters() {
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
    const [date1, setDate1] = useState<Date | "">("");
    const [date2, setDate2] = useState<Date | "">("");
    const [dateFilter, setDateFilter] = useState<string>("");
    const [searchTags, setSearchTags] = useState<string[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
    const { filters: filtersConfig, loadingFilters } = useFilters({
      key: "concesionados",
      endpoint: getConcesionadosFilters,
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