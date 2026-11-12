"use client";

import React from "react";
import { EMPLOYEE_QUICK, SHIFT_QUICK, getShiftConfig, getStatusConfig } from "../attendanceStatus";
import { EmployeeAttendance } from "../../reporte_asistencias/lib/employees";
import { OPENED, ShiftRow, turnoLabel } from "../../reporte_asistencias/lib/shifts";
import { DIAS, MESES, toISO } from "../../reporte_asistencias/lib/period";
import { shiftQuickKey } from "./LocationViews";
import { Empty } from "./ui";

type Serie = { key: string; label: string; bar: string; match: (s: string) => boolean };

const Section = ({ title, note, children, legend }: { title: string; note: string; children: React.ReactNode; legend?: Serie[] }) => (
  <section className="flex flex-col gap-4 rounded-2xl bg-c10-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,.04),0_6px_20px_rgba(15,23,42,.04)]">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="m-0 text-base font-semibold text-c10-title">{title}</h3>
        <p className="m-0 text-xs text-c10-meta">{note}</p>
      </div>
      {legend && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {legend.map(s => (
            <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-c10-secondary"><i className={`h-2.5 w-2.5 rounded-sm ${s.bar}`} />{s.label}</span>
          ))}
        </div>
      )}
    </div>
    {children}
  </section>
);

type BarRow = { key: string; label: string; sub?: string; counts: Record<string, number>; onClick?: () => void };

// Barras horizontales apiladas (una fila por empleado, departamento o caseta)
const StackedRows = ({ rows, series }: { rows: BarRow[]; series: Serie[] }) => {
  const total = (r: BarRow) => series.reduce((n, s) => n + (r.counts[s.key] ?? 0), 0);
  const max = Math.max(1, ...rows.map(total));
  const shown = rows.filter(r => total(r) > 0);
  if (!shown.length) return <Empty />;
  return (
    <div className="flex flex-col gap-2.5">
      {shown.map(r => {
        const t = total(r);
        const Tag = r.onClick ? "button" : "div";
        return (
          <Tag key={r.key} {...(r.onClick ? { type: "button" as const, onClick: r.onClick, title: "Ver solo este" } : {})} className="grid grid-cols-[minmax(120px,200px)_minmax(0,1fr)_40px] items-center gap-3 rounded-lg text-left hover:bg-c10-panel">
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-c10-title">{r.label}</span>
              {r.sub && <span className="block truncate text-[11px] text-c10-meta">{r.sub}</span>}
            </span>
            <span className="flex h-2.5 overflow-hidden rounded-full bg-c10-sunken">
              <span className="flex h-full" style={{ width: `${(t / max) * 100}%` }}>
                {series.map(s => {
                  const v = r.counts[s.key] ?? 0;
                  return v ? <i key={s.key} title={`${s.label}: ${v}`} className={`block h-full ${s.bar}`} style={{ width: `${(v / t) * 100}%` }} /> : null;
                })}
              </span>
            </span>
            <b className="text-right text-[13px] font-semibold tabular-nums text-c10-title">{t}</b>
          </Tag>
        );
      })}
    </div>
  );
};

type Bucket = { key: string; label: string; sub: string; title: string; values: (number | null)[] };

// Columnas por día (o por mes si el periodo es largo)
const Trend = ({ buckets, series, max, unit = "" }: { buckets: Bucket[]; series: Serie[]; max: number; unit?: string }) => (
  <div className="flex flex-col gap-1">
    <div className="relative flex h-48 items-end gap-[3px] border-b border-c10-line">
      <span className="absolute -top-1 left-0 text-[10px] tabular-nums text-c10-faint">{max}{unit}</span>
      <span className="absolute left-0 top-1/2 w-full border-t border-dashed border-c10-line" />
      {buckets.map(b => {
        const sum = b.values.reduce<number>((n, v) => n + (v ?? 0), 0);
        const fut = b.values.every(v => v == null);
        const tip = fut ? `${b.title}: por venir` : `${b.title}\n${series.map((s, i) => `${s.label}: ${b.values[i]}${unit}`).join("\n")}`;
        return (
          <span key={b.key} title={tip} className="flex h-full min-w-0 flex-1 flex-col-reverse">
            {!fut && series.map((s, i) => {
              const v = b.values[i] ?? 0;
              return v ? <i key={s.key} className={`block w-full first:rounded-b-none last:rounded-t ${s.bar}`} style={{ height: `${(v / max) * 100}%` }} /> : null;
            })}
            {!fut && !sum && <i className="block h-px w-full bg-c10-line-strong" />}
          </span>
        );
      })}
    </div>
    <div className="flex gap-[3px]">
      {buckets.map(b => (
        <span key={b.key} className="min-w-0 flex-1 text-center text-[10px] leading-tight text-c10-meta">
          {buckets.length <= 16 && <span className="block">{b.sub}</span>}
          <span className="block tabular-nums">{b.label}</span>
        </span>
      ))}
    </div>
  </div>
);

const niceMax = (v: number) => {
  const st = v <= 4 ? 1 : v <= 10 ? 2 : v <= 50 ? 5 : v <= 200 ? 20 : 100;
  return Math.max(st, Math.ceil(v / st) * st);
};

const MESC = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const D1 = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

// Agrupa los días del periodo: por día, o por mes si son más de 62
const groupDays = (days: Date[]) => {
  const today = toISO(new Date());
  const byMonth = days.length > 62;
  const groups: { key: string; label: string; sub: string; title: string; dates: string[] }[] = [];
  days.forEach(d => {
    const iso = toISO(d);
    if (iso > today) {
      if (!byMonth) groups.push({ key: iso, label: String(d.getDate()), sub: D1[d.getDay()], title: `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`, dates: [] });
      else if (!groups.find(g => g.key === `${d.getMonth()}`)) groups.push({ key: `${d.getMonth()}`, label: MESC[d.getMonth()], sub: "", title: MESES[d.getMonth()], dates: [] });
      return;
    }
    const key = byMonth ? `${d.getMonth()}` : iso;
    let g = groups.find(x => x.key === key);
    if (!g) groups.push((g = byMonth
      ? { key, label: MESC[d.getMonth()], sub: "", title: `${MESES[d.getMonth()]} ${d.getFullYear()}`, dates: [] }
      : { key, label: String(d.getDate()), sub: D1[d.getDay()], title: `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`, dates: [] }));
    g.dates.push(iso);
  });
  return { groups, byMonth };
};

// ───────── Empleados ─────────
const EMP_SERIES: Serie[] = EMPLOYEE_QUICK.filter(q => q.key !== "por_llegar").map(q => ({ key: q.key, label: q.label, bar: getStatusConfig(q.status).bar, match: s => q.match.includes(s) }));

export const EmployeeCharts = ({ employees, days, quick, onSelectEmployee }: { employees: EmployeeAttendance[]; days: Date[]; quick: string[]; onSelectEmployee: (nombre: string) => void }) => {
  if (!employees.length) return <Empty />;
  const fechas = days.map(toISO);
  const series = EMP_SERIES.filter(s => (!quick.length || quick.includes(s.key)) && employees.some(e => fechas.some(f => s.match(e.dias[f]?.status ?? ""))));
  const countOf = (list: EmployeeAttendance[], dates: string[]) => {
    const c: Record<string, number> = {};
    list.forEach(e => dates.forEach(f => {
      const s = e.dias[f]?.status;
      const serie = s && series.find(x => x.match(s));
      if (serie) c[serie.key] = (c[serie.key] ?? 0) + 1;
    }));
    return c;
  };
  const deps = Array.from(new Set(employees.map(e => e.departamento || "Sin departamento"))).sort();
  const { groups, byMonth } = groupDays(days);
  const trendSeries = EMP_SERIES.filter(s => ["presente", "retardo", "falta"].includes(s.key) && (!quick.length || quick.includes(s.key)));
  const buckets: Bucket[] = groups.map(g => {
    const c = countOf(employees, g.dates);
    return { key: g.key, label: g.label, sub: g.sub, title: g.title, values: trendSeries.map(s => (g.dates.length ? c[s.key] ?? 0 : null)) };
  });
  const max = niceMax(Math.max(1, ...buckets.map(b => b.values.reduce<number>((n, v) => n + (v ?? 0), 0))));

  return (
    <div className="flex flex-col gap-4">
      <Section title="Registros de asistencia por empleado" note="Total de registros de cada empleado en el periodo." legend={series}>
        <StackedRows series={series} rows={employees.map(e => ({ key: String(e.employee_id), label: e.nombre, sub: e.departamento, counts: countOf([e], fechas), onClick: () => onSelectEmployee(e.nombre) }))} />
      </Section>
      <Section title="Registros de asistencia por departamento" note="Total de registros de los empleados de cada departamento en el periodo." legend={series}>
        <StackedRows series={series} rows={deps.map(d => ({ key: d, label: d, counts: countOf(employees.filter(e => (e.departamento || "Sin departamento") === d), fechas) }))} />
      </Section>
      {trendSeries.length > 0 && groups.length > 1 && (
        <Section title={byMonth ? "Tendencia por mes" : "Tendencia por día"} note="Asistencias, retardos y faltas del periodo." legend={trendSeries}>
          <Trend buckets={buckets} series={trendSeries} max={max} />
        </Section>
      )}
    </div>
  );
};

// ───────── Ubicaciones ─────────
const LOC_SERIES: Serie[] = SHIFT_QUICK.filter(q => q.key !== "por_abrir").map(q => ({ key: q.key, label: q.label, bar: getShiftConfig(q.status).bar, match: s => s === q.key }));

export const LocationCharts = ({ rows, days, quick }: { rows: ShiftRow[]; days: Date[]; quick: string[] }) => {
  if (!rows.length) return <Empty />;
  const fechas = days.map(toISO);
  const series = LOC_SERIES.filter(s => !quick.length || quick.includes(s.key));
  const countOf = (list: ShiftRow[], dates: string[]) => {
    const c: Record<string, number> = {};
    list.forEach(r => r.dias.forEach(d => {
      if (!dates.includes(d.fecha)) return;
      const k = shiftQuickKey(d);
      if (series.some(s => s.key === k)) c[k] = (c[k] ?? 0) + 1;
    }));
    return c;
  };
  const turnos = Array.from(new Set(rows.map(turnoLabel))).sort();
  const { groups, byMonth } = groupDays(days);
  const cov: Serie = { key: "cov", label: "Cobertura", bar: "bg-button-primary", match: () => true };
  const buckets: Bucket[] = groups.map(g => {
    if (!g.dates.length) return { key: g.key, label: g.label, sub: g.sub, title: g.title, values: [null] };
    let prog = 0, open = 0;
    rows.forEach(r => r.dias.forEach(d => {
      if (!g.dates.includes(d.fecha) || ["pendiente", "descanso", "por_abrir"].includes(d.status)) return;
      prog++;
      if (OPENED.includes(d.status)) open++;
    }));
    return { key: g.key, label: g.label, sub: g.sub, title: g.title, values: [prog ? Math.round((open / prog) * 100) : 0] };
  });

  return (
    <div className="flex flex-col gap-4">
      <Section title="Registros por caseta" note="Turnos de cada caseta en el periodo, por estatus." legend={series}>
        <StackedRows series={series} rows={rows.reduce<BarRow[]>((acc, r) => {
          const key = `${r.ubicacion}|${r.caseta}`;
          const prev = acc.find(x => x.key === key);
          const c = countOf([r], fechas);
          if (prev) Object.entries(c).forEach(([k, v]) => (prev.counts[k] = (prev.counts[k] ?? 0) + v));
          else acc.push({ key, label: r.caseta, sub: r.ubicacion, counts: c });
          return acc;
        }, [])} />
      </Section>
      <Section title="Registros por turno" note="Turnos en el periodo, por estatus." legend={series}>
        <StackedRows series={series} rows={turnos.map(t => ({ key: t, label: t, counts: countOf(rows.filter(r => turnoLabel(r) === t), fechas) }))} />
      </Section>
      {groups.length > 1 && (
        <Section title="Cobertura de turnos" note={byMonth ? "Turnos abiertos ÷ turnos programados, por mes." : "Turnos abiertos ÷ turnos programados, por día."}>
          <Trend buckets={buckets} series={[cov]} max={100} unit="%" />
        </Section>
      )}
    </div>
  );
};
