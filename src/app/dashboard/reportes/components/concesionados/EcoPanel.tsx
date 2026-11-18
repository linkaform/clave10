"use client";

import React from "react";
import { PieChart, X } from "lucide-react";
import { C, Eco, SER } from "../../reporte_concesionados/lib/cards";
import { money, n, pct } from "../../reporte_concesionados/lib/core";

type Parte = { t: string; col: string; v: number };

const Dona = ({ partes, ctr, ctrSub }: { partes: Parte[]; ctr: string; ctrSub: string }) => {
  const tot = partes.reduce((a, p) => a + p.v, 0);
  let acc = 0;
  const cg = tot
    ? partes.filter(p => p.v > 0).map(p => { const a = acc; acc += (p.v / tot) * 100; return `${p.col} ${a.toFixed(2)}% ${acc.toFixed(2)}%`; }).join(", ")
    : "var(--c10-sunken) 0% 100%";
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <div className="relative h-[150px] w-[150px] flex-none rounded-full" style={{ background: `conic-gradient(${cg})` }}>
        <div className="absolute inset-[22px] flex flex-col items-center justify-center rounded-full bg-c10-surface text-center">
          <span className="text-[11px] text-c10-meta">{ctrSub}</span>
          <strong className="text-[17px] font-bold tabular-nums text-c10-title">{ctr}</strong>
        </div>
      </div>
      <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-2.5">
        {partes.filter(p => p.v > 0 || !tot).map(p => (
          <div key={p.t} className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.col }} />
            <span className="truncate text-c10-label">{p.t}</span>
            <b className="whitespace-nowrap tabular-nums text-c10-title">{pct(tot ? (p.v / tot) * 100 : 0)} <span className="font-normal text-c10-meta">({money(p.v)})</span></b>
          </div>
        ))}
      </div>
    </div>
  );
};

const Tarjeta = ({ titulo, desc, children }: { titulo: string; desc: string; children: React.ReactNode }) => (
  <div className="rounded-xl bg-c10-surface p-5 shadow-[0_0_0_1px_var(--c10-line-card)]">
    <h3 className="m-0 text-sm font-semibold text-c10-title">{titulo}</h3>
    <p className="m-0 mb-2.5 mt-0.5 text-xs text-c10-meta">{desc}</p>
    {children}
  </div>
);

export const EcoPanel = ({ eco, label, onClose }: { eco: Eco; label: string; onClose: () => void }) => {
  const enPlazo = eco.vCalle - eco.vVenc;
  return (
    <aside aria-label="Resumen económico" className="sticky top-[84px] flex h-[calc(100vh-100px)] w-[min(520px,40vw)] flex-none flex-col overflow-hidden rounded-xl bg-c10-surface shadow-[0_0_0_1px_var(--c10-line-card),0_1px_2px_rgba(15,23,42,.06),0_4px_10px_rgba(15,23,42,.06)] max-lg:hidden">
      <div className="flex items-start justify-between gap-3 px-6 py-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="m-0 text-xl font-semibold tracking-[-.02em] text-c10-title">Resumen económico</h2>
          <span className="text-[13px] text-c10-meta">{label}</span>
          <span className="truncate text-xs text-c10-meta">Lo que está fuera y qué pasó con lo que se prestó en el periodo.</span>
        </div>
        <button type="button" title="Cerrar" aria-label="Cerrar resumen económico" onClick={onClose} className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-c10-sunken text-c10-secondary transition-colors hover:bg-c10-blue-light hover:text-button-primary">
          <X size={16} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto border-t border-c10-line bg-c10-panel px-6 py-5">
        <Tarjeta titulo="Lo que se prestó en el periodo" desc="Valor de lo que salió en el periodo y qué pasó con él.">
          <Dona ctr={money(eco.prestado)} ctrSub="Prestado" partes={eco.partes.map(p => ({ t: SER[p.k][0], col: SER[p.k][1], v: p.v }))} />
        </Tarjeta>
        <Tarjeta titulo="Fuera" desc="Todo lo que sigue sin devolverse, sin importar cuándo salió.">
          <Dona ctr={money(eco.vCalle)} ctrSub="Valor fuera" partes={[{ t: "En plazo", col: C.CLARO, v: enPlazo }, { t: "Vencido", col: C.AMBAR, v: eco.vVenc }]} />
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-[.05em] text-c10-faint">Artículos fuera</span>
              <b className="block text-sm font-medium tabular-nums text-c10-title">{n(eco.nCalle)}</b>
            </div>
            <div>
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-[.05em] text-c10-faint">Artículos vencidos</span>
              <b className="block text-sm font-medium tabular-nums" style={{ color: eco.nVenc ? "#B45309" : undefined }}>{n(eco.nVenc)}</b>
            </div>
          </div>
        </Tarjeta>
      </div>
    </aside>
  );
};

// Pestaña vertical para volver a abrir el panel
export const EcoRail = ({ onOpen }: { onOpen: () => void }) => (
  <button
    type="button"
    title="Ver resumen económico"
    aria-label="Ver resumen económico"
    onClick={onOpen}
    className="sticky top-[84px] flex w-9 flex-none flex-col items-center gap-2.5 rounded-[10px] border border-c10-line bg-c10-surface py-2.5 shadow-sm max-lg:hidden"
  >
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-c10-blue-light text-button-primary"><PieChart size={14} /></span>
    <span className="whitespace-nowrap text-[10px] font-bold tracking-[.08em] text-c10-meta [writing-mode:vertical-rl]">RESUMEN ECONÓMICO</span>
  </button>
);
