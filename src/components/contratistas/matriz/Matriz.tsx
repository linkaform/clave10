"use client";
// F0-12 · Motor de matriz (variante de estados). Fila × columna con estados,
// columna de cumplimiento, chips con contador, pie de %, popover de celda,
// selección con Descargar Registros y Notificar Incumplimientos.
//
// Qué no hace (lo pone la pantalla): qué filas/columnas entran, el periodo
// (pasa <SelectorPeriodo> en `barra`), las acciones del popover, la
// paginación y el estado vacío de F0-05 (`paginacion`, `vacio`).
import { useCallback, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowDown01, ArrowDown10, ArrowDownAZ, ArrowDownZA, ArrowUpDown, Bell, Download } from "lucide-react";
import { useMatriz } from "@/hooks/Contratistas/useMatriz";
import {
  ESTADOS, colorAvatar, colorPct, csvMatriz, descargarCsv, fmtPct, iniciales, posicionPopover,
} from "@/lib/contratistas/matriz";
import type {
  ContenidoPopover, EstadoCelda, MatrizCelda, MatrizColumna, MatrizFila, OrdenDir,
} from "@/types/contratistas/matriz";
import { BarraFlotante, BotonBarra, Casilla, CeldaEstado, ChipsEstado, IconoTodas } from "./piezas";
import { PopoverCelda } from "./PopoverCelda";

export interface MatrizProps {
  filas: MatrizFila[];
  columnas: MatrizColumna[];
  /** Estado de cada celda. Memoizar con useCallback: se usa en cálculos. */
  celda: (fila: MatrizFila, columna: MatrizColumna) => MatrizCelda | undefined;
  /** "Contratista", "Empleado", "Obligación"… (encabezado y CSV). */
  etiquetaFila: string;
  /** "Cumplimiento por obligación". */
  etiquetaPie: string;
  /** Para el tooltip del pie: "x de y <unidad> cumplieron". */
  unidadPie: string;
  /** Chips de filtro; por defecto los 7 del diseño. */
  estadosChips?: EstadoCelda[];
  /** Lado izquierdo de la barra superior (selector de periodo, volver…). */
  barra?: ReactNode;
  /** Contenido del popover; null = la celda no abre popover. */
  popover?: (fila: MatrizFila, columna: MatrizColumna, celda: MatrizCelda, cerrar: () => void) => ContenidoPopover | null;
  /** Campana por fila y "Notificar Incumplimientos". Sin esto no hay campana (Asignación). */
  onNotificar?: (filaIds: string[]) => void;
  onFilaClick?: (fila: MatrizFila) => void;
  /** Nombre del CSV sin extensión. */
  nombreCsv: string;
  /** Paginación controlada (F0-05). Sin esto se muestran todas las filas. */
  pagina?: number;
  porPagina?: number;
  /** Debajo de la matriz: paginación de F0-05. Recibe el total de filas visibles. */
  paginacion?: (total: number) => ReactNode;
  /** Estado vacío (F0-05). Por defecto, un texto simple. */
  vacio?: ReactNode;
  /** Offset del encabezado pegajoso (alto del header de la app). */
  stickyTop?: number;
  anchoNombre?: number;
}

const IcOrden = ({ d, num }: { d: OrdenDir; num?: boolean }) => {
  const I = d === "asc" ? (num ? ArrowDown01 : ArrowDownAZ) : d === "desc" ? (num ? ArrowDown10 : ArrowDownZA) : ArrowUpDown;
  return <I className="size-3.5" style={{ color: d ? "var(--c10-acc,#2F80ED)" : "#94A3B8" }} />;
};

const th = "flex items-center px-3 py-2.5 text-xs font-semibold uppercase tracking-[.05em] text-[#475569] whitespace-nowrap";

export function Matriz(p: MatrizProps) {
  const m = useMatriz({ filas: p.filas, columnas: p.columnas, celda: p.celda, estadosChips: p.estadosChips, anchoNombre: p.anchoNombre });
  const a = m.acciones;
  const hdRef = useRef<HTMLDivElement>(null);
  const conCampana = !!p.onNotificar;
  const anchoAcc = conCampana ? 92 : 52;
  const nCols = Math.max(1, m.columnasVisibles.length);
  const grid = `${anchoAcc}px ${m.ancho}px 128px repeat(${nCols}, minmax(120px, 1fr))`;
  const minW = anchoAcc + m.ancho + 128 + nCols * 120;

  const total = m.visibles.length;
  const filasPagina = p.porPagina
    ? m.visibles.slice(((p.pagina ?? 1) - 1) * p.porPagina, (p.pagina ?? 1) * p.porPagina)
    : m.visibles;

  const redimensionar = (ev: React.MouseEvent<HTMLSpanElement>) => {
    ev.preventDefault(); ev.stopPropagation();
    const x0 = ev.clientX, w0 = m.ancho;
    const mover = (e: MouseEvent) => a.setAncho(w0 + e.clientX - x0);
    const soltar = () => {
      window.removeEventListener("mousemove", mover); window.removeEventListener("mouseup", soltar);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", mover); window.addEventListener("mouseup", soltar);
  };

  const descargar = () => {
    const sel = m.seleccionadas;
    descargarCsv(csvMatriz(sel.map((x) => x.fila), p.columnas, p.celda, p.etiquetaFila), p.nombreCsv);
    a.limpiarSeleccion();
    toast.success(sel.length === 1 ? "Se descargó 1 registro" : `Se descargaron ${sel.length} registros`);
  };

  const conIncumplimiento = m.seleccionadas.filter((x) => x.incumplimientos > 0).map((x) => x.fila.id);

  // Popover abierto
  const po = m.popover;
  const poFila = po && p.filas.find((f) => f.id === po.filaId);
  const poCol = po && p.columnas.find((c) => c.id === po.columnaId);
  const poCelda = poFila && poCol ? p.celda(poFila, poCol) : undefined;
  const cerrar = a.cerrarPopover;
  const poContenido = poFila && poCol && poCelda && p.popover ? p.popover(poFila, poCol, poCelda, cerrar) : null;

  const sincronizar = useCallback((ev: React.UIEvent<HTMLDivElement>) => {
    if (hdRef.current) hdRef.current.scrollLeft = ev.currentTarget.scrollLeft;
  }, []);

  return (
    <section className="relative flex min-w-0 flex-col">
      {/* Barra superior: periodo (de la pantalla) + chips */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-t-xl border border-b-0 border-[#E2E8F0] bg-white px-4 py-3">
        {p.barra}
        <ChipsEstado chips={m.chips} onAlternar={a.alternarChip} onLimpiar={a.limpiarFiltro} />
      </div>

      <div className="border-x border-[#E2E8F0] bg-white">
        {/* Encabezado pegajoso con scroll horizontal sincronizado */}
        <div className="sticky z-[4] bg-white" style={{ top: p.stickyTop ?? 0 }}>
          <div ref={hdRef} className="overflow-hidden bg-[var(--c10-acc-l,#DBEAFE)]">
            <div style={{ minWidth: minW }}>
              <div className="grid min-h-[52px] bg-[var(--c10-acc-l,#DBEAFE)]" style={{ gridTemplateColumns: grid }}>
                <span className="sticky left-0 z-[2] flex items-center bg-[var(--c10-acc-l,#DBEAFE)] px-3">
                  <Casilla marcada={m.todasSeleccionadas} mixto={!m.todasSeleccionadas && m.seleccionadas.length > 0}
                    titulo="Seleccionar todos" onClick={a.alternarTodas} deshabilitada={!total} />
                </span>
                <span className={`${th} sticky z-[2] bg-[var(--c10-acc-l,#DBEAFE)] shadow-[1px_0_0_var(--c10-acc-b,#BFDBFE)]`} style={{ left: anchoAcc }}>
                  <button type="button" onClick={a.ordenarNombre} className="flex items-center gap-1.5 uppercase"
                    title={m.ordenNombre === "asc" ? "Orden Z-A" : m.ordenNombre === "desc" ? "Quitar orden" : "Ordenar A-Z"}>
                    {p.etiquetaFila}<IcOrden d={m.ordenNombre} />
                  </button>
                  <span onMouseDown={redimensionar} title="Arrastra para ajustar el ancho"
                    className="absolute -right-1 top-0 z-[3] h-full w-2 cursor-col-resize transition-colors hover:bg-[var(--c10-acc-m,#93C5FD)]" />
                </span>
                <span className={th}>
                  <button type="button" onClick={a.ordenarPct} className="flex items-center gap-1.5 uppercase"
                    title={m.ordenPct === "asc" ? "Menor cumplimiento primero" : m.ordenPct === "desc" ? "Mayor cumplimiento primero" : "Ordenar por cumplimiento"}>
                    Cumplimiento<IcOrden d={m.ordenPct} num />
                  </button>
                </span>
                {m.columnasVisibles.map(({ columna: c }) => (
                  <span key={c.id} className="flex min-w-0 items-center justify-center px-1.5 py-2 text-center text-xs font-semibold uppercase leading-[1.25] tracking-[.05em] text-[#475569]">
                    {c.onClick
                      ? <button type="button" onClick={c.onClick} className="uppercase hover:text-[var(--c10-acc,#2F80ED)] hover:underline">{c.etiqueta}</button>
                      : c.etiqueta}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="overflow-x-auto" onScroll={sincronizar}>
          <div style={{ minWidth: minW }}>
            {filasPagina.map((x) => {
              const f = x.fila, sel = m.seleccion.has(f.id), puede = x.incumplimientos > 0;
              const cp = x.cumplimiento;
              return (
                <div key={f.id} className="grid items-center border-t border-[#F1F5F9] transition-colors duration-150"
                  style={{ gridTemplateColumns: grid, background: sel ? "var(--c10-acc-s,#EFF6FF)" : "#FFFFFF" }}>
                  <div className="sticky left-0 z-[2] flex items-center gap-1 self-stretch bg-inherit px-3 py-2">
                    <Casilla marcada={sel} titulo="Seleccionar" onClick={() => a.alternarFila(f.id)} />
                    {conCampana && (
                      <button type="button" onClick={() => puede && p.onNotificar!([f.id])} disabled={!puede}
                        title={puede ? "Notificar incumplimiento" : "Sin incumplimientos"} aria-label="Notificar incumplimiento"
                        className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#F1F5F9] text-[#475569] transition-colors duration-150 hover:bg-[#E2E8F0] hover:text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-40">
                        <Bell className="size-4" />
                      </button>
                    )}
                  </div>
                  <div onClick={p.onFilaClick ? () => p.onFilaClick!(f) : undefined} title={p.onFilaClick ? "Ver detalle" : undefined}
                    className={`sticky z-[2] flex min-w-0 items-center gap-2.5 self-stretch bg-inherit px-3 py-2 shadow-[1px_0_0_#E2E8F0] ${p.onFilaClick ? "cursor-pointer" : ""}`}
                    style={{ left: anchoAcc }}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: colorAvatar(f.id) }}>
                      {f.iniciales ?? iniciales(f.nombre)}
                    </span>
                    <span className="flex min-w-0 flex-col gap-px">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span title={f.nombre} className="truncate text-sm font-semibold text-[#0F172A]">{f.nombre}</span>
                        {f.punto && <span title={f.punto.titulo} className="size-2 shrink-0 rounded-full" style={{ background: f.punto.color }} />}
                      </span>
                      {(f.subtitulo || f.marca) && (
                        <span className="flex items-center gap-1.5 whitespace-nowrap text-xs tabular-nums text-[#94A3B8]">{f.subtitulo}{f.marca}</span>
                      )}
                    </span>
                  </div>
                  <span className="flex min-w-0 flex-col gap-1 px-3 py-2"
                    title={cp.pct == null ? "Nada aplica" : `${cp.cumplidas} de ${cp.aplican} cumplidas${x.incumplimientos ? ` · ${x.incumplimientos} sin cumplir` : ""}`}>
                    <span className="flex items-baseline justify-between gap-1.5">
                      <span className="text-[13px] font-semibold leading-none tabular-nums" style={{ color: colorPct(cp.pct) }}>{fmtPct(cp.pct)}</span>
                      <span className="whitespace-nowrap text-xs tabular-nums text-[#94A3B8]">{cp.cumplidas} de {cp.aplican}</span>
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]">
                      <span className="block h-full rounded-full" style={{ width: `${cp.pct ?? 0}%`, background: colorPct(cp.pct) }} />
                    </span>
                  </span>
                  {m.columnasVisibles.map(({ columna: c, i }) => {
                    const cel = x.celdas[i];
                    if (!cel) return <span key={c.id} />;
                    const activa = !!po && po.filaId === f.id && po.columnaId === c.id;
                    return (
                      <span key={c.id} className="flex items-center justify-center self-stretch px-1.5 py-2">
                        <CeldaEstado celda={cel} activa={activa} atenuada={m.hayFiltro && !m.coincide(cel)}
                          titulo={cel.titulo ?? `${c.etiqueta}: ${ESTADOS[cel.estado].etiqueta}`}
                          onClick={p.popover ? (ev) => a.abrirPopover({
                            filaId: f.id, columnaId: c.id,
                            ...posicionPopover(ev.currentTarget.getBoundingClientRect(), window.innerWidth, window.innerHeight),
                          }) : undefined} />
                      </span>
                    );
                  })}
                </div>
              );
            })}

            {total > 0 && (
              <div className="grid items-center border-t border-[#E2E8F0] bg-[#F8FAFC]" style={{ gridTemplateColumns: grid }}>
                <span className="sticky left-0 z-[2] self-stretch bg-[#F8FAFC]" />
                <span className="sticky z-[2] flex items-center self-stretch bg-[#F8FAFC] p-3 text-[13px] font-semibold text-[#334155] shadow-[1px_0_0_#E2E8F0]" style={{ left: anchoAcc }}>
                  {p.etiquetaPie}
                </span>
                <span className="p-3 text-[13px] font-semibold tabular-nums" style={{ color: colorPct(m.pie.total.pct) }}
                  title={m.pie.total.pct == null ? "Nada aplica" : `${m.pie.total.cumplidas} de ${m.pie.total.aplican} cumplidas`}>
                  {fmtPct(m.pie.total.pct)}
                </span>
                {m.columnasVisibles.map(({ columna: c }, k) => {
                  const cp = m.pie.porColumna[k];
                  return (
                    <span key={c.id} className="px-1.5 py-3 text-center text-[13px] font-semibold tabular-nums" style={{ color: colorPct(cp.pct) }}
                      title={cp.pct == null ? `${c.etiqueta}: no aplica en este periodo` : `${c.etiqueta}: ${cp.cumplidas} de ${cp.aplican} ${p.unidadPie} cumplieron`}>
                      {fmtPct(cp.pct)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {total === 0 && (p.vacio ?? (
          <div className="flex min-h-[240px] items-center justify-center border-t border-[#F1F5F9] text-sm text-[#64748B]">
            {m.hayFiltro ? "No se encontraron resultados" : "No existen registros"}
          </div>
        ))}
      </div>

      <div className={`rounded-b-xl border border-[#E2E8F0] border-t-[#F1F5F9] bg-white ${p.paginacion ? "px-4 py-3" : "h-3"}`}>
        {p.paginacion?.(total)}
      </div>

      {m.seleccionadas.length > 0 && (
        <BarraFlotante etiqueta={m.seleccionadas.length === 1 ? "1 seleccionado" : `${m.seleccionadas.length} seleccionados`} onQuitar={a.limpiarSeleccion}>
          <BotonBarra onClick={a.alternarTodas}>
            <IconoTodas todas={m.todasSeleccionadas} />{m.todasSeleccionadas ? "Quitar selección" : `Seleccionar todos (${total})`}
          </BotonBarra>
          <BotonBarra onClick={descargar}><Download />Descargar Registros</BotonBarra>
          {conCampana && (
            <BotonBarra blanco onClick={() => p.onNotificar!(conIncumplimiento)} deshabilitado={!conIncumplimiento.length}
              titulo={conIncumplimiento.length ? undefined : "Ninguno de los seleccionados tiene incumplimientos"}>
              <Bell />Notificar Incumplimientos
            </BotonBarra>
          )}
        </BarraFlotante>
      )}

      {po && poCelda && poContenido && (
        <PopoverCelda pos={po} estado={poCelda.estado} contenido={poContenido} onCerrar={cerrar} />
      )}
    </section>
  );
}
