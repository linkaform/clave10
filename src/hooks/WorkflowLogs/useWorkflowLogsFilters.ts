"use client";

import { useCallback, useMemo, useState } from "react";
import { FilterConfig } from "@/types/bitacoras";
import { WorkflowLogFiltersState } from "@/lib/workflow-logs-sdk";
import { buildDateRange, ScriptLogsExternalFilters } from "@/hooks/ScriptLogs/useScriptLogsFilters";
import { useWorkflowLogFilterOptions } from "./useWorkflowLogs";

const asOptions = (opts: { value: string | number; label: string }[]) =>
  opts.map((o) => ({ value: String(o.value), label: o.label }));

export function useWorkflowLogsFilters() {
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  const [dateFilter, setDateFilter] = useState("");
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const options = useWorkflowLogFilterOptions();

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
        ],
      },
      { key: "rule", label: "Acción", type: "multiple", defaultDisplayOpen: true, options: asOptions(options.rule) },
      { key: "event", label: "Evento", type: "multiple", options: asOptions(options.event) },
      { key: "workflow", label: "Workflow", type: "multiselect", options: asOptions(options.workflow) },
      { key: "form", label: "Formulario", type: "multiselect", options: asOptions(options.form) },
      { key: "user", label: "Usuario", type: "multiselect", options: asOptions(options.user) },
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

  const queryFilters: WorkflowLogFiltersState = useMemo(() => {
    const range = buildDateRange(dateFilter, date1, date2);
    return {
      status: (dynamicFilters.status as string) || "",
      rules: (dynamicFilters.rule as string[]) ?? [],
      events: (dynamicFilters.event as string[]) ?? [],
      workflowNames: (dynamicFilters.workflow as string[]) ?? [],
      formIds: (dynamicFilters.form as string[]) ?? [],
      userIds: (dynamicFilters.user as string[]) ?? [],
      dateFrom: range.date_from ?? "",
      dateTo: range.date_to ?? "",
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
