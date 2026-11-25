// Panel lateral de detalle: qué se abre al hacer clic en una fila de una gráfica.
// Igual que las gráficas, aquí solo se arman datos (PanelSpec) y DetallePanel los pinta.
//
// Cada fila clicable trae `sel` = "<tipo>|<dimensión>|<valor>" (ver selPanel y selPersona):
//   prest  pendientes de regresar de una categoría, ubicación o rango de tiempo fuera (Resumen)
//   sol    lo que tiene prestado y lo que perdió una persona o empresa (Solicitantes)
//   irr    irregularidades de una persona o empresa (Solicitantes)
//   forz   cierres forzados de una categoría, empresa o persona (Cierres forzados)
// Los demás paneles del diseño (lista, categoría) se agregan aquí cuando se trabajen esas
// pestañas: se arman con los mismos tipos de sección (stats, items, bars).
import { C, TX } from "./cards";
import { Corte, HORA, MALO, Prestamo, addDias, dur, fh, grupo, money, n, pct, sod, suma } from "./core";

// Destino de los enlaces del panel: la bitácora de concesionados filtrada por el folio y con
// el detalle de esa concesión abierto (ver ?folio= en app/dashboard/articulos/page.tsx).
export const BITACORA = "/dashboard/articulos?tab=articulos_concesionados";
export const concesionHref = (folio: string) => `${BITACORA}&folio=${encodeURIComponent(folio)}`;

// Rangos de la gráfica "Tiempo fuera" [etiqueta, desde h, hasta h]
export const TIEMPO_FUERA: [string, number, number][] = [["Menos de 8 h", 0, 8], ["8 a 24 h", 8, 24], ["1 a 3 días", 24, 72], ["Más de 3 días", 72, Infinity]];

type Dim = "categoria" | "ubicacion" | "vig";
export const selPanel = (dim: Dim, val: string) => `prest|${dim}|${val}`;

// Solicitantes: panel de la persona (o empresa, con "Ver por: Empresa")
type DimPersona = "solicitante" | "empresa";
export const selPersona = (tipo: "sol" | "irr", emp: boolean, val: string) => `${tipo}|${emp ? "empresa" : "solicitante"}|${val}`;

// Cierres forzados: panel de una categoría, empresa o persona
type DimForz = "categoria" | "empresa" | "solicitante";
export const selForz = (dim: DimForz, val: string) => `forz|${dim}|${val}`;

// Qué panel está abierto: la fila (`sel`) y, si se hizo clic en un tramo, su serie
export type PanelSel = { sel: string; serie?: string };

export type PanelItem = { a: string; b: string; bcol?: string; lines: string[]; href: string };
// Dato suelto de la tarjeta de resumen (nombre del campo arriba, valor abajo)
export type PanelStat = { t: string; v: string; col?: string };
// Fila de una lista con barras: nombre, valor, "% del total" y ancho de la barra (0–100)
export type PanelBar = { l: string; v: string; p: string; w: number };
// Cada sección es de un tipo:
//   items  lista de préstamos; cuenta = piezas junto al título (si no viene, el número de items)
//   stats  tarjeta de datos, sin título
//   bars   las 5 filas con más; total = cuántas hay en total, va junto al título
export type PanelSec = {
  k: string; title: string; txt?: string;
  items?: PanelItem[]; cuenta?: number;
  stats?: PanelStat[];
  bars?: PanelBar[]; total?: number; desc?: string; col?: string;
};
// av: iniciales del avatar; pill: chip junto al título (riesgo)
export type PanelSpec = {
  id: string; tit: string; sub: string; desc: string; secs: PanelSec[];
  av?: string; pill?: { t: string; bg: string; fg: string };
};

// Una card por equipo de cada folio: las piezas de la misma línea del préstamo (mismo folio,
// artículo y momento `t`) se juntan. Del más reciente al más antiguo.
const juntar = (l: Prestamo[], t: (r: Prestamo) => number, extra: (r: Prestamo) => string = () => "") => {
  const m = new Map<string, Prestamo[]>();
  l.forEach(r => {
    const k = `${r.folio}|${r.articulo}|${t(r)}|${extra(r)}`;
    m.set(k, [...(m.get(k) ?? []), r]);
  });
  return [...m.values()].sort((a, b) => t(b[0]) - t(a[0]));
};

// "2 piezas" / "1 de 3 pendientes"; vacío si el equipo es de una sola pieza.
// unidad: "2 de 3", o vacía si es una pieza
const piezasTxt = (g: Prestamo[], pend = false) => {
  const total = Number(g[0].unidad.split(" de ")[1]) || 1, k = g.length;
  if (total <= 1) return "";
  return k === total || !pend ? `${n(k)} ${k === 1 ? "pieza" : "piezas"}` : `${n(k)} de ${n(total)} pendientes`;
};
const linea = (...partes: (string | false | undefined)[]) => partes.filter(Boolean).join(" · ");
// Horas con un decimal solo si hace falta: "24 h", "19.6 h"
const hrs = (h: number) => `${n(Math.round(h * 10) / 10)} h`;
// Préstamos sin empresa o sin nombre: el título del panel no se queda vacío
const nombre = (val: string, dim: string) => val || (dim === "empresa" ? "Sin empresa" : dim === "categoria" ? "Sin categoría" : "Sin nombre");
const titulo = (g: Prestamo[]) => (g.length > 1 ? `${g[0].articulo} × ${n(g.length)}` : g[0].articulo);

// Pendientes de regresar de una categoría, ubicación o rango de tiempo fuera
const pendientes = (c: Corte, dim: Dim, val: string, serie: string | undefined, multi: boolean): PanelSpec => {
  const fin = c.fin, hoyFin = addDias(sod(fin), 1);
  const rango = TIEMPO_FUERA[Number(val)] ?? TIEMPO_FUERA[0];
  const ab = dim === "vig"
    ? c.abiertos.filter(r => { const h = (fin - r.t_ini) / HORA; return h >= rango[1] && h < rango[2]; })
    : c.abiertos.filter(r => r[dim] === val);
  const vence = (r: Prestamo) => r.t_ini + r.plazo * HORA;

  // Las piezas de una misma línea tienen el mismo plazo, así que caen juntas en la sección
  const item = (g: Prestamo[]): PanelItem => {
    const r = g[0], v = c.vencido(r);
    return {
      a: titulo(g),
      b: v ? `+${dur((fin - r.t_ini) / HORA - r.plazo)} vencido` : `Vence ${fh(vence(r))}`,
      bcol: v ? TX.red : undefined,
      lines: [
        linea(`Folio #${r.folio}`, piezasTxt(g, true), money(r.precio * g.length), dim !== "categoria" && r.categoria),
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
    .map(([k, title, l]) => ({ k, title, cuenta: l.length, items: juntar(l, r => r.t_ini).map(item) }));
  // Clic en un tramo de color: esa sección va primero
  if (serie) secs.sort((a, b) => Number(b.k === serie) - Number(a.k === serie));
  if (!secs.length) secs.push({ k: "nada", title: "", txt: "No hay artículos pendientes de regresar." });

  const tit = dim === "vig" ? `${rango[0]} fuera` : val;
  return { id: `prest|${dim}|${val}`, tit, sub: c.p.label, desc: `${n(ab.length)} ${ab.length === 1 ? "pieza pendiente" : "piezas pendientes"} de regresar`, secs };
};

// ───── Solicitantes: persona o empresa ─────
// Mismo criterio que la tabla "Detalle por empresa y solicitante" (tabs.ts): irregularidades =
// cerrados a la fuerza + perdidos o dañados + vencidos; riesgo alto con 4 o más, medio con 2 o 3.
const RIESGO: Record<string, [string, string]> = { Alto: ["#FEE2E2", TX.red], Medio: ["#FEF3C7", TX.amber], Bajo: ["#DCFCE7", TX.green] };
const iniciales = (t: string) => t.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

const persona = (c: Corte, tipo: "sol" | "irr", dim: DimPersona, val: string): PanelSpec => {
  const mio = (r: Prestamo) => r[dim] === val;
  const he = c.hechos.filter(mio), cer = c.cerrados.filter(mio), ab = c.abiertos.filter(mio);
  const fz = cer.filter(r => r.tipo_cierre === "Forzada"), dn = cer.filter(r => MALO.includes(r.estado)), en = ab.filter(c.vencido);
  const inc = fz.length + dn.length + en.length, riesgo = inc >= 4 ? "Alto" : inc >= 2 ? "Medio" : "Bajo";
  const quien = (r: Prestamo) => (dim === "empresa" ? r.solicitante : "");
  const uno = he[0] ?? ab[0] ?? cer[0];
  const base = {
    tit: nombre(val, dim), desc: "", av: iniciales(nombre(val, dim)),
    sub: [dim !== "empresa" && uno?.empresa ? uno.empresa : dim === "empresa" ? "Empresa" : "", c.p.label].filter(Boolean).join(" · "),
    pill: { t: `Riesgo ${riesgo.toLowerCase()}`, bg: RIESGO[riesgo][0], fg: RIESGO[riesgo][1] },
  };
  const secs: PanelSec[] = [];
  const S = (k: string, title: string, l: Prestamo[], t: (r: Prestamo) => number, item: (g: Prestamo[]) => PanelItem, extra?: (r: Prestamo) => string) => {
    if (l.length) secs.push({ k, title, cuenta: l.length, items: juntar(l, t, extra).map(item) });
  };

  if (tipo === "sol") {
    secs.push({
      k: "res", title: "", stats: [
        { t: "Valor prestado", v: money(suma(he, r => r.precio)) },
        { t: "Préstamos", v: n(he.length) },
        { t: "En plazo", v: money(suma(ab.filter(r => !c.vencido(r)), r => r.precio)) },
        { t: "Vencido", v: money(suma(en, r => r.precio)), col: en.length ? TX.amber : undefined },
        { t: "Perdido o dañado", v: money(suma(dn, r => r.precio)), col: dn.length ? TX.red : undefined },
      ],
    });
    S("ab", "Lo que tiene prestado", ab, r => r.t_ini, g => {
      const r = g[0], v = c.vencido(r), valor = money(r.precio * g.length);
      return {
        a: titulo(g), b: v ? `+${dur((c.fin - r.t_ini) / HORA - r.plazo)} vencido` : valor, bcol: v ? TX.red : undefined,
        lines: [linea(`Folio #${r.folio}`, r.categoria, piezasTxt(g, true), v && valor), linea(`Salió ${fh(r.t_ini)}`, `prestó ${r.guardia_presto || "—"}`, quien(r))],
        href: concesionHref(r.folio),
      };
    });
    S("per", "Lo que perdió o dañó", dn, r => r.t_fin ?? 0, g => {
      const r = g[0];
      return {
        a: titulo(g), b: r.estado, bcol: TX.red,
        lines: [linea(`Folio #${r.folio}`, r.categoria, piezasTxt(g), money(r.precio * g.length)), linea(`Regresó ${fh(r.t_fin ?? 0)}`, `recibió ${r.guardia_cierre || "—"}`, quien(r))],
        href: concesionHref(r.folio),
      };
    }, r => r.estado);
  } else {
    secs.push({ k: "res", title: "", stats: [{ t: "Irregularidades", v: n(inc), col: inc ? TX.red : undefined }, { t: "Préstamos", v: n(he.length) }] });
    S("fz", "Cerrados a la fuerza", fz, r => r.t_fin ?? 0, g => {
      const r = g[0];
      return {
        a: titulo(g), b: fh(r.t_fin ?? 0),
        lines: [linea(`Folio #${r.folio}`, `prestó ${r.guardia_presto || "—"}`, `cerró ${r.guardia_cierre || "—"}`, quien(r)), linea(r.ubicacion, `${hrs(r.horas)} afuera`, `plazo ${hrs(r.plazo)}`)],
        href: concesionHref(r.folio),
      };
    });
    S("dn", "Perdidos o dañados", dn, r => r.t_fin ?? 0, g => {
      const r = g[0];
      return {
        a: titulo(g), b: r.estado, bcol: TX.red,
        lines: [linea(`Folio #${r.folio}`, piezasTxt(g), money(r.precio * g.length), quien(r)), linea(fh(r.t_fin ?? 0), `recibió ${r.guardia_cierre || "—"}`)],
        href: concesionHref(r.folio),
      };
    }, r => r.estado);
    S("en", "Vencidos", en, r => r.t_ini, g => {
      const r = g[0];
      return {
        a: titulo(g), b: `+${dur((c.fin - r.t_ini) / HORA - r.plazo)} vencido`, bcol: TX.red,
        lines: [linea(`Folio #${r.folio}`, "sigue sin devolverse", `plazo ${hrs(r.plazo)}`, quien(r)), linea(`Salió ${fh(r.t_ini)}`, `prestó ${r.guardia_presto || "—"}`)],
        href: concesionHref(r.folio),
      };
    });
    if (!inc) secs.push({ k: "nada", title: "", txt: "Sin irregularidades en el periodo." });
  }
  return { id: `${tipo}|${dim}|${val}`, ...base, secs };
};

// ───── Cierres forzados: categoría, empresa o persona ─────
// fl: los cierres forzados que pasan los filtros de estatus activos, igual que las gráficas
// de la pestaña (tabs.ts → forzadas).
const forzados = (c: Corte, dim: DimForz, val: string, act: string[]): PanelSpec => {
  const pasa = (r: Prestamo) => !act.length || (act.includes("dan") && MALO.includes(r.estado)) || (act.includes("enc") && r.con_otro_vencido);
  const l = c.cerrados.filter(r => r.tipo_cierre === "Forzada" && pasa(r) && r[dim] === val);
  const he = c.hechos.filter(r => r[dim] === val);
  // Las 5 con más cierres forzados; el porcentaje es sobre todos los cierres del panel
  const barras = (f: (r: Prestamo) => string): Pick<PanelSec, "bars" | "total"> => {
    const g = grupo(l, f), max = Math.max(1, ...g.map(x => x.v.length)), tot = l.length || 1;
    return { total: g.length, bars: g.slice(0, 5).map(x => ({ l: x.k, v: n(x.v.length), p: `${pct((x.v.length / tot) * 100)} del total`, w: (x.v.length / max) * 100 })) };
  };
  const secs: PanelSec[] = [{
    k: "res", title: "", stats: [
      { t: "Cerrados a la fuerza", v: n(l.length), col: l.length ? TX.red : undefined },
      { t: "Préstamos", v: n(he.length) },
      { t: "% cerró a la fuerza", v: pct(he.length ? (l.length / he.length) * 100 : null) },
      { t: "Valor", v: money(suma(l, r => r.precio)) },
    ],
  }];
  if (l.length) {
    secs.push({ k: "art", title: "Artículos", desc: "Los 5 artículos con más cierres forzados.", col: C.RED, ...barras(r => r.articulo) });
    if (dim !== "categoria") secs.push({ k: "cat", title: "Categorías", desc: "Las 5 categorías con más cierres forzados.", col: C.RED, ...barras(r => r.categoria) });
    if (dim !== "solicitante") secs.push({ k: "per", title: "Personas", desc: "Las 5 personas con más cierres forzados.", col: C.RED, ...barras(r => r.solicitante) });
  }
  return { id: `forz|${dim}|${val}`, tit: nombre(val, dim), sub: c.p.label, desc: "Cerrados por un guardia sin devolución.", secs };
};

// act: filtros de estatus activos de la pestaña (los usa el panel de cierres forzados)
export const panelSpec = (ps: PanelSel, c: Corte, multi: boolean, act: string[] = []): PanelSpec | null => {
  const [tipo, dim, ...resto] = ps.sel.split("|");
  const val = resto.join("|");
  if (tipo === "prest" && (dim === "categoria" || dim === "ubicacion" || dim === "vig")) return pendientes(c, dim, val, ps.serie, multi);
  if ((tipo === "sol" || tipo === "irr") && (dim === "solicitante" || dim === "empresa")) return persona(c, tipo, dim, val);
  if (tipo === "forz" && (dim === "categoria" || dim === "empresa" || dim === "solicitante")) return forzados(c, dim, val, act);
  return null;
};

// ───── "Ver todos" de una sección del panel ─────
// El panel enseña los 5 más recientes; "Ver todos" pasa el reporte a la vista de tabla, a la
// tabla de detalle que corresponde, con los filtros que existen para esa sección. Si no hay
// filtro para algo (ubicación, tiempo fuera, persona o empresa), se queda sin ese filtro.
//   tabla      id de la tabla (resumen.ts / tabs.ts)
//   quick      botones de estatus que se prenden
//   categoria  filtro de categoría (solo en Resumen, que lo tiene)
export type VerTodos = { tabla: string; quick: string[]; categoria?: string };
export const verTodosDe = (sel: string, k: string): VerTodos | null => {
  const [tipo, dim, ...resto] = sel.split("|");
  // Resumen: secciones venc / hoy / plazo = los mismos botones de estatus de la pestaña
  if (tipo === "prest") return { tabla: "r_pend", quick: [k], categoria: dim === "categoria" ? resto.join("|") : undefined };
  // Solicitantes: los vencidos tienen su tabla; lo demás, el detalle por empresa y solicitante
  if (tipo === "sol" || tipo === "irr") {
    if (k === "en") return { tabla: "s_venc", quick: ["venc"] };
    return { tabla: "s_det", quick: k === "fz" ? ["forz"] : k === "per" || k === "dn" ? ["dan"] : [] };
  }
  return null;
};
