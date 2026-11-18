// Especificación de tablas: datos puros; ReportTable solo los pinta
export type Cell = { t: string; v?: number | string; col?: string; fw?: number };
export type TableSpec = {
  id: string; title: string; short: string; cap?: string;
  cols: { t: string; r?: boolean }[];
  rows: Cell[][];
  rk?: string[][]; // estatus de cada fila, para los filtros rápidos
  grp?: boolean[]; // filas encabezado de grupo (las demás son su detalle)
};
