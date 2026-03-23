"use client";

import { Button } from "@/components/ui/button";
import { FiltersPanelProps } from "@/types/bitacoras";
import { useFiltersPanel } from "@/hooks/bitacora/useFiltersPanel";
import { cn, catalogoFechas } from "@/lib/utils";
import { CustomMultiSelect } from "../CustomMultiSelect";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectPortal,
} from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import DateTime from "@/components/dateTime";

export function FiltersPanel({
  filters,
  onFiltersChange,
  filtersConfig = [],
}: FiltersPanelProps) {
  const { handleDynamicChange, clearFilters, hasActiveFilters } =
    useFiltersPanel(filters, onFiltersChange);

  return (
    <div className="flex flex-col gap-4 w-full relative">
      <div className="flex lg:flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground">Filtros</h2>
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2A7EFF] text-[10px] font-bold text-white">
              {Object.values(filters.dynamic || {})
                .flat()
                .filter(Boolean).length +
                (filters.dateFilter && filters.dateFilter !== "today" ? 1 : 0)}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-sm text-[#2A7EFF] hover:text-[#2A7EFF]/80 hover:bg-transparent font-medium">
            Limpiar
          </Button>
        )}
      </div>

      <Accordion
        type="multiple"
        className="w-full space-y-2 pb-10"
        key={filtersConfig
          ?.map((c) => `${c.key}-${c.defaultDisplayOpen}`)
          .join("_")}
        defaultValue={[
          "fecha",
          ...(filtersConfig
            ?.filter((c) => c.defaultDisplayOpen === true)
            ?.map((c) => c.key) || []),
        ]}>
        {/* Filtro de Fecha */}
        <AccordionItem value="fecha" className="border-none">
          <AccordionTrigger className="hover:no-underline py-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700">Fecha</span>
              {filters.dateFilter && filters.dateFilter !== "today" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2A7EFF] text-[10px] font-bold text-white">
                  1
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-4 space-y-3 overflow-visible">
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg bg-white p-1 relative z-[105]">
              <Select
                value={filters.dateFilter || "today"}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, dateFilter: value })
                }>
                <SelectTrigger className="w-full h-8 border-none shadow-none focus:ring-0 z-[110]">
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    className="z-[1000] min-w-[200px]">
                    {catalogoFechas().map((option: any) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
              <CalendarDays className="text-slate-400 mr-2" size={18} />
            </div>

            {filters.dateFilter === "range" && (
              <div className="flex flex-col gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase px-1">
                    Desde
                  </span>
                  <DateTime
                    date={filters.date1 || ""}
                    setDate={(d) => {
                      const newDate =
                        typeof d === "function" ? d(filters.date1 || "") : d;
                      onFiltersChange({ ...filters, date1: newDate });
                    }}
                    disablePastDates={false}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase px-1">
                    Hasta
                  </span>
                  <DateTime
                    date={filters.date2 || ""}
                    setDate={(d) => {
                      const newDate =
                        typeof d === "function" ? d(filters.date2 || "") : d;
                      onFiltersChange({ ...filters, date2: newDate });
                    }}
                    disablePastDates={false}
                  />
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {filtersConfig.length > 0 &&
          filtersConfig.map((config) => {
            const currentValue = (filters.dynamic || {})[config.key];
            const activeCount = Array.isArray(currentValue)
              ? currentValue.length
              : currentValue
                ? 1
                : 0;

            return (
              <AccordionItem
                key={config.key}
                value={config.key}
                className="border-none">
                <AccordionTrigger className="hover:no-underline py-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">
                      {config.label}
                    </span>
                    {activeCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2A7EFF] text-[10px] font-bold text-white">
                        {activeCount}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-4 overflow-visible">
                  {config.type === "multiselect" ? (
                    <div className="px-1">
                      <CustomMultiSelect
                        options={config.options}
                        value={(currentValue as string[]) || []}
                        onChange={(newValues) => {
                          handleDynamicChange(
                            config.key,
                            newValues,
                            true,
                            config.type,
                          );
                        }}
                        placeholder={`Buscar ${config.label.toLowerCase()}...`}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {config.options.map((option) => {
                        const isChecked = Array.isArray(currentValue)
                          ? currentValue.includes(option.value)
                          : currentValue === option.value;

                        return (
                          <button
                            key={option.value}
                            onClick={() =>
                              handleDynamicChange(
                                config.key,
                                option.value,
                                !isChecked,
                                config.type,
                              )
                            }
                            className={cn(
                              "group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                              isChecked
                                ? "bg-[#2A7EFF] border-[#2A7EFF] text-white shadow-sm"
                                : "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                            )}>
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
      </Accordion>
    </div>
  );
}
