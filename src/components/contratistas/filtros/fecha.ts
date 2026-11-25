// F0-06 · Filtro de fecha: periodos rápidos y su rango.
// Diseño: plataforma.dc.html, dcFechaOpts y el switch de rangos de Documentos (~7880, ~8002).

export const PERIODOS = [
  "Todos", "Hoy", "Ayer", "Esta semana", "Semana pasada", "Últimos 15 días", "Este mes", "Mes pasado", "Este año", "Personalizado",
] as const;
export type Periodo = (typeof PERIODOS)[number];

/** Valor del filtro de fecha. desde/hasta solo cuentan en "Personalizado" (yyyy-mm-dd). */
export interface FiltroFecha {
  periodo: Periodo;
  desde?: string;
  hasta?: string;
}

export const FECHA_TODOS: FiltroFecha = { periodo: "Todos" };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Rango [desde, hasta] en yyyy-mm-dd, ambos incluidos. Vacío ("") = sin límite de ese lado.
 * La semana empieza en lunes.
 */
export function rangoFecha({ periodo, desde = "", hasta = "" }: FiltroFecha, hoy = new Date()): [string, string] {
  const d0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const y = d0.getFullYear();
  const m = d0.getMonth();
  const mas = (n: number) => iso(new Date(y, m, d0.getDate() + n));
  const dow = (d0.getDay() + 6) % 7; // lunes = 0
  switch (periodo) {
    case "Hoy": return [iso(d0), iso(d0)];
    case "Ayer": return [mas(-1), mas(-1)];
    case "Esta semana": return [mas(-dow), mas(6 - dow)];
    case "Semana pasada": return [mas(-dow - 7), mas(-dow - 1)];
    case "Últimos 15 días": return [mas(-14), iso(d0)];
    case "Este mes": return [iso(new Date(y, m, 1)), iso(new Date(y, m + 1, 0))];
    case "Mes pasado": return [iso(new Date(y, m - 1, 1)), iso(new Date(y, m, 0))];
    case "Este año": return [iso(new Date(y, 0, 1)), iso(new Date(y, 11, 31))];
    case "Personalizado": return [desde, hasta];
    default: return ["", ""];
  }
}

/**
 * ¿La fecha cae en el filtro? Acepta "yyyy-mm-dd", "yyyy-mm-dd hh:mm:ss" o Date.
 * Sin fecha: solo pasa con "Todos".
 */
export function enFecha(fecha: string | Date | null | undefined, filtro: FiltroFecha, hoy = new Date()): boolean {
  if (filtro.periodo === "Todos") return true;
  if (!fecha) return false;
  const f = typeof fecha === "string" ? fecha.slice(0, 10) : iso(fecha);
  const [a, b] = rangoFecha(filtro, hoy);
  return (!a || f >= a) && (!b || f <= b);
}

export const fechaActiva = (f: FiltroFecha) => f.periodo !== "Todos";
