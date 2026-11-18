"use client";

import React, { useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useOutside } from "../ui";
import { MiniCalendar } from "./MiniCalendar";
import { PeriodView, periodRange } from "./period";

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
  // Se puede avanzar hasta el periodo siguiente al actual (p. ej. ver las vacaciones de la próxima semana)
  const [start] = periodRange(view, date);
  const atEnd = start > new Date(new Date().toDateString());

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
