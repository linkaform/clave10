"use client";

import React, { useSyncExternalStore } from "react";

// ───── Ancho de la primera columna (compartido entre tablas, se guarda en el navegador) ─────
const PCW_KEY = "c10-asis-pcw";
let pcw = 240;
const pcwSubs = new Set<() => void>();
const readPcw = () => {
  try { const v = Number(localStorage.getItem(PCW_KEY)); if (v >= 140 && v <= 600) pcw = v; } catch { /* sin almacenamiento */ }
};
let pcwLoaded = false;
export const usePcw = () => useSyncExternalStore(
  (cb: () => void) => { if (!pcwLoaded) { pcwLoaded = true; readPcw(); } pcwSubs.add(cb); return () => { pcwSubs.delete(cb); }; },
  () => pcw,
  () => 240,
);
const setPcw = (w: number) => { pcw = w; pcwSubs.forEach(f => f()); };
// Estilo para la tabla y clases para la primera columna
export const pcwVar = (w: number) => ({ ["--pcw" as string]: `${w}px` }) as React.CSSProperties;
export const PCW = "w-[var(--pcw)] min-w-[var(--pcw)] max-w-[var(--pcw)]";

// Agarradera para arrastrar el ancho de la primera columna (140–600 px)
export const ResizeHandle = () => (
  <span
    title="Arrastra para ajustar el ancho"
    onClick={e => e.stopPropagation()}
    onMouseDown={e => {
      e.preventDefault();
      e.stopPropagation();
      const th = (e.currentTarget as HTMLElement).closest("th");
      const x0 = e.clientX, w0 = th?.getBoundingClientRect().width ?? pcw;
      const hd = e.currentTarget as HTMLElement;
      hd.dataset.on = "1";
      document.body.style.cursor = "col-resize";
      const mv = (ev: MouseEvent) => setPcw(Math.round(Math.max(140, Math.min(600, w0 + ev.clientX - x0))));
      const up = () => {
        window.removeEventListener("mousemove", mv);
        window.removeEventListener("mouseup", up);
        delete hd.dataset.on;
        document.body.style.cursor = "";
        try { localStorage.setItem(PCW_KEY, String(pcw)); } catch { /* sin almacenamiento */ }
      };
      window.addEventListener("mousemove", mv);
      window.addEventListener("mouseup", up);
    }}
    className="group/rsz absolute inset-y-0 right-0 z-[6] w-[7px] cursor-col-resize"
  >
    <i className="absolute inset-y-1.5 right-0.5 w-[3px] rounded-sm bg-transparent transition-colors duration-150 group-hover/rsz:bg-slate-400 group-data-[on]/rsz:bg-slate-400" />
  </span>
);
