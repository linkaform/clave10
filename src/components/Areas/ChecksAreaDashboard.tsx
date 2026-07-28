"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ClipboardCheck, Search, ChevronDown, ChevronUp, TrendingUp, ArrowUpRight, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAreaChecks, AreaCheckItem } from "@/hooks/Areas/useAreaChecks";
import { useAreaFallas } from "@/hooks/Areas/useAreaFallas";
import { KpiCard } from "./KpiCard";
import {
  KPI_WINDOWS,
  countWithinWindows,
  parseLooseDate,
  DATE_RANGE_PRESETS,
  DateRangePreset,
  resolveDateRangePreset,
} from "@/lib/areas-kpi";

const parseCheckDate = parseLooseDate;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function ChecksAreaDashboard({ ubicacion, area }: { ubicacion: string; area: string }) {
  const { checks, isLoadingChecks } = useAreaChecks(ubicacion, area);

  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("todos");
  const [soloIncidencias, setSoloIncidencias] = useState(false);
  const [visibleCount, setVisibleCount] = useState(25);
  const [showTendencia, setShowTendencia] = useState(false);
  const [tendenciaTab, setTendenciaTab] = useState<"comentarios" | "kpis">("comentarios");

  const { fallas, isLoadingFallas } = useAreaFallas(ubicacion, area);

  const kpis = useMemo(() => {
    let conIncidencias = 0;
    const incidenciasPorVentana = countWithinWindows(
      checks.map((check) => ({
        date: parseCheckDate(check.created_at),
        weight: check.grupo_incidencias_check?.length || 0,
      })),
    );

    for (const check of checks) {
      if ((check.grupo_incidencias_check?.length || 0) > 0) conIncidencias += 1;
    }

    const fallasPorVentana = countWithinWindows(
      fallas.map((falla) => ({ date: parseLooseDate(falla.falla_fecha_hora || falla.created_at) })),
    );

    const ultimosComentarios = [...checks]
      .filter((c) => c.comentario_check_area)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 5);

    return {
      total: checks.length,
      conIncidencias,
      incidenciasPorVentana,
      fallasTotal: fallas.length,
      fallasPorVentana,
      ultimosComentarios,
    };
  }, [checks, fallas]);

  const filtered = useMemo(() => {
    const query = normalizeText(search.trim());
    const range = resolveDateRangePreset(datePreset);
    const [from, to] = range ?? [null, null];

    const result = checks.filter((check) => {
      if (soloIncidencias && !(check.grupo_incidencias_check?.length > 0)) return false;

      const fecha = parseCheckDate(check.created_at);
      if (from && (!fecha || fecha < from)) return false;
      if (to && (!fecha || fecha > to)) return false;

      if (query) {
        const incidenciasTexto = (check.grupo_incidencias_check || [])
          .map((inc: any) => `${inc.incidencia || ""} ${inc.incidente_accion || ""}`)
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

    result.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    return result;
  }, [checks, search, datePreset, soloIncidencias]);

  const visible = filtered.slice(0, visibleCount);

  if (isLoadingChecks) {
    return (
      <div className="flex flex-col items-center gap-3 h-32 justify-center">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-sm text-gray-500">Cargando checks...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* KPIs */}
      <div className="flex flex-wrap gap-3">
        <KpiCard label="Checks (360 días)" value={kpis.total} />
        <KpiCard
          label="Con incidencias"
          value={kpis.conIncidencias}
          tone={kpis.conIncidencias > 0 ? "bad" : "good"}
        />
        <KpiCard
          label="Fallas"
          value={isLoadingFallas ? "…" : kpis.fallasTotal}
          tone={kpis.fallasTotal > 0 ? "warn" : "good"}
        />
        <KpiCard label="Tareas" value="—" />
        <KpiCard label="Inspecciones" value="—" />
      </div>

      <button
        onClick={() => setShowTendencia((v) => !v)}
        className="flex items-center gap-2 self-start text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        <TrendingUp className="w-4 h-4" />
        Ver tendencia y comentarios
        {showTendencia ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showTendencia && (
        <div className="border border-gray-100 rounded-xl overflow-hidden min-w-0">
          <div className="flex items-center gap-2 p-2 border-b border-gray-100 bg-gray-50/50">
            <button
              onClick={() => setTendenciaTab("comentarios")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tendenciaTab === "comentarios"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Comentarios
            </button>
            <button
              onClick={() => setTendenciaTab("kpis")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tendenciaTab === "kpis" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              KPIs 360 días
            </button>
          </div>

          <div className="p-4 min-w-0">
            {tendenciaTab === "comentarios" ? (
              kpis.ultimosComentarios.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {kpis.ultimosComentarios.map((check, index) => (
                    <div
                      key={`${check.id}-${index}`}
                      className="text-sm text-gray-600 flex items-start justify-between gap-3"
                    >
                      <span className="flex-1">{check.comentario_check_area}</span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{check.created_at}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No hay comentarios registrados.</p>
              )
            ) : (
              <div className="flex flex-col gap-4 min-w-0">
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full text-sm min-w-[420px]">
                    <thead>
                      <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wide">
                        <th className="font-semibold pb-2 pr-4">Categoría</th>
                        {KPI_WINDOWS.map((dias) => (
                          <th key={dias} className="font-semibold pb-2 px-3 text-center">
                            {dias} días
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      <tr>
                        <td className="py-2 pr-4 font-medium text-gray-700">Incidencias</td>
                        {KPI_WINDOWS.map((dias) => (
                          <td key={dias} className="py-2 px-3 text-center text-gray-700">
                            {kpis.incidenciasPorVentana[dias]}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium text-gray-700">Fallas</td>
                        {KPI_WINDOWS.map((dias) => (
                          <td key={dias} className="py-2 px-3 text-center text-gray-700">
                            {isLoadingFallas ? "…" : kpis.fallasPorVentana[dias]}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium text-gray-400">Tareas</td>
                        {KPI_WINDOWS.map((dias) => (
                          <td key={dias} className="py-2 px-3 text-center text-gray-300">
                            —
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium text-gray-400">Inspecciones</td>
                        {KPI_WINDOWS.map((dias) => (
                          <td key={dias} className="py-2 px-3 text-center text-gray-300">
                            —
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buscador y filtros */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, comentario o incidencia..."
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
          <ClipboardCheck className="w-8 h-8 text-gray-300" />
          <span className="text-sm">No hay checks que coincidan con la búsqueda.</span>
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

function CheckCard({ check }: { check: AreaCheckItem }) {
  const tieneIncidencias = (check.grupo_incidencias_check?.length || 0) > 0;
  const primeraIncidencia = check.grupo_incidencias_check?.[0];
  const evidenciaThumbRaw = check.foto_evidencia_area?.[0]?.file_url;
  // Algunos registros sincronizados desde el celular guardan una ruta local
  // (file:///...) mientras la foto aún no termina de subirse -- next/image
  // truena si el host no está configurado, así que solo usamos http(s).
  const evidenciaThumb = /^https?:\/\//.test(evidenciaThumbRaw || "") ? evidenciaThumbRaw : null;
  const evidenciasCount = check.foto_evidencia_area?.length || 0;
  const rondinUrl = check.rondin?.id ? `/dashboard/rondines?tab=rondines&id=${check.rondin.id}` : null;

  return (
    <div className="border-2 border-blue-500 rounded-xl p-4 flex gap-4 divide-x divide-gray-200 transition-colors">
      {/* Columna 1: rondín, fecha, comentario */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            {check.rondin?.nombre_recorrido || "Rondín sin nombre"}
          </span>
          {rondinUrl && (
            <a
              href={rondinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              Ver <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>{check.fecha_inspeccion_area || check.created_at}</span>
          {check.rondin?.asignado_a && <span>{check.rondin.asignado_a}</span>}
        </div>

        {check.comentario_check_area && (
          <p className="text-sm text-gray-600">{check.comentario_check_area}</p>
        )}
        {check.url_inspeccion && (
          <a
            href={check.url_inspeccion}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline w-fit"
          >
            Ver inspección <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Columna 2: foto de evidencia */}
      <div className="w-24 shrink-0 flex items-center justify-center pl-4">
        {evidenciaThumb && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-green-500 bg-gray-50 shrink-0">
            <Image src={evidenciaThumb} alt="Evidencia" fill className="object-cover" />
            {evidenciasCount > 1 && (
              <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 rounded-tl">
                +{evidenciasCount - 1}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Columna 3: datos de la incidencia */}
      <div className="w-[170px] shrink-0 pl-4">
        {tieneIncidencias && primeraIncidencia && (
          <div className="border-2 border-orange-500 bg-red-50/60 rounded-lg p-2 text-[11px] text-red-700 flex flex-col gap-0.5">
            {primeraIncidencia.categoria && (
              <span>
                <span className="font-semibold">Categoría:</span> {primeraIncidencia.categoria}
              </span>
            )}
            {primeraIncidencia.subcategoria && (
              <span>
                <span className="font-semibold">Subcategoría:</span> {primeraIncidencia.subcategoria}
              </span>
            )}
            {primeraIncidencia.incidencia && (
              <span>
                <span className="font-semibold">Tipo:</span> {primeraIncidencia.incidencia}
              </span>
            )}
            {rondinUrl && (
              <a href={rondinUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline mt-0.5">
                Ver incidencia
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
