// Pestaña "Resumen operativo"
import { Corte, DIA, HORA, INICIO_DIA, Prestamo, addDias, f1, fd, fh, grupo, hh, n, plural, sod, suma } from "./core";
import { C, Calc, Card, Cell, HRow, TX, TableSpec, TipLine, cell, colr, mon, nota10, num, ser } from "./cards";

type Est = "plazo" | "hoy" | "venc";

export const resumen = (c: Corte, multi: boolean): Calc => {
  const graf: Card[] = [], tab: TableSpec[] = [], fin = c.fin, p = c.p;
  const hoyFin = addDias(sod(fin), 1);
  const sinNada = "No hay artículos prestados en este momento";
  const est = (r: Prestamo): Est => (c.vencido(r) ? "venc" : r.t_ini + r.plazo * HORA < hoyFin ? "hoy" : "plazo");
  const parte = (l: Prestamo[]) => ({ l, plazo: l.filter(r => est(r) === "plazo"), hoy: l.filter(r => est(r) === "hoy"), venc: l.filter(r => est(r) === "venc") });
  type Parte = ReturnType<typeof parte>;
  const tip3 = (h: string, x: Parte) => ({
    h, tt: plural(x.l.length, "artículo", "artículos"),
    l: ([[x.plazo.length, "En plazo", C.CLARO], [x.hoy.length, "Deben regresar hoy", C.BLUE], [x.venc.length, "Vencidos", C.AMBAR]] as [number, string, string][])
      .filter(z => z[0]).map(z => ({ t: `${z[1]}: ${n(z[0])}`, col: z[2] })),
  });
  const fila3 = (k: string, x: Parte): HRow => ({ l: k, vals: [x.plazo.length, x.hoy.length, x.venc.length], tip: tip3(k, x) });
  const cols3 = [{ t: "Pendientes", r: true }, { t: "En plazo", r: true }, { t: "Deben regresar hoy", r: true }, { t: "Vencidos", r: true }, { t: "Valor fuera", r: true }];
  const cel3 = (x: Parte): Cell[] => [num(x.l.length, { fw: 700 }), num(x.plazo.length), num(x.hoy.length), colr(x.venc.length, "amber"), mon(suma(x.l, r => r.precio))];
  const T3 = [{ t: "Préstamos", r: true }, { t: "Devueltos", r: true }, { t: "Cerrados a la fuerza", r: true }];
  const desglose = (l: Prestamo[]): TipLine[] => (multi ? grupo(l, r => r.ubicacion).map(g => ({ t: `${g.k}: ${plural(g.v.length, "préstamo", "préstamos")}` })) : []);

  // Pendientes por categoría
  const cats = grupo(c.abiertos, r => r.categoria).map(g => ({ k: g.k, ...parte(g.v) }));
  const TC = "Artículos pendientes de regresar por categoría";
  graf.push({
    kind: "h", title: TC, cap: "Lo que sigue prestado y está pendiente de regresar al final del periodo.", series: ser("plazo", "hoy", "venc"), lw: 190,
    rows: cats.slice(0, 10).map(d => fila3(d.k, d)), nota: nota10(Math.min(10, cats.length), cats.length, "categorías"), empty: !c.abiertos.length, emptyT: sinNada,
  });
  tab.push({ id: "r_cat", short: "Categoría", title: TC, cols: [{ t: "Categoría" }, ...cols3], rows: cats.map(d => [cell(d.k, { fw: 700 }), ...cel3(d)]), rk: cats.map(d => [...(d.plazo.length ? ["plazo"] : []), ...(d.hoy.length ? ["hoy"] : []), ...(d.venc.length ? ["venc"] : [])]) });

  // Tiempo fuera
  const V: [string, number, number][] = [["Menos de 8 h", 0, 8], ["8 a 24 h", 8, 24], ["1 a 3 días", 24, 72], ["Más de 3 días", 72, Infinity]];
  const vig = V.map(([l, a, b]) => ({ k: l, ...parte(c.abiertos.filter(r => { const h = (fin - r.t_ini) / HORA; return h >= a && h < b; })) }));
  graf.push({
    kind: "h", title: "Tiempo fuera de los artículos prestados", cap: "Cuánto tiempo llevan fuera los artículos pendientes de regresar al final del periodo.",
    series: ser("plazo", "hoy", "venc"), lw: 120, rows: vig.map(d => fila3(d.k, d)), empty: !c.abiertos.length, emptyT: sinNada,
  });
  const pend = c.abiertos.slice().sort((a, b) => a.t_ini - b.t_ini);
  tab.push({
    id: "r_pend", short: "Artículos", title: "Cada artículo pendiente de regresar", cap: "Del que lleva más tiempo fuera al que menos.",
    cols: [{ t: "Folio" }, { t: "Artículo" }, { t: "Unidad" }, { t: "Estatus" }, { t: "Horas fuera", r: true }, { t: "Plazo", r: true }, { t: "Solicitante" }, { t: "Prestó" }, { t: "Salió" }, { t: "Valor", r: true }, ...(multi ? [{ t: "Ubicación" }] : [])],
    rk: pend.map(r => [est(r)]),
    rows: pend.map(r => {
      const h = (fin - r.t_ini) / HORA, e = est(r);
      return [
        cell("#" + r.folio, { fw: 700 }), cell(r.articulo), cell(r.unidad),
        cell({ venc: "Vencido", hoy: "Debe regresar hoy", plazo: "En plazo" }[e], { col: e === "venc" ? TX.amber : e === "hoy" ? TX.blue : TX.green, fw: 700 }),
        cell(f1(h), { v: Math.round(h * 10) / 10, col: e === "venc" ? TX.red : undefined, fw: e === "venc" ? 700 : 400 }),
        cell(r.plazo + " h", { v: r.plazo }), cell(r.solicitante), cell(r.guardia_presto), cell(fh(r.t_ini)), mon(r.precio),
        ...(multi ? [cell(r.ubicacion)] : []),
      ];
    }),
  });

  // Por ubicación (solo con varias)
  if (multi) {
    const ubs = grupo(c.abiertos, r => r.ubicacion).map(g => ({ k: g.k, ...parte(g.v), he: c.hechos.filter(r => r.ubicacion === g.k) }));
    const TU = "Artículos prestados actualmente por ubicación";
    graf.push({ kind: "h", title: TU, cap: "Artículos prestados en cada ubicación.", series: ser("plazo", "hoy", "venc"), lw: 190, rows: ubs.map(d => fila3(d.k, d)), empty: !c.abiertos.length, emptyT: sinNada });
    tab.push({
      id: "r_ubic", short: "Ubicación", title: TU, cols: [{ t: "Ubicación" }, ...cols3, ...T3],
      rows: ubs.map(d => [cell(d.k, { fw: 700 }), ...cel3(d), num(d.he.length), num(d.he.filter(r => c.cerroAntes(r) && r.tipo_cierre === "Normal").length), colr(d.he.filter(r => c.cerroAntes(r) && r.tipo_cierre === "Forzada").length, "red")]),
    });
  }

  const horas = Array.from({ length: 24 }, (_, i) => (INICIO_DIA + i) % 24);
  const hr = (t: number) => new Date(t).getHours();
  const cierres = (l: Prestamo[]) => ({ dev: l.filter(r => r.tipo_cierre === "Normal").length, forz: l.filter(r => r.tipo_cierre === "Forzada").length });
  const tipMov = (h: string, pr: Prestamo[], dev: number, forz: number) => ({
    h, l: [{ t: `Préstamos: ${n(pr.length)}`, col: C.BLUE }, { t: `Devueltos: ${n(dev)}`, col: C.NAVY }, { t: `Cerrados a la fuerza: ${n(forz)}`, col: C.RED }, ...desglose(pr)],
  });
  const barras = (pr: number, dev: number, forz: number) => [[{ k: "prest", v: pr, col: C.BLUE }], [{ k: "dev", v: dev, col: C.NAVY }, { k: "forz", v: forz, col: C.RED }]];

  if (p.v === "dia") {
    const datos = horas.map(h => ({ h, pr: c.hechos.filter(r => hr(r.t_ini) === h), ...cierres(c.cerrados.filter(r => hr(r.t_fin as number) === h)) }));
    const T = "Movimiento por hora";
    graf.push({
      kind: "v", title: T, cap: `Préstamos y devoluciones de cada hora del día, desde las ${hh(INICIO_DIA)}.`, empty: !c.hechos.length && !c.cerrados.length,
      cols: datos.map(d => ({ x: d.h % 2 === INICIO_DIA % 2 ? hh(d.h) : "", bars: barras(d.pr.length, d.dev, d.forz), tip: tipMov(`${hh(d.h)} – ${hh((d.h + 1) % 24)}`, d.pr, d.dev, d.forz) })),
    });
    let bal = 0;
    tab.push({
      id: "r_hora", short: "Hora", title: T, cap: "Solo horas con movimiento. Balance = préstamos que siguen afuera, acumulado en el día.", cols: [{ t: "Hora" }, ...T3, { t: "Balance", r: true }],
      rows: datos.filter(d => d.pr.length || d.dev || d.forz).map(d => { bal += d.pr.length - d.dev - d.forz; return [cell(`${hh(d.h)} – ${hh((d.h + 1) % 24)}`, { fw: 700 }), num(d.pr.length), num(d.dev), colr(d.forz, "red"), num(bal)]; }),
    });
  } else {
    // Mapa de calor día × hora
    const filas = p.v === "semana"
      ? Array.from({ length: 7 }, (_, i) => { const t = addDias(p.ini, i), d = new Date(t); return { l: `${DIA[d.getDay()]} ${d.getDate()}`, m: (x: number) => sod(x) === t }; })
      : [1, 2, 3, 4, 5, 6, 0].map(dw => ({ l: DIA[dw], m: (x: number) => new Date(x).getDay() === dw }));
    const celdas = filas.map(f => horas.map(h => ({
      l: c.hechos.filter(r => f.m(r.t_ini) && hr(r.t_ini) === h),
      fz: c.cerrados.filter(r => r.tipo_cierre === "Forzada" && f.m(r.t_fin as number) && hr(r.t_fin as number) === h),
    })));
    const max = Math.max(1, ...celdas.flat().map(x => x.l.length)), paso4 = Math.max(1, Math.ceil(max / 4));
    const TON = ["#DBEAFE", "#93C5FD", "#3B82F6", "#1D4ED8"];
    const nivel = (v: number) => Math.min(3, Math.floor((v - 1) / paso4));
    const rangos = [0, 1, 2, 3].map(i => [i * paso4 + 1, Math.min(max, (i + 1) * paso4)]).filter(([a, b]) => a <= b);
    graf.push({
      kind: "heat", title: "Préstamos por día y hora",
      cap: p.v === "semana" ? "Préstamos por día y hora de la semana." : "Suma de préstamos del periodo por día de la semana y hora.",
      legend: [...rangos.map(([a, b], i) => ({ t: `${a === b ? a : a + "–" + b} ${b === 1 ? "préstamo" : "préstamos"}`, col: TON[i] })), { t: "Hubo cierre forzado", col: C.RED, round: true }],
      hrs: horas.map((h, i) => (i % 2 ? "" : hh(h))), empty: !c.hechos.length,
      rows: filas.map((f, fi) => ({
        l: f.l,
        cells: celdas[fi].map((x, hi) => {
          const v = x.l.length, lv = v ? nivel(v) : -1;
          return {
            v, bg: v ? TON[lv] : "", fg: lv >= 2 ? "#FFFFFF" : "#1D4ED8", dot: x.fz.length > 0,
            tip: { h: `${f.l} · ${hh(horas[hi])} – ${hh((horas[hi] + 1) % 24)}`, l: [{ t: `Préstamos: ${n(v)}`, col: C.BLUE }, ...(x.fz.length ? [{ t: `Cierres forzados: ${n(x.fz.length)}`, col: C.RED }] : []), ...desglose(x.l)] },
          };
        }),
      })),
    });
    // Movimiento por día
    const dias: number[] = [];
    for (let t = p.ini; t < p.end; t = addDias(t, 1)) dias.push(t);
    const datos = dias.map(t => ({ t, pr: c.hechos.filter(r => sod(r.t_ini) === t), ...cierres(c.cerrados.filter(r => sod(r.t_fin as number) === t)) }));
    const lab = (t: number) => { const d = new Date(t); return p.v === "semana" ? `${DIA[d.getDay()]} ${d.getDate()}` : String(d.getDate()); };
    const T2 = "Movimiento por día";
    graf.push({
      kind: "v", title: T2, cap: "Préstamos y devoluciones de cada día del periodo.", empty: !c.hechos.length && !c.cerrados.length,
      cols: datos.map(d => ({ x: lab(d.t), bars: barras(d.pr.length, d.dev, d.forz), tip: tipMov(fd(d.t), d.pr, d.dev, d.forz) })),
    });
    tab.push({ id: "r_dia", short: "Día", title: T2, cols: [{ t: "Día" }, ...T3], rows: datos.map(d => [cell(fd(d.t), { fw: 700 }), num(d.pr.length), num(d.dev), colr(d.forz, "red")]) });
  }

  // Conteos de los filtros rápidos
  const nv = c.abiertos.filter(r => !c.vencido(r));
  const qn = {
    dev: c.cerrados.filter(r => r.tipo_cierre === "Normal").length,
    forz: c.cerrados.filter(r => r.tipo_cierre === "Forzada").length,
    plazo: nv.filter(r => r.t_ini + r.plazo * HORA >= hoyFin).length,
    hoy: nv.filter(r => r.t_ini + r.plazo * HORA < hoyFin).length,
    venc: c.abiertos.filter(c.vencido).length,
  };
  return { graf, tab, qn, total: c.hechos.length };
};
