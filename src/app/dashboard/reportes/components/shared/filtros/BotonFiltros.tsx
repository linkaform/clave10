"use client";

import React, { useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

// Botón flotante para volver a abrir el panel de filtros, pegado a la orilla izquierda.
// Se puede arrastrar hacia arriba o hacia abajo para que no tape lo que hay detrás; un clic
// sin arrastrar lo abre. activos = cuántos filtros hay puestos (globito rojo).
// (Igual al de reporte_asistencias, que todavía tiene su propia copia.)
export const BotonFiltros = ({ activos, onOpen }: { activos: number; onOpen: () => void }) => {
  const [y, setY] = useState<number | null>(null);
  const drag = useRef<{ y0: number; top0: number; moved: boolean } | null>(null);
  return (
    <button
      type="button"
      title="Filtros · arrastra para moverlo"
      aria-label="Mostrar filtros"
      onPointerDown={e => {
        const r = e.currentTarget.getBoundingClientRect();
        drag.current = { y0: e.clientY, top0: r.top + r.height / 2, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={e => {
        const d = drag.current;
        if (!d) return;
        if (Math.abs(e.clientY - d.y0) > 4) d.moved = true;
        if (d.moved) setY(Math.min(window.innerHeight - 34, Math.max(110, d.top0 + e.clientY - d.y0)));
      }}
      onPointerUp={() => {
        const moved = drag.current?.moved;
        drag.current = null;
        if (!moved) onOpen();
      }}
      style={{ top: y ?? "50%", touchAction: "none" }}
      className="fixed left-0 z-40 inline-flex h-[52px] w-[38px] -translate-y-1/2 cursor-grab items-center justify-center rounded-r-full bg-button-primary text-white shadow-[0_4px_12px_rgba(47,128,237,.3)] hover:bg-button-primary-hover active:cursor-grabbing"
    >
      <SlidersHorizontal size={18} />
      {activos > 0 && <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">{activos}</span>}
    </button>
  );
};
