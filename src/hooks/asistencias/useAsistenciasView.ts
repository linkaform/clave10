"use client";

import { useReportAsistencias } from "@/app/dashboard/reportes/hooks/useAsistenciasReport";
import { GroupingMode } from "@/app/dashboard/reportes/types/attendance";
import {
  PeriodView,
  isCurrentPeriod,
  periodDays,
  periodLabel,
  periodRange,
  shiftPeriod,
  toISO,
} from "@/app/dashboard/reportes/reporte_asistencias/lib/period";
import { useCallback, useMemo, useState } from "react";

// cov = Cobertura (pendiente: requiere plantilla por caseta)
export type DisplayMode = "cov" | "cal" | "gallery" | "table" | "charts";

// Periodos que admite cada modo de vista
export const MODE_PERIODS: Record<DisplayMode, PeriodView[]> = {
  cov: ["dia"],
  cal: ["dia", "semana", "quincena", "mes"],
  gallery: ["dia", "semana", "quincena", "mes"],
  table: ["dia", "semana", "quincena", "mes", "anio"],
  charts: ["semana", "quincena", "mes", "anio"],
};

const fitPeriod = (mode: DisplayMode, period: PeriodView): PeriodView => {
  const allowed = MODE_PERIODS[mode];
  if (allowed.includes(period)) return period;
  return period === "anio" ? "mes" : period === "dia" ? "mes" : allowed[0];
};

export const useAsistenciasView = () => {
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("employees");
  const [period, setPeriodState] = useState<PeriodView>("dia");
  const [date, setDate] = useState<Date>(() => new Date());
  const [displayMode, setDisplayModeState] = useState<DisplayMode>("cal");
  const [search, setSearch] = useState("");

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    setDisplayModeState(mode);
    setPeriodState(p => fitPeriod(mode, p));
  }, []);
  const setPeriod = useCallback((p: PeriodView) => setPeriodState(fitPeriod(displayMode, p)), [displayMode]);

  const [from, to] = periodRange(period, date);
  const days = useMemo(() => periodDays(period, date), [period, date]);

  const {
    reportAsistencias,
    isLoadingReportAsistencias,
    isFetchingReportAsistencias,
    errorReportAsistencias,
    refetchReportAsistencias,
  } = useReportAsistencias({
    // La galería lee los registros de check-in, no el reporte
    enabled: displayMode !== "gallery" && displayMode !== "cov",
    dateRange: period,
    locations: [],
    groupBy: groupingMode,
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    dateFrom: toISO(from),
    dateTo: toISO(to),
  });

  const goPrev = useCallback(() => setDate(d => shiftPeriod(period, d, -1)), [period]);
  const goNext = useCallback(() => setDate(d => shiftPeriod(period, d, 1)), [period]);
  const goToday = useCallback(() => setDate(new Date()), []);

  return {
    groupingMode,
    setGroupingMode,
    period,
    setPeriod,
    date,
    setDate,
    from: toISO(from),
    to: toISO(to),
    days,
    label: periodLabel(period, date),
    isCurrent: isCurrentPeriod(period, date),
    goPrev,
    goNext,
    goToday,
    displayMode,
    setDisplayMode,
    search,
    setSearch,
    reportAsistencias: Array.isArray(reportAsistencias) ? reportAsistencias : [],
    // isLoading: no hay datos guardados para este periodo (skeleton). isFetching: se está pidiendo (spinner en Recargar).
    isLoading: isLoadingReportAsistencias,
    isFetching: isFetchingReportAsistencias,
    errorReportAsistencias,
    refetchReportAsistencias,
  };
};
