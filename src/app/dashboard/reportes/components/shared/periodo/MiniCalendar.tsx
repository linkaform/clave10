"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MESES, PeriodView, addDays, periodRange, sameDay } from "./period";

const capital = (t: string) => t[0].toUpperCase() + t.slice(1);

// Mini calendario: días (Día/Semana/Quincena), meses (Mes) o años (Año). Fechas futuras deshabilitadas.
export const MiniCalendar = ({ view, date, onPick }: { view: PeriodView; date: Date; onPick: (d: Date) => void }) => {
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
