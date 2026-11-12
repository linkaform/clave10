"use client";

import React, { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { EMPLOYEE_QUICK, StatusChip, StatusIcon, getStatusConfig } from "../attendanceStatus";
import { AttendanceDay, EmployeeAttendance, cierreDia, horaSalida, horasDia, jornadaLabel, horasSolicitud, permisoParcial } from "../../reporte_asistencias/lib/employees";
import { DIAS, DIAS_3, sameDay, toISO } from "../../reporte_asistencias/lib/period";
import { EmployeeMetrics, LawAlert, asistTone, pctTone } from "../../reporte_asistencias/lib/metrics";
import { useNow } from "../../reporte_asistencias/lib/useNow";
import { AutoCloseMark } from "../drawerParts";
import { Avatar, Checkbox, Empty, Pager, T, fmtH, usePaged } from "./ui";

export type OpenDay = (employee: EmployeeAttendance, fecha: string) => void;

// ¿El estatus coincide con alguno de los filtros rápidos activos?
export const matchQuick = (active: string[], status?: string) =>
  !active.length || EMPLOYEE_QUICK.some(q => active.includes(q.key) && q.match.includes(status ?? "sin_registro"));

const hh = (v?: string | null) => v?.substring(11, 16);
const hhmm = (v?: string | null) => v?.substring(0, 5);

const sub = (emp: EmployeeAttendance, day?: AttendanceDay) => {
  const ubic = day?.ubicacion && day.ubicacion !== "Sin ubicación" ? day.ubicacion : emp.ubicaciones[0];
  return [ubic, emp.departamento].filter(Boolean).join(" · ") || "Sin ubicación";
};

// Texto de la columna REGISTRO
const registroText = (emp: EmployeeAttendance, day?: AttendanceDay) => {
  switch (day?.status) {
    case "falta":
      return "Sin registro";
    case "vacaciones":
    case "incapacidad":
    case "permiso":
    case "home_office":
    case "trabajo_fuera":
      return "Justificado";
    case "dia_libre":
      return day.fecha_inicio ? "Trabajó en día de descanso" : "Día no laboral";
    case "por_llegar":
      return emp.jornada?.hora_entrada ? `Entrada a las ${hhmm(emp.jornada.hora_entrada)}` : "---";
    case "sin_registro":
    case undefined:
      return "---";
    default:
      return day?.ubicacion && day.ubicacion !== "Sin ubicación" ? day.ubicacion : emp.ubicaciones.join(", ") || "---";
  }
};

const ESTATUS_ENTRADA: Record<string, string> = { presente: "text-green-700", en_turno: "text-green-700", retardo: "text-amber-700", sin_salida: "text-green-700" };

// ───────── Calendario · Día: tarjetas agrupadas por hora de entrada ─────────
export const EmployeeDayCalendar = ({ employees, date, quick, onOpenDay }: { employees: EmployeeAttendance[]; date: Date; quick: string[]; onOpenDay: OpenDay }) => {
  const fecha = toISO(date);
  const isToday = sameDay(date, new Date());
  const { buckets, hours } = useMemo(() => {
    const b = new Map<number, { emp: EmployeeAttendance; day?: AttendanceDay; time?: string }[]>();
    employees.forEach(emp => {
      const day = emp.dias[fecha];
      const time = hh(day?.fecha_inicio) ?? (day?.status === "por_llegar" ? hhmm(emp.jornada?.hora_entrada) : undefined);
      const key = time ? Number(time.slice(0, 2)) : -1;
      b.set(key, [...(b.get(key) ?? []), { emp, day, time }]);
    });
    b.forEach(list => list.sort((x, y) => (x.time ?? "").localeCompare(y.time ?? "") || x.emp.nombre.localeCompare(y.emp.nombre)));
    const hs = Array.from(b.keys()).filter(k => k >= 0);
    const range = hs.length ? Array.from({ length: Math.max(...hs) - Math.min(...hs) + 1 }, (_, i) => Math.min(...hs) + i) : [];
    return { buckets: b, hours: b.has(-1) ? [-1, ...range] : range };
  }, [employees, fecha]);

  if (!employees.length) return <Empty />;
  return (
    <div className="flex flex-col">
      <div className="flex justify-center border-b border-c10-line py-3">
        <div className="flex flex-col items-center gap-1">
          <span className={`text-[11px] font-semibold uppercase tracking-[.05em] ${isToday ? "text-button-primary" : "text-c10-meta"}`}>{DIAS_3[date.getDay()]}</span>
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold tabular-nums ${isToday ? "bg-button-primary text-white" : "text-c10-title"}`}>{date.getDate()}</span>
        </div>
      </div>
      {hours.map(h => {
        const list = buckets.get(h) ?? [];
        return (
          <div key={h} className={`grid grid-cols-[96px_minmax(0,1fr)] border-b border-c10-line last:border-b-0 ${h === -1 ? "bg-c10-panel" : ""}`}>
            <span className="px-3 py-3 text-xs text-c10-meta tabular-nums">{h === -1 ? "Sin registro de ingreso" : `${String(h).padStart(2, "0")}:00`}</span>
            <div className="flex min-h-[52px] flex-wrap gap-2 p-2">
              {list.map(({ emp, day, time }) => (
                <button
                  key={emp.employee_id}
                  type="button"
                  onClick={() => onOpenDay(emp, fecha)}
                  style={{ opacity: matchQuick(quick, day?.status) ? 1 : 0.22 }}
                  aria-label={`${emp.nombre}: ${getStatusConfig(day?.status).label}`}
                  className="flex w-[264px] max-w-full items-start gap-2.5 rounded-xl bg-c10-sunken p-2.5 text-left transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(15,23,42,.06),0_14px_30px_rgba(15,23,42,.12)]"
                >
                  <Avatar name={emp.nombre} size={32} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <b className="truncate text-[13px] font-semibold text-c10-title">{emp.nombre}</b>
                      {time && day?.fecha_inicio && <b className="flex-none text-[13px] font-semibold tabular-nums text-c10-title">{time}</b>}
                    </span>
                    <span className="truncate text-xs text-c10-secondary">{sub(emp, day)}</span>
                    <span><StatusChip status={day?.status} /></span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ───────── Calendario · Semana/Quincena/Mes: empleados × días ─────────
export const EmployeePeriodGrid = ({ employees, days, quick, metrics, onOpenDay }: {
  employees: EmployeeAttendance[]; days: Date[]; quick: string[]; metrics: Map<number, EmployeeMetrics>; onOpenDay: OpenDay;
}) => {
  const today = new Date();
  if (!employees.length) return <Empty />;
  const size = days.length > 7 ? 22 : 28;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-[2] min-w-[200px] bg-c10-surface px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary">Empleado</th>
            {days.map(d => {
              const isToday = sameDay(d, today);
              return (
                <th key={toISO(d)} className={`min-w-[30px] px-0.5 py-1.5 text-center ${isToday ? "bg-c10-blue-subtle" : ""}`}>
                  <span className={`block text-[10px] font-semibold uppercase ${isToday ? "text-button-primary" : "text-c10-meta"}`}>{DIAS_3[d.getDay()]}</span>
                  <span className={`mx-auto mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums ${isToday ? "bg-button-primary text-white" : "text-c10-title"}`}>{d.getDate()}</span>
                </th>
              );
            })}
            <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary">Asist.</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => {
            const pct = metrics.get(emp.employee_id)?.asistPct;
            return (
              <tr key={emp.employee_id} className="group">
                <td className="sticky left-0 z-[1] border-t border-c10-line bg-c10-surface px-3 py-2 group-hover:bg-c10-panel">
                  <span className="flex items-center gap-2.5">
                    <Avatar name={emp.nombre} size={28} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-c10-title">{emp.nombre}</span>
                      <span className="block truncate text-xs text-c10-meta">{emp.departamento || emp.ubicaciones[0] || "---"}</span>
                    </span>
                  </span>
                </td>
                {days.map(d => {
                  const fecha = toISO(d);
                  const day = emp.dias[fecha];
                  const parcial = permisoParcial(day);
                  const label = `${getStatusConfig(day?.status).label}${parcial ? ` · permiso ${horasSolicitud(parcial)}` : ""}`;
                  const pending = !day || day.status === "sin_registro";
                  return (
                    <td key={fecha} className={`border-t border-c10-line px-0.5 py-1.5 text-center group-hover:bg-c10-panel ${sameDay(d, today) ? "bg-c10-blue-subtle" : ""}`}>
                      {pending ? (
                        <span className="text-c10-faint">-</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenDay(emp, fecha)}
                          style={{ opacity: matchQuick(quick, day.status) ? 1 : 0.22 }}
                          className="relative inline-flex rounded-md p-0 hover:outline hover:outline-2 hover:outline-offset-1 hover:outline-button-primary"
                          title={label}
                          aria-label={`${emp.nombre}, ${DIAS[d.getDay()]} ${d.getDate()}: ${label}`}
                        >
                          <StatusIcon status={day.status} size={size} />
                          {parcial && <i className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-pink-600" />}
                        </button>
                      )}
                    </td>
                  );
                })}
                <td className={`border-t border-c10-line px-3 py-2 text-right text-[13px] font-semibold tabular-nums group-hover:bg-c10-panel ${pct != null ? asistTone(pct) : "text-c10-faint"}`}>
                  {pct != null ? `${Math.round(pct)}%` : "---"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Selección + orden A–Z/Z–A compartidos por las tablas de empleados
const useTableState = (employees: EmployeeAttendance[], resetKey: unknown) => {
  const [asc, setAsc] = useState(true);
  const sorted = useMemo(() => [...employees].sort((a, b) => (asc ? 1 : -1) * a.nombre.localeCompare(b.nombre)), [employees, asc]);
  const paged = usePaged(sorted, resetKey);
  return { asc, setAsc, paged };
};

export type Selection = { ids: number[]; set: (ids: number[]) => void };

const HeadCheck = ({ rows, sel }: { rows: EmployeeAttendance[]; sel: Selection }) => {
  const ids = rows.map(r => r.employee_id);
  const n = ids.filter(id => sel.ids.includes(id)).length;
  return (
    <Checkbox
      label="Seleccionar todos"
      checked={n > 0 && n === ids.length}
      indeterminate={n > 0 && n < ids.length}
      onChange={() => sel.set(n === ids.length ? sel.ids.filter(id => !ids.includes(id)) : Array.from(new Set([...sel.ids, ...ids])))}
    />
  );
};

const RowCheck = ({ id, sel, name }: { id: number; sel: Selection; name: string }) => (
  <Checkbox label={`Seleccionar a ${name}`} checked={sel.ids.includes(id)} onChange={() => sel.set(sel.ids.includes(id) ? sel.ids.filter(x => x !== id) : [...sel.ids, id])} />
);

const NameHead = ({ asc, setAsc }: { asc: boolean; setAsc: (v: boolean) => void }) => (
  <button type="button" onClick={() => setAsc(!asc)} title={asc ? "Ordenar Z–A" : "Ordenar A–Z"} className="inline-flex items-center gap-1.5 uppercase hover:text-button-primary">
    Empleado <ArrowUpDown size={13} aria-hidden="true" />
  </button>
);

const PctBar = ({ pct }: { pct: number | null }) => {
  if (pct == null) return <span className="text-c10-faint">---</span>;
  const tone = pctTone(pct);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-c10-sunken"><i className={`block h-full ${tone.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} /></span>
      <b className={`text-[13px] font-semibold tabular-nums ${tone.text}`}>{Math.round(pct)}%</b>
    </span>
  );
};

// ───────── Tabla · Día ─────────
export const EmployeeDayTable = ({ employees, date, sel, onOpenDay }: { employees: EmployeeAttendance[]; date: Date; sel: Selection; onOpenDay: OpenDay }) => {
  const fecha = toISO(date);
  const now = useNow();
  const isToday = sameDay(date, now);
  const { asc, setAsc, paged } = useTableState(employees, `${fecha}|${employees.length}`);
  if (!employees.length) return <Empty />;
  return (
    <>
      <div className={T.box}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${T.th} w-10`}><HeadCheck rows={paged.slice} sel={sel} /></th>
              <th className={T.th}><NameHead asc={asc} setAsc={setAsc} /></th>
              <th className={T.th}>Jornada</th>
              <th className={T.th}>Entrada</th>
              <th className={T.th}>Salida</th>
              <th className={`${T.th} text-right`}>Horas</th>
              <th className={T.th}>% del día</th>
              <th className={T.th}>Estatus</th>
              <th className={T.th}>Registro</th>
            </tr>
          </thead>
          <tbody>
            {paged.slice.map(emp => {
              const day = emp.dias[fecha];
              const enCurso = isToday && !!day?.fecha_inicio && !day?.closed;
              const h = horasDia(emp, day, enCurso, now);
              const pct = h.trabajadas != null && h.esperadas && !enCurso ? (h.trabajadas / h.esperadas) * 100 : null;
              const cierre = cierreDia(emp, day);
              return (
                <tr key={emp.employee_id} onClick={() => onOpenDay(emp, fecha)} className="cursor-pointer hover:bg-c10-panel">
                  <td className={T.td}><RowCheck id={emp.employee_id} sel={sel} name={emp.nombre} /></td>
                  <td className={T.td}>
                    <div className="font-semibold text-c10-title">{emp.nombre}</div>
                    <div className="text-xs text-c10-meta">{emp.departamento || emp.ubicaciones[0] || "---"}</div>
                  </td>
                  <td className={`${T.td} text-c10-label`}>{jornadaLabel(emp.jornada) || "---"}</td>
                  <td className={`${T.td} font-semibold tabular-nums ${ESTATUS_ENTRADA[day?.status ?? ""] ?? "text-c10-faint"}`}>{hh(day?.fecha_inicio) || "---"}</td>
                  <td className={`${T.td} tabular-nums text-c10-label`}>
                    {horaSalida(day) || (enCurso ? "En turno" : "---")}
                    {cierre && <AutoCloseMark text={cierre.texto} label={cierre.label} />}
                  </td>
                  <td className={`${T.td} ${T.num} font-semibold`}>
                    {h.trabajadas != null ? <>{fmtH(h.trabajadas)}{enCurso && <span className="ml-1 text-xs font-normal text-c10-meta">en curso</span>}</> : "---"}
                  </td>
                  <td className={T.td}><PctBar pct={pct} /></td>
                  <td className={T.td}><StatusChip status={day?.status} /></td>
                  <td className={`${T.td} text-c10-label`}>{registroText(emp, day)}</td>
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

// Chips de alertas de ley (máx. 2 visibles, el resto en el tooltip)
const AlertChips = ({ alerts }: { alerts: LawAlert[] }) => {
  if (!alerts.length) return <span className="text-c10-faint">---</span>;
  const title = alerts.map(a => `${a.level === "alerta" ? "Alerta" : "Aviso"} · ${a.week}: ${a.text}. ${a.explain}`).join("\n");
  return (
    <span className="inline-flex flex-wrap items-center gap-1" title={title}>
      {alerts.slice(0, 2).map((a, i) => (
        <span key={i} className={`inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold ${a.level === "alerta" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 3 2 21h20L12 3z" /><path d="M12 10v5M12 18v.5" /></svg>
          {a.text}
        </span>
      ))}
      {alerts.length > 2 && <span className="text-xs font-semibold text-c10-meta">+{alerts.length - 2}</span>}
    </span>
  );
};

const COUNT_COLS: { key: keyof EmployeeMetrics["resumen"]; status: string; label: string }[] = [
  { key: "asistencias", status: "presente", label: "Asistencias" },
  { key: "retardos", status: "retardo", label: "Retardos" },
  { key: "faltas", status: "falta", label: "Faltas" },
  { key: "sin_salida", status: "sin_salida", label: "Sin salida" },
  { key: "vacaciones", status: "vacaciones", label: "Vacaciones" },
  { key: "incapacidades", status: "incapacidad", label: "Incapacidades" },
  { key: "permisos", status: "permiso", label: "Permisos" },
  { key: "fuera_oficina", status: "home_office", label: "Fuera de oficina" },
  { key: "descansos", status: "dia_libre", label: "Descansos" },
];

// ───────── Tabla · Semana/Quincena/Mes/Año ─────────
export const EmployeePeriodTable = ({ employees, metrics, quincena, sel, resetKey, onSelectEmployee }: {
  employees: EmployeeAttendance[]; metrics: Map<number, EmployeeMetrics>; quincena: boolean; sel: Selection; resetKey: unknown; onSelectEmployee: (nombre: string) => void;
}) => {
  const { asc, setAsc, paged } = useTableState(employees, resetKey);
  if (!employees.length) return <Empty />;
  const cols = COUNT_COLS.filter(c => c.key !== "fuera_oficina" || employees.some(e => (metrics.get(e.employee_id)?.resumen.fuera_oficina ?? 0) > 0));
  return (
    <>
      <div className={T.box}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${T.th} sticky left-0 z-[2] w-10`}><HeadCheck rows={paged.slice} sel={sel} /></th>
              <th className={`${T.th} sticky left-10 z-[2]`}><NameHead asc={asc} setAsc={setAsc} /></th>
              {quincena && <th className={`${T.th} text-right`}>Días laborales</th>}
              {cols.map(c => (
                <th key={c.key} className={`${T.th} text-right`}>
                  <span className="inline-flex items-center gap-1.5"><StatusIcon status={c.status} size={18} />{c.label}</span>
                </th>
              ))}
              <th className={`${T.th} text-right`}>Horas</th>
              <th className={T.th}>% horas</th>
              <th className={`${T.th} text-right`}>Extra</th>
              {quincena && <th className={`${T.th} text-right`}>Días a pagar</th>}
              {quincena && <th className={`${T.th} text-right`}>Extra triple</th>}
              <th className={T.th}>Alertas de ley</th>
              {quincena && <th className={T.th}>Revisión</th>}
            </tr>
          </thead>
          <tbody>
            {paged.slice.map(emp => {
              const m = metrics.get(emp.employee_id)!;
              return (
                <tr key={emp.employee_id} className="group hover:bg-c10-panel">
                  <td className={`${T.td} sticky left-0 z-[1] bg-c10-surface group-hover:bg-c10-panel`}><RowCheck id={emp.employee_id} sel={sel} name={emp.nombre} /></td>
                  <td className={`${T.td} sticky left-10 z-[1] bg-c10-surface group-hover:bg-c10-panel`}>
                    <button type="button" title="Ver sus días" onClick={() => onSelectEmployee(emp.nombre)} className="group/name text-left">
                      <div className="font-semibold text-c10-title group-hover/name:text-button-primary group-hover/name:underline">{emp.nombre}</div>
                      <div className="text-xs text-c10-meta">{emp.departamento || jornadaLabel(emp.jornada) || "---"}</div>
                    </button>
                  </td>
                  {quincena && <td className={`${T.td} ${T.num}`}>{m.laborales || "–"}</td>}
                  {cols.map(c => {
                    const v = m.resumen[c.key];
                    const tone = !v ? "text-c10-faint" : c.key === "faltas" ? "font-semibold text-red-700" : c.key === "sin_salida" ? "font-semibold text-orange-700" : "";
                    return <td key={c.key} className={`${T.td} ${T.num} ${tone}`}>{v || "–"}</td>;
                  })}
                  <td className={`${T.td} ${T.num} font-semibold`}>{m.horasVivo ? fmtH(m.horasVivo) : "–"}</td>
                  <td className={T.td}><PctBar pct={m.pct} /></td>
                  <td className={`${T.td} ${T.num} ${m.extra ? "font-semibold text-c10-title" : "text-c10-faint"}`}>{m.extra ? fmtH(m.extra) : "–"}</td>
                  {quincena && <td className={`${T.td} ${T.num} font-semibold`}>{m.aPagar}</td>}
                  {quincena && <td className={`${T.td} ${T.num} ${m.triple ? "font-semibold text-red-700" : "text-c10-faint"}`}>{m.triple ? fmtH(m.triple) : "–"}</td>}
                  <td className={T.td}><AlertChips alerts={m.alerts} /></td>
                  {quincena && (
                    <td className={T.td}>
                      <span className={`inline-flex h-[22px] items-center rounded-full px-[9px] text-[11px] font-semibold ${m.revisar ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {m.revisar ? "Revisar" : "Listo"}
                      </span>
                    </td>
                  )}
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
