"use client";

import React, { useState } from "react";
import { EMPLOYEE_QUICK, SHIFT_QUICK, getShiftConfig, getStatusConfig } from "../attendanceStatus";
import { EmployeeAttendance } from "../../reporte_asistencias/lib/employees";
import { OPENED, ShiftRow, turnoLabel } from "../../reporte_asistencias/lib/shifts";
import { DIAS, MESES, toISO } from "../../reporte_asistencias/lib/period";
import { shiftQuickKey } from "./LocationViews";
import { Empty } from "./ui";

type Serie = { key: string; label: string; bar: string; text: string; match: (s: string) => boolean };

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

// Tooltip flotante de las gráficas (sigue al cursor y no se sale de la pantalla)
type TipItem = { label: string; value: string; cls?: string };
type TipData = { title: string; sub?: string; items: TipItem[] };
type TipState = TipData & { x: number; y: number };

const useChartTip = () => {
  const [tip, setTip] = useState<TipState | null>(null);
  const on = (d: TipData) => {
    const place = (e: React.MouseEvent) => {
      const h = 64 + d.items.length * 22;
      let x = e.clientX + 16, y = e.clientY + 16;
      if (x + 280 > window.innerWidth) x = Math.max(8, e.clientX - 296);
      if (y + h > window.innerHeight) y = Math.max(8, e.clientY - h - 12);
      setTip({ ...d, x, y });
    };
    return { onMouseEnter: place, onMouseMove: place, onMouseLeave: () => setTip(null) };
  };
  const node = tip && (
    <div role="tooltip" className="pointer-events-none fixed z-[130] flex min-w-[220px] max-w-[300px] flex-col gap-1 rounded-[14px] bg-c10-surface px-4 py-3 text-[13px] shadow-[0_12px_32px_rgba(15,23,42,.16)]" style={{ left: tip.x, top: tip.y }}>
      <b className="text-sm font-semibold text-c10-title">{tip.title}</b>
      {tip.sub && <span className="mb-0.5 text-xs text-c10-meta">{tip.sub}</span>}
      {tip.items.map((i, k) => (
        <span key={k} className="flex items-center gap-2 text-xs">
          {i.cls && <i className={`h-2.5 w-2.5 flex-none rounded-sm ${i.cls}`} />}
          <span className="min-w-0 flex-1 text-c10-label">{i.label}</span>
          <b className="font-semibold tabular-nums text-c10-title">{i.value}</b>
        </span>
      ))}
    </div>
  );
  return { on, node };
};

// Barras horizontales apiladas (una fila por empleado, departamento o caseta)
const StackedRows = ({ rows, series }: { rows: BarRow[]; series: Serie[] }) => {
  const tip = useChartTip();
  const total = (r: BarRow) => series.reduce((n, s) => n + (r.counts[s.key] ?? 0), 0);
  const max = Math.max(1, ...rows.map(total));
  const shown = rows.filter(r => total(r) > 0);
  if (!shown.length) return <Empty />;
  return (
    <div className="flex flex-col gap-2.5">
      {tip.node}
      {shown.map(r => {
        const t = total(r);
        const Tag = r.onClick ? "button" : "div";
        return (
          <Tag
            key={r.key}
            {...tip.on({
              title: r.label,
              sub: r.onClick ? `${t} registros · clic para ver solo este` : `${t} registros`,
              items: series.filter(s => r.counts[s.key]).map(s => ({ label: s.label, value: String(r.counts[s.key]), cls: s.bar })),
            })}
            {...(r.onClick ? { type: "button" as const, onClick: r.onClick } : {})} className="-mx-2 grid grid-cols-[minmax(120px,200px)_minmax(0,1fr)_44px] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 hover:bg-c10-sunken">
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-c10-title">{r.label}</span>
              {r.sub && <span className="block truncate text-[11px] text-c10-meta">{r.sub}</span>}
            </span>
            <span className="flex h-2.5 overflow-hidden rounded-full bg-c10-sunken">
              <span className="flex h-full" style={{ width: `${(t / max) * 100}%` }}>
                {series.map(s => {
                  const v = r.counts[s.key] ?? 0;
                  return v ? <i key={s.key} className={`block h-full ${s.bar}`} style={{ width: `${(v / t) * 100}%` }} /> : null;
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

type Bucket = { key: string; label: string; sub: string; title: string; values: (number | null)[]; nota?: string };

// Línea por serie, una columna por día (o por mes si el periodo es largo).
// Hover gris por columna; los días por venir o sin esperados quedan sin punto.
const Trend = ({ buckets, series, max, unit = "" }: { buckets: Bucket[]; series: Serie[]; max: number; unit?: string }) => {
  const tip = useChartTip();
  const n = buckets.length;
  const x = (i: number) => ((i + 0.5) / n) * 1000;
  const y = (v: number) => 200 - (Math.min(v, max) / max) * 200;
  // Tramos continuos: un hueco (null) corta la línea
  const tramos = series.map((_, si) => {
    const out: string[][] = [[]];
    buckets.forEach((b, i) => {
      const v = b.values[si];
      if (v == null) { if (out[out.length - 1].length) out.push([]); return; }
      out[out.length - 1].push(`${x(i)},${y(v)}`);
    });
    return out.filter(t => t.length > 1);
  });
  return (
    <div className="flex gap-2">
      <div className="relative flex h-48 w-8 flex-none flex-col justify-between text-right text-[10px] tabular-nums text-c10-faint">
        <span className="-translate-y-1/2">{max}{unit}</span>
        <span>{max / 2}{unit}</span>
        <span className="translate-y-1/2">0</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="relative h-48">
          {tip.node}
          <span className="absolute left-0 top-0 w-full border-t border-c10-line" />
          <span className="absolute left-0 top-1/2 w-full border-t border-dashed border-c10-line" />
          <span className="absolute bottom-0 left-0 w-full border-t border-c10-line" />
          <svg viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
            {series.map((s, si) => tramos[si].map((t, k) => (
              <polyline key={`${s.key}-${k}`} points={t.join(" ")} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" className={s.text} />
            )))}
          </svg>
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {buckets.map(b => {
              const vacio = b.values.every(v => v == null);
              const data = vacio
                ? { title: b.title, sub: b.nota ?? "Por venir", items: [] }
                : { title: b.title, items: series.map((s, i) => ({ label: s.label, value: `${b.values[i]}${unit}`, cls: s.bar })) };
              return (
                <span key={b.key} {...tip.on(data)} className="relative h-full rounded-md transition-colors duration-150 hover:bg-c10-sunken">
                  {series.map((s, i) => {
                    const v = b.values[i];
                    return v == null ? null : (
                      <i key={s.key} className={`absolute left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-current bg-c10-surface ${s.text}`} style={{ bottom: `${(Math.min(v, max) / max) * 100}%` }} />
                    );
                  })}
                </span>
              );
            })}
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {buckets.map(b => (
            <span key={b.key} className={`min-w-0 text-center text-[10px] leading-tight ${b.values.every(v => v == null) && !b.nota ? "text-c10-faint" : "text-c10-meta"}`}>
              <span className="block">{n > 16 ? b.sub.slice(0, 1) : b.sub}</span>
              <span className="block tabular-nums">{b.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Estatus de un día en que sí se esperaba al empleado
const ESPERADOS_DIA = ["presente", "en_turno", "retardo", "sin_salida", "falta"];

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
const EMP_SERIES: Serie[] = EMPLOYEE_QUICK.filter(q => q.key !== "por_llegar").map(q => ({ key: q.key, label: q.label, bar: getStatusConfig(q.status).bar, text: getStatusConfig(q.status).icon, match: s => q.match.includes(s) }));

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
  // % sobre los que se esperaban (asistencia, retardo, sin salida o falta); descansos y asuetos no cuentan.
  // Un día sin nadie esperado queda vacío, no como 0 %.
  const buckets: Bucket[] = groups.map(g => {
    const c = countOf(employees, g.dates);
    const esperados = employees.reduce((n, e) => n + g.dates.filter(f => ESPERADOS_DIA.includes(e.dias[f]?.status ?? "")).length, 0);
    return {
      key: g.key, label: g.label, sub: g.sub, title: g.title,
      nota: g.dates.length && !esperados ? "sin empleados esperados (descanso o asueto)" : undefined,
      values: trendSeries.map(s => (g.dates.length && esperados ? Math.round(((c[s.key] ?? 0) / esperados) * 100) : null)),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <Section title="Registros de asistencia por empleado" note="Total de registros de cada empleado en el periodo.">
        <StackedRows series={series} rows={employees.map(e => ({ key: String(e.employee_id), label: e.nombre, sub: e.departamento, counts: countOf([e], fechas), onClick: () => onSelectEmployee(e.nombre) }))} />
      </Section>
      <Section title="Registros de asistencia por departamento" note="Total de registros de los empleados de cada departamento en el periodo.">
        <StackedRows series={series} rows={deps.map(d => ({ key: d, label: d, counts: countOf(employees.filter(e => (e.departamento || "Sin departamento") === d), fechas) }))} />
      </Section>
      {trendSeries.length > 0 && groups.length > 1 && (
        <Section title={byMonth ? "Tendencia por mes" : "Tendencia por día"} note="Asistencias, retardos y faltas como % de los empleados esperados. Descansos y asuetos no cuentan.">
          <Trend buckets={buckets} series={trendSeries} max={100} unit="%" />
        </Section>
      )}
    </div>
  );
};

// ───────── Ubicaciones ─────────
const LOC_SERIES: Serie[] = SHIFT_QUICK.filter(q => q.key !== "por_abrir").map(q => ({ key: q.key, label: q.label, bar: getShiftConfig(q.status).bar, text: getShiftConfig(q.status).icon, match: s => s === q.key }));

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
  const cov: Serie = { key: "cov", label: "Cobertura", bar: "bg-button-primary", text: "text-button-primary", match: () => true };
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
      <Section title="Registros por caseta" note="Turnos de cada caseta en el periodo, por estatus.">
        <StackedRows series={series} rows={rows.reduce<BarRow[]>((acc, r) => {
          const key = `${r.ubicacion}|${r.caseta}`;
          const prev = acc.find(x => x.key === key);
          const c = countOf([r], fechas);
          if (prev) Object.entries(c).forEach(([k, v]) => (prev.counts[k] = (prev.counts[k] ?? 0) + v));
          else acc.push({ key, label: r.caseta, sub: r.ubicacion, counts: c });
          return acc;
        }, [])} />
      </Section>
      <Section title="Registros por turno" note="Turnos en el periodo, por estatus.">
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
