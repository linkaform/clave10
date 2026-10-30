import React from "react";
import { ShiftStatusIcon, getShiftConfig } from "./attendanceStatus";
import { OPENED, ShiftRow, ShiftSelection, groupShifts, initials, turnoLabel } from "../reporte_asistencias/lib/shifts";
import { DIAS, DIAS_CORTOS, sameDay, toISO } from "../reporte_asistencias/lib/period";

interface LocationPeriodViewProps {
  rows: ShiftRow[];
  days: Date[];
  mode: "cal" | "table";
  onOpenShift: (selection: ShiftSelection) => void;
}

const th = "whitespace-nowrap bg-[#DBEAFE] px-3 py-2.5 text-left text-xs font-bold tracking-[.03em] text-[#192A4E]";
const td = "whitespace-nowrap border-t border-[#E2E8F0] px-3 py-[9px]";

// Celda del calendario: iniciales de quien abrió, × si nadie abrió
const ShiftCell = ({ status, nombre, size }: { status: string; nombre?: string; size: number }) => {
  const config = getShiftConfig(status);
  if (!nombre) return <ShiftStatusIcon status={status} size={size} />;
  return (
    <span
      className={`inline-flex flex-none items-center justify-center rounded-[7px] border border-transparent text-[10px] font-bold tracking-[.02em] ${config.className}`}
      style={{ width: size, height: size }}
    >
      {initials(nombre)}
    </span>
  );
};

const PctCell = ({ done, total }: { done: number; total: number }) => {
  if (!total) return <span className="text-xs text-[#64748B]">—</span>;
  const p = Math.round((done / total) * 100);
  const color = p < 90 ? "bg-[#DC2626]" : "bg-[#16A34A]";
  return (
    <span className="inline-flex items-center gap-2" title={`${done} de ${total} turnos abiertos`}>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#F1F5F9]"><i className={`block h-full ${color}`} style={{ width: `${Math.min(p, 100)}%` }} /></span>
      <b className="tabular-nums">{p}%</b>
    </span>
  );
};

export const LocationPeriodView: React.FC<LocationPeriodViewProps> = ({ rows, days, mode, onOpenShift }) => {
  const today = new Date();
  const fechas = days.map(toISO);
  const inPeriod = (row: ShiftRow) => row.dias.filter(d => fechas.includes(d.fecha));
  const total = (k: keyof ShiftRow["resumen"]) => rows.reduce((n, r) => n + r.resumen[k], 0);
  const programados = total("programados");
  const abiertos = total("a_tiempo") + total("tarde") + total("en_curso") + total("sin_cierre");
  const groups = groupShifts(rows);

  if (mode === "cal") {
    const size = days.length > 7 ? 26 : 32;
    return (
      <div className="flex flex-col gap-3.5">
        <span className="text-xs text-[#64748B]">Cada cuadro muestra las iniciales de quien abrió el turno. Haz clic para ver hora, fotos y cierre.</span>
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${th} sticky left-0 z-[1] min-w-[170px]`}>CASETA</th>
                <th className={`${th} min-w-[120px]`}>TURNO</th>
                {days.map(d => (
                  <th key={toISO(d)} className={`min-w-[30px] px-0.5 py-1.5 text-center text-[11px] font-bold ${sameDay(d, today) ? "bg-[#2F80ED] text-white" : "bg-[#DBEAFE] text-[#192A4E]"}`}>
                    {String(d.getDate()).padStart(2, "0")}
                    <small className="block font-normal">{DIAS_CORTOS[d.getDay()]}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <React.Fragment key={g.ubicacion}>
                  <tr>
                    <td colSpan={days.length + 2} className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[13px] font-bold text-[#0F172A]">
                      {g.ubicacion} <span className="text-xs font-normal text-[#64748B]">· {g.casetas.length} {g.casetas.length === 1 ? "caseta" : "casetas"}</span>
                    </td>
                  </tr>
                  {g.casetas.map(c =>
                    c.rows.map((row, k) => (
                      <tr key={`${c.caseta}|${turnoLabel(row)}`}>
                        {k === 0 && (
                          <td rowSpan={c.rows.length} className={`${td} sticky left-0 z-[1] bg-white align-top font-bold text-[#0F172A]`}>{c.caseta}</td>
                        )}
                        <td className={`${td} text-[13px]`}>{turnoLabel(row)}</td>
                        {inPeriod(row).map(day => {
                          const d = days[fechas.indexOf(day.fecha)];
                          const opener = OPENED.includes(day.status) ? day.guardias[0]?.nombre : undefined;
                          const label = `${c.caseta}, ${DIAS[d.getDay()]} ${d.getDate()}: ${getShiftConfig(day.status).label}${opener ? ` · ${opener}` : ""}`;
                          return (
                            <td key={day.fecha} className="border-t border-[#E2E8F0] px-0.5 py-1.5 text-center">
                              {day.status === "pendiente" ? (
                                <ShiftCell status={day.status} size={size} />
                              ) : (
                                <button type="button" title={label} aria-label={label} onClick={() => onOpenShift({ row, day })} className="inline-flex rounded-[7px] border-none bg-transparent p-0 hover:outline hover:outline-2 hover:outline-offset-1 hover:outline-[#2F80ED]">
                                  <ShiftCell status={day.status} nombre={opener} size={size} />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const chip = "inline-flex h-9 items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3.5 text-[#475569]";
  const sinAbrir = total("sin_abrir");
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={chip}>Turnos programados <strong className="tabular-nums text-[#0F172A]">{programados}</strong></span>
        <span className={chip}><ShiftStatusIcon status="a_tiempo" size={20} />A tiempo <strong className="tabular-nums text-[#0F172A]">{total("a_tiempo")}</strong></span>
        <span className={chip}><ShiftStatusIcon status="tarde" size={20} />Tarde <strong className="tabular-nums text-[#0F172A]">{total("tarde")}</strong></span>
        <span className={`${chip} ${sinAbrir ? "!border-[#DC2626] !text-[#DC2626]" : ""}`}><ShiftStatusIcon status="sin_abrir" size={20} />Sin abrir <strong className="tabular-nums">{sinAbrir}</strong></span>
        <span className={chip}>Cobertura <strong className="tabular-nums text-[#0F172A]">{programados ? Math.round((abiertos / programados) * 100) : 0}%</strong></span>
        <span className="text-xs text-[#64748B]">Cobertura = turnos abiertos ÷ turnos programados.</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>CASETA</th>
              <th className={th}>TURNO</th>
              <th className={`${th} text-right`}>PROGRAMADOS</th>
              {([["a_tiempo", "A TIEMPO"], ["tarde", "TARDE"], ["sin_abrir", "SIN ABRIR"], ["sin_cierre", "SIN CIERRE"]] as const).map(([s, l]) => (
                <th key={s} className={`${th} text-right`}><span className="inline-flex items-center gap-1.5"><ShiftStatusIcon status={s} size={18} />{l}</span></th>
              ))}
              <th className={th}>COBERTURA</th>
              <th className={th}>INICIARON TURNO</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <React.Fragment key={g.ubicacion}>
                <tr><td colSpan={9} className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 font-bold text-[#0F172A]">{g.ubicacion}</td></tr>
                {g.casetas.map(c =>
                  c.rows.map(row => {
                    const r = row.resumen;
                    const abiertosRow = r.a_tiempo + r.tarde + r.en_curso + r.sin_cierre;
                    const guardias = Array.from(new Set(row.dias.filter(d => OPENED.includes(d.status)).map(d => d.guardias[0]?.nombre).filter(Boolean)));
                    return (
                      <tr key={`${c.caseta}|${turnoLabel(row)}`} className="hover:bg-[#F8FAFC]">
                        <td className={`${td} font-bold text-[#0F172A]`}>{c.caseta}</td>
                        <td className={`${td} tabular-nums`}>{turnoLabel(row)}</td>
                        <td className={`${td} text-right tabular-nums`}>{r.programados}</td>
                        <td className={`${td} text-right tabular-nums`}>{r.a_tiempo || "—"}</td>
                        <td className={`${td} text-right tabular-nums text-[#92400E]`}>{r.tarde || "—"}</td>
                        <td className={`${td} text-right tabular-nums ${r.sin_abrir ? "font-bold text-[#DC2626]" : ""}`}>{r.sin_abrir || "—"}</td>
                        <td className={`${td} text-right tabular-nums ${r.sin_cierre ? "font-bold text-[#9A3412]" : ""}`}>{r.sin_cierre || "—"}</td>
                        <td className={td}><PctCell done={abiertosRow} total={r.programados} /></td>
                        <td className={`${td} whitespace-normal text-[#475569]`}>{guardias.join(", ") || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
