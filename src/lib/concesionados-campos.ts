// Campos que se agregaron a la forma "Concesión de Activos Único" (2026-11). La lista de la
// bitácora (get_list_articulos_concesionados en addons) traduce los ids a nombres con cons_f;
// mientras estos campos no estén en cons_f llegan con su id como llave, así que se leen por
// nombre o por id. Los registros anteriores no los traen.
export const CAMPOS_CONCESION = {
  // primer nivel
  empresa_concesion: "6afebfb2212240c549ff9872",
  guardia_entrega_concesion: "6afebfb2212240c549ff9873",
  // en cada equipo (Equipos en Préstamo)
  plazo_devolucion: "6afeb86f7ac0963b3cc0a414", // horas, detalle del catálogo de equipos
  fecha_limite_devolucion: "6afec078bd8d0a8795b09bec",
  // en cada devolución (Devoluciones de Equipo)
  recibio_devolucion: "6afec2f16b7ce990218fe1e3",
} as const;

type Campo = keyof typeof CAMPOS_CONCESION;

/** Valor de un campo nuevo: por nombre o por id; los de catálogo llegan como lista. */
export const campoConcesion = (obj: any, campo: Campo): any => {
  const v = obj?.[campo] ?? obj?.[CAMPOS_CONCESION[campo]];
  return Array.isArray(v) ? v[0] : v;
};

const aFecha = (s: string) => new Date(s.replace(" ", "T")).getTime();
const dosDigitos = (k: number) => String(k).padStart(2, "0");

/** Plazo del equipo en horas, o null. */
export const plazoEquipo = (equipo: any): number | null => {
  const h = Number(campoConcesion(equipo, "plazo_devolucion"));
  return h > 0 ? h : null;
};

/**
 * Fecha límite del equipo "YYYY-MM-DD HH:MM": la guardada o, si no está, fecha de la
 * concesión + plazo. null si no hay ninguna de las dos.
 */
export const fechaLimiteEquipo = (equipo: any, fechaConcesion?: string): string | null => {
  const guardada = campoConcesion(equipo, "fecha_limite_devolucion");
  if (guardada) return String(guardada).slice(0, 16);
  const plazo = plazoEquipo(equipo);
  const ini = fechaConcesion ? aFecha(fechaConcesion) : NaN;
  if (!plazo || Number.isNaN(ini)) return null;
  const d = new Date(ini + plazo * 36e5);
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())} ${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
};

/** ¿Ya pasó la fecha límite y quedan piezas por regresar? */
export const equipoVencido = (equipo: any, fechaLimite: string | null): boolean => {
  if (!fechaLimite) return false;
  const pendientes = (equipo?.cantidad_equipo_concesion ?? 0) - (equipo?.cantidad_equipo_devuelto ?? 0);
  return pendientes > 0 && aFecha(fechaLimite) < Date.now();
};

/** Horas para regresar un equipo sin plazo en el catálogo (igual que el back). */
export const PLAZO_DEVOLUCION_DEFAULT = 24;
