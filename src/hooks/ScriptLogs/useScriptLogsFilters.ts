"use client";

import { useCallback, useMemo, useState } from "react";
import { resolveDateRange } from "@/lib/utils";
import { FilterConfig } from "@/types/bitacoras";
import { ScriptLogFiltersState } from "@/lib/script-logs-sdk";
import { useScriptLogFilterOptions } from "./useScriptLogs";

export type ScriptLogsExternalFilters = {
  dynamic: Record<string, any>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
};

// Rangos de duración (segundos) como chips, igual que el resto de filtros de
// FiltersPanel (no hay inputs numéricos en ese panel).
const DURATION_RANGES: Record<string, { min?: number; max?: number }> = {
  lt10: { max: 10 },
  "10_60": { min: 10, max: 60 },
  "60_300": { min: 60, max: 300 },
  gt300: { min: 300 },
};

const toIso = (localDateTime: string | undefined) =>
  localDateTime ? new Date(localDateTime.replace(" ", "T")).toISOString() : "";

/** Rango [desde, hasta] en ISO UTC a partir del selector de fecha de FiltersPanel. */
export const buildDateRange = (
  dateFilter: string,
  date1: Date | "",
  date2: Date | "",
): { date_from?: string; date_to?: string } => {
  if (dateFilter === "range") {
    if (!date1 || !date2) return {};
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(23, 59, 59, 0);
    return { date_from: d1.toISOString(), date_to: d2.toISOString() };
  }
  const r = resolveDateRange(dateFilter);
  return { date_from: toIso(r.date_from), date_to: toIso(r.date_to) };
};

export function useScriptLogsFilters() {
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  const [dateFilter, setDateFilter] = useState("");
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const options = useScriptLogFilterOptions();

  const filtersConfig: FilterConfig[] = useMemo(
    () => [
      {
        key: "status",
        label: "Estado",
        type: "single",
        defaultDisplayOpen: true,
        options: [
          { value: "success", label: "Exitoso" },
          { value: "error", label: "Con error" },
          { value: "running", label: "En ejecución" },
        ],
      },
      {
        key: "script",
        label: "Script",
        type: "multiselect",
        options: options.script.map((o) => ({ value: String(o.value), label: o.label })),
      },
      {
        key: "user",
        label: "Usuario",
        type: "multiselect",
        options: options.user.map((o) => ({ value: String(o.value), label: o.label })),
      },
      {
        key: "duration",
        label: "Duración",
        type: "single",
        options: [
          { value: "lt10", label: "< 10 s" },
          { value: "10_60", label: "10 s – 1 min" },
          { value: "60_300", label: "1 – 5 min" },
          { value: "gt300", label: "> 5 min" },
        ],
      },
    ],
    [options],
  );

  const externalFilters: ScriptLogsExternalFilters = useMemo(
    () => ({ dynamic: dynamicFilters, dateFilter, date1, date2 }),
    [dynamicFilters, dateFilter, date1, date2],
  );

  const onExternalFiltersChange = useCallback((f: ScriptLogsExternalFilters) => {
    setDynamicFilters(f.dynamic ?? {});
    setDateFilter(f.dateFilter ?? "");
    setDate1(f.date1 ?? "");
    setDate2(f.date2 ?? "");
  }, []);

  const activeFiltersCount = useMemo(() => {
    const dyn = Object.values(dynamicFilters).reduce((acc: number, v) => {
      if (Array.isArray(v)) return acc + (v.length > 0 ? 1 : 0);
      return acc + (v ? 1 : 0);
    }, 0);
    return dyn + (dateFilter ? 1 : 0);
  }, [dynamicFilters, dateFilter]);

  // Shape que consume script_logs_sdk (list_script_logs).
  const queryFilters: ScriptLogFiltersState = useMemo(() => {
    const range = buildDateRange(dateFilter, date1, date2);
    const dur = DURATION_RANGES[dynamicFilters.duration as string] ?? {};
    return {
      status: (dynamicFilters.status as string) || "",
      scriptIds: (dynamicFilters.script as string[]) ?? [],
      userIds: (dynamicFilters.user as string[]) ?? [],
      dateFrom: range.date_from ?? "",
      dateTo: range.date_to ?? "",
      minDuration: dur.min !== undefined ? String(dur.min) : "",
      maxDuration: dur.max !== undefined ? String(dur.max) : "",
    };
  }, [dynamicFilters, dateFilter, date1, date2]);

  return {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
    queryFilters,
    isSidebarOpen,
    setIsSidebarOpen,
    filtersConfig,
  };
}
