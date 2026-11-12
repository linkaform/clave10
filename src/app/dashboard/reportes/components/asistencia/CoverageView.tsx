"use client";

import React from "react";
import { getPlazaConfig } from "../attendanceStatus";
import {
  Plaza,
  PlantillaRow,
  PlazasSelection,
  ordenPlazas,
  plantillaTurnoLabel,
  plazaQuickKey,
  plazasDe,
  resumenPlazas,
  turnoKey,
} from "../../reporte_asistencias/lib/plantilla";
import { DIAS, MESES, fromISO } from "../../reporte_asistencias/lib/period";
import { Empty } from "./ui";

export type CovFilter = "all" | "f" | "ok";

export type CovLocation = { ubicacion: string; rows: PlantillaRow[]; plazas: Plaza[] };

// Ubicaciones con las casetas del turno elegido
export const coverageLocations = (rows: PlantillaRow[], turno: string | undefined, fecha: string): CovLocation[] => {
  const m = new Map<string, PlantillaRow[]>();
  rows.filter(r => !turno || turnoKey(r) === turno).forEach(r => m.set(r.ubicacion, [...(m.get(r.ubicacion) ?? []), r]));
  return Array.from(m.entries())
    .map(([ubicacion, rs]) => ({
      ubicacion,
      rows: rs.slice().sort((a, b) => a.caseta.localeCompare(b.caseta, "es", { numeric: true })),
      plazas: plazasDe(rs, fecha),
    }))
    .filter(l => l.plazas.length > 0)
    .sort((a, b) => a.ubicacion.localeCompare(b.ubicacion, "es"));
};

export const plazasSubtitle = (ubicacion: string, fecha: string, turno?: string) => {
  const d = fromISO(fecha);
  return `${ubicacion} · ${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}${turno ? ` · ${turno}` : ""}`;
};

const tone = (plazas: Plaza[]) => {
  const r = resumenPlazas(plazas);
  if (r.sinEntrada) return "bg-red-100 text-red-700";
  if (r.total && r.entradas === r.total) return "bg-green-100 text-green-700";
  return "bg-slate-100 text-slate-600";
};

const CountPill = ({ label, plazas, total, onClick, title }: { label: string; plazas: Plaza[]; total?: boolean; onClick: () => void; title: string }) => {
  const r = resumenPlazas(plazas);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border border-c10-line pl-2.5 pr-1 text-xs transition-colors hover:border-button-primary ${total ? "bg-c10-panel font-semibold text-c10-title" : "bg-c10-surface font-medium text-c10-label"}`}
    >
      {label}
      <span className={`inline-flex h-5 items-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${tone(plazas)}`}>{r.entradas} de {r.total}</span>
    </button>
  );
};

// Barra de plazas: un segmento por plaza; los que no coinciden con el filtro rápido se atenúan
export const PlazaBar = ({ plazas, quick = [], height = 6 }: { plazas: Plaza[]; quick?: string[]; height?: number }) => (
  <span className="flex w-full gap-0.5" role="img" aria-label={`${resumenPlazas(plazas).entradas} de ${plazas.length} plazas con entrada`}>
    {ordenPlazas(plazas).map((p, i) => {
      const cfg = getPlazaConfig(p.status);
      return (
        <span
          key={i}
          title={`${p.rol || "Plaza"} · ${p.guardia || "Sin guardia"} · ${cfg.label}`}
          className={`flex-1 rounded-full ${cfg.bar}`}
          style={{ height, opacity: !quick.length || quick.includes(plazaQuickKey(p)) ? 1 : 0.2 }}
        />
      );
    })}
  </span>
);

// ───────── Cobertura · Día: plazas cubiertas por ubicación y caseta ─────────
export const CoverageView = ({ locations, fecha, turnoLabel, quick, onOpen }: {
  locations: CovLocation[];
  fecha: string;
  turnoLabel?: string;
  quick: string[];
  onOpen: (s: PlazasSelection) => void;
}) => {
  if (!locations.length) return <Empty>No hay plazas para este turno.</Empty>;
  return (
    <div className="columns-1 gap-0 p-0 [column-rule:1px_solid_var(--c10-line)] min-[900px]:columns-2">
      {locations.map(l => (
        <section key={l.ubicacion} className="flex break-inside-avoid flex-col gap-2.5 border-b border-c10-line px-4 py-3.5">
          <h3 className="m-0 text-[13px] font-semibold text-c10-title">{l.ubicacion}</h3>
          <div className="flex flex-wrap gap-1.5">
            {l.rows.map(r => (
              <CountPill
                key={r.caseta}
                label={r.caseta}
                plazas={plazasDe([r], fecha)}
                title={`${l.ubicacion} · ${r.caseta}`}
                onClick={() => onOpen({ title: r.caseta, subtitle: plazasSubtitle(l.ubicacion, fecha, turnoLabel), fecha, rows: [r] })}
              />
            ))}
            {l.rows.length > 1 && (
              <CountPill
                total
                label="Total"
                plazas={l.plazas}
                title={`${l.ubicacion} · Total`}
                onClick={() => onOpen({ title: l.ubicacion, subtitle: plazasSubtitle(`${l.rows.length} casetas`, fecha, turnoLabel), fecha, rows: l.rows })}
              />
            )}
          </div>
          <PlazaBar plazas={l.plazas} quick={quick} />
        </section>
      ))}
    </div>
  );
};

// Panel de filtros de Cobertura: turno + estatus de la ubicación
export const CoverageFilters = ({ turnos, turno, onTurno, filter, onFilter, counts }: {
  turnos: PlantillaRow[];
  turno?: string;
  onTurno: (k: string) => void;
  filter: CovFilter;
  onFilter: (f: CovFilter) => void;
  counts: Record<CovFilter, number>;
}) => !turnos.length ? null : (
  <>
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-c10-title">Turno</span>
      <select
        value={turno ?? ""}
        onChange={e => onTurno(e.target.value)}
        className="h-10 rounded-lg border border-c10-line bg-c10-surface px-3 text-sm text-c10-title outline-none focus:border-button-primary"
      >
        {turnos.map(t => <option key={turnoKey(t)} value={turnoKey(t)}>{plantillaTurnoLabel(t)}</option>)}
      </select>
    </label>
    <div className="border-t border-c10-sunken" />
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-c10-title">Estatus</span>
      <div className="flex flex-wrap gap-1.5">
        {([["all", "Todas"], ["f", "Con faltas"], ["ok", "Sin faltas"]] as const).map(([k, l]) => {
          const on = filter === k;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => onFilter(k)}
              className={`inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors ${on ? "bg-button-primary font-semibold text-white" : "bg-c10-sunken font-medium text-c10-label hover:bg-c10-blue-light"}`}
            >
              {l}
              <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums ${on ? "bg-white/25 text-white" : "bg-c10-surface text-c10-secondary"}`}>{counts[k]}</span>
            </button>
          );
        })}
      </div>
    </div>
  </>
);
