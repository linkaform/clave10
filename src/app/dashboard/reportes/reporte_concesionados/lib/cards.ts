// Simbología, filtros rápidos y celdas del reporte de concesionados
import { n, money } from "./core";

// Los tipos de gráficas y tablas son de components/shared; se reexportan para resumen.ts y tabs.ts
import type { Card, Serie } from "../../components/shared/graficas/tipos";
import type { Cell, TableSpec } from "../../components/shared/tabla/tipos";
export type { Card, HCard, HRow, HeatCard, HeatCell, LCard, Serie, Tip, TipLine, VBar, VCard, VCol } from "../../components/shared/graficas/tipos";
export type { Cell, TableSpec } from "../../components/shared/tabla/tipos";

// Resumen económico (panel de la pestaña Económico)
export type Eco = {
  prestado: number; partes: { k: string; v: number }[];
  vCalle: number; nCalle: number; vVenc: number; nVenc: number;
};

export type Calc = { graf: Card[]; tab: TableSpec[]; qn: Record<string, number>; total: number; eco?: Eco };

// ───── colores y simbología (del diseño) ─────
export const C = { BLUE: "#2F80ED", NAVY: "#192A4E", RED: "#DC2626", SLATE: "#CBD5E1", AMBAR: "#F59E0B", ROSA: "#DB2777", MORADO: "#8B5CF6", CLARO: "#93C5FD" };
export const TX = { red: "#B91C1C", amber: "#B45309", green: "#15803D", blue: "#1E6FDB" };

export const SER: Record<string, [string, string]> = {
  prest: ["Préstamos", C.BLUE], dev: ["Devueltos", C.NAVY], forz: ["Cerrados a la fuerza", C.RED],
  plazo: ["En plazo", C.CLARO], hoy: ["Deben regresar hoy", C.BLUE], venc: ["Vencidos", C.AMBAR],
  dan: ["Perdidos o dañados", C.ROSA], enc: ["Pidió con otro vencido", C.MORADO],
  hechos: ["Préstamos hechos", C.BLUE], bien: ["Regresó", C.NAVY], perdido: ["Perdido o dañado", C.ROSA],
  regreso: ["Regresó", C.NAVY], ahora: ["En plazo", C.CLARO], vvenc: ["Vencido", C.AMBAR], vperd: ["Perdido o dañado", C.ROSA],
};
export const ser = (...ks: string[]): Serie[] => ks.map(k => ({ k, t: SER[k][0], col: SER[k][1] }));

// Ícono (trazo SVG 24×24) y color de cada filtro rápido
const I_PREST = "M4 7h11l-3-3M20 17H9l3 3";
const I_DEV = "M9 10l-5 5 5 5M20 4v7a4 4 0 0 1-4 4H4";
const I_FORZ = "M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2zM8 11V8a4 4 0 0 1 8 0v3";
const I_RELOJ = "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 2";
const I_CAL = "M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 10h16M9 3v4M15 3v4";
const I_VENC = I_CAL + "M10 13.5l4 4M14 13.5l-4 4";
const I_DAN = "M12 3 2 21h20L12 3zM12 10v5M12 18v.5";
const I_X = "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM15 9l-6 6M9 9l6 6";
export const QI: Record<string, [string, string]> = {
  prest: [I_PREST, C.BLUE], dev: [I_DEV, C.NAVY], regreso: [I_DEV, C.NAVY], forz: [I_FORZ, C.RED],
  plazo: [I_RELOJ, "#64748B"], ahora: [I_RELOJ, C.BLUE], hoy: [I_CAL, C.BLUE], venc: [I_VENC, "#D97706"], vvenc: [I_VENC, "#D97706"],
  dan: [I_DAN, "#7F1D1D"], enc: ["M8 8h11v11H8zM5 16V5h11", C.MORADO], vperd: [I_X, C.ROSA],
};

// Filtros rápidos de cada pestaña
export const QUICK: Record<string, string[]> = {
  resumen: ["dev", "forz", "plazo", "hoy", "venc"], guardias: ["prest", "dev", "forz"], solicitantes: ["forz", "dan", "venc"],
  articulos: ["forz", "dan", "venc"], forzadas: ["dan", "enc"], economico: ["ahora", "vvenc", "regreso", "vperd"],
};

// Columna de tabla → estatus, para que los filtros rápidos también filtren las tablas
const KCOL: Record<string, string[]> = {
  "Préstamos": ["prest"], "Devueltos": ["dev"], "Cerrados a la fuerza": ["forz"], "En plazo": ["plazo", "ahora"],
  "Deben regresar hoy": ["hoy"], "Vencidos": ["venc"], "Dañados": ["dan"], "Perdidos o dañados": ["dan"], "No regresó": ["dan"],
  "Pidió con otro vencido": ["enc"], "Regresó": ["regreso"], "Préstamos entregados": ["prest"], "Devoluciones recibidas": ["dev"],
  "Cierres forzados realizados": ["forz"], "Vencido": ["vvenc"], "Valor vencido": ["vvenc"], "Perdido o dañado": ["vperd"],
};

// Deja solo las filas que tienen algo de los estatus activos
export const filtrarTabla = (t: TableSpec, act: string[], quick: string[]): TableSpec => {
  const a = act.filter(k => quick.includes(k));
  if (!a.length) return t;
  const cks = t.cols.map(c => (KCOL[c.t] ?? []).filter(k => quick.includes(k)));
  const idx = cks.map((ks, j) => (ks.some(k => a.includes(k)) ? j : -1)).filter(j => j >= 0);
  const keep = t.rows.map((row, i) => {
    if (t.rk) return t.rk[i].some(k => a.includes(k));
    if (t.grp?.[i]) return true;
    return !idx.length || idx.some(j => Number(row[j].v) > 0);
  });
  return { ...t, rows: t.rows.filter((_, i) => keep[i]), rk: t.rk?.filter((_, i) => keep[i]) };
};

// ───── celdas ─────
export const cell = (t: string | number | null | undefined, o: Omit<Cell, "t"> = {}): Cell => ({ t: t == null ? "" : String(t), ...o });
export const num = (v: number, o: Omit<Cell, "t" | "v"> = {}) => cell(n(v), { ...o, v });
export const mon = (v: number, o: Omit<Cell, "t" | "v"> = {}) => cell(money(v), { ...o, v });
export const colr = (v: number, tone: keyof typeof TX) => num(v, v ? { col: TX[tone], fw: 700 } : {});

export const nota10 = (mostrados: number, total: number, quien: string) =>
  total > mostrados ? `Mostrando ${mostrados} de ${total} ${quien} · en Tablas están todos` : "";
