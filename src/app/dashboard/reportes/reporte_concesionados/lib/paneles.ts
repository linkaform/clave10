// Panel lateral de detalle: qué se abre al hacer clic en una fila de una gráfica.
// Igual que las gráficas, aquí solo se arman datos (PanelSpec) y DetallePanel los pinta.
//
// Cada fila clicable trae `sel` = "<tipo>|<dimensión>|<valor>" (ver selPanel). Por ahora solo
// existe el tipo "prest" (pendientes de regresar, pestaña Resumen); los demás paneles del
// diseño (sol, irr, forz, lista) se agregan aquí mismo cuando se trabajen esas pestañas.
import { TX } from "./cards";
import { Corte, HORA, Prestamo, addDias, dur, fh, money, n, sod } from "./core";

// Destino de los enlaces del panel: la bitácora de concesionados filtrada por el folio y con
// el detalle de esa concesión abierto (ver ?folio= en app/dashboard/articulos/page.tsx).
export const BITACORA = "/dashboard/articulos?tab=articulos_concesionados";
export const concesionHref = (folio: string) => `${BITACORA}&folio=${encodeURIComponent(folio)}`;

// Rangos de la gráfica "Tiempo fuera" [etiqueta, desde h, hasta h]
export const TIEMPO_FUERA: [string, number, number][] = [["Menos de 8 h", 0, 8], ["8 a 24 h", 8, 24], ["1 a 3 días", 24, 72], ["Más de 3 días", 72, Infinity]];

type Dim = "categoria" | "ubicacion" | "vig";
export const selPanel = (dim: Dim, val: string) => `prest|${dim}|${val}`;

// Qué panel está abierto: la fila (`sel`) y, si se hizo clic en un tramo, su serie
export type PanelSel = { sel: string; serie?: string };

export type PanelItem = { a: string; b: string; bcol?: string; lines: string[]; href: string };
// cuenta: lo que se muestra junto al título (piezas); si no viene, el número de items
export type PanelSec = { k: string; title: string; items?: PanelItem[]; cuenta?: number; txt?: string };
export type PanelSpec = { id: string; tit: string; sub: string; desc: string; secs: PanelSec[] };

// Pendientes de regresar de una categoría, ubicación o rango de tiempo fuera
const pendientes = (c: Corte, dim: Dim, val: string, serie: string | undefined, multi: boolean): PanelSpec => {
  const fin = c.fin, hoyFin = addDias(sod(fin), 1);
  const rango = TIEMPO_FUERA[Number(val)] ?? TIEMPO_FUERA[0];
  const ab = dim === "vig"
    ? c.abiertos.filter(r => { const h = (fin - r.t_ini) / HORA; return h >= rango[1] && h < rango[2]; })
    : c.abiertos.filter(r => r[dim] === val);
  const vence = (r: Prestamo) => r.t_ini + r.plazo * HORA;

  // Una card por equipo de cada folio: las piezas pendientes de la misma línea del préstamo
  // (mismo folio, artículo y salida) se juntan. Tienen el mismo plazo, así que caen juntas.
  const juntar = (l: Prestamo[]) => {
    const m = new Map<string, Prestamo[]>();
    l.forEach(r => {
      const k = `${r.folio}|${r.articulo}|${r.t_ini}`;
      m.set(k, [...(m.get(k) ?? []), r]);
    });
    return [...m.values()].sort((a, b) => b[0].t_ini - a[0].t_ini);
  };

  const item = (g: Prestamo[]): PanelItem => {
    const r = g[0], k = g.length;
    const total = Number(r.unidad.split(" de ")[1]) || 1; // unidad: "2 de 3", o vacía si es una pieza
    const piezas = total <= 1 ? "" : k === total ? `${n(k)} piezas` : `${n(k)} de ${n(total)} pendientes`;
    const v = c.vencido(r);
    return {
      a: k > 1 ? `${r.articulo} × ${n(k)}` : r.articulo,
      b: v ? `+${dur((fin - r.t_ini) / HORA - r.plazo)} vencido` : `Vence ${fh(vence(r))}`,
      bcol: v ? TX.red : undefined,
      lines: [
        [`Folio #${r.folio}`, piezas, money(r.precio * k), dim !== "categoria" && r.categoria].filter(Boolean).join(" · "),
        r.empresa ? `${r.solicitante || "Sin solicitante"} (${r.empresa})` : r.solicitante || "Sin solicitante",
        `Prestó ${r.guardia_presto || "—"} · salió ${fh(r.t_ini)}${multi && dim !== "ubicacion" ? " · " + r.ubicacion : ""}`,
      ],
      href: concesionHref(r.folio),
    };
  };

  const secs: PanelSec[] = ([
    ["venc", "Vencidos", ab.filter(c.vencido)],
    ["hoy", "Deben regresar hoy", ab.filter(r => !c.vencido(r) && vence(r) < hoyFin)],
    ["plazo", "En plazo", ab.filter(r => !c.vencido(r) && vence(r) >= hoyFin)],
  ] as [string, string, Prestamo[]][])
    .filter(([, , l]) => l.length)
    .map(([k, title, l]) => ({ k, title, cuenta: l.length, items: juntar(l).map(item) }));
  // Clic en un tramo de color: esa sección va primero
  if (serie) secs.sort((a, b) => Number(b.k === serie) - Number(a.k === serie));
  if (!secs.length) secs.push({ k: "nada", title: "", txt: "No hay artículos pendientes de regresar." });

  const tit = dim === "vig" ? `${rango[0]} fuera` : val;
  return { id: `prest|${dim}|${val}`, tit, sub: c.p.label, desc: `${n(ab.length)} ${ab.length === 1 ? "pieza pendiente" : "piezas pendientes"} de regresar`, secs };
};

export const panelSpec = (ps: PanelSel, c: Corte, multi: boolean): PanelSpec | null => {
  const [tipo, dim, ...resto] = ps.sel.split("|");
  const val = resto.join("|");
  if (tipo === "prest" && (dim === "categoria" || dim === "ubicacion" || dim === "vig")) return pendientes(c, dim, val, ps.serie, multi);
  return null;
};
