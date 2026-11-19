// F0-12 · Estado y cálculos del motor de matriz (variante de estados).
// Orden, filtro por chips, selección, ancho de la primera columna y popover.
import { useCallback, useMemo, useState } from "react";
import {
  ESTADOS_CHIPS, compararNombre, cumplimiento, esIncumplimiento, estadosDe,
  type Cumplimiento, type PosPopover,
} from "@/lib/contratistas/matriz";
import type { EstadoCelda, MatrizCelda, MatrizColumna, MatrizFila, OrdenDir } from "@/types/contratistas/matriz";

export interface OpcionesMatriz {
  filas: MatrizFila[];
  columnas: MatrizColumna[];
  celda: (fila: MatrizFila, columna: MatrizColumna) => MatrizCelda | undefined;
  estadosChips?: EstadoCelda[];
  /** Ancho inicial de la columna de nombre. */
  anchoNombre?: number;
}

export interface FilaCalculada {
  fila: MatrizFila;
  celdas: (MatrizCelda | undefined)[];
  cumplimiento: Cumplimiento;
  incumplimientos: number;
}

export interface PopoverAbierto extends PosPopover {
  filaId: string;
  columnaId: string;
}

const siguiente = (d: OrdenDir): OrdenDir => (d === "" ? "asc" : d === "asc" ? "desc" : "");

export function useMatriz({ filas, columnas, celda, estadosChips = ESTADOS_CHIPS, anchoNombre = 260 }: OpcionesMatriz) {
  const [ordenNombre, setOrdenNombre] = useState<OrdenDir>("");
  const [ordenPct, setOrdenPct] = useState<OrdenDir>("");
  const [filtro, setFiltro] = useState<EstadoCelda[]>([]);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [ancho, setAncho] = useState(anchoNombre);
  const [popover, setPopover] = useState<PopoverAbierto | null>(null);

  // Todas las filas con sus celdas y cumplimiento (sobre todas las columnas).
  const calculadas = useMemo<FilaCalculada[]>(
    () => filas.map((f) => {
      const cs = columnas.map((c) => celda(f, c));
      return {
        fila: f, celdas: cs, cumplimiento: cumplimiento(cs),
        incumplimientos: cs.filter((c) => estadosDe(c).some(esIncumplimiento)).length,
      };
    }),
    [filas, columnas, celda],
  );

  const coincide = useCallback(
    (c: MatrizCelda | undefined) => !filtro.length || estadosDe(c).some((e) => filtro.includes(e)),
    [filtro],
  );

  // Chips: cuántas filas tienen al menos una celda en ese estado.
  const chips = useMemo(
    () => estadosChips.map((e) => ({
      estado: e,
      cuenta: calculadas.filter((x) => x.celdas.some((c) => estadosDe(c).includes(e))).length,
      activo: filtro.includes(e),
    })),
    [calculadas, estadosChips, filtro],
  );

  const visibles = useMemo(() => {
    let r = filtro.length ? calculadas.filter((x) => x.celdas.some((c) => coincide(c))) : calculadas.slice();
    if (ordenPct) r = r.sort((a, b) => ((a.cumplimiento.pct ?? 101) - (b.cumplimiento.pct ?? 101)) * (ordenPct === "asc" ? 1 : -1));
    else if (ordenNombre) r = r.sort((a, b) => compararNombre(a.fila.nombre, b.fila.nombre) * (ordenNombre === "asc" ? 1 : -1));
    return r;
  }, [calculadas, filtro, coincide, ordenNombre, ordenPct]);

  // Con filtro activo solo quedan las columnas donde alguna fila visible coincide.
  const columnasVisibles = useMemo(
    () => columnas.map((c, i) => ({ columna: c, i }))
      .filter(({ i }) => !filtro.length || visibles.some((x) => coincide(x.celdas[i]))),
    [columnas, visibles, filtro, coincide],
  );

  // Pie: % por columna sobre las filas visibles, y total general.
  const pie = useMemo(() => {
    const porColumna = columnasVisibles.map(({ i }) => cumplimiento(visibles.map((x) => x.celdas[i])));
    const total = cumplimiento(visibles.flatMap((x) => columnasVisibles.map(({ i }) => x.celdas[i])));
    return { porColumna, total };
  }, [columnasVisibles, visibles]);

  const cerrarPopover = useCallback(() => setPopover(null), []);

  const seleccionadas = useMemo(() => visibles.filter((x) => seleccion.has(x.fila.id)), [visibles, seleccion]);
  const todasSeleccionadas = visibles.length > 0 && visibles.every((x) => seleccion.has(x.fila.id));

  return {
    visibles, columnasVisibles, pie, chips, coincide,
    ordenNombre, ordenPct, ancho, popover, seleccion, seleccionadas, todasSeleccionadas,
    hayFiltro: filtro.length > 0,
    acciones: {
      ordenarNombre: () => { setOrdenNombre(siguiente(ordenNombre)); setOrdenPct(""); setPopover(null); },
      ordenarPct: () => { setOrdenPct(siguiente(ordenPct)); setOrdenNombre(""); setPopover(null); },
      alternarChip: (e: EstadoCelda) => setFiltro((f) => (f.includes(e) ? f.filter((x) => x !== e) : [...f, e])),
      limpiarFiltro: () => setFiltro([]),
      alternarFila: (id: string) => setSeleccion((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }),
      alternarTodas: () => setSeleccion(todasSeleccionadas ? new Set() : new Set(visibles.map((x) => x.fila.id))),
      limpiarSeleccion: () => setSeleccion(new Set()),
      setAncho: (w: number) => setAncho(Math.round(Math.max(200, Math.min(720, w)))),
      abrirPopover: (p: PopoverAbierto) =>
        setPopover((a) => (a && a.filaId === p.filaId && a.columnaId === p.columnaId ? null : p)),
      cerrarPopover,
    },
  };
}
