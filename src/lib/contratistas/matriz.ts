// F0-12 · Lógica pura del motor de matriz (sin React). Se puede probar sola.
import type { EstadoCelda, MatrizCelda, MatrizColumna, MatrizFila } from "@/types/contratistas/matriz";

export interface EstiloEstado {
  etiqueta: string;
  /** Plural para los chips de filtro. */
  plural: string;
  bg: string;
  fg: string;
  /** Texto del chip de estado (más oscuro que `fg`). */
  texto: string;
  /** Bolita y contador. */
  punto: string;
}

/** Colores del diseño (ST, línea 5836+). */
export const ESTADOS: Record<EstadoCelda, EstiloEstado> = {
  ok:    { etiqueta: "Aceptado",        plural: "Aceptados",     bg: "#DCFCE7", fg: "#16A34A", texto: "#15803D", punto: "#16A34A" },
  rev:   { etiqueta: "Por revisar",     plural: "Por revisar",   bg: "#DBEAFE", fg: "#2F80ED", texto: "#1E6FDB", punto: "#2F80ED" },
  rech:  { etiqueta: "Rechazado",       plural: "Rechazados",    bg: "#FEE2E2", fg: "#DC2626", texto: "#B91C1C", punto: "#DC2626" },
  venc:  { etiqueta: "Vencido",         plural: "Vencidos",      bg: "#FFEDD5", fg: "#EA580C", texto: "#C2410C", punto: "#EA580C" },
  pend:  { etiqueta: "Por subir",       plural: "Por subir",     bg: "#F1F5F9", fg: "#64748B", texto: "#475569", punto: "#94A3B8" },
  falta: { etiqueta: "No entregado",    plural: "No entregados", bg: "#FEE2E2", fg: "#DC2626", texto: "#B91C1C", punto: "#DC2626" },
  na:    { etiqueta: "No aplica",       plural: "No aplica",     bg: "transparent", fg: "#64748B", texto: "#475569", punto: "#94A3B8" },
  par:   { etiqueta: "Parcial",         plural: "Parciales",     bg: "rgba(245,158,11,.14)", fg: "#F59E0B", texto: "#B45309", punto: "#F59E0B" },
  fut:   { etiqueta: "Por transcurrir", plural: "Por transcurrir", bg: "#F8FAFC", fg: "#CBD5E1", texto: "#94A3B8", punto: "#CBD5E1" },
};

/** Chips por defecto, en el orden del diseño. */
export const ESTADOS_CHIPS: EstadoCelda[] = ["ok", "rev", "pend", "rech", "venc", "falta", "na"];

/** Peor primero: decide el estado de una celda que agrupa periodos. */
const PRIORIDAD: EstadoCelda[] = ["rech", "venc", "falta", "rev", "pend", "ok"];

export const esIncumplimiento = (e: EstadoCelda) => e === "falta" || e === "rech" || e === "venc";

export const estadosDe = (c: MatrizCelda | undefined): EstadoCelda[] =>
  !c ? [] : c.estados?.length ? c.estados : [c.estado];

/**
 * Agrupa periodos (meses de un cuatrimestre o del año) en una sola celda:
 * nada evaluable → "pend" (o "na"/"fut" si todos lo son); todos los
 * evaluables con el mismo estado → ese estado; mezclados → "par" (Parcial).
 * `contador` = periodos evaluables que no cumplen, solo si agrupa varios.
 */
export function agruparPeriodos(estados: EstadoCelda[]): MatrizCelda {
  if (!estados.length) return { estado: "pend", estados: ["pend"] };
  if (estados.every((e) => e === "na")) return { estado: "na", estados: ["na"] };
  if (estados.every((e) => e === "fut")) return { estado: "fut", estados: ["fut"] };
  const evaluables = estados.filter((e) => e !== "fut" && e !== "na");
  const presentes = PRIORIDAD.filter((k) => estados.includes(k));
  if (!evaluables.length) return { estado: "pend", estados: presentes.length ? presentes : ["pend"] };
  const ok = evaluables.filter((e) => e === "ok").length;
  const malos = evaluables.length - ok;
  const unico = evaluables.every((e) => e === evaluables[0]);
  return {
    estado: unico ? evaluables[0] : "par",
    estados: presentes.length ? presentes : ["pend"],
    contador: estados.length > 1 && malos > 0 ? malos : undefined,
  };
}

/** Una celda aplica si no es "No aplica" ni "Por transcurrir". */
export const aplica = (c: MatrizCelda | undefined) => !!c && c.estado !== "na" && c.estado !== "fut";

export interface Cumplimiento {
  cumplidas: number;
  aplican: number;
  /** null si nada aplica (se muestra "—"). */
  pct: number | null;
}

export function cumplimiento(celdas: (MatrizCelda | undefined)[]): Cumplimiento {
  const ap = celdas.filter(aplica);
  const ok = ap.filter((c) => c!.estado === "ok").length;
  return { cumplidas: ok, aplican: ap.length, pct: ap.length ? Math.round((ok / ap.length) * 100) : null };
}

/** Umbrales: ≥90 verde, 51–89 ámbar, ≤50 rojo. */
export function colorPct(pct: number | null): string {
  if (pct == null) return "#94A3B8";
  return pct >= 90 ? "#16A34A" : pct > 50 ? "#B45309" : "#DC2626";
}

export const fmtPct = (pct: number | null) => (pct == null ? "—" : `${pct}%`);

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function iniciales(nombre: string): string {
  const w = nombre.replace(/,.*$/, "").split(/\s+/).filter((x) => /^[A-ZÁÉÍÓÚÑ]/.test(x));
  return (w.length ? w : nombre.split(/\s+/)).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
}

const AVATARES = ["#192A4E", "#2F80ED", "#0891B2", "#7C3AED", "#DB2777", "#EA580C"];
export function colorAvatar(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATARES[h % AVATARES.length];
}

export const compararNombre = (a: string, b: string) => norm(a).localeCompare(norm(b), "es");

/* ---------- CSV ---------- */

const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** CSV con cumplimiento y estado por columna (Descargar Registros). */
export function csvMatriz(
  filas: MatrizFila[],
  columnas: MatrizColumna[],
  celda: (f: MatrizFila, c: MatrizColumna) => MatrizCelda | undefined,
  etiquetaFila: string,
): string {
  const head = [etiquetaFila, "Identificador", "Cumplimiento", ...columnas.map((c) => c.etiqueta)];
  const body = filas.map((f) => {
    const cs = columnas.map((c) => celda(f, c));
    return [f.nombre, f.subtitulo ?? "", fmtPct(cumplimiento(cs).pct), ...cs.map((x) => (x ? ESTADOS[x.estado].etiqueta : ""))];
  });
  return "﻿" + [head, ...body].map((r) => r.map(q).join(",")).join("\n");
}

export function descargarCsv(csv: string, nombreArchivo: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = nombreArchivo.endsWith(".csv") ? nombreArchivo : `${nombreArchivo}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Popover ---------- */

export const POPOVER_ANCHO = 320;
const POPOVER_ALTO = 420;

export interface PosPopover {
  x: number;
  y: number;
  arriba: boolean;
  maxAlto: number;
  /** Posición de la flecha dentro del popover. */
  flecha: number;
}

/** Junto a la celda; hacia arriba si abajo no caben 420 px y arriba hay más espacio. */
export function posicionPopover(r: DOMRect, vw: number, vh: number): PosPopover {
  const cx = r.left + r.width / 2;
  const x = Math.max(12, Math.min(cx - POPOVER_ANCHO / 2, vw - POPOVER_ANCHO - 12));
  const abajo = vh - r.bottom;
  const arriba = abajo < POPOVER_ALTO && r.top > abajo;
  const y = Math.round(arriba ? r.top - 10 : r.bottom + 10);
  return { x: Math.round(x), y, arriba, maxAlto: Math.max(160, arriba ? y - 12 : vh - y - 12), flecha: Math.round(cx - x - 6) };
}
