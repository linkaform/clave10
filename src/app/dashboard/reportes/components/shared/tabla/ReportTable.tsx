"use client";

import React, { useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpDown, ArrowUpZA, ChevronRight } from "lucide-react";
import { Pager, usePaged } from "./Pager";
import { PCW, ResizeHandle, pcwVar, usePcw } from "./ResizeHandle";
import { ScrollBox } from "./ScrollBox";
import { Cell, TableSpec } from "./tipos";

type Fila = { c: Cell[]; g: boolean; sub: boolean; key: string };

// Tabla del reporte: una a la vez, con pestañas verticales a la derecha si hay varias.
// - La primera columna se puede hacer más ancha o más angosta (ResizeHandle; el ancho se guarda
//   en el navegador y es el mismo para todas las tablas).
// - Si queda contenido a la derecha, la orilla se difumina (ScrollBox).
// - Con pocas filas, las filas se estiran para llenar la tarjeta (que mide al menos lo que las
//   pestañas verticales) en vez de dejar espacio en blanco abajo.
export const ReportTable = ({ tablas, activa, onActiva, toolbar, resetKey }: {
  tablas: TableSpec[];
  activa: TableSpec | undefined;
  onActiva: (id: string) => void;
  toolbar: React.ReactNode;
  resetKey: string;
}) => {
  const [orden, setOrden] = useState<0 | 1 | -1>(0);
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});
  // Filas visibles: encabezados de grupo siempre; su detalle solo si el grupo está abierto
  const rows = useMemo(() => {
    const t = activa;
    if (!t) return [] as Fila[];
    const k0 = (f: Fila) => String(f.c[0].v ?? f.c[0].t);
    const cmp = (a: Fila, b: Fila) => orden * k0(a).localeCompare(k0(b), "es", { numeric: true });
    if (!t.grp) {
      const l = t.rows.map((c, i) => ({ c, g: false, sub: false, key: String(i) }));
      return orden ? l.sort(cmp) : l;
    }
    const bloques: { h: Fila; hijos: Fila[] }[] = [];
    t.rows.forEach((c, i) => {
      if (t.grp?.[i] || !bloques.length) bloques.push({ h: { c, g: true, sub: false, key: `${t.id}:${c[0].t}` }, hijos: [] });
      else bloques[bloques.length - 1].hijos.push({ c, g: false, sub: true, key: `${t.id}:${i}` });
    });
    if (orden) { bloques.sort((a, b) => cmp(a.h, b.h)); bloques.forEach(b => b.hijos.sort(cmp)); }
    return bloques.flatMap(b => [b.h, ...(abiertos[b.h.key] ? b.hijos : [])]);
  }, [activa, orden, abiertos]);
  const pg = usePaged(rows, `${resetKey}|${activa?.id}|${orden}`);
  const pcw = usePcw();
  const varias = tablas.length > 1;
  const SortIcon = orden === 1 ? ArrowDownAZ : orden === -1 ? ArrowUpZA : ArrowUpDown;
  const th = "sticky top-0 whitespace-nowrap bg-c10-blue-light px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary";
  const td = "whitespace-nowrap border-t border-c10-sunken px-3.5 py-2.5";

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-row-reverse items-stretch">
        {varias && (
          <div role="tablist" aria-label="Tablas" aria-orientation="vertical" className="flex w-10 flex-none flex-col gap-1">
            {tablas.map(t => {
              const on = t.id === activa?.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  title={t.title}
                  onClick={() => onActiva(t.id)}
                  className={`flex flex-[1_0_auto] items-center justify-center rounded-r-xl py-4 text-sm shadow-[0_0_0_1px_var(--c10-line)] transition-colors ${on ? "bg-button-primary font-semibold text-white" : "bg-c10-surface font-medium text-c10-secondary hover:brightness-95"}`}
                >
                  <span className="whitespace-nowrap [writing-mode:vertical-rl]">{t.short}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className={`flex min-w-0 flex-1 flex-col overflow-hidden bg-c10-surface shadow-[0_0_0_1px_var(--c10-line)] ${varias ? "rounded-l-xl" : "rounded-xl"}`}>
          <div className="flex flex-col gap-3 px-4 py-3">{toolbar}</div>
          {activa?.cap && <p className="m-0 px-4 pb-2 text-xs text-c10-meta">{activa.cap}</p>}
          <ScrollBox className="max-h-[calc(100vh-230px)] min-h-0 flex-1 overflow-y-auto">
            <table className="h-full w-full min-w-max border-separate border-spacing-0 text-sm tabular-nums" style={pcwVar(pcw)}>
              <thead>
                <tr>
                  {activa?.cols.map((c, j) => j === 0 ? (
                    <th key={j} className={`${th} ${PCW} left-0 z-[4] text-left shadow-[inset_-1px_0_0_var(--c10-line-strong)]`}>
                      {c.t}
                      <button
                        type="button"
                        onClick={() => setOrden(o => (o === 1 ? -1 : o === -1 ? 0 : 1))}
                        title={orden === 1 ? "Orden A–Z" : orden === -1 ? "Orden Z–A" : "Ordenar A–Z"}
                        aria-label="Ordenar"
                        className={`ml-1 inline-flex h-[22px] w-[22px] items-center justify-center rounded-md align-middle hover:bg-blue-200 hover:text-button-primary ${orden ? "text-button-primary" : "text-c10-meta"}`}
                      >
                        <SortIcon size={14} />
                      </button>
                      <ResizeHandle />
                    </th>
                  ) : (
                    <th key={j} className={`${th} z-[2] ${c.r ? "text-right" : "text-left"}`}>{c.t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pg.slice.map(f => (
                  <tr key={f.key} className="group">
                    {f.c.map((x, j) => (
                      <td
                        key={j}
                        className={`${td} ${f.g && activa?.grp ? "bg-c10-panel" : "bg-c10-surface"} group-hover:bg-c10-blue-subtle ${j === 0 ? `sticky left-0 z-[1] ${PCW} shadow-[inset_-1px_0_0_var(--c10-line-strong)]` : ""} ${activa?.cols[j]?.r ? "text-right" : "text-left"} ${x.col ? "" : "text-c10-title"}`}
                        style={{ color: x.col, fontWeight: f.sub && j === 0 ? 400 : x.fw ?? 400 }}
                      >
                        {j === 0 && f.g && activa?.grp ? (
                          <button
                            type="button"
                            aria-expanded={!!abiertos[f.key]}
                            onClick={() => setAbiertos(a => ({ ...a, [f.key]: !a[f.key] }))}
                            title={x.t}
                            className="inline-flex max-w-full items-center gap-2 font-bold text-c10-title"
                          >
                            <ChevronRight size={16} className={`flex-none text-c10-meta transition-transform duration-200 ${abiertos[f.key] ? "rotate-90" : ""}`} />
                            <span className="truncate">{x.t}</span>
                          </button>
                        ) : j === 0 ? (
                          // Primera columna de ancho fijo: si no cabe, "…" y el texto completo al pasar el mouse
                          <span title={x.t} className={`block truncate ${f.sub ? "pl-6" : ""}`}>{x.t}</span>
                        ) : (
                          <span>{x.t}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <div className="p-6 text-center text-[13px] text-c10-meta">No se encontraron registros</div>}
          </ScrollBox>
        </div>
      </div>
      <Pager {...pg} sizes={[10, 15, 25, 50]} />
    </div>
  );
};
