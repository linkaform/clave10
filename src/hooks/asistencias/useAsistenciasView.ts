"use client";

import { useReportAsistencias, useReportLocations } from "@/app/dashboard/reportes/hooks/useAsistenciasReport";
import { asistenciasReport } from "@/app/dashboard/reportes/types/report";
import { GroupingMode } from "@/app/dashboard/reportes/types/attendance";
import { useState, useCallback } from "react";


type ViewMode = "table" | "photos" | "list";

const areFiltersEqual = (a: any, b: any) =>
  JSON.stringify(a) === JSON.stringify(b);

export const useAsistenciasView = () => {
  const today = new Date();

  // Vista
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mes / año
  const [month, setMonth] = useState<number>(today.getMonth() + 1);
  const [year, setYear] = useState<number>(today.getFullYear());

  // Filtros de asistencias
  const [timeframe, setTimeframe] = useState<"mes" | "semana">("mes");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [groupByLocation, setGroupByLocation] = useState(false);
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("employees");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  // Control de ejecución
  const [isExecuted, setIsExecuted] = useState(false);
  const [filters, setFilters] = useState<asistenciasReport>({
    enabled: false,
    dateRange: "mes",
    locations: [],
    groupBy: "employees",
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  // Datos
  const {
    reportAsistencias,
    isLoadingReportAsistencias,
    isFetchingReportAsistencias,
    errorReportAsistencias,
    refetchReportAsistencias,
  } = useReportAsistencias(filters);

  const { reportLocations } = useReportLocations({ enabled: true });

  // Valores derivados
  const daysInMonth = new Date(year, month, 0).getDate();
  const isLoading = isLoadingReportAsistencias || isFetchingReportAsistencias;
  const hasData = Array.isArray(reportAsistencias) && reportAsistencias.length > 0;

  // Acciones
  const handleExecute = useCallback(() => {
    const newFilters: asistenciasReport = {
      enabled: true,
      dateRange: timeframe,
      locations: [...selectedLocations],
      groupBy: groupingMode,
      month,
      year,
    };
    if (isExecuted && areFiltersEqual(filters, newFilters)) {
      refetchReportAsistencias();
      return;
    }
    setFilters(newFilters);
    setIsExecuted(true);
  }, [filters, groupingMode, isExecuted, month, refetchReportAsistencias, selectedLocations, timeframe, year]);

  const handlePrevMonth = useCallback(() => {
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    if (isExecuted) {
      setTimeout(() => {
        setFilters((prev) => ({ ...prev, month: newMonth, year: newYear, enabled: true }));
      }, 0);
    }
  }, [isExecuted, month, year]);

  const handleNextMonth = useCallback(() => {
    const current = new Date();
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    if (
      newYear > current.getFullYear() ||
      (newYear === current.getFullYear() && newMonth > current.getMonth() + 1)
    ) return;
    setMonth(newMonth);
    setYear(newYear);
    if (isExecuted) {
      setTimeout(() => {
        setFilters((prev) => ({ ...prev, month: newMonth, year: newYear, enabled: true }));
      }, 0);
    }
  }, [isExecuted, month, year]);

  const handleGroupByLocationToggle = useCallback(() => {
    setGroupByLocation((prev) => !prev);
  }, []);

  const handleClear = useCallback(() => {
    const now = new Date();
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
    setTimeframe("mes");
    setSelectedLocations([]);
    setGroupByLocation(false);
    setGroupingMode("employees");
    setSelectedStatus([]);
    setIsExecuted(false);
    setFilters({
      enabled: false,
      dateRange: "mes",
      locations: [],
      groupBy: "employees",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  }, []);

  return {
    // Vista
    viewMode,
    setViewMode,
    isSidebarOpen,
    setIsSidebarOpen,
    // Mes / año
    month,
    year,
    daysInMonth,
    handlePrevMonth,
    handleNextMonth,
    // Filtros
    timeframe,
    setTimeframe,
    selectedLocations,
    setSelectedLocations,
    groupByLocation,
    setGroupByLocation,
    handleGroupByLocationToggle,
    groupingMode,
    setGroupingMode,
    selectedStatus,
    setSelectedStatus,
    // Acciones
    handleExecute,
    handleClear,
    isExecuted,
    // Datos
    reportAsistencias,
    data: reportAsistencias, // alias para calcular totalFaltas en el page
    reportLocations,
    isLoading,
    errorReportAsistencias,
    refetchReportAsistencias,
    hasData,
  };
};