"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "./tipos";

// Esqueleto de carga de las gráficas: una tarjeta por cada gráfica de la pestaña, con su título
// y descripción reales y el cuerpo en gris con las mismas medidas que pinta ChartCard (Charts.tsx).
// Si cambian las medidas allá, hay que cambiarlas aquí también.
//
// Las tarjetas se calculan sin datos, así que ya traen las columnas de las verticales, los días
// del mapa de calor y los puntos de la línea. Las de barras horizontales vienen sin filas: se
// ponen 10 en las de "Las 10…/Los 10…" y 5 en las demás.

const BARRAS = [92, 78, 66, 55, 47, 40, 33, 27, 21, 16];
const ALTOS = [46, 70, 58, 84, 38, 62, 74, 50, 66, 42, 78, 55];

const filasH = (card: Card & { kind: "h" }) => card.rows.length || (/\b10\b/.test(card.title) ? 10 : 5);

const Cuerpo = ({ card }: { card: Card }) => {
  if (card.kind === "h") {
    const lw = card.lw ?? 190;
    const sub = card.rows.some(r => r.sub);
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: filasH(card) }, (_, i) => (
          <div key={i} className="grid items-center gap-3" style={{ gridTemplateColumns: `minmax(90px, min(${lw}px, 32%)) minmax(80px, 1fr) minmax(56px, min(84px, 22%))` }}>
            <div className="flex min-w-0 flex-col justify-center gap-1">
              <div className="flex h-5 items-center"><Skeleton className="h-3.5" style={{ width: `${70 - (i % 4) * 10}%` }} /></div>
              {sub && <Skeleton className="h-2.5 w-1/2" />}
            </div>
            <Skeleton className="h-3.5 rounded-full" style={{ width: `${BARRAS[i % BARRAS.length]}%` }} />
            <Skeleton className="h-3.5 w-10 justify-self-end" />
          </div>
        ))}
      </div>
    );
  }

  if (card.kind === "v") {
    const cols = card.cols.length || 12;
    return (
      <div>
        <div className="ml-10 flex h-[220px] items-end gap-[3px] border-b border-c10-line">
          {Array.from({ length: cols }, (_, i) => (
            <div key={i} className="flex h-full min-w-0 flex-1 items-end justify-center">
              <Skeleton className="w-full max-w-[18px] rounded-b-none rounded-t-[3px]" style={{ height: `${ALTOS[i % ALTOS.length]}%` }} />
            </div>
          ))}
        </div>
        <div className="ml-10 flex h-[22px] items-center gap-[3px] pt-1.5">
          {Array.from({ length: cols }, (_, i) => (
            <div key={i} className="flex min-w-0 flex-1 justify-center"><Skeleton className="h-2.5 w-6 max-w-full" /></div>
          ))}
        </div>
      </div>
    );
  }

  if (card.kind === "l") {
    return (
      <div>
        <Skeleton className="ml-11 mt-2 h-[200px] rounded-lg" />
        <div className="ml-11 mt-1.5 flex h-4 items-center justify-between gap-2">
          {Array.from({ length: Math.min(card.pts.length || 7, 12) }, (_, i) => <Skeleton key={i} className="h-2.5 w-8" />)}
        </div>
      </div>
    );
  }

  // Mapa de calor: renglón de horas y un renglón de celdas de 26 px por día
  const dias = card.rows.length || 7;
  return (
    <div className="flex flex-col gap-[3px] overflow-hidden">
      <div className="grid min-w-[640px] gap-[3px]" style={{ gridTemplateColumns: "64px repeat(24, minmax(0, 1fr))" }}>
        <span />
        {Array.from({ length: 24 }, (_, i) => <div key={i} className="flex h-[15px] items-center">{i % 3 === 0 && <Skeleton className="h-2 w-4" />}</div>)}
      </div>
      {Array.from({ length: dias }, (_, d) => (
        <div key={d} className="grid min-w-[640px] gap-[3px]" style={{ gridTemplateColumns: "64px repeat(24, minmax(0, 1fr))" }}>
          <div className="flex items-center justify-end pr-1.5"><Skeleton className="h-3.5 w-8" /></div>
          {Array.from({ length: 24 }, (_, i) => <Skeleton key={i} className="h-[26px] rounded" />)}
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton = ({ cards }: { cards: Card[] }) => (
  <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando gráficas">
    {cards.map(card => (
      <section key={card.title} className="flex min-w-0 flex-col gap-3 rounded-xl border border-c10-line-card bg-c10-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,.06),0_4px_10px_rgba(15,23,42,.06)]">
        <div className="min-w-0">
          <h2 className="m-0 text-base font-semibold leading-tight text-c10-title">{card.title}</h2>
          <p className="m-0 mt-0.5 text-xs text-c10-meta">{card.cap}</p>
        </div>
        <Cuerpo card={card} />
        {card.kind === "h" && card.nota && <p className="m-0 text-xs text-c10-meta">{card.nota}</p>}
      </section>
    ))}
  </div>
);
