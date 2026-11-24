"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { MiniCalendar } from "./MiniCalendar";
import { PeriodView } from "./period";

// Campo "Fecha" del panel: abre el mini calendario.
// El calendario (316px) es más ancho que el panel (280px, con scroll que recorta), así que
// se pinta en un portal con posición fija, pegado al botón y sin salirse de la ventana.
const CAL_W = 316;
export const FechaPicker = ({ view, date, label, onPick }: { view: PeriodView; date: Date; label: string; onPick: (d: Date) => void }) => {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const open = !!pos;
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const abrir = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - CAL_W - 8)), top: r.bottom + 8 });
  };
  useEffect(() => {
    if (!open) return;
    const cerrar = () => setPos(null);
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btn.current?.contains(t) && !pop.current?.contains(t)) cerrar();
    };
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    // Si se recorre el panel o la página el botón se mueve: mejor cerrar que dejarlo flotando
    const scroll = (e: Event) => { if (!pop.current?.contains(e.target as Node)) cerrar(); };
    // Si no cabe abajo, se sube para que se vea completo
    const r = pop.current?.getBoundingClientRect();
    if (r && r.bottom > window.innerHeight - 8) {
      const b = btn.current?.getBoundingClientRect();
      if (b) setPos(p => p && { ...p, top: Math.max(8, b.top - r.height - 8) });
    }
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", tecla);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", tecla);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [open]);
  return (
    <div className="relative">
      <button
        ref={btn}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? setPos(null) : abrir())}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-c10-surface px-3 text-left text-sm tabular-nums text-c10-title transition-colors ${open ? "border-button-primary shadow-[0_0_0_3px_rgba(59,130,246,.15)]" : "border-c10-line"}`}
      >
        {label}
        <ChevronDown size={16} aria-hidden="true" className={`flex-none transition-transform duration-200 ${open ? "rotate-180 text-button-primary" : "text-c10-faint"}`} />
      </button>
      {pos && createPortal(
        <div
          ref={pop}
          role="dialog"
          aria-label="Elegir fecha"
          style={{ left: pos.left, top: pos.top }}
          className="fixed z-[70] rounded-xl bg-c10-surface p-3 shadow-[0_0_0_1px_var(--c10-line),0_12px_28px_rgba(15,23,42,.12)]"
        >
          <MiniCalendar view={view} date={date} onPick={d => { onPick(d); setPos(null); }} />
        </div>,
        document.body,
      )}
    </div>
  );
};
