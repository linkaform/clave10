"use client";
// F0-05 · Paginación del listado. Diseño: plataforma.dc.html, svPg/pgList (~6665, ~6683).
// "Mostrar 10/25/50" · "1 - 10 de 37 registros" · ‹ 1 … 4 5 6 … 9 ›
import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Selector } from "../Campo";
import { POR_PAGINA } from "./useTabla";

/** Primera, última, la actual y sus vecinas; "…" donde hay huecos. */
export const paginasVisibles = (actual: number, total: number): (number | "…")[] => {
  const ns = [...new Set([1, actual - 1, actual, actual + 1, total])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  return ns.flatMap((n, i) => (i && n - ns[i - 1] > 1 ? ["…" as const, n] : [n]));
};

const BOTON = "inline-flex size-8 items-center justify-center rounded-lg text-sm tabular-nums transition-colors duration-150";

export function Paginacion<T>({ tabla, opciones = POR_PAGINA }: { tabla: Table<T>; opciones?: readonly number[] }) {
  const total = tabla.getPrePaginationRowModel().rows.length;
  if (!total) return null;
  const { pageIndex, pageSize } = tabla.getState().pagination;
  const actual = pageIndex + 1;
  const paginas = Math.max(1, tabla.getPageCount());
  const desde = pageIndex * pageSize + 1;
  const hasta = Math.min(actual * pageSize, total);

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3 pt-3.5">
      <div className="flex items-center gap-2 text-sm text-c10-meta">
        <span>Mostrar</span>
        <Selector
          compacto
          arriba
          etiqueta="Registros por página"
          opciones={opciones.map((n) => ({ valor: String(n), etiqueta: String(n) }))}
          valor={String(pageSize)}
          onCambio={(v) => {
            tabla.setPageSize(Number(v));
            tabla.setPageIndex(0);
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm tabular-nums text-c10-meta">
          {desde} - {hasta} de {total.toLocaleString("es-MX")} {total === 1 ? "registro" : "registros"}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Página anterior"
            aria-label="Página anterior"
            onClick={() => tabla.previousPage()}
            disabled={!tabla.getCanPreviousPage()}
            className={cn(BOTON, "text-c10-label hover:bg-c10-sunken disabled:pointer-events-none disabled:opacity-40")}
          >
            <ChevronLeft className="size-4" />
          </button>
          {paginasVisibles(actual, paginas).map((n, i) =>
            n === "…" ? (
              <span key={`h${i}`} className={cn(BOTON, "text-c10-faint")} aria-hidden>
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                aria-current={n === actual ? "page" : undefined}
                onClick={() => tabla.setPageIndex(n - 1)}
                className={cn(BOTON, n === actual ? "bg-c10-acc font-semibold text-white" : "text-c10-label hover:bg-c10-sunken")}
              >
                {n}
              </button>
            ),
          )}
          <button
            type="button"
            title="Página siguiente"
            aria-label="Página siguiente"
            onClick={() => tabla.nextPage()}
            disabled={!tabla.getCanNextPage()}
            className={cn(BOTON, "text-c10-label hover:bg-c10-sunken disabled:pointer-events-none disabled:opacity-40")}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
