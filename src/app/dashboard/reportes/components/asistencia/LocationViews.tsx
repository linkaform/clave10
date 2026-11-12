"use client";

import React, { useMemo } from "react";
import { ShiftStatusChip, ShiftStatusIcon, getShiftConfig } from "../attendanceStatus";
import { OPENED, ShiftDay, ShiftRow, ShiftSelection, groupShifts, minutosDiferencia, siguienteInicio, turnoLabel } from "../../reporte_asistencias/lib/shifts";
import { DIAS, DIAS_3, sameDay, toISO } from "../../reporte_asistencias/lib/period";
import { formatHoras, horaSalida, horasTrabajadas, tipoCierre } from "../../reporte_asistencias/lib/employees";
import { useNow } from "../../reporte_asistencias/lib/useNow";
import { AutoCloseMark } from "../drawerParts";
import { Avatar, Empty, Pager, T, initials, usePaged } from "./ui";

type OpenShift = (s: ShiftSelection) => void;

// Estatus para filtros rápidos: "En curso" cuenta como abierto a tiempo o tarde
export const shiftQuickKey = (day: ShiftDay) => {
  if (day.status !== "en_curso") return day.status;
  const g = day.guardias[0];
  return g?.status === "retardo" || g?.status === "falta_por_retardo" ? "tarde" : "a_tiempo";
};
export const matchShift = (active: string[], day?: ShiftDay) => !active.length || (!!day && active.includes(shiftQuickKey(day)));

const hh = (v?: string | null) => v?.substring(11, 16);
const hhmm = (v?: string | null) => v?.substring(0, 5);

// ───────── Calendario · Día: turnos agrupados por hora de apertura ─────────
export const LocationDayCalendar = ({ rows, date, quick, onOpenShift }: { rows: ShiftRow[]; date: Date; quick: string[]; onOpenShift: OpenShift }) => {
  const fecha = toISO(date);
  const isToday = sameDay(date, new Date());
  const items = useMemo(() => rows
    .map(row => ({ row, day: row.dias.find(d => d.fecha === fecha) }))
    .filter((x): x is { row: ShiftRow; day: ShiftDay } => !!x.day && x.day.status !== "descanso" && x.day.status !== "pendiente")
    .map(x => {
      const opener = OPENED.includes(x.day.status) ? x.day.guardias[0] : undefined;
      const time = hh(opener?.fecha_inicio) ?? hhmm(x.row.hora_entrada) ?? "";
      return { ...x, opener, time };
    })
    .sort((a, b) => a.time.localeCompare(b.time)), [rows, fecha]);

  // Casetas sin ningún turno abierto ahora (solo hoy)
  const sinTurno = isToday
    ? Array.from(new Set(items.map(x => `${x.row.ubicacion}|${x.row.caseta}`)))
      .filter(k => !items.some(x => `${x.row.ubicacion}|${x.row.caseta}` === k && x.day.status === "en_curso"))
      .map(k => items.find(x => `${x.row.ubicacion}|${x.row.caseta}` === k && x.day.status === "sin_abrir"))
      .filter(Boolean) as typeof items
    : [];

  if (!items.length) return <Empty />;
  const hours = Array.from(new Set(items.map(x => Number(x.time.slice(0, 2)) || 0)));
  const range = Array.from({ length: Math.max(...hours) - Math.min(...hours) + 1 }, (_, i) => Math.min(...hours) + i);

  return (
    <div className="flex flex-col">
      {sinTurno.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-3">
          <b className="text-sm text-red-700">Casetas sin turno abierto</b>
          {sinTurno.map(x => (
            <button key={`${x.row.ubicacion}|${x.row.caseta}`} type="button" onClick={() => onOpenShift(x)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-c10-surface px-3 text-[13px] font-semibold text-red-700 hover:bg-red-100">
              <ShiftStatusIcon status="sin_abrir" size={18} />
              {x.row.ubicacion} · {x.row.caseta}
            </button>
          ))}
        </div>
      )}
      <div className="flex justify-center border-b border-c10-line py-3">
        <div className="flex flex-col items-center gap-1">
          <span className={`text-[11px] font-semibold uppercase tracking-[.05em] ${isToday ? "text-button-primary" : "text-c10-meta"}`}>{DIAS_3[date.getDay()]}</span>
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold tabular-nums ${isToday ? "bg-button-primary text-white" : "text-c10-title"}`}>{date.getDate()}</span>
        </div>
      </div>
      {range.map(h => {
        const list = items.filter(x => (Number(x.time.slice(0, 2)) || 0) === h);
        return (
          <div key={h} className="grid grid-cols-[96px_minmax(0,1fr)] border-b border-c10-line last:border-b-0">
            <span className="px-3 py-3 text-xs tabular-nums text-c10-meta">{String(h).padStart(2, "0")}:00</span>
            <div className="flex min-h-[52px] flex-wrap gap-2 p-2">
              {list.map(x => {
                const name = x.opener?.nombre ?? "";
                return (
                  <button
                    key={`${x.row.ubicacion}|${x.row.caseta}|${turnoLabel(x.row)}`}
                    type="button"
                    onClick={() => onOpenShift({ row: x.row, day: x.day })}
                    style={{ opacity: matchShift(quick, x.day) ? 1 : 0.22 }}
                    className="flex w-[264px] max-w-full items-start gap-2.5 rounded-xl bg-c10-sunken p-2.5 text-left transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(15,23,42,.06),0_14px_30px_rgba(15,23,42,.12)]"
                  >
                    <Avatar name={name} size={32} />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <b className="truncate text-[13px] font-semibold text-c10-title">{name || "Sin guardia"}</b>
                        {x.opener && <b className="flex-none text-[13px] font-semibold tabular-nums text-c10-title">{x.time}</b>}
                      </span>
                      <span className="truncate text-xs text-c10-secondary">{x.row.caseta} · {turnoLabel(x.row)}</span>
                      <span className="truncate text-xs text-c10-meta">{x.row.ubicacion}</span>
                      <span><ShiftStatusChip status={x.day.status} /></span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ───────── Tabla · Día (agrupada por planta) ─────────
export const LocationDayTable = ({ rows, date, onOpenShift }: { rows: ShiftRow[]; date: Date; onOpenShift: OpenShift }) => {
  const fecha = toISO(date);
  const now = useNow();
  const recs = rows
    .map(row => ({ row, day: row.dias.find(d => d.fecha === fecha) }))
    .filter((x): x is { row: ShiftRow; day: ShiftDay } => !!x.day && x.day.status !== "pendiente");
  if (!recs.length) return <Empty />;
  const groups = groupShifts(recs.map(x => x.row));
  return (
    <div className={T.box}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Ubicación", "Turno", "Estatus", "Inició turno", "Hora inicio", "Cerró turno", "Hora cierre"].map(h => <th key={h} className={T.th}>{h}</th>)}
            <th className={`${T.th} text-right`}>Horas</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(g => (
            <React.Fragment key={g.ubicacion}>
              <tr><td colSpan={8} className="border-t border-c10-line bg-c10-panel px-3 py-2 text-[13px] font-semibold text-c10-title">{g.ubicacion}</td></tr>
              {g.casetas.flatMap(c => c.rows).map(row => {
                const day = recs.find(x => x.row === row)!.day;
                const gd = OPENED.includes(day.status) ? day.guardias[0] : undefined;
                const diff = minutosDiferencia(row, gd);
                const auto = gd ? tipoCierre(gd.fecha_inicio, gd.fecha_cierre, siguienteInicio(row, gd), gd.cierre_automatico) : null;
                return (
                  <tr key={`${row.caseta}|${turnoLabel(row)}`} onClick={() => onOpenShift({ row, day })} className="cursor-pointer hover:bg-c10-panel">
                    <td className={T.td}><div className="font-semibold text-c10-title">{row.caseta}</div></td>
                    <td className={`${T.td} tabular-nums text-c10-label`}>{turnoLabel(row)}</td>
                    <td className={T.td}><ShiftStatusChip status={day.status} /></td>
                    <td className={T.td}>{gd?.nombre ?? "---"}</td>
                    <td className={`${T.td} font-semibold tabular-nums`}>
                      {gd ? hh(gd.fecha_inicio) : "---"}
                      {gd && diff != null && diff > 0 && <span className="ml-1 text-xs font-normal text-amber-700">(+{diff} min)</span>}
                    </td>
                    <td className={T.td}>{gd?.fecha_cierre ? gd.nombre : "---"}</td>
                    <td className={`${T.td} tabular-nums`}>
                      {gd?.fecha_cierre ? horaSalida({ fecha: day.fecha, dia: 0, status: day.status, fecha_cierre: gd.fecha_cierre }) : day.status === "en_curso" ? "En turno" : "---"}
                      {auto && <AutoCloseMark text={auto.texto} label={auto.label} />}
                    </td>
                    <td className={`${T.td} ${T.num}`}>{formatHoras(horasTrabajadas(gd?.fecha_inicio, gd?.fecha_cierre, day.status === "en_curso", now)) ?? "---"}</td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ───────── Calendario · periodo: caseta+turno × días ─────────
export const LocationPeriodGrid = ({ rows, days, quick, onOpenShift }: { rows: ShiftRow[]; days: Date[]; quick: string[]; onOpenShift: OpenShift }) => {
  const today = new Date();
  if (!rows.length) return <Empty />;
  const size = days.length > 7 ? 22 : 28;
  const groups = groupShifts(rows);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-[2] min-w-[220px] bg-c10-surface px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary">Caseta</th>
            {days.map(d => {
              const isToday = sameDay(d, today);
              return (
                <th key={toISO(d)} className={`min-w-[30px] px-0.5 py-1.5 text-center ${isToday ? "bg-c10-blue-subtle" : ""}`}>
                  <span className={`block text-[10px] font-semibold uppercase ${isToday ? "text-button-primary" : "text-c10-meta"}`}>{DIAS_3[d.getDay()]}</span>
                  <span className={`mx-auto mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums ${isToday ? "bg-button-primary text-white" : "text-c10-title"}`}>{d.getDate()}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {groups.map(g => (
            <React.Fragment key={g.ubicacion}>
              <tr><td colSpan={days.length + 1} className="sticky left-0 border-t border-c10-line bg-c10-panel px-3 py-2 text-[13px] font-semibold text-c10-title">{g.ubicacion}</td></tr>
              {g.casetas.flatMap(c => c.rows).map(row => (
                <tr key={`${row.caseta}|${turnoLabel(row)}`} className="group">
                  <td className="sticky left-0 z-[1] border-t border-c10-line bg-c10-surface px-3 py-2 group-hover:bg-c10-panel">
                    <div className="text-[13px] font-semibold text-c10-title">{row.caseta}</div>
                    <div className="text-xs tabular-nums text-c10-meta">{turnoLabel(row)}</div>
                  </td>
                  {days.map(d => {
                    const fecha = toISO(d);
                    const day = row.dias.find(x => x.fecha === fecha);
                    const opener = day && OPENED.includes(day.status) ? day.guardias[0] : undefined;
                    const cfg = getShiftConfig(day?.status);
                    const label = day ? `${cfg.label}${opener ? ` · ${opener.nombre} · ${hh(opener.fecha_inicio)}` : ""}` : "";
                    return (
                      <td key={fecha} className={`border-t border-c10-line px-0.5 py-1.5 text-center group-hover:bg-c10-panel ${sameDay(d, today) ? "bg-c10-blue-subtle" : ""}`}>
                        {!day || day.status === "pendiente" ? (
                          <span className="text-c10-faint">-</span>
                        ) : (
                          <button
                            type="button"
                            title={label}
                            aria-label={`${row.caseta}, ${DIAS[d.getDay()]} ${d.getDate()}: ${label}`}
                            onClick={() => onOpenShift({ row, day })}
                            style={{ opacity: matchShift(quick, day) ? 1 : 0.22 }}
                            className="inline-flex rounded-md p-0 hover:outline hover:outline-2 hover:outline-offset-1 hover:outline-button-primary"
                          >
                            {opener ? (
                              <span className={`inline-flex items-center justify-center rounded-md text-[10px] font-bold ${cfg.chip}`} style={{ width: size, height: size }}>{initials(opener.nombre)}</span>
                            ) : (
                              <ShiftStatusIcon status={day.status} size={size} />
                            )}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CovBar = ({ done, total }: { done: number; total: number }) => {
  if (!total) return <span className="text-c10-faint">---</span>;
  const p = Math.round((done / total) * 100);
  return (
    <span className="inline-flex items-center gap-2" title={`${done} de ${total} turnos abiertos`}>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-c10-sunken"><i className={`block h-full ${p < 90 ? "bg-red-600" : "bg-green-600"}`} style={{ width: `${Math.min(p, 100)}%` }} /></span>
      <b className={`text-[13px] font-semibold tabular-nums ${p < 90 ? "text-red-700" : "text-green-700"}`}>{p}%</b>
    </span>
  );
};

// Guardias que iniciaron turno en el periodo, del que más turnos tiene al que menos
const guardStats = (row: ShiftRow) => {
  const m = new Map<string, number>();
  row.dias.forEach(d => {
    const g = OPENED.includes(d.status) ? d.guardias[0] : undefined;
    if (g) m.set(g.nombre, (m.get(g.nombre) ?? 0) + 1);
  });
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};

// ───────── Tabla · periodo ─────────
export const LocationPeriodTable = ({ rows, resetKey }: { rows: ShiftRow[]; resetKey: unknown }) => {
  const flat = useMemo(() => groupShifts(rows).flatMap(g => g.casetas.flatMap(c => c.rows)), [rows]);
  const paged = usePaged(flat, resetKey);
  if (!rows.length) return <Empty />;
  const total = (k: keyof ShiftRow["resumen"]) => rows.reduce((n, r) => n + r.resumen[k], 0);
  const programados = total("programados");
  const abiertos = total("a_tiempo") + total("tarde") + total("en_curso") + total("sin_cierre");
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-c10-line px-3 py-2.5 text-sm text-c10-secondary">
        <span>Turnos programados <b className="tabular-nums text-c10-title">{programados}</b></span>
        <span>Cobertura <b className="tabular-nums text-c10-title">{programados ? Math.round((abiertos / programados) * 100) : 0}%</b></span>
        <span className="text-xs text-c10-meta">(turnos abiertos ÷ turnos programados)</span>
      </div>
      <div className={T.box}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={T.th}>Caseta</th>
              <th className={T.th}>Turno</th>
              <th className={`${T.th} text-right`}>Programados</th>
              {([["a_tiempo", "Abierto a tiempo"], ["tarde", "Abierto tarde"], ["sin_abrir", "Sin abrir"], ["sin_cierre", "Sin cierre"]] as const).map(([s, l]) => (
                <th key={s} className={`${T.th} text-right`}><span className="inline-flex items-center gap-1.5"><ShiftStatusIcon status={s} size={18} />{l}</span></th>
              ))}
              <th className={T.th}>Cobertura</th>
              <th className={T.th}>Iniciaron turno</th>
            </tr>
          </thead>
          <tbody>
            {paged.slice.map(row => {
              const r = row.resumen;
              const ab = r.a_tiempo + r.tarde + r.en_curso + r.sin_cierre;
              const gs = guardStats(row);
              return (
                <tr key={`${row.ubicacion}|${row.caseta}|${turnoLabel(row)}`} className="hover:bg-c10-panel">
                  <td className={T.td}>
                    <div className="font-semibold text-c10-title">{row.caseta}</div>
                    <div className="text-xs text-c10-meta">{row.ubicacion}</div>
                  </td>
                  <td className={`${T.td} tabular-nums text-c10-label`}>{turnoLabel(row)}</td>
                  <td className={`${T.td} ${T.num}`}>{r.programados}</td>
                  <td className={`${T.td} ${T.num} ${r.a_tiempo ? "" : "text-c10-faint"}`}>{r.a_tiempo || "–"}</td>
                  <td className={`${T.td} ${T.num} ${r.tarde ? "text-amber-700" : "text-c10-faint"}`}>{r.tarde || "–"}</td>
                  <td className={`${T.td} ${T.num} ${r.sin_abrir ? "font-semibold text-red-700" : "text-c10-faint"}`}>{r.sin_abrir || "–"}</td>
                  <td className={`${T.td} ${T.num} ${r.sin_cierre ? "font-semibold text-orange-700" : "text-c10-faint"}`}>{r.sin_cierre || "–"}</td>
                  <td className={T.td}><CovBar done={ab} total={r.programados} /></td>
                  <td className={T.td} title={gs.slice(0, 10).map(([n, c]) => `${n}: ${c} ${c === 1 ? "turno" : "turnos"}`).join("\n")}>
                    {gs.length ? (
                      <span className="inline-flex items-center gap-2">
                        <Avatar name={gs[0][0]} size={24} />
                        <span className="text-c10-title">{gs[0][0]}</span>
                        {gs.length > 1 && <span className="text-xs font-semibold text-c10-meta">+{gs.length - 1}</span>}
                      </span>
                    ) : <span className="text-c10-faint">---</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pager {...paged} />
    </>
  );
};

