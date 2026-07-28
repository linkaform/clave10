"use client";

import { useMemo, useState } from "react";
import { Wrench, ImageIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAreaFallas, AreaFallaItem } from "@/hooks/Areas/useAreaFallas";
import { KpiCard } from "./KpiCard";

const parseFallaDate = (value: string) => {
  if (!value) return null;
  const date = new Date(value.replace(" ", "T"));
  return isNaN(date.getTime()) ? null : date;
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const esResuelta = (estatus: string) => normalizeText(estatus || "").includes("resuelt");

type SortOption = "recientes" | "antiguos";

export function FallasAreaDashboard({ ubicacion, area }: { ubicacion: string; area: string }) {
  const { fallas, isLoadingFallas } = useAreaFallas(ubicacion, area);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [soloAbiertas, setSoloAbiertas] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recientes");
  const [visibleCount, setVisibleCount] = useState(25);

  const kpis = useMemo(() => {
    const now = new Date();
    const withinDays = (date: Date | null, days: number) => {
      if (!date) return false;
      const diffMs = now.getTime() - date.getTime();
      return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
    };

    let abiertas = 0;
    const fallasPorVentana = { 30: 0, 60: 0, 120: 0, 360: 0 };

    for (const falla of fallas) {
      if (!esResuelta(falla.falla_estatus)) abiertas += 1;
      const fecha = parseFallaDate(falla.falla_fecha_hora || falla.created_at);
      for (const dias of [30, 60, 120, 360] as const) {
        if (withinDays(fecha, dias)) {
          fallasPorVentana[dias] += 1;
        }
      }
    }

    const ultimosComentarios = [...fallas]
      .filter((f) => f.falla_comentarios)
      .sort((a, b) => ((a.falla_fecha_hora || a.created_at) < (b.falla_fecha_hora || b.created_at) ? 1 : -1))
      .slice(0, 5);

    return {
      total: fallas.length,
      abiertas,
      fallasPorVentana,
      ultimosComentarios,
    };
  }, [fallas]);

  const filtered = useMemo(() => {
    const query = normalizeText(search.trim());
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    const result = fallas.filter((falla) => {
      if (soloAbiertas && esResuelta(falla.falla_estatus)) return false;

      const fecha = parseFallaDate(falla.falla_fecha_hora || falla.created_at);
      if (from && (!fecha || fecha < from)) return false;
      if (to && (!fecha || fecha > to)) return false;

      if (query) {
        const haystack = normalizeText(
          `${falla.falla || ""} ${falla.falla_objeto_afectado || ""} ${falla.falla_reporta_nombre || ""} ${
            falla.falla_comentarios || ""
          }`,
        );
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      const fechaA = a.falla_fecha_hora || a.created_at;
      const fechaB = b.falla_fecha_hora || b.created_at;
      return sortBy === "antiguos" ? (fechaA < fechaB ? -1 : 1) : fechaA < fechaB ? 1 : -1;
    });

    return result;
  }, [fallas, search, dateFrom, dateTo, soloAbiertas, sortBy]);

  const visible = filtered.slice(0, visibleCount);

  if (isLoadingFallas) {
    return (
      <div className="flex flex-col items-center gap-3 h-32 justify-center">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-sm text-gray-500">Cargando fallas...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="flex flex-wrap gap-3">
        <KpiCard label="Fallas (360 días)" value={kpis.total} />
        <KpiCard label="Abiertas" value={kpis.abiertas} tone={kpis.abiertas > 0 ? "bad" : "good"} />
        <KpiCard label="Fallas 30 días" value={kpis.fallasPorVentana[30]} tone="warn" />
        <KpiCard label="Fallas 60 días" value={kpis.fallasPorVentana[60]} tone="warn" />
        <KpiCard label="Fallas 120 días" value={kpis.fallasPorVentana[120]} tone="warn" />
        <KpiCard label="Fallas 360 días" value={kpis.fallasPorVentana[360]} tone="warn" />
      </div>

      {/* Últimos comentarios */}
      {kpis.ultimosComentarios.length > 0 && (
        <div className="border border-gray-100 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Últimos comentarios
          </h4>
          <div className="flex flex-col gap-2">
            {kpis.ultimosComentarios.map((falla) => (
              <div key={falla.folio} className="text-sm text-gray-600 flex items-start justify-between gap-3">
                <span className="flex-1">{falla.falla_comentarios}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {falla.falla_fecha_hora || falla.created_at}
                </span>
              </div>
            ))}
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
            placeholder="Buscar por tipo de falla, reporta o comentario..."
            className="pl-9 h-9"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="recientes">Más recientes</option>
          <option value="antiguos">Más antiguos</option>
        </select>
        <button
          onClick={() => setSoloAbiertas((v) => !v)}
          className={`h-9 px-3 rounded-md text-sm font-semibold border whitespace-nowrap transition-colors ${
            soloAbiertas
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-white text-gray-600 border-input hover:bg-gray-50"
          }`}
        >
          Solo abiertas
        </button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 gap-2">
          <Wrench className="w-8 h-8 text-gray-300" />
          <span className="text-sm">No hay fallas que coincidan con la búsqueda.</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visible.map((falla) => (
              <FallaCard key={falla.folio} falla={falla} />
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

function FallaCard({ falla }: { falla: AreaFallaItem }) {
  const resuelta = esResuelta(falla.falla_estatus);
  const evidencias = falla.falla_evidencia?.length || 0;

  return (
    <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-800">
          {falla.falla || "Falla sin tipo"}
          {falla.falla_objeto_afectado ? ` · ${falla.falla_objeto_afectado}` : ""}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${
            resuelta
              ? "bg-green-50 text-green-600 border-green-100"
              : "bg-red-50 text-red-600 border-red-100"
          }`}
        >
          {falla.falla_estatus || (resuelta ? "Resuelta" : "Abierta")}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{falla.falla_fecha_hora || falla.created_at}</span>
        {falla.falla_reporta_nombre && <span>{falla.falla_reporta_nombre}</span>}
      </div>

      {falla.falla_comentarios && <p className="text-sm text-gray-600">{falla.falla_comentarios}</p>}

      {falla.falla_responsable_solucionar_nombre && (
        <p className="text-xs text-gray-500">
          Responsable: <span className="font-medium">{falla.falla_responsable_solucionar_nombre}</span>
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5" /> {evidencias} evidencia{evidencias === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
