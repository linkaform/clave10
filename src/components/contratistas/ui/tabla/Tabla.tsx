"use client";
// F0-05 · Tabla. Spec: contratistas_ui_spec.md §4. Diseño: plataforma.dc.html, dcVTable
// (~2749, Documentos), ctTab (~2770, Contratos: dos columnas fijas) y rqRzDown (~1867,
// ancho ajustable).
//
// Solo pinta: el orden, la página y la selección viven en useTabla, que comparten los
// tres modos de vista. Las columnas son ColumnDef de @tanstack/react-table; la principal
// (nombre) lleva meta: { principal: true }.
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { flexRender, type Header, type Table } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Casilla } from "../Campo";

const MIN = 160;
const MAX = 640;

/** Ancho de la columna principal, arrastrable y guardado por tabla en el navegador. */
function useAnchoPrincipal(clave: string | undefined, inicial: number) {
  const llave = clave ? `c10-col-${clave}` : null;
  const [ancho, setAncho] = useState(inicial);
  useLayoutEffect(() => {
    if (!llave) return;
    try {
      const w = Number(localStorage.getItem(llave));
      if (w >= MIN && w <= MAX) setAncho(w);
    } catch {
      /* sin almacenamiento */
    }
  }, [llave]);
  const arrastrar = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const x0 = e.clientX;
    const w0 = ancho;
    let ultimo = w0;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const mover = (ev: PointerEvent) => {
      ultimo = Math.max(MIN, Math.min(MAX, Math.round(w0 + ev.clientX - x0)));
      setAncho(ultimo);
    };
    const soltar = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      try {
        if (llave) localStorage.setItem(llave, String(ultimo));
      } catch {
        /* sin almacenamiento */
      }
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  };
  return { ancho, arrastrar };
}

export interface TablaProps<T> {
  tabla: Table<T>;
  /** Botones de la columna ACCIONES (el ojo primero). */
  acciones?: (fila: T) => ReactNode;
  /** Checkbox por fila y "Seleccionar todos" en el encabezado. */
  seleccion?: boolean;
  /** Tablas anchas (Contratos): la columna principal también queda fija. */
  fijarPrincipal?: boolean;
  /** Si viene, el ancho arrastrado de la columna principal se recuerda con esta clave. */
  claveAncho?: string;
  anchoPrincipal?: number;
  /** Para el title del checkbox: "Seleccionar Ternium México". */
  nombreFila?: (fila: T) => string;
  /** id de la fila con el panel de detalle abierto: se resalta. */
  filaActiva?: string | null;
  cargando?: boolean;
  /** Lo que se ve cuando no hay filas (un <EstadoVacio>). */
  vacio?: ReactNode;
}

const TH = "whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary";

function Encabezado<T>({ h }: { h: Header<T, unknown> }) {
  const etiqueta = flexRender(h.column.columnDef.header, h.getContext());
  if (!h.column.getCanSort()) return <>{etiqueta}</>;
  const dir = h.column.getIsSorted();
  const Icono = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={h.column.getToggleSortingHandler()}
      title="Ordenar"
      className={cn("inline-flex items-center gap-1.5 uppercase tracking-[.05em] hover:text-c10-acc", dir && "text-c10-acc")}
    >
      {etiqueta}
      <Icono className={cn("size-3.5 shrink-0", !dir && "opacity-40")} aria-hidden />
    </button>
  );
}

export function Tabla<T>({
  tabla, acciones, seleccion, fijarPrincipal, claveAncho, anchoPrincipal = 280, nombreFila, filaActiva, cargando, vacio,
}: TablaProps<T>) {
  const conAcciones = !!acciones || !!seleccion;
  const { ancho, arrastrar } = useAnchoPrincipal(claveAncho, anchoPrincipal);

  // La principal fija va justo después de ACCIONES: se mide su ancho real
  const thAcc = useRef<HTMLTableCellElement>(null);
  const [anchoAcc, setAnchoAcc] = useState(0);
  useLayoutEffect(() => {
    const el = thAcc.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAnchoAcc(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [conAcciones]);

  const filas = tabla.getRowModel().rows;
  const columnas = tabla.getVisibleLeafColumns().length + (conAcciones ? 1 : 0);
  const fijaPrincipal = (principal?: boolean) => !!(principal && fijarPrincipal);

  return (
    <div className="overflow-hidden rounded-xl bg-c10-surface shadow-[0_0_0_1px_var(--c10-line)]">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            {tabla.getHeaderGroups().map((g) => (
              <tr key={g.id} className="bg-c10-acc-l">
                {conAcciones && (
                  <th ref={thAcc} scope="col" className={cn(TH, "sticky left-0 z-[3] w-px bg-c10-acc-l py-0.5")}>
                    <span className="flex items-center gap-1.5">
                      {seleccion && (
                        <span className="flex size-8 items-center justify-center">
                          <Casilla
                            titulo="Seleccionar todos"
                            marcada={tabla.getIsAllPageRowsSelected()}
                            mixto={tabla.getIsSomePageRowsSelected()}
                            onCambio={(v) => tabla.toggleAllPageRowsSelected(v)}
                            deshabilitada={!filas.length}
                          />
                        </span>
                      )}
                      Acciones
                    </span>
                  </th>
                )}
                {g.headers.map((h) => {
                  const m = h.column.columnDef.meta;
                  const dir = h.column.getIsSorted();
                  return (
                    <th
                      key={h.id}
                      scope="col"
                      aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined}
                      style={m?.principal ? { width: ancho, minWidth: ancho, maxWidth: ancho, left: fijarPrincipal ? anchoAcc : undefined } : { minWidth: m?.minimo }}
                      className={cn(
                        TH,
                        "relative",
                        m?.derecha && "text-right",
                        fijaPrincipal(m?.principal) && "sticky z-[3] bg-c10-acc-l shadow-[1px_0_0_var(--c10-acc-b)]",
                      )}
                    >
                      <Encabezado h={h} />
                      {m?.principal && (
                        <span
                          aria-hidden
                          title="Arrastra para ajustar el ancho"
                          onPointerDown={arrastrar}
                          className="absolute -right-1 bottom-0 top-0 z-[4] w-2 cursor-col-resize hover:bg-blue-500/15"
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {cargando
              ? Array.from({ length: 5 }, (_, i) => (
                  <tr key={i}>
                    {Array.from({ length: columnas }, (_, j) => (
                      <td key={j} className="h-12 border-t border-c10-sunken px-3">
                        <span className="block h-3.5 w-3/4 animate-pulse rounded bg-c10-skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              : filas.map((r) => {
                  const fondo = r.getIsSelected() || filaActiva === r.id ? "bg-c10-acc-s" : "bg-c10-surface group-hover:bg-c10-panel";
                  return (
                    <tr key={r.id} className={cn("group transition-colors duration-150", fondo)}>
                      {conAcciones && (
                        <td className={cn("sticky left-0 z-[1] whitespace-nowrap border-t border-c10-sunken px-3 py-2", fondo)}>
                          <span className="flex items-center gap-1.5">
                            {seleccion && (
                              <span className="flex size-8 items-center justify-center">
                                <Casilla
                                  titulo={`Seleccionar ${nombreFila?.(r.original) ?? "registro"}`}
                                  marcada={r.getIsSelected()}
                                  onCambio={(v) => r.toggleSelected(v)}
                                />
                              </span>
                            )}
                            {acciones?.(r.original)}
                          </span>
                        </td>
                      )}
                      {r.getVisibleCells().map((c) => {
                        const m = c.column.columnDef.meta;
                        return (
                          <td
                            key={c.id}
                            style={m?.principal ? { width: ancho, maxWidth: ancho, left: fijarPrincipal ? anchoAcc : undefined } : undefined}
                            className={cn(
                              "border-t border-c10-sunken px-3 py-2 align-middle text-c10-text",
                              m?.derecha && "text-right tabular-nums",
                              fijaPrincipal(m?.principal) && cn("sticky z-[1] shadow-[1px_0_0_var(--c10-line)]", fondo),
                            )}
                          >
                            {flexRender(c.column.columnDef.cell, c.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
      {!cargando && !filas.length && vacio && <div className="border-t border-c10-sunken">{vacio}</div>}
    </div>
  );
}
