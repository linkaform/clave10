"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Search, ArrowUpRight, CalendarDays, History, Camera, Tags } from "lucide-react";
import { Input } from "@/components/ui/input";
import ViewImage from "@/components/modals/view-image";
import { useAreaIncidencias, AreaIncidenciaItem } from "@/hooks/Areas/useAreaIncidencias";
import { KpiCard, toneReciente } from "./KpiCard";
import {
  KPI_WINDOWS,
  countWithinWindows,
  parseLooseDate,
  DATE_RANGE_PRESETS,
  DateRangePreset,
  resolveDateRangePreset,
} from "@/lib/areas-kpi";

// Igual que en Checks Áreas: se trae toda la lista del área y se filtra en el
// cliente (get_incidencias_by_area con limit=0 regresa todas).
const TODAS_LAS_INCIDENCIAS = 0;

const normalizeText = (value: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function IncidenciasAreaDashboard({ areaId }: { areaId: string }) {
  const { incidencias, isLoadingIncidencias } = useAreaIncidencias(areaId, TODAS_LAS_INCIDENCIAS, 0);
  const records = incidencias.records;

  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("todos");
  const [categoria, setCategoria] = useState("todas");
  const [soloConEvidencia, setSoloConEvidencia] = useState(false);
  const [visibleCount, setVisibleCount] = useState(25);

  const categorias = useMemo(
    () => Array.from(new Set(records.map((r) => r.categoria).filter(Boolean))).sort(),
    [records],
  );

  const kpis = useMemo(() => {
    const porVentana = countWithinWindows(
      records.map((r) => ({ date: parseLooseDate(r.fecha_hora_incidente) })),
    );
    return {
      total: records.length,
      porVentana,
      conEvidencia: records.filter((r) => (r.evidencias ?? []).some((e) => e.file_url)).length,
      categorias: categorias.length,
    };
  }, [records, categorias]);

  const filtered = useMemo(() => {
    const query = normalizeText(search.trim());
    const range = resolveDateRangePreset(datePreset);
    const [from, to] = range ?? [null, null];

    const result = records.filter((incidencia) => {
      if (categoria !== "todas" && incidencia.categoria !== categoria) return false;
      if (soloConEvidencia && !(incidencia.evidencias ?? []).some((e) => e.file_url)) return false;

      const fecha = parseLooseDate(incidencia.fecha_hora_incidente);
      if (from && (!fecha || fecha < from)) return false;
      if (to && (!fecha || fecha > to)) return false;

      if (query) {
        const haystack = normalizeText(
          `${incidencia.incidente} ${incidencia.categoria} ${incidencia.subcategoria} ${
            incidencia.nombre_del_recorrido
          } ${incidencia.accion_tomada} ${incidencia.comentarios} ${incidencia.folio}`,
        );
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    result.sort((a, b) => (a.fecha_hora_incidente < b.fecha_hora_incidente ? 1 : -1));

    return result;
  }, [records, search, datePreset, categoria, soloConEvidencia]);

  const visible = filtered.slice(0, visibleCount);

  if (isLoadingIncidencias) {
    return (
      <div className="flex flex-col items-center gap-3 h-32 justify-center">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-sm text-gray-500">Cargando incidencias...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* KPIs */}
      <div className="flex flex-wrap gap-2">
        <KpiCard label="Incidencias" value={kpis.total} icon={AlertTriangle} />
        <KpiCard
          label="Últimos 30 días"
          value={kpis.porVentana[KPI_WINDOWS[0]]}
          tone={toneReciente(kpis.porVentana[KPI_WINDOWS[0]])}
          icon={CalendarDays}
        />
        <KpiCard label="360 días" value={kpis.porVentana[360]} tone={toneReciente(kpis.porVentana[360])} icon={History} />
        <KpiCard label="Con evidencia" value={kpis.conEvidencia} icon={Camera} />
        <KpiCard label="Categorías" value={kpis.categorias} icon={Tags} />
      </div>

      {/* Buscador y filtros */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por incidente, categoría, rondín o comentario..."
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
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm max-w-[180px]"
        >
          <option value="todas">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button
          onClick={() => setSoloConEvidencia((v) => !v)}
          className={`h-9 px-3 rounded-md text-sm font-semibold border whitespace-nowrap transition-colors shadow-sm ${
            soloConEvidencia
              ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
          }`}
        >
          Solo con evidencia
        </button>
        <a
          href="/dashboard/rondines?tab=incidencias-rondines"
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-3 rounded-md text-sm font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 whitespace-nowrap flex items-center gap-1.5 shadow-sm transition-colors"
          title="Explorar Incidencias de rondines"
        >
          Incidencias
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 gap-2">
          <AlertTriangle className="w-8 h-8 text-gray-300" />
          <span className="text-sm">
            {records.length === 0
              ? "No hay incidencias registradas para esta área."
              : "No hay incidencias que coincidan con la búsqueda."}
          </span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visible.map((incidencia) => (
              <IncidenciaCard key={`${incidencia.id}-${incidencia.ref_number}`} incidencia={incidencia} />
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

function IncidenciaCard({ incidencia }: { incidencia: AreaIncidenciaItem }) {
  // Igual que en Checks: solo http(s), las rutas file:/// del celular truenan en next/image.
  const evidencias = (incidencia.evidencias ?? []).filter((e) => /^https?:\/\//.test(e.file_url || ""));

  return (
    <div className="border border-gray-200 rounded-xl p-4 flex gap-4">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">{incidencia.incidente || "Sin incidente"}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-orange-50 text-orange-700 border-orange-200">
            {incidencia.categoria} · {incidencia.subcategoria}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
          <span># {incidencia.folio}</span>
          <span>{incidencia.nombre_del_recorrido}</span>
          <span>{incidencia.fecha_hora_incidente}</span>
        </div>

        {incidencia.accion_tomada && (
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Acción tomada:</span> {incidencia.accion_tomada}
          </p>
        )}
        {incidencia.comentarios && (
          <p className="text-sm text-gray-500">{incidencia.comentarios}</p>
        )}
      </div>

      {evidencias.length > 0 && (
        <div className="shrink-0 h-fit">
          <ViewImage imageUrl={evidencias} size="md" />
        </div>
      )}
    </div>
  );
}

export default IncidenciasAreaDashboard;
