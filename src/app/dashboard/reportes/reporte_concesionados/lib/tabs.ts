// Pestañas Guardias, Solicitantes, Artículos, Cierres forzados y Económico
import { Corte, DIA, HORA, MALO, MES, Prestamo, addDias, dur, f1, fd, fh, grupo, lunes, money, n, pct, plural, suma, uniq } from "./core";
import { C, Calc, Card, Cell, Eco, HRow, SER, TX, TableSpec, Tip, cell, colr, mon, nota10, num, ser } from "./cards";

const desglose = (multi: boolean, l: Prestamo[]) => (multi ? grupo(l, r => r.ubicacion).map(g => ({ t: `${g.k}: ${n(g.v.length)}` })) : []);
const cerr = (c: Corte, t: string) => c.cerrados.filter(r => r.tipo_cierre === t).length;

// ───── Guardias ─────
export const guardias = (c: Corte, sel: string[], multi: boolean): Calc => {
  let gs = uniq([...c.hechos.map(r => r.guardia_presto), ...c.cerrados.map(r => r.guardia_cierre)]).filter(Boolean);
  if (sel.length) gs = gs.filter(g => sel.includes(g));
  const datos = gs.map(g => {
    const ent = c.hechos.filter(r => r.guardia_presto === g), rec = c.cerrados.filter(r => r.guardia_cierre === g);
    const dev = ent.filter(r => c.cerroAntes(r) && r.tipo_cierre === "Normal").length, forz = ent.filter(r => c.cerroAntes(r) && r.tipo_cierre === "Forzada").length;
    const devR = rec.filter(r => r.tipo_cierre === "Normal").length, forzR = rec.filter(r => r.tipo_cierre === "Forzada").length;
    return {
      g, ub: grupo([...ent, ...rec], r => r.ubicacion)[0]?.k ?? "", ent: ent.length, ab: ent.length - dev - forz, devR, forzR,
      tx: ent.length + devR + forzR, rec: rec.length, sinEv: rec.filter(r => r.evidencia === false).length, dan: rec.filter(r => MALO.includes(r.estado)).length,
    };
  }).sort((a, b) => b.tx - a.tx || a.g.localeCompare(b.g));
  const top = datos.filter(d => d.tx);
  const T = "Transacciones de préstamos por guardia";
  const graf: Card[] = [{
    kind: "h", title: T, cap: "Movimientos que registró cada guardia en el periodo.", lw: 150,
    series: [{ k: "prest", t: "Préstamos entregados", col: C.BLUE }, { k: "dev", t: "Devoluciones recibidas", col: C.NAVY }, { k: "forz", t: "Cierres forzados", col: C.RED }],
    rows: top.map(d => ({
      l: d.g, sub: multi ? d.ub : "", vals: [d.ent, d.devR, d.forzR],
      tip: { h: d.g, s: multi ? d.ub : "", tt: `${n(d.tx)} transacciones`, l: [{ t: `Préstamos entregados: ${n(d.ent)}`, col: C.BLUE }, { t: `Devoluciones recibidas: ${n(d.devR)}`, col: C.NAVY }, { t: `Cierres forzados: ${n(d.forzR)}`, col: C.RED }] },
    })),
    empty: !top.length,
  }];
  const tab: TableSpec[] = [{
    id: "g_tabla", short: "Guardias", title: T, cap: 'Abiertos = préstamos que entregó ese guardia y siguen sin devolverse. "Cierres sin evidencia" = sin foto o sin identificación.',
    cols: [{ t: "Guardia" }, { t: "Abiertos", r: true }, ...(multi ? [{ t: "Ubicación" }] : []), { t: "Transacciones", r: true }, { t: "Préstamos entregados", r: true }, { t: "Devoluciones recibidas", r: true }, { t: "Cierres forzados realizados", r: true }, { t: "Cierres sin evidencia", r: true }, { t: "Recibidos con daño", r: true }],
    rows: datos.map(d => [
      cell(d.g, { fw: 700 }), num(d.ab), ...(multi ? [cell(d.ub)] : []), num(d.tx, { fw: 700 }), num(d.ent), num(d.devR), colr(d.forzR, "red"),
      cell(d.rec ? `${d.sinEv} de ${d.rec}` : "---", { v: d.sinEv, col: d.sinEv ? TX.amber : undefined, fw: d.sinEv ? 700 : 400 }), colr(d.dan, "red"),
    ]),
  }];
  return { graf, tab, total: c.hechos.length, qn: { prest: c.hechos.length, dev: cerr(c, "Normal"), forz: cerr(c, "Forzada") } };
};

// ───── Solicitantes ─────
type Sol = ReturnType<typeof solic>[number];
const solic = (c: Corte, emp: boolean) => {
  const clave = (r: Prestamo) => (emp ? r.empresa : r.solicitante);
  const todos = [...c.hechos, ...c.cerrados, ...c.abiertos];
  return uniq(todos.map(clave)).map(k => {
    const de = (l: Prestamo[]) => l.filter(r => clave(r) === k);
    const cer = de(c.cerrados), ab = de(c.abiertos), he = de(c.hechos), mios = de(todos);
    const forz = cer.filter(r => r.tipo_cierre === "Forzada").length, dan = cer.filter(r => ["Dañado", "Roto", "Incompleto"].includes(r.estado)).length;
    const per = cer.filter(r => r.estado === "No regresó").length, venc = ab.filter(c.vencido).length;
    const sig = he.filter(r => !c.cerroAntes(r)), sigV = sig.filter(c.vencido), heP = he.filter(r => MALO.includes(r.estado));
    const inc = forz + dan + per + venc;
    return {
      k, tipo: uniq(mios.map(r => r.tipo_solicitante)).join(", "), empresa: mios[0]?.empresa ?? "", personas: uniq(mios.map(r => r.solicitante)).length,
      prest: he.length, ab: ab.length, venc, forz, dan, per, inc, vAhora: suma(ab, r => r.precio),
      vSig: suma(sig, r => r.precio), vVen: suma(sigV, r => r.precio), vTot: suma(he, r => r.precio), vPer: suma(heP, r => r.precio),
      nSig: sig.length, nVen: sigV.length, nPer: heP.length, riesgo: inc >= 4 ? "Alto" : inc >= 2 ? "Medio" : "Bajo",
    };
  });
};

export const solicitantes = (c: Corte, emp: boolean, multi: boolean): Calc => {
  const all = solic(c, emp), quien = emp ? "empresas" : "personas";
  const sub = (d: Sol) => (emp ? plural(d.personas, "persona", "personas") : d.empresa);
  const val = all.filter(d => d.vTot > 0).sort((a, b) => b.vTot - a.vTot), v10 = val.slice(0, 10);
  const irr = all.filter(d => d.inc > 0).sort((a, b) => b.inc - a.inc || b.prest - a.prest), i10 = irr.slice(0, 10);
  const RC: Record<string, string> = { Alto: TX.red, Medio: TX.amber, Bajo: TX.green };

  const vAhora = c.abiertos.filter(c.vencido).map(r => ({ r, pasado: (c.fin - r.t_ini) / HORA - r.plazo })).sort((a, b) => b.pasado - a.pasado);
  const vg = grupo(vAhora, x => (emp ? x.r.empresa : x.r.solicitante))
    .map(g => ({ k: g.k, v: g.v, val: suma(g.v, x => x.r.precio), empresa: g.v[0].r.empresa, personas: uniq(g.v.map(x => x.r.solicitante)).length }))
    .sort((a, b) => b.val - a.val);
  const TV = emp ? "Valor de artículos vencidos por empresa" : "Valor de artículos vencidos por solicitante";

  const graf: Card[] = [
    {
      kind: "h", title: TV, cap: "Valor de lo que tiene vencido actualmente y no ha regresado.", series: ser("venc"), lw: 200, fmt: money,
      rows: vg.slice(0, 10).map(d => ({ l: d.k, sub: emp ? plural(d.personas, "persona", "personas") : d.empresa, vals: [d.val], tip: { h: d.k, s: plural(d.v.length, "artículo", "artículos"), l: [{ t: `Vencido: ${money(d.val)}`, col: C.AMBAR }] } })),
      nota: nota10(Math.min(10, vg.length), vg.length, quien), empty: !vg.length, emptyT: "Nadie tiene artículos vencidos al cierre del periodo",
    },
    {
      kind: "h", title: emp ? "Las 10 empresas con más valor prestado" : "Las 10 personas con más valor prestado", cap: "Valor total de lo que se prestó en el periodo y qué pasó con él.",
      series: ser("bien", "ahora", "vvenc", "perdido"), lw: 200, fmt: money,
      rows: v10.map(d => ({
        l: d.k, sub: sub(d), vals: [d.vTot - d.vPer - d.vSig, d.vSig - d.vVen, d.vVen, d.vPer],
        tip: {
          h: d.k, s: `${money(d.vTot)} · ${plural(d.prest, "préstamo", "préstamos")}`,
          l: ([["Regresó", d.vTot - d.vPer - d.vSig, d.prest - d.nPer - d.nSig, C.NAVY], ["En plazo", d.vSig - d.vVen, d.nSig - d.nVen, C.CLARO], ["Vencido", d.vVen, d.nVen, C.AMBAR], ["Perdido o dañado", d.vPer, d.nPer, C.ROSA]] as [string, number, number, string][])
            .filter(x => x[2] > 0).map(([l, v, k, col]) => ({ t: `${l}: ${money(v)} (${n(k)})`, col })),
        },
      })),
      nota: nota10(v10.length, val.length, quien), empty: !v10.length,
    },
    {
      kind: "h", title: emp ? "Las 10 empresas con más irregularidades" : "Las 10 personas con más irregularidades", cap: "Total de irregularidades en el periodo.",
      series: ser("forz", "dan", "venc"), lw: 200,
      rows: i10.map(d => ({
        l: d.k, sub: sub(d), vals: [d.forz, d.dan + d.per, d.venc],
        tip: { h: d.k, s: `${plural(d.inc, "irregularidad", "irregularidades")} · ${plural(d.prest, "préstamo", "préstamos")}`, l: [{ t: `Cerrados a la fuerza: ${n(d.forz)}`, col: C.RED }, { t: `Perdidos o dañados: ${n(d.dan + d.per)}`, col: C.ROSA }, { t: `Vencidos: ${n(d.venc)}`, col: C.AMBAR }] },
      })),
      nota: nota10(i10.length, irr.length, quien), empty: !i10.length, emptyT: "Nadie tiene irregularidades en este periodo",
    },
  ];

  // Detalle agrupado: empresa → sus solicitantes
  const E = solic(c, true).sort((a, b) => b.inc - a.inc || b.vTot - a.vTot), PS = solic(c, false), rows: Cell[][] = [], grp: boolean[] = [];
  const met = (d: Sol): Cell[] => [
    num(d.prest), mon(d.vTot), num(d.ab), mon(d.vAhora), colr(d.venc, "amber"), mon(d.vPer, d.vPer ? { col: TX.red, fw: 700 } : {}),
    cell(pct(d.vTot ? (d.vPer / d.vTot) * 100 : 0), { v: d.vTot ? Math.round((d.vPer / d.vTot) * 1000) / 10 : 0 }),
    num(d.inc, { fw: 700 }), colr(d.forz, "red"), colr(d.dan, "red"), colr(d.per, "red"), cell(d.riesgo, { col: RC[d.riesgo], fw: 700 }),
  ];
  E.forEach(e => {
    rows.push([cell(e.k, { fw: 700 }), cell(e.tipo), num(e.personas), ...met(e)]); grp.push(true);
    PS.filter(d => d.empresa === e.k).sort((a, b) => b.inc - a.inc || b.vTot - a.vTot).forEach(d => { rows.push([cell(d.k), cell(d.tipo), cell("---"), ...met(d)]); grp.push(false); });
  });
  const tab: TableSpec[] = [
    {
      id: "s_venc", short: "Vencidos", title: TV, cap: "Cada artículo vencido sin devolver, del más atrasado al menos atrasado.", rk: vAhora.map(() => ["venc"]),
      cols: [{ t: "Solicitante" }, { t: "Empresa" }, { t: "Artículo" }, { t: "Unidad" }, { t: "Valor", r: true }, { t: "Retraso", r: true }, { t: "Plazo", r: true }, { t: "Prestó" }, { t: "Salió" }, ...(multi ? [{ t: "Ubicación" }] : [])],
      rows: vAhora.map(({ r, pasado }) => [
        cell(r.solicitante, { fw: 700 }), cell(r.empresa), cell(r.articulo), cell(r.unidad), mon(r.precio, { fw: 700 }),
        cell("+" + dur(pasado), { v: Math.round(pasado * 10) / 10, col: TX.red, fw: 700 }), cell(r.plazo + " h", { v: r.plazo }), cell(r.guardia_presto), cell(fh(r.t_ini)),
        ...(multi ? [cell(r.ubicacion)] : []),
      ]),
    },
    {
      id: "s_det", short: "Empresa / solicitante", title: "Detalle por empresa y solicitante", grp, rows,
      cap: "Valor prestado e irregularidades del periodo. Irregularidades = cerrados a la fuerza, dañados, no regresó y vencidos. Riesgo: alto con 4 o más, medio con 2 o 3, bajo con 0 o 1.",
      cols: [{ t: "Empresa / solicitante" }, { t: "Tipo" }, { t: "Personas", r: true }, { t: "Préstamos", r: true }, { t: "Valor prestado", r: true }, { t: "Pendientes", r: true }, { t: "Valor fuera", r: true }, { t: "Vencidos", r: true }, { t: "Valor perdido", r: true }, { t: "% perdido", r: true }, { t: "Irregularidades", r: true }, { t: "Cerrados a la fuerza", r: true }, { t: "Dañados", r: true }, { t: "No regresó", r: true }, { t: "Riesgo" }],
    },
  ];
  return { graf, tab, total: c.hechos.length, qn: { forz: cerr(c, "Forzada"), dan: c.cerrados.filter(r => MALO.includes(r.estado)).length, venc: c.abiertos.filter(c.vencido).length } };
};

// ───── Artículos ─────
const artProb = (c: Corte, f: (r: Prestamo) => string) =>
  uniq([...c.hechos, ...c.cerrados, ...c.abiertos].map(f)).map(k => {
    const he = c.hechos.filter(r => f(r) === k), cer = c.cerrados.filter(r => f(r) === k), ab = c.abiertos.filter(r => f(r) === k);
    const forz = cer.filter(r => r.tipo_cierre === "Forzada").length, dan = cer.filter(r => MALO.includes(r.estado)).length, venc = ab.filter(c.vencido).length;
    const x = he[0] ?? cer[0] ?? ab[0];
    return {
      k, cat: x.categoria, plazo: x.plazo, prest: he.length, arts: uniq(he.map(r => r.articulo)).length, unids: uniq(he.map(r => r.unidad)).length,
      forz, dan, venc, prob: forz + dan + venc, prom: cer.length ? suma(cer, r => r.horas) / cer.length : null, valor: suma(he, r => r.precio),
    };
  });

export const articulos = (c: Corte, categorias: string[]): Calc => {
  const cats = artProb(c, r => r.categoria), arts = artProb(c, r => r.articulo);
  const totP = suma(cats, d => d.prest);
  const porP = cats.filter(d => d.prest).sort((a, b) => b.prest - a.prest);
  const porProb = cats.filter(d => d.prob).sort((a, b) => b.prob - a.prob);
  const artP = arts.filter(d => d.prob).sort((a, b) => b.prob - a.prob), a10 = artP.slice(0, 10);
  const tiempo = cats.filter(d => d.prom !== null).sort((a, b) => (b.prom as number) - (a.prom as number));
  const tipProb = (h: string, s: string, d: { forz: number; dan: number; venc: number }): Tip => ({ h, s, l: [{ t: `Cerrados a la fuerza: ${n(d.forz)}`, col: C.RED }, { t: `Perdidos o dañados: ${n(d.dan)}`, col: C.ROSA }, { t: `Vencidos: ${n(d.venc)}`, col: C.AMBAR }] });
  const graf: Card[] = [
    {
      kind: "h", title: "Las 10 categorías con más préstamos", cap: "Total de préstamos de cada categoría en el periodo.", series: ser("prest"), lw: 170,
      rows: porP.slice(0, 10).map(d => ({ l: d.k, vals: [d.prest], tip: { h: d.k, s: plural(d.arts, "artículo", "artículos"), l: [{ t: `Préstamos: ${n(d.prest)}`, col: C.BLUE }] } })),
      nota: nota10(Math.min(10, porP.length), porP.length, "categorías"), empty: !porP.length,
    },
    {
      kind: "h", title: "Tiempo promedio afuera contra plazo", cap: "Cuánto tarda en promedio en regresar cada categoría, contra el plazo que tiene para regresar (línea roja).",
      series: [{ k: "prom", t: "Promedio afuera", col: C.BLUE }], lw: 170, fmt: v => f1(v) + " h",
      rows: tiempo.map((d): HRow => {
        const prom = d.prom as number;
        return {
          l: d.k, vals: [prom], mk: d.plazo,
          tip: { h: d.k, s: prom > d.plazo ? "En promedio se regresan tarde" : "En promedio se regresan a tiempo", l: [{ t: `Promedio afuera: ${dur(prom)}`, col: C.BLUE }, { t: `Plazo: ${d.plazo} h`, col: C.RED }, { t: `${prom > d.plazo ? "Se pasa" : "Le sobran"}: ${dur(Math.abs(prom - d.plazo))}` }] },
        };
      }),
      empty: !tiempo.length,
    },
    {
      kind: "h", title: "Las 10 categorías con más problemas", cap: "Total de problemas de cada categoría en el periodo.", series: ser("forz", "dan", "venc"), lw: 170,
      rows: porProb.slice(0, 10).map(d => ({ l: d.k, vals: [d.forz, d.dan, d.venc], tip: tipProb(d.k, `${plural(d.prob, "problema", "problemas")} · ${n(d.prest)} préstamos`, d) })),
      nota: nota10(Math.min(10, porProb.length), porProb.length, "categorías"), empty: !porProb.length, emptyT: "Sin problemas en este periodo",
    },
    {
      kind: "h", title: "Los 10 artículos con más problemas", cap: `Total de problemas de cada artículo${categorias.length ? " de " + categorias.join(", ") : ""} en el periodo.`, series: ser("forz", "dan", "venc"), lw: 190,
      rows: a10.map(d => ({ l: d.k, sub: d.cat, vals: [d.forz, d.dan, d.venc], tip: tipProb(d.k, `${d.cat} · ${plural(d.prob, "problema", "problemas")} · ${n(d.prest)} préstamos`, d) })),
      nota: nota10(a10.length, artP.length, "artículos"), empty: !a10.length, emptyT: "Sin problemas en este periodo",
    },
  ];
  const rows: Cell[][] = [], grp: boolean[] = [];
  const fila = (d: (typeof cats)[number], cat: boolean): Cell[] => {
    const dif = d.prom === null ? null : d.prom - d.plazo;
    return [
      cell(d.k, { fw: cat ? 700 : 400 }), num(d.prest), cell(pct(totP ? (d.prest / totP) * 100 : 0), { v: totP ? Math.round((d.prest / totP) * 1000) / 10 : 0 }),
      cat ? num(d.arts) : cell("---"), num(d.unids), mon(d.valor),
      d.prom === null ? cell("---") : cell(f1(d.prom), { v: Math.round(d.prom * 10) / 10 }), num(d.plazo),
      dif === null ? cell("---") : cell((dif > 0 ? "+" : "") + f1(dif), { v: Math.round(dif * 10) / 10, col: dif > 0 ? TX.amber : TX.green, fw: 700 }),
      colr(d.forz, "red"), colr(d.dan, "red"), colr(d.venc, "amber"), num(d.prob, { fw: 700 }),
    ];
  };
  cats.slice().sort((a, b) => b.prest - a.prest).forEach(d => {
    rows.push(fila(d, true)); grp.push(true);
    arts.filter(x => x.cat === d.k).sort((a, b) => b.prob - a.prob || b.prest - a.prest).forEach(x => { rows.push(fila(x, false)); grp.push(false); });
  });
  const tab: TableSpec[] = [{
    id: "a_det", short: "Categoría", title: "Detalle por categoría y artículo", grp, rows,
    cap: "Préstamos, tiempo afuera y problemas de cada categoría y sus artículos. Diferencia = promedio afuera menos el plazo.",
    cols: [{ t: "Categoría / artículo" }, { t: "Préstamos", r: true }, { t: "% de los préstamos", r: true }, { t: "Artículos", r: true }, { t: "Unidades", r: true }, { t: "Valor prestado", r: true }, { t: "Promedio afuera (h)", r: true }, { t: "Plazo (h)", r: true }, { t: "Diferencia (h)", r: true }, { t: "Cerrados a la fuerza", r: true }, { t: "Perdidos o dañados", r: true }, { t: "Vencidos", r: true }, { t: "Total de problemas", r: true }],
  }];
  return { graf, tab, total: c.hechos.length, qn: { forz: cerr(c, "Forzada"), dan: c.cerrados.filter(r => MALO.includes(r.estado)).length, venc: c.abiertos.filter(c.vencido).length } };
};

// ───── Cierres forzados ─────
// base: préstamos ya filtrados (sin el corte del periodo) para contar los hechos por día/semana
export const forzadas = (c: Corte, base: Prestamo[], act: string[], d0: number, multi: boolean): Calc => {
  const p = c.p;
  const pasa = (r: Prestamo) => !act.length || (act.includes("dan") && MALO.includes(r.estado)) || (act.includes("enc") && r.con_otro_vencido);
  const todasF = c.cerrados.filter(r => r.tipo_cierre === "Forzada");
  const fl = todasF.filter(pasa).sort((a, b) => (b.t_fin as number) - (a.t_fin as number));
  const cub: { ini: number; fin: number; x: string; h: string }[] = [];
  if (p.unico) {
    for (let t = lunes(Math.max(p.ini, d0)); t < p.end; t = addDias(t, 7)) {
      const a = new Date(t), z = new Date(addDias(t, 6));
      cub.push({ ini: t, fin: addDias(t, 7), x: `${a.getDate()} ${MES[a.getMonth()]}–${z.getDate()} ${MES[z.getMonth()]}`, h: `Semana del ${a.getDate()} ${MES[a.getMonth()]} al ${z.getDate()} ${MES[z.getMonth()]}` });
    }
  } else {
    for (let t = p.ini; t < p.end; t = addDias(t, 1)) { const d = new Date(t); cub.push({ ini: t, fin: addDias(t, 1), x: p.v === "semana" ? `${DIA[d.getDay()]} ${d.getDate()}` : String(d.getDate()), h: fd(t) }); }
  }
  const tiempo = cub.map(q => { const l = base.filter(r => r.t_ini >= q.ini && r.t_ini < q.fin); return { ...q, l, f: l.filter(r => r.tipo_cierre === "Forzada" && pasa(r)) }; });
  const vacio = !tiempo.some(d => d.l.length);
  const T0 = p.unico ? "Préstamos y cierres forzados por semana" : "Préstamos y cierres forzados por día";
  const pc = (d: (typeof tiempo)[number]) => (d.l.length ? (d.f.length / d.l.length) * 100 : 0);
  const tipF = (d: (typeof tiempo)[number]): Tip => ({ h: d.h, s: plural(d.l.length, "préstamo", "préstamos"), l: [{ t: `Cerrados a la fuerza: ${pct(pc(d))} (${n(d.f.length)})`, col: C.RED }] });
  const graf: Card[] = [
    {
      kind: "v", title: T0, cap: `Préstamos hechos ${p.unico ? "cada semana" : "cada día"} y, de esos, cuántos se cerraron a la fuerza.`, empty: vacio,
      cols: tiempo.map(d => ({ x: d.x, bars: [[{ k: "hechos", v: d.l.length, col: C.BLUE }], [{ k: "forz", v: d.f.length, col: C.RED }]], tip: tipF(d) })),
    },
    {
      kind: "l", title: p.unico ? "Porcentaje de cierres forzados por semana" : "Porcentaje de cierres forzados por día", cap: "De cada 100 préstamos hechos, cuántos se cerraron a la fuerza.",
      fmt: v => Math.round(v) + "%", empty: vacio, pts: tiempo.map(d => ({ v: pc(d), x: d.x, tip: tipF(d) })),
    },
  ];
  const tab: TableSpec[] = [{
    id: "f_tiempo", short: "Tiempo", title: T0, cols: [{ t: p.unico ? "Semana" : "Día" }, { t: "Préstamos hechos", r: true }, { t: "Cerrados a la fuerza", r: true }, { t: "% a la fuerza", r: true }],
    rows: tiempo.map(d => [cell(d.h, { fw: 700 }), num(d.l.length), colr(d.f.length, "red"), cell(pct(d.l.length ? pc(d) : null), { v: d.l.length ? Math.round(pc(d) * 10) / 10 : "" })]),
  }];
  const dims: { campo: "categoria" | "empresa" | "solicitante"; titulo: string; top: string; quien: string; cap: string; col0: string; short: string; extra?: { t: string; r?: boolean; f: (l: Prestamo[]) => Cell } }[] = [
    { campo: "categoria", titulo: "Cierres forzados por categoría", top: "Las 10 categorías con más cierres forzados", quien: "categorías", col0: "Categoría", short: "Categoría", cap: "Total de préstamos cerrados a la fuerza en el periodo en cada categoría.", extra: { t: "Artículos", r: true, f: l => num(uniq(l.map(r => r.articulo)).length) } },
    { campo: "empresa", titulo: "Cierres forzados por empresa", top: "Las 10 empresas con más cierres forzados", quien: "empresas", col0: "Empresa", short: "Empresa", cap: "Total de préstamos cerrados a la fuerza en el periodo por empresa del solicitante." },
    { campo: "solicitante", titulo: "Cierres forzados por persona", top: "Las 10 personas con más cierres forzados", quien: "personas", col0: "Solicitante", short: "Persona", cap: "Total de préstamos cerrados a la fuerza en el periodo por solicitante, responsable de que se registre la devolución.", extra: { t: "Empresa", f: l => cell(l[0].empresa) } },
  ];
  dims.forEach(d => {
    const gr = grupo(fl, r => r[d.campo]), top = gr.slice(0, 10);
    graf.push({
      kind: "h", title: d.top, cap: d.cap, series: ser("forz"), lw: 200,
      rows: top.map(g => ({
        l: g.k, vals: [g.v.length],
        sub: d.campo === "solicitante" ? g.v[0].empresa : d.campo === "empresa" ? plural(uniq(g.v.map(r => r.solicitante)).length, "persona", "personas") : plural(uniq(g.v.map(r => r.articulo)).length, "artículo", "artículos"),
        tip: { h: g.k, l: [{ t: `Cerrados a la fuerza: ${n(g.v.length)}`, col: C.RED }, ...desglose(multi, g.v)] },
      })),
      nota: nota10(top.length, gr.length, d.quien), empty: !top.length, emptyT: "Sin cierres forzados en este periodo",
    });
    if (d.campo !== "empresa") tab.push({
      id: "f_" + d.campo, short: d.short, title: d.titulo,
      cols: [{ t: d.col0 }, ...(d.extra ? [{ t: d.extra.t, r: d.extra.r }] : []), { t: "Cerrados a la fuerza", r: true }, { t: "Perdidos o dañados", r: true }, { t: "Con otro vencido", r: true }],
      rows: gr.map(g => [cell(g.k, { fw: 700 }), ...(d.extra ? [d.extra.f(g.v)] : []), colr(g.v.length, "red"), colr(g.v.filter(r => MALO.includes(r.estado)).length, "red"), colr(g.v.filter(r => r.con_otro_vencido).length, "red")]),
    });
  });
  tab.push({
    id: "f_tabla", short: "Cierres", title: "Cada cierre forzado del periodo", cap: '"Con otro vencido" = lo pidió teniendo otro préstamo que ya pasaba su plazo.',
    cols: [{ t: "Folio" }, { t: "Ubicación" }, { t: "Artículo" }, { t: "Unidad" }, { t: "Solicitante" }, { t: "Empresa" }, { t: "Prestó" }, { t: "Forzó" }, { t: "Cerrada" }, { t: "Horas", r: true }, { t: "Condición" }, { t: "Con otro vencido" }],
    rows: fl.map(r => [
      cell("#" + r.folio, { fw: 700 }), cell(r.ubicacion), cell(r.articulo), cell(r.unidad), cell(r.solicitante), cell(r.empresa), cell(r.guardia_presto), cell(r.guardia_cierre),
      cell(fh(r.t_fin as number)), cell(f1(r.horas), { v: r.horas }), cell(r.estado || "---", MALO.includes(r.estado) ? { col: TX.red, fw: 700 } : {}),
      cell(r.con_otro_vencido ? "Sí" : "No", r.con_otro_vencido ? { col: TX.red, fw: 700 } : {}),
    ]),
  });
  return { graf, tab, total: c.hechos.length, qn: { dan: todasF.filter(r => MALO.includes(r.estado)).length, enc: todasF.filter(r => r.con_otro_vencido).length } };
};

// ───── Económico ─────
const KEYS = ["regreso", "ahora", "vvenc", "vperd"] as const;
type K = (typeof KEYS)[number];

export const economico = (c: Corte, multi: boolean): Calc => {
  const estado = (r: Prestamo): K => (c.cerroAntes(r) ? (MALO.includes(r.estado) ? "vperd" : "regreso") : c.vencido(r) ? "vvenc" : "ahora");
  const reparte = (l: Prestamo[]) => {
    const v: Record<K, number> = { regreso: 0, ahora: 0, vvenc: 0, vperd: 0 }, k: Record<K, number> = { regreso: 0, ahora: 0, vvenc: 0, vperd: 0 };
    l.forEach(r => { const e = estado(r); v[e] += r.precio; k[e]++; });
    return { v, k, tot: suma(l, r => r.precio) };
  };
  type Rep = ReturnType<typeof reparte>;
  const calle = c.abiertos, abV = calle.filter(c.vencido);
  const tipE = (h: string, s: string, o: Rep): Tip => ({ h, s, l: KEYS.filter(k => o.k[k]).map(k => ({ t: `${SER[k][0]}: ${money(o.v[k])} (${n(o.k[k])})`, col: SER[k][1] })) });
  const cel = (o: Rep): Cell[] => [mon(o.tot, { fw: 700 }), mon(o.v.regreso), mon(o.v.ahora), mon(o.v.vvenc, o.v.vvenc ? { col: TX.amber, fw: 700 } : {}), mon(o.v.vperd, o.v.vperd ? { col: TX.red, fw: 700 } : {})];
  const enCalle = (f: (r: Prestamo) => string) => grupo(calle, f).map(g => { const v = g.v.filter(c.vencido); return { k: g.k, tot: suma(g.v, r => r.precio), venc: suma(v, r => r.precio), nv: v.length, cnt: g.v.length }; }).sort((a, b) => b.tot - a.tot);
  const calleCat = enCalle(r => r.categoria), porUb = enCalle(r => r.ubicacion);
  const porCat = grupo(c.hechos, r => r.categoria).map(g => ({ k: g.k, o: reparte(g.v), cnt: g.v.length })).sort((a, b) => b.o.tot - a.o.tot);
  const porArt = grupo(c.hechos, r => r.articulo).map(g => ({ k: g.k, cat: g.v[0].categoria, precio: g.v[0].precio, o: reparte(g.v), cnt: g.v.length })).sort((a, b) => b.o.tot - a.o.tot), ar10 = porArt.slice(0, 10);
  const sinCalle = "No hay artículos prestados en este momento";
  const calleCard = (title: string, cap: string, list: typeof calleCat): Card => ({
    kind: "h", title, cap, series: ser("ahora", "vvenc"), lw: 170, fmt: money, empty: !list.length, emptyT: sinCalle,
    rows: list.map(d => ({
      l: d.k, vals: [d.tot - d.venc, d.venc],
      tip: { h: d.k, s: plural(d.cnt, "artículo", "artículos"), l: [...(d.cnt - d.nv ? [{ t: `En plazo: ${money(d.tot - d.venc)} (${n(d.cnt - d.nv)})`, col: C.CLARO }] : []), ...(d.nv ? [{ t: `Vencido: ${money(d.venc)} (${n(d.nv)})`, col: C.AMBAR }] : [])] },
    })),
  });
  const T0 = "Valor fuera por categoría";
  const graf: Card[] = [
    calleCard(T0, "Valor de lo que sigue prestado actualmente en cada categoría.", calleCat),
    ...(multi ? [calleCard("Valor fuera por ubicación", "Valor de lo que sigue prestado actualmente en cada ubicación.", porUb)] : []),
    {
      kind: "h", title: "Los 10 artículos con mayor valor prestado", cap: "Valor prestado en el periodo de cada artículo.", series: ser("prest"), lw: 220, fmt: money,
      rows: ar10.map(d => ({ l: d.k, sub: d.cat, vals: [d.o.tot], tip: { h: d.k, s: `${d.cat} · ${plural(d.cnt, "préstamo", "préstamos")}`, l: [{ t: `Valor por unidad: ${money(d.precio)}` }, { t: `Valor prestado en el periodo: ${money(d.o.tot)}`, col: C.BLUE }] } })),
      nota: nota10(Math.min(10, porArt.length), porArt.length, "artículos"), empty: !porArt.length,
    },
    {
      kind: "h", title: "Valor prestado por categoría", cap: "Valor total que se prestó en el periodo en cada categoría y qué pasó con él.", series: ser(...KEYS), lw: 170, fmt: money,
      rows: porCat.map(d => ({ l: d.k, vals: KEYS.map(k => d.o.v[k]), tip: tipE(d.k, `${n(d.cnt)} préstamos`, d.o) })), empty: !porCat.length,
    },
    {
      kind: "h", title: "Valor prestado por artículo", cap: "Valor total que se prestó en el periodo de cada artículo y qué pasó con él.", series: ser(...KEYS), lw: 190, fmt: money,
      rows: ar10.map(d => ({ l: d.k, sub: d.cat, vals: KEYS.map(k => d.o.v[k]), tip: tipE(d.k, `${n(d.cnt)} préstamos · valor por unidad ${money(d.precio)}`, d.o) })),
      nota: nota10(ar10.length, porArt.length, "artículos"), empty: !ar10.length,
    },
  ];
  const rows: Cell[][] = [], grp: boolean[] = [];
  porCat.forEach(d => {
    rows.push([cell(d.k, { fw: 700 }), cell("---"), num(d.cnt), ...cel(d.o)]); grp.push(true);
    porArt.filter(x => x.cat === d.k).forEach(x => { rows.push([cell(x.k), mon(x.precio), num(x.cnt), ...cel(x.o)]); grp.push(false); });
  });
  const tab: TableSpec[] = [
    {
      id: "e_calle", short: "Fuera", title: T0, rk: calleCat.map(d => [...(d.cnt - d.nv ? ["ahora"] : []), ...(d.nv ? ["vvenc"] : [])]),
      cols: [{ t: "Categoría" }, { t: "Artículos fuera", r: true }, { t: "Valor fuera", r: true }, { t: "En plazo", r: true }, { t: "Vencidos", r: true }, { t: "Valor vencido", r: true }],
      rows: calleCat.map(d => [cell(d.k, { fw: 700 }), num(d.cnt), mon(d.tot, { fw: 700 }), mon(d.tot - d.venc), colr(d.nv, "amber"), mon(d.venc, d.venc ? { col: TX.amber, fw: 700 } : {})]),
    },
    {
      id: "e_det", short: "Categoría", title: "Valor prestado por categoría y artículo", cap: "Lo que se prestó en el periodo y qué pasó con él.", grp, rows,
      cols: [{ t: "Categoría / artículo" }, { t: "Valor por unidad", r: true }, { t: "Préstamos", r: true }, { t: "Valor prestado", r: true }, { t: "Regresó", r: true }, { t: "En plazo", r: true }, { t: "Vencido", r: true }, { t: "Perdido o dañado", r: true }],
    },
  ];
  const tot = reparte(c.hechos);
  const eco: Eco = { prestado: tot.tot, partes: KEYS.map(k => ({ k, v: tot.v[k] })), vCalle: suma(calle, r => r.precio), nCalle: calle.length, vVenc: suma(abV, r => r.precio), nVenc: abV.length };
  const vv = abV.length;
  return { graf, tab, eco, total: c.hechos.length, qn: { regreso: tot.k.regreso, vperd: tot.k.vperd, vvenc: vv, ahora: c.abiertos.length - vv } };
};
