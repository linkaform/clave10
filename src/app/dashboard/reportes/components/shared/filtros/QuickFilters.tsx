"use client";

import React from "react";

// Filtros rápidos de estatus: varios a la vez, con conteo
export type QuickPill = { key: string; label: string; count: number; icon: React.ReactNode };

// Por defecto se ocultan los que tienen 0. `todos` los muestra siempre (p. ej. mientras el
// reporte aún no tiene datos y se quiere ver el diseño completo).
// `pildora`: fondo gris y activo en azul sólido, como van dentro del panel de filtros.
export const QuickFilters = ({ pills, active, onToggle, todos = false, pildora = false }: { pills: QuickPill[]; active: string[]; onToggle: (k: string) => void; todos?: boolean; pildora?: boolean }) => {
  const shown = todos ? pills : pills.filter(p => p.count > 0 || active.includes(p.key));
  if (!shown.length) return null;
  return (
    <div className={`flex flex-wrap items-center ${pildora ? "gap-1.5" : "gap-2"}`}>
      {shown.map(p => {
        const on = active.includes(p.key);
        return (
          <button
            key={p.key}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(p.key)}
            className={`inline-flex h-[30px] items-center gap-1.5 rounded-full pl-[5px] pr-2 text-[13px] transition-colors duration-150 ${
              pildora
                ? on ? "bg-button-primary font-semibold text-white" : "bg-c10-sunken font-medium text-c10-label hover:bg-c10-line"
                : on ? "bg-c10-blue-light font-semibold text-button-primary-hover" : "bg-transparent font-normal text-c10-label hover:bg-c10-sunken"
            }`}
          >
            {p.icon}
            {p.label}
            <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums ${
              pildora
                ? on ? "bg-c10-surface text-button-primary" : "bg-c10-blue-light text-button-primary-hover"
                : on ? "bg-button-primary text-white" : "bg-c10-blue-light text-button-primary"
            }`}>
              {p.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
