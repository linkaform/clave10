"use client";

import React, { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { DrawerShell, Field, Fields } from "../shared/drawer/drawerParts";
import type { PanelBar, PanelItem, PanelSec, PanelSpec } from "../../reporte_concesionados/lib/paneles";

// Panel lateral de detalle del reporte de concesionados. Solo pinta un PanelSpec
// (reporte_concesionados/lib/paneles.ts); el contenedor es el DrawerShell de shared.
// Cada sección es de un tipo: tarjeta de datos (stats), lista de préstamos (items) o
// lista con barras (bars).

const VISIBLES = 5;

// Cada card es un préstamo (un equipo de un folio) y puede llevar varias piezas: el título
// de la sección cuenta piezas y el texto de abajo, préstamos.
const n = (k: number) => k.toLocaleString("es-MX");
const piezas = (k: number) => `${n(k)} ${k === 1 ? "pieza" : "piezas"}`;

const Item = ({ it }: { it: PanelItem }) => (
  <div className="flex flex-col gap-[3px] border-t border-c10-sunken py-2.5 text-[13px]">
    <div className="flex justify-between gap-2 font-semibold">
      <a
        href={it.href}
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir la concesión en la bitácora de artículos concesionados"
        className="inline-flex min-w-0 items-center gap-1.5 text-button-primary hover:underline"
      >
        <span className="truncate">{it.a}</span>
        <ExternalLink size={14} aria-hidden="true" className="flex-none" />
      </a>
      <span className="whitespace-nowrap text-c10-title" style={it.bcol ? { color: it.bcol } : undefined}>{it.b}</span>
    </div>
    {it.lines.map((l, i) => <div key={i} className="text-xs text-c10-label">{l}</div>)}
  </div>
);

// Fila de una lista con barras: nombre y "% del total" a la izquierda; número y barra a la derecha
const Barra = ({ b, col }: { b: PanelBar; col?: string }) => (
  <div className="flex items-center justify-between gap-3 border-t border-c10-sunken py-2.5">
    <div className="min-w-0">
      <div className="truncate text-[13px] font-semibold text-c10-title">{b.l}</div>
      <div className="text-xs text-c10-meta">{b.p}</div>
    </div>
    <div className="flex w-[90px] flex-none flex-col items-end gap-1.5">
      <span className="text-[13px] font-semibold tabular-nums text-c10-title">{b.v}</span>
      <span className="h-1 w-full overflow-hidden rounded-full bg-c10-sunken">
        <span className="block h-full rounded-full" style={{ width: `${b.w}%`, background: col ?? "var(--c10-acc, #2F80ED)" }} />
      </span>
    </div>
  </div>
);

const Seccion = ({ s }: { s: PanelSec }) => {
  const [open, setOpen] = useState(true);
  const [todos, setTodos] = useState(false);

  // Tarjeta de datos: mismos campos que los demás paneles de detalle (Fields de shared)
  if (s.stats) {
    return (
      <Fields>
        {s.stats.map(st => (
          <Field key={st.t} label={st.t} value={<span style={st.col ? { color: st.col } : undefined}>{st.v}</span>} />
        ))}
      </Fields>
    );
  }

  const items = s.items ?? [];
  const hayMas = items.length > VISIBLES;
  const vis = todos ? items : items.slice(0, VISIBLES);
  const cuenta = s.bars ? ` · ${n(s.total ?? s.bars.length)}` : items.length ? ` · ${piezas(s.cuenta ?? items.length)}` : "";
  return (
    <section className="rounded-xl bg-c10-surface p-5 shadow-[0_0_0_1px_var(--c10-line-card)]">
      {s.title && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="min-w-0 flex-auto text-left text-sm font-semibold text-c10-title">
            {s.title}{cuenta}
          </button>
          {open && hayMas && (
            <button type="button" onClick={() => setTodos(t => !t)} className="flex-none whitespace-nowrap text-[13px] font-semibold text-button-primary hover:underline">
              {todos ? "Ver menos" : "Ver todos"}
            </button>
          )}
          <button type="button" onClick={() => setOpen(o => !o)} aria-label="Mostrar u ocultar" className="inline-flex h-6 w-6 flex-none items-center justify-center text-c10-secondary">
            <ChevronDown size={16} strokeWidth={2.4} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      )}
      {open && (
        <div className={s.title ? "mt-3" : ""}>
          {items.length > 0 && (
            <p className="-mt-0.5 mb-1.5 text-xs text-c10-meta">
              {items.length === 1
                ? "En 1 préstamo."
                : todos || !hayMas
                  ? `En ${n(items.length)} préstamos, del más reciente al más antiguo.`
                  : `Los ${VISIBLES} préstamos más recientes de ${n(items.length)}.`}
            </p>
          )}
          {s.bars && s.desc && <p className="-mt-0.5 mb-1.5 text-xs text-c10-meta">{s.desc}</p>}
          {s.txt && <p className="m-0 text-[13px] text-c10-label">{s.txt}</p>}
          {vis.map((it, i) => <Item key={i} it={it} />)}
          {s.bars?.map(b => <Barra key={b.l} b={b} col={s.col} />)}
        </div>
      )}
    </section>
  );
};

export const DetallePanel = ({ spec, onClose }: { spec: PanelSpec; onClose: () => void }) => (
  <DrawerShell
    labelledBy="detalle-concesionados"
    onClose={onClose}
    // Avatar con iniciales, del color del riesgo (paneles de una persona o empresa)
    lead={spec.av ? (
      <span
        aria-hidden="true"
        className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-full text-base font-semibold text-white"
        style={{ background: spec.pill?.fg ?? "var(--c10-acc, #2F80ED)" }}
      >
        {spec.av}
      </span>
    ) : undefined}
    title={
      <span className="flex flex-wrap items-center gap-2">
        {spec.tit}
        {spec.pill && (
          <span className="inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] text-[11px] font-semibold tracking-normal" style={{ background: spec.pill.bg, color: spec.pill.fg }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: spec.pill.fg }} />
            {spec.pill.t}
          </span>
        )}
      </span>
    }
    subtitle={
      <>
        <div>{spec.sub}</div>
        {spec.desc && <div className="mt-1 text-xs text-c10-meta">{spec.desc}</div>}
      </>
    }
  >
    {/* key: al cambiar de fila se reinicia lo plegado y "Ver todos" */}
    {spec.secs.map(s => <Seccion key={`${spec.id}|${s.k}`} s={s} />)}
  </DrawerShell>
);
