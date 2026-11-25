// Núcleo del reporte de artículos concesionados: tipos, formato, periodos y "corte".
// Port de la lógica del diseño "Reporte de articulos concesionados.dc.html".
import { n } from "../../components/shared/formato";

export const HORA = 36e5;

// Plazo para regresar, en horas, cuando el préstamo no trae fecha límite ni plazo
// (equipo sin plazo en el catálogo)
export const PLAZO_DEFAULT = 24;

// Condiciones que cuentan como "perdido o dañado"
export const MALO = ["Dañado", "Roto", "Incompleto", "No regresó"];

// Primera hora del día de la planta (mapa de calor y movimiento por hora)
export const INICIO_DIA = 6;

export type TipoCierre = "Normal" | "Forzada" | "Abierto";

// Préstamo tal como lo mandaría el back (una fila por artículo prestado)
export type PrestamoRaw = {
  folio: string;
  unidad: string;
  articulo: string;
  categoria: string;
  precio: number;
  solicitante: string;
  tipo_solicitante: string;
  empresa: string;
  guardia_presto: string;
  fecha_prestamo: string; // "YYYY-MM-DD HH:mm"
  tipo_cierre: TipoCierre;
  guardia_cierre: string;
  fecha_cierre: string | null;
  estado: string;
  foto: string;
  identificacion: string;
  ubicacion: string;
  // Evidencia de la devolución (URL). "" = la devolución no la trae; null = no hay devolución
  // capturada (abierto, o cerrado en registros viejos sin devolución)
  foto_cierre?: string | null;
  identificacion_cierre?: string | null;
  plazo?: number | null; // horas: el guardado al prestar o, en registros viejos, el actual del catálogo
  fecha_limite?: string | null; // "YYYY-MM-DD HH:mm"; si viene, manda sobre el plazo
};

export type Prestamo = Omit<PrestamoRaw, "plazo"> & {
  plazo: number;
  horas: number;
  t_ini: number;
  t_fin: number | null;
  con_otro_vencido: boolean;
  evidencia: boolean | null;
};

const fecha = (s: string | null) => (s ? new Date(s.replace(" ", "T") + ":00").getTime() : null);

// Horas que tenía el préstamo para regresar: hasta la fecha límite, o el plazo, o 24 h
const plazoDe = (p: PrestamoRaw, ini: number) => {
  const lim = fecha(p.fecha_limite ?? null);
  if (lim && lim > ini) return (lim - ini) / HORA;
  return p.plazo && p.plazo > 0 ? p.plazo : PLAZO_DEFAULT;
};

// ¿La devolución trae foto e identificación? Solo cuenta en devoluciones normales: las
// forzadas tienen su propia columna y no llevan evidencia. null = no aplica o no se sabe.
const evidenciaCierre = (p: PrestamoRaw): boolean | null => {
  if (p.tipo_cierre !== "Normal") return null;
  if (p.foto_cierre == null && p.identificacion_cierre == null) return null;
  return !!p.foto_cierre && !!p.identificacion_cierre;
};

// Agrega tiempos, plazo y "pidió con otro vencido"
export const enriquecer = (raw: PrestamoRaw[], ahora: number): Prestamo[] => {
  // Préstamos capturados sin nombre (hay registros así): cada folio por separado, para no
  // juntarlos en una sola "persona" ni ligarlos entre sí en "pidió con otro vencido"
  raw = raw.map(p => (p.solicitante?.trim() ? p : { ...p, solicitante: `Sin nombre · #${p.folio}` }));
  const base = raw.map(p => {
    const ini = fecha(p.fecha_prestamo) as number;
    return { p, ini, fin: fecha(p.fecha_cierre), plazo: plazoDe(p, ini) };
  });
  const porPersona = new Map<string, typeof base>();
  base.forEach(x => {
    const l = porPersona.get(x.p.solicitante) ?? [];
    l.push(x);
    porPersona.set(x.p.solicitante, l);
  });
  return base.map(({ p, ini, fin, plazo }) => {
    const otros = porPersona.get(p.solicitante) ?? [];
    const conOtro = otros.some(q => q.p !== p && q.ini < ini && (!q.fin || q.fin > ini) && (ini - q.ini) / HORA > q.plazo);
    return {
      ...p,
      precio: Number(p.precio) || 0,
      plazo,
      horas: Math.round((((fin ?? ahora) - ini) / HORA) * 10) / 10,
      t_ini: ini,
      t_fin: fin,
      con_otro_vencido: conOtro,
      evidencia: evidenciaCierre(p),
    };
  });
};

// ───── formato ─────
export const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MESL = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export { n };
export const money = (v: number) => "$" + Math.round(v || 0).toLocaleString("es-MX");
export const f1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const pct = (v: number | null | undefined) => (v == null ? "—" : f1(v) + "%");
export const dur = (h: number) => (h >= 48 ? f1(h / 24) + " días" : f1(h) + " h");
export const hh = (h: number) => String(h).padStart(2, "0") + ":00";
export const plural = (k: number, uno: string, varios: string) => `${n(k)} ${k === 1 ? uno : varios}`;

export const sod = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const addDias = (t: number, k: number) => { const d = new Date(t); d.setDate(d.getDate() + k); return d.getTime(); };
export const lunes = (t: number) => { const d = new Date(sod(t)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
export const fh = (t: number) => {
  const d = new Date(t);
  return `${DIA[d.getDay()]} ${d.getDate()} ${MES[d.getMonth()]} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
export const fd = (t: number) => { const d = new Date(t); return `${DIA[d.getDay()]} ${d.getDate()} ${MES[d.getMonth()]}`; };

export const grupo = <T,>(l: T[], f: (x: T) => string) => {
  const m = new Map<string, T[]>();
  l.forEach(r => { const k = f(r); const v = m.get(k) ?? []; v.push(r); m.set(k, v); });
  return [...m].map(([k, v]) => ({ k, v })).sort((a, b) => b.v.length - a.v.length || a.k.localeCompare(b.k));
};
export const suma = <T,>(l: T[], f: (x: T) => number) => l.reduce((a, r) => a + f(r), 0);
export const uniq = <T,>(l: T[]) => [...new Set(l)];

// ───── periodos ─────
export type Vista = "dia" | "semana" | "mes" | "u30" | "u60" | "historico";
export const VLBL: Record<Vista, string> = { dia: "Día", semana: "Semana", mes: "Mes", u30: "30 días", u60: "60 días", historico: "Histórico" };
const UNICO: Vista[] = ["historico", "u30", "u60"];

export type Periodo = { v: Vista; ini: number; fin: number; end: number; label: string; unico: boolean };

// ahora = momento del corte (normalmente Date.now()); d0 = inicio del historial
export const periodo = (v: Vista, ref: number, ahora: number, d0: number): Periodo => {
  const finDia = addDias(sod(ahora), 1);
  let ini: number, fin: number, label: string;
  if (v === "dia") {
    ini = sod(ref); fin = addDias(ini, 1);
    const d = new Date(ini);
    label = `${DIA[d.getDay()]} ${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}`;
  } else if (v === "semana") {
    ini = lunes(ref); fin = addDias(ini, 7);
    const a = new Date(ini), b = new Date(addDias(ini, 6));
    label = `${a.getDate()} ${MES[a.getMonth()]} – ${b.getDate()} ${MES[b.getMonth()]} ${b.getFullYear()}`;
  } else if (v === "mes") {
    const d = new Date(ref);
    ini = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    fin = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    label = `${MESL[d.getMonth()]} ${d.getFullYear()}`;
  } else if (v === "u30") { fin = finDia; ini = addDias(finDia, -30); label = "Últimos 30 días"; }
  else if (v === "u60") { fin = finDia; ini = addDias(finDia, -60); label = "Últimos 60 días"; }
  else { fin = finDia; ini = d0; label = "Todo el historial"; }
  return { v, ini, fin, end: Math.min(fin, ahora), label, unico: UNICO.includes(v) };
};

export const paso = (v: Vista, ref: number, k: number) => {
  if (v === "dia") return addDias(ref, k);
  if (v === "semana") return addDias(ref, 7 * k);
  const d = new Date(ref);
  return new Date(d.getFullYear(), d.getMonth() + k, Math.min(d.getDate(), 28), 12).getTime();
};

// ───── corte: qué préstamos caen en el periodo ─────
export type Corte = {
  p: Periodo;
  ini: number;
  fin: number;
  hechos: Prestamo[];   // salieron en el periodo
  cerrados: Prestamo[]; // se cerraron en el periodo
  abiertos: Prestamo[]; // seguían afuera al final del periodo
  vencido: (r: Prestamo) => boolean;
  cerroAntes: (r: Prestamo) => boolean;
};

export const corte = (rows: Prestamo[], p: Periodo, guardias: string[] = []): Corte => {
  const ini = p.ini, fin = p.end;
  const gp = (r: Prestamo) => !guardias.length || guardias.includes(r.guardia_presto);
  const gc = (r: Prestamo) => !guardias.length || guardias.includes(r.guardia_cierre);
  return {
    p, ini, fin,
    hechos: rows.filter(r => r.t_ini >= ini && r.t_ini < fin && gp(r)),
    cerrados: rows.filter(r => r.t_fin !== null && r.t_fin >= ini && r.t_fin <= fin && gc(r)),
    abiertos: rows.filter(r => r.t_ini < fin && (r.t_fin === null || r.t_fin > fin) && gp(r)),
    vencido: r => (fin - r.t_ini) / HORA > r.plazo,
    cerroAntes: r => r.t_fin !== null && r.t_fin <= fin,
  };
};
