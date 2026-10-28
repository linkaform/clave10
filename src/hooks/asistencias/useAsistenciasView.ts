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

export type DisplayMode = "cal" | "table";

export const useAsistenciasView = () => {
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("employees");
  const [period, setPeriod] = useState<PeriodView>("dia");
  const [date, setDate] = useState<Date>(() => new Date());
  const [displayMode, setDisplayMode] = useState<DisplayMode>("cal");
  const [search, setSearch] = useState("");

  const [from, to] = periodRange(period, date);
  const days = useMemo(() => periodDays(period, date), [period, date]);

  const {
    reportAsistencias,
    isLoadingReportAsistencias,
    isFetchingReportAsistencias,
    errorReportAsistencias,
    refetchReportAsistencias,
  } = useReportAsistencias({
    enabled: true,
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
    isLoading: isLoadingReportAsistencias || isFetchingReportAsistencias,
    errorReportAsistencias,
    refetchReportAsistencias,
  };
};
