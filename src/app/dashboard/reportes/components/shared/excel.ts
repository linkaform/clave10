import * as XLSX from "xlsx";
import { TableSpec } from "./tabla/tipos";

// Una hoja por tabla; números como números (para poder sumar en Excel)
export const descargarExcel = (tablas: TableSpec[], nombre: string) => {
  if (!tablas.length) return;
  const wb = XLSX.utils.book_new();
  const usados = new Set<string>();
  tablas.forEach(t => {
    const base = t.title.replace(/[[\]:*?/\\]/g, " ").slice(0, 31).trim() || "Hoja";
    let hoja = base, i = 2;
    while (usados.has(hoja)) hoja = `${base.slice(0, 28)} ${i++}`;
    usados.add(hoja);
    const filas = [t.cols.map(c => c.t), ...t.rows.map(r => r.map(x => (typeof x.v === "number" && isFinite(x.v) ? x.v : x.t)))];
    const ws = XLSX.utils.aoa_to_sheet(filas);
    ws["!cols"] = t.cols.map((_, j) => ({ wch: Math.min(45, Math.max(10, ...filas.map(f => String(f[j] ?? "").length + 2))) }));
    XLSX.utils.book_append_sheet(wb, ws, hoja);
  });
  XLSX.writeFile(wb, `${nombre.replace(/[\\/:*"<>|]/g, "-")}.xlsx`);
};
