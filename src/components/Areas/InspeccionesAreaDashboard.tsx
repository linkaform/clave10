"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, CalendarDays, Camera, ClipboardList, History, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAreaChecks } from "@/hooks/Areas/useAreaChecks";
import { CheckCard } from "./ChecksAreaDashboard";
import { KpiCard, toneProblema } from "./KpiCard";
import {
  KPI_WINDOWS,
  countWithinWindows,
  parseLooseDate,
  DATE_RANGE_PRESETS,
  DateRangePreset,
  resolveDateRangePreset,
} from "@/lib/areas-kpi";

const normalizeText = (value: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// Igual que en la app móvil: las inspecciones del área son los checks que
// llevaron inspección (el back les pone url_inspeccion al guardarla). Usa la
// misma consulta que Checks Áreas, así que sale de la caché.
export function InspeccionesAreaDashboard({ ubicacion, area }: { ubicacion: string; area: string }) {
  const { checks, isLoadingChecks } = useAreaChecks(ubicacion, area);
  const inspecciones = useMemo(() => checks.filter((c) => !!c.url_inspeccion), [checks]);

  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("todos");
  const [soloIncidencias, setSoloIncidencias] = useState(false);
  const [visibleCount, setVisibleCount] = useState(25);

  const kpis = useMemo(() => {
    const porVentana = countWithinWindows(inspecciones.map((c) => ({ date: parseLooseDate(c.created_at) })));
    return {
      total: inspecciones.length,
      porVentana,
      conIncidencias: inspecciones.filter((c) => (c.grupo_incidencias_check?.length || 0) > 0).length,
      conEvidencia: inspecciones.filter((c) => (c.foto_evidencia_area?.length || 0) > 0).length,
    };
  }, [inspecciones]);

  const filtered = useMemo(() => {
    const query = normalizeText(search.trim());
    const [from, to] = resolveDateRangePreset(datePreset) ?? [null, null];

    const result = inspecciones.filter((check) => {
      if (soloIncidencias && !(check.grupo_incidencias_check?.length > 0)) return false;

      const fecha = parseLooseDate(check.created_at);
      if (from && (!fecha || fecha < from)) return false;
      if (to && (!fecha || fecha > to)) return false;

      if (query) {
        const incidenciasTexto = (check.grupo_incidencias_check || [])
          .map((inc) => `${inc.incidencia || ""} ${inc.incidente_accion || ""}`)
          .join(" ");
        const haystack = normalizeText(
          `${check.rondin?.nombre_recorrido || ""} ${check.rondin?.asignado_a || ""} ${
            check.comentario_check_area || ""
          } ${incidenciasTexto}`,
        );
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    return result.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [inspecciones, search, datePreset, soloIncidencias]);

  const visible = filtered.slice(0, visibleCount);

  if (isLoadingChecks) {
    return (
      <div className="flex flex-col items-center gap-3 h-32 justify-center">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-sm text-gray-500">Cargando inspecciones...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* KPIs */}
      <div className="flex flex-wrap gap-2">
        <KpiCard label="Inspecciones" value={kpis.total} icon={ClipboardList} />
        <KpiCard label="Últimos 30 días" value={kpis.porVentana[KPI_WINDOWS[0]]} icon={CalendarDays} />
        <KpiCard label="360 días" value={kpis.porVentana[360]} icon={History} />
        <KpiCard
          label="Con incidencias"
          value={kpis.conIncidencias}
          tone={toneProblema(kpis.conIncidencias)}
          icon={AlertTriangle}
        />
        <KpiCard label="Con evidencia" value={kpis.conEvidencia} icon={Camera} />
      </div>

      {/* Buscador y filtros */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por rondín, asignado, comentario o incidencia..."
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
        <button
          onClick={() => setSoloIncidencias((v) => !v)}
          className={`h-9 px-3 rounded-md text-sm font-semibold border whitespace-nowrap transition-colors shadow-sm ${
            soloIncidencias
              ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
          }`}
        >
          Solo con incidencias
        </button>
        <a
          href={`/dashboard/rondines?tab=check-areas&area=${encodeURIComponent(area)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-3 rounded-md text-sm font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 whitespace-nowrap flex items-center gap-1.5 shadow-sm transition-colors"
          title="Explorar Check de Áreas"
        >
          Check de Áreas
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 gap-2">
          <ClipboardList className="w-8 h-8 text-gray-300" />
          <span className="text-sm">
            {inspecciones.length === 0
              ? "No hay inspecciones registradas para esta área."
              : "No hay inspecciones que coincidan con la búsqueda."}
          </span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visible.map((check, index) => (
              <CheckCard key={`${check.id}-${index}`} check={check} />
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
