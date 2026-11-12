import React from "react";
import { PlazaStatusIcon } from "./attendanceStatus";
import { DrawerShell } from "./drawerParts";
import { PlazaBar } from "./asistencia/CoverageView";
import { Plaza, PlantillaRow, PlazasSelection, ordenPlazas, plantillaTurnoLabel, plazasDe, resumenPlazas } from "../reporte_asistencias/lib/plantilla";

const hhmm = (v?: string | null) => v?.substring(0, 5) ?? "";

const STATUS_TEXT: Record<Plaza["status"], string> = {
  A: "text-green-700",
  R: "text-amber-700",
  F: "text-red-700",
  PL: "text-c10-secondary",
  PE: "text-c10-meta",
};

const statusText = (p: Plaza, row: PlantillaRow) => {
  if (p.status === "A") return `Entrada ${hhmm(p.hora)}`;
  if (p.status === "R") return `Retardo · ${hhmm(p.hora)}`;
  if (p.status === "F") return "Sin entrada";
  if (p.status === "PL") return `Entra a las ${hhmm(row.hora_entrada)}`;
  return "Programado";
};

const entradasTone = (plazas: Plaza[]) => {
  const r = resumenPlazas(plazas);
  return r.sinEntrada ? "text-red-700" : r.total && r.entradas === r.total ? "text-green-700" : "text-c10-secondary";
};

const PlazaList = ({ row, plazas }: { row: PlantillaRow; plazas: Plaza[] }) => (
  <ul className="m-0 flex list-none flex-col p-0">
    {ordenPlazas(plazas).map((p, i) => (
      <li key={i} className="flex items-center gap-3 border-t border-c10-sunken py-2.5 first:border-t-0">
        <PlazaStatusIcon status={p.status} size={28} />
        <span className="flex min-w-0 flex-1 flex-col">
          <b className="truncate text-[13px] font-semibold text-c10-title">{p.guardia || "Sin guardia asignado"}</b>
          <span className="truncate text-xs text-c10-secondary">
            {p.rol || "Plaza"}
            {p.suplente && p.guardia_programado ? ` · cubre a ${p.guardia_programado}` : p.suplente ? " · suplente" : ""}
          </span>
          {p.sin_rol && <span className="text-xs text-amber-700" title="El check-in no trae rol; se cuenta en esta plaza">Sin rol registrado en el check-in</span>}
        </span>
        <span className={`flex-none text-xs font-semibold tabular-nums ${STATUS_TEXT[p.status]}`}>{statusText(p, row)}</span>
      </li>
    ))}
  </ul>
);

// Panel lateral con las plazas de una caseta (o de todas las casetas de una ubicación) en un día
export const PlazasDrawer = ({ selection, onClose }: { selection: PlazasSelection | null; onClose: () => void }) => {
  if (!selection) return null;
  const { rows, fecha } = selection;
  const all = plazasDe(rows, fecha);
  const r = resumenPlazas(all);
  const varias = rows.length > 1;
  const extras = rows.flatMap(row => row.dias.find(d => d.fecha === fecha)?.extras ?? []);
  const sum = [`${r.total} ${r.total === 1 ? "plaza programada" : "plazas programadas"}`, r.sinEntrada ? `${r.sinEntrada} sin entrada` : "", r.porLlegar ? `${r.porLlegar} por llegar` : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <DrawerShell labelledBy="plazas-title" onClose={onClose} title={selection.title} subtitle={selection.subtitle}>
      <div className="flex flex-col gap-2 rounded-xl bg-c10-surface p-5 shadow-[0_0_0_1px_var(--c10-line-card)]">
        <div className="flex items-center justify-between gap-3">
          <h3 className="m-0 text-base font-semibold text-c10-title">Guardias del día</h3>
          <b className={`text-sm font-semibold tabular-nums ${entradasTone(all)}`}>{r.entradas}/{r.total} entradas</b>
        </div>
        <PlazaBar plazas={all} height={6} />
        <span className="text-xs text-c10-secondary">{sum}</span>
      </div>
      {rows.map(row => {
        const plazas = plazasDe([row], fecha);
        return (
          <div key={`${row.caseta}|${row.horario}`} className="flex flex-col gap-1 rounded-xl bg-c10-surface px-5 py-3 shadow-[0_0_0_1px_var(--c10-line-card)]">
            <div className="flex items-center justify-between gap-3 py-1">
              <span className="text-[13px] font-semibold text-c10-title">{varias ? row.caseta : plantillaTurnoLabel(row)}</span>
              <span className={`text-xs font-semibold tabular-nums ${entradasTone(plazas)}`}>{resumenPlazas(plazas).entradas}/{plazas.length} entradas</span>
            </div>
            <PlazaList row={row} plazas={plazas} />
          </div>
        );
      })}
      {extras.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl bg-c10-surface px-5 py-3 shadow-[0_0_0_1px_var(--c10-line-card)]">
          <span className="py-1 text-[13px] font-semibold text-c10-title">Entradas fuera de la plantilla</span>
          {extras.map((e, i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-t border-c10-sunken py-2 text-[13px] first:border-t-0">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-c10-title">{e.guardia}</span>
                {!!e.roles?.length && <span className="truncate text-xs text-c10-secondary">{e.roles.join(", ")}</span>}
              </span>
              <span className="tabular-nums text-c10-secondary">Entrada {hhmm(e.hora)}</span>
            </div>
          ))}
        </div>
      )}
    </DrawerShell>
  );
};
