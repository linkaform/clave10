"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Route, Search, ExternalLink, ArrowUpRight, CircleCheck, Timer, CalendarClock, CircleX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EstatusBadge } from "@/components/estatus-badge";
import { useAreaRondines, AreaRondinItem } from "@/hooks/Areas/useAreaRondines";
import { KpiCard, toneLogro, toneProblema } from "./KpiCard";
import {
  parseLooseDate,
  DATE_RANGE_PRESETS,
  DateRangePreset,
  resolveDateRangePreset,
} from "@/lib/areas-kpi";

const MAX_RONDINES = 1000;

const ESTATUS_OPTIONS = [
  { key: "todos", label: "Todos los estatus" },
  { key: "programado", label: "Programado" },
  { key: "en_proceso", label: "En proceso" },
  { key: "realizado", label: "Realizado" },
  { key: "cerrado", label: "Cerrado" },
  { key: "cancelado", label: "Cancelado" },
];

const normalizeText = (value: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const normalizeEstatus = (value: string) => normalizeText(value).replace(/\s+/g, "_");

const fechaRondin = (rondin: AreaRondinItem) =>
  rondin.fecha_inicio || rondin.fecha_programacion || "";

export function RondinesAreaDashboard({ areaId }: { areaId: string }) {
  const { rondines, isLoadingRondines } = useAreaRondines(areaId, MAX_RONDINES, 0);
  const records = rondines.records;

  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("todos");
  const [estatus, setEstatus] = useState("todos");
  const [visibleCount, setVisibleCount] = useState(25);

  const kpis = useMemo(() => {
    const porEstatus = (key: string) =>
      records.filter((r) => normalizeEstatus(r.estatus_rondin) === key).length;
    return {
      total: rondines.total_records,
      realizados: porEstatus("realizado"),
      enProceso: porEstatus("en_proceso"),
      programados: porEstatus("programado"),
      cancelados: porEstatus("cancelado"),
    };
  }, [records, rondines.total_records]);

  const filtered = useMemo(() => {
    const query = normalizeText(search.trim());
    const range = resolveDateRangePreset(datePreset);
    const [from, to] = range ?? [null, null];

    return records.filter((rondin) => {
      if (estatus !== "todos" && normalizeEstatus(rondin.estatus_rondin) !== estatus) return false;

      const fecha = parseLooseDate(fechaRondin(rondin));
      if (from && (!fecha || fecha < from)) return false;
      if (to && (!fecha || fecha > to)) return false;

      if (query) {
        const haystack = normalizeText(
          `${rondin.nombre_recorrido} ${rondin.asignado_a} ${rondin.folio} ${rondin.estatus_rondin}`,
        );
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [records, search, datePreset, estatus]);

  const visible = filtered.slice(0, visibleCount);

  if (isLoadingRondines) {
    return (
      <div className="flex flex-col items-center gap-3 h-32 justify-center">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-sm text-gray-500">Cargando rondines...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* KPIs */}
      <div className="flex flex-wrap gap-2">
        <KpiCard label="Rondines" value={kpis.total} icon={Route} />
        <KpiCard label="Realizados" value={kpis.realizados} tone={toneLogro(kpis.realizados)} icon={CircleCheck} />
        <KpiCard label="En proceso" value={kpis.enProceso} icon={Timer} />
        <KpiCard label="Programados" value={kpis.programados} icon={CalendarClock} />
        <KpiCard label="Cancelados" value={kpis.cancelados} tone={toneProblema(kpis.cancelados)} icon={CircleX} />
      </div>

      {/* Buscador y filtros */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, folio o asignado..."
            className="pl-9 h-9"
          />
        </div>
        <select
          value={datePreset}
          onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {DATE_RANGE_PRESETS.map((preset) => (
            <option key={preset.key} value={preset.key}>
              {preset.label}
            </option>
          ))}
        </select>
        <select
          value={estatus}
          onChange={(e) => setEstatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {ESTATUS_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <a
          href="/dashboard/rondines?tab=rondines"
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-3 rounded-md text-sm font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 whitespace-nowrap flex items-center gap-1.5 shadow-sm transition-colors"
          title="Explorar Rondines"
        >
          Rondines
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 gap-2">
          <Route className="w-8 h-8 text-gray-300" />
          <span className="text-sm">
            {records.length === 0
              ? "No hay rondines que incluyan esta área."
              : "No hay rondines que coincidan con la búsqueda."}
          </span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visible.map((rondin) => (
              <RondinCard key={rondin.record_id} rondin={rondin} />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span>
              Mostrando {visible.length} de {filtered.length}
            </span>
            {visibleCount < filtered.length && (
              <button
                onClick={() => setVisibleCount((v) => v + 25)}
                className="text-blue-600 font-semibold hover:underline"
              >
                Ver más
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RondinCard({ rondin }: { rondin: AreaRondinItem }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">
            {rondin.nombre_recorrido || "Rondín sin nombre"}
          </span>
          {rondin.estatus_rondin && (
            <EstatusBadge
              estatus={rondin.estatus_rondin.replace(/_/g, " ")}
              className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold"
            />
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
          <span># {rondin.folio}</span>
          {fechaRondin(rondin) && <span>{fechaRondin(rondin)}</span>}
          {rondin.asignado_a && <span>{rondin.asignado_a}</span>}
        </div>
      </div>

      {rondin.recorrido_id && (
        <Link
          href={`/dashboard/ver-recorrido/${rondin.recorrido_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0"
        >
          Ver recorrido <ExternalLink className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default RondinesAreaDashboard;
