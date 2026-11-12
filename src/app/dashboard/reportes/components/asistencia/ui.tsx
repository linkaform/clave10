"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { MESES, PeriodView, addDays, periodRange, sameDay, toISO } from "../../reporte_asistencias/lib/period";

// Piezas de UI del reporte de asistencia (spec de Clave 10: Inicio.dc.html)

const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export const matches = (text: string, q: string) => !q.trim() || norm(text).includes(norm(q.trim()));

export const initials = (nombre: string) =>
  nombre.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

const AVATAR_BG = ["bg-slate-800", "bg-button-primary", "bg-cyan-600", "bg-violet-600", "bg-pink-600", "bg-orange-600"];
const avatarBg = (n: string) => {
  let h = 7;
  for (const ch of n || "") h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return AVATAR_BG[h % AVATAR_BG.length];
};

export const Avatar = ({ name, size = 32 }: { name: string; size?: number }) => (
  <span
    aria-hidden="true"
    className={`inline-flex flex-none items-center justify-center rounded-full text-[11px] font-semibold text-white ${name ? avatarBg(name) : "bg-slate-300"}`}
    style={{ width: size, height: size }}
  >
    {name ? initials(name) : "?"}
  </span>
);

export const KpiChip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded-full bg-c10-blue-light px-[9px] text-[11px] font-semibold tabular-nums text-button-primary-hover">
    {children}
  </span>
);

export const Empty = ({ children = "No se encontraron registros" }: { children?: React.ReactNode }) => (
  <div className="p-8 text-center text-c10-meta">{children}</div>
);

// Cierra al hacer clic fuera
const useOutside = (ref: React.RefObject<HTMLElement>, open: boolean, close: () => void) => {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, open, close]);
};

// Grupo unido de tabs (40px)
export function SegTabs<T extends string>({ value, options, onChange, label, variant = "fill" }: {
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (v: T) => void;
  label: string;
  variant?: "fill" | "outline";
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex h-10 overflow-hidden rounded-lg border border-c10-line bg-c10-surface">
      {options.map(o => {
        const on = o.value === value;
        const cls = on
          ? variant === "fill"
            ? "bg-button-primary font-semibold text-white"
            : "font-semibold text-button-primary shadow-[inset_0_0_0_1px_var(--button-primary)]"
          : "font-medium text-c10-secondary hover:text-button-primary";
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`h-full border-l border-c10-line px-4 text-sm transition-colors first:border-l-0 disabled:cursor-not-allowed disabled:opacity-40 ${cls}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Selección múltiple con búsqueda (filtros del panel lateral)
export const MultiCombo = ({ label, placeholder, options, value, onChange }: {
  label: string;
  placeholder: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, open, () => setOpen(false));
  const list = options.filter(o => matches(o, q));
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);

  return (
    <div ref={ref} className="relative flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-c10-title">{label}</span>
      <label className={`flex h-10 items-center gap-2 rounded-lg border bg-c10-surface px-3 transition-colors ${open ? "border-button-primary shadow-[0_0_0_3px_rgba(59,130,246,.15)]" : "border-c10-line"}`}>
        <Search size={16} className="flex-none text-c10-faint" aria-hidden="true" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => e.key === "Escape" && setOpen(false)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 border-none bg-transparent text-sm text-c10-title outline-none placeholder:text-c10-faint"
        />
        <ChevronDown size={16} aria-hidden="true" className={`flex-none transition-transform duration-200 ${open ? "rotate-180 text-button-primary" : "text-c10-faint"}`} />
      </label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(v => (
            <span key={v} className="inline-flex h-[26px] max-w-full items-center gap-1 rounded-full bg-c10-blue-subtle pl-2.5 pr-1 text-xs font-semibold text-button-primary-hover">
              <span className="truncate">{v}</span>
              <button type="button" aria-label={`Quitar ${v}`} onClick={() => toggle(v)} className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-c10-blue-light">
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div role="listbox" aria-multiselectable="true" className="absolute left-0 right-0 top-[66px] z-30 max-h-64 animate-[c10-menu-in_200ms_ease-in-out] overflow-auto rounded-xl bg-c10-surface p-1 shadow-[0_0_0_1px_var(--c10-line),0_12px_28px_rgba(15,23,42,.12)]">
          {list.length ? list.map(o => {
            const on = value.includes(o);
            return (
              <button
                key={o}
                type="button"
                role="option"
                aria-selected={on}
                onMouseDown={e => e.preventDefault()}
                onClick={() => toggle(o)}
                className={`flex min-h-[34px] w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left text-sm ${on ? "bg-c10-blue-subtle font-semibold text-button-primary" : "text-c10-title hover:bg-c10-sunken"}`}
              >
                <span className="truncate">{o}</span>
                {on && <Check size={16} aria-hidden="true" className="flex-none" />}
              </button>
            );
          }) : <div className="px-2.5 py-2 text-sm text-c10-meta">No se encontraron opciones</div>}
        </div>
      )}
    </div>
  );
};

const capital = (t: string) => t[0].toUpperCase() + t.slice(1);

// Mini calendario: días (Día/Semana/Quincena), meses (Mes) o años (Año). Fechas futuras deshabilitadas.
const MiniCalendar = ({ view, date, onPick }: { view: PeriodView; date: Date; onPick: (d: Date) => void }) => {
  const today = new Date();
  const [ym, setYm] = useState<[number, number]>([date.getFullYear(), date.getMonth()]);
  const [yy, mm] = ym;
  const [selA, selB] = periodRange(view, date);
  const inSel = (x: Date) => x >= new Date(selA.toDateString()) && x <= new Date(selB.toDateString());
  const nav = (n: number) => () => {
    if (view === "mes") setYm([yy + n, mm]);
    else if (view === "anio") setYm([yy + 12 * n, mm]);
    else setYm(mm + n < 0 ? [yy - 1, 11] : mm + n > 11 ? [yy + 1, 0] : [yy, mm + n]);
  };
  const cell = "h-9 rounded-lg text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-35";

  let title: string, body: React.ReactNode;
  if (view === "mes" || view === "anio") {
    const y0 = yy - (yy % 12);
    const items = view === "mes"
      ? MESES.map((m, k) => ({ t: capital(m.slice(0, 3)), d: new Date(yy, k, 1) }))
      : Array.from({ length: 12 }, (_, k) => ({ t: String(y0 + k), d: new Date(y0 + k, 0, 1) }));
    title = view === "mes" ? String(yy) : `${y0} – ${y0 + 11}`;
    body = (
      <div className="grid grid-cols-3 gap-1">
        {items.map(({ t, d }) => {
          const on = sameDay(periodRange(view, d)[0], selA);
          return (
            <button key={t} type="button" disabled={d > today} onClick={() => onPick(d)} className={`${cell} ${on ? "bg-button-primary font-semibold text-white" : "text-c10-title hover:bg-c10-sunken"}`}>{t}</button>
          );
        })}
      </div>
    );
  } else {
    const off = (new Date(yy, mm, 1).getDay() + 6) % 7;
    const dim = new Date(yy, mm + 1, 0).getDate();
    const weeks = Math.ceil((off + dim) / 7);
    const solid = view === "dia";
    title = `${capital(MESES[mm])} ${yy}`;
    body = (
      <div className="grid grid-cols-7 gap-y-1">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <span key={i} className="py-1 text-center text-[11px] font-semibold text-c10-meta">{d}</span>
        ))}
        {Array.from({ length: weeks * 7 }, (_, k) => {
          const x = new Date(yy, mm, 1 - off + k);
          const on = inSel(x);
          const prev = k % 7 > 0 && inSel(addDays(x, -1));
          const next = k % 7 < 6 && inSel(addDays(x, 1));
          const radius = solid || !on ? "rounded-lg" : `${prev ? "rounded-l-none" : "rounded-l-lg"} ${next ? "rounded-r-none" : "rounded-r-lg"}`;
          const tone = on
            ? solid ? "bg-button-primary font-semibold text-white" : "bg-c10-blue-subtle font-semibold text-button-primary"
            : sameDay(x, today) ? "font-semibold text-button-primary hover:bg-c10-sunken"
            : x.getMonth() === mm ? "text-c10-title hover:bg-c10-sunken" : "text-c10-faint hover:bg-c10-sunken";
          return (
            <button key={k} type="button" disabled={x > today} onClick={() => onPick(x)} className={`${cell} ${radius} ${tone}`}>{x.getDate()}</button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex w-[292px] flex-col gap-2">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Anterior" onClick={nav(-1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-c10-sunken text-c10-secondary hover:bg-c10-blue-light hover:text-button-primary"><ChevronLeft size={16} /></button>
        <b className="text-sm text-c10-title">{title}</b>
        <button type="button" aria-label="Siguiente" onClick={nav(1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-c10-sunken text-c10-secondary hover:bg-c10-blue-light hover:text-button-primary"><ChevronRight size={16} /></button>
      </div>
      {body}
    </div>
  );
};

// Hoy · ‹ etiqueta ▾ ›
export const PeriodNav = ({ view, date, label, isCurrent, onPrev, onNext, onToday, onPick }: {
  view: PeriodView;
  date: Date;
  label: string;
  isCurrent: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onPick: (d: Date) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, open, () => setOpen(false));
  const round = "inline-flex h-8 w-8 items-center justify-center rounded-full bg-c10-sunken text-c10-secondary transition-colors hover:bg-c10-blue-light hover:text-button-primary disabled:cursor-not-allowed disabled:opacity-40";
  const [, end] = periodRange(view, date);
  const atEnd = end >= new Date(new Date().toDateString());

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={onToday}
        disabled={isCurrent}
        title={isCurrent ? "Ya estás viendo el periodo actual" : "Regresar al periodo actual"}
        className="h-9 rounded-lg border border-c10-line bg-c10-surface px-3.5 text-sm font-medium text-c10-label transition-colors hover:border-button-primary hover:text-button-primary disabled:cursor-default disabled:hover:border-c10-line disabled:hover:text-c10-label"
      >
        Hoy
      </button>
      <button type="button" aria-label="Periodo anterior" onClick={onPrev} className={round}><ChevronLeft size={16} /></button>
      <button
        type="button"
        aria-label="Elegir periodo"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-xl font-semibold tracking-[-.02em] text-c10-title hover:bg-c10-sunken"
      >
        <span className="tabular-nums">{label}</span>
        <ChevronDown size={16} aria-hidden="true" className={`text-c10-faint transition-transform duration-200 ${open ? "rotate-180 text-button-primary" : ""}`} />
      </button>
      <button type="button" aria-label="Periodo siguiente" onClick={onNext} disabled={atEnd} className={round}><ChevronRight size={16} /></button>
      {open && (
        <div className="absolute left-0 top-12 z-30 animate-[c10-menu-in_200ms_ease-in-out] rounded-xl bg-c10-surface p-3 shadow-[0_0_0_1px_var(--c10-line),0_12px_28px_rgba(15,23,42,.12)]">
          <MiniCalendar view={view} date={date} onPick={d => { onPick(d); setOpen(false); }} />
        </div>
      )}
    </div>
  );
};

// Filtros rápidos de estatus: varios a la vez, con conteo
export type QuickPill = { key: string; label: string; count: number; icon: React.ReactNode };

export const QuickFilters = ({ pills, active, onToggle }: { pills: QuickPill[]; active: string[]; onToggle: (k: string) => void }) => {
  const shown = pills.filter(p => p.count > 0 || active.includes(p.key));
  if (!shown.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {shown.map(p => {
        const on = active.includes(p.key);
        return (
          <button
            key={p.key}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(p.key)}
            className={`inline-flex h-[30px] items-center gap-1.5 rounded-full border pl-1.5 pr-2 text-[13px] transition-colors ${on ? "border-button-primary bg-button-primary font-semibold text-white" : "border-c10-line bg-c10-surface font-medium text-c10-label hover:border-c10-line-strong hover:bg-c10-sunken"}`}
          >
            <span className={on ? "[&>span]:!bg-transparent [&>span]:!text-white" : ""}>{p.icon}</span>
            {p.label}
            <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums ${on ? "bg-white text-button-primary" : "bg-c10-blue-light text-button-primary-hover"}`}>
              {p.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// Paginación estilo Bitácoras: Mostrar 10/25/50 · rango · páginas
export const usePaged = <T,>(rows: T[], resetKey: unknown) => {
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [resetKey, size]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const cur = Math.min(page, pages);
  const slice = useMemo(() => rows.slice((cur - 1) * size, cur * size), [rows, cur, size]);
  return { slice, size, setSize, page: cur, setPage, pages, total: rows.length };
};

export const Pager = ({ size, setSize, page, setPage, pages, total, sizes = [10, 25, 50] }: {
  size: number; setSize: (n: number) => void; page: number; setPage: (n: number) => void; pages: number; total: number; sizes?: number[];
}) => {
  if (!total) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const btn = "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm tabular-nums";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-c10-line px-3 py-3 text-sm text-c10-secondary">
      <label className="flex items-center gap-2">
        Mostrar
        <select value={size} onChange={e => setSize(Number(e.target.value))} className="h-8 rounded-lg border border-c10-line bg-c10-surface px-2 text-c10-title">
          {sizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="tabular-nums">{from} - {to} de {total} registros</span>
      </label>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Página anterior" disabled={page === 1} onClick={() => setPage(page - 1)} className={`${btn} text-c10-secondary hover:bg-c10-sunken disabled:opacity-40`}><ChevronLeft size={16} /></button>
          {nums.map((n, i) => (
            <React.Fragment key={n}>
              {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-c10-faint">…</span>}
              <button type="button" aria-current={n === page} onClick={() => setPage(n)} className={`${btn} ${n === page ? "bg-button-primary font-semibold text-white" : "text-c10-label hover:bg-c10-sunken"}`}>{n}</button>
            </React.Fragment>
          ))}
          <button type="button" aria-label="Página siguiente" disabled={page === pages} onClick={() => setPage(page + 1)} className={`${btn} text-c10-secondary hover:bg-c10-sunken disabled:opacity-40`}><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
};

// Clases comunes de tabla
export const T = {
  box: "overflow-x-auto",
  th: "sticky top-0 whitespace-nowrap bg-c10-blue-light px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary",
  td: "whitespace-nowrap border-t border-c10-line px-3 py-2.5 text-sm",
  num: "text-right tabular-nums",
};

// Checkbox 20×20 radio 5
export const Checkbox = ({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: () => void; label: string }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={indeterminate ? "mixed" : checked}
    aria-label={label}
    title={label}
    onClick={e => { e.stopPropagation(); onChange(); }}
    className={`inline-flex h-5 w-5 flex-none items-center justify-center rounded-[5px] border-[1.5px] ${checked || indeterminate ? "border-button-primary bg-button-primary text-white" : "border-c10-line-strong bg-c10-surface"}`}
  >
    {indeterminate ? <span className="h-0.5 w-2.5 rounded bg-white" /> : checked ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : null}
  </button>
);

// Horas en formato 7.5 h
export const fmtH = (h: number | null | undefined, unit = "") => (h == null ? "---" : `${h.toFixed(1)}${unit}`);

export const todayISO = () => toISO(new Date());
