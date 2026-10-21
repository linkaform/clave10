import type { EstadoDia } from "@/lib/asistencia-sdk";

type Estilo = { label: string; pill: string; dot: string };

const ESTADOS: Record<string, Estilo> = {
  presente: { label: "A tiempo", pill: "bg-green-50 text-green-700", dot: "bg-green-500" },
  asistio: { label: "Asistió", pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-300" },
  retardo: { label: "Retardo", pill: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  falta_por_retardo: { label: "Falta por retardo", pill: "bg-orange-50 text-orange-700", dot: "bg-orange-500" },
  falta: { label: "Falta", pill: "bg-red-50 text-red-700", dot: "bg-red-500" },
  no_ha_llegado: { label: "No ha llegado", pill: "bg-red-50 text-red-700", dot: "bg-red-500" },
  por_llegar: { label: "Por llegar", pill: "bg-slate-100 text-slate-600", dot: "bg-slate-300" },
  fuera_de_horario: { label: "Fuera de horario", pill: "bg-violet-50 text-violet-700", dot: "bg-violet-400" },
  descanso: { label: "Descanso", pill: "bg-slate-100 text-slate-500", dot: "bg-slate-200" },
  sin_horario: { label: "Sin horario", pill: "bg-slate-100 text-slate-500", dot: "bg-slate-100" },
  sin_registro: { label: "Sin registro", pill: "bg-slate-50 text-slate-400", dot: "bg-slate-100" },
};

// Los permisos (vacaciones, enfermedad…) llegan con su tipo como estado.
const PERMISO: Estilo = { label: "Permiso", pill: "bg-sky-50 text-sky-700", dot: "bg-sky-400" };

export const estilo = (estado: EstadoDia): Estilo => {
  const e = ESTADOS[estado];
  if (e) return e;
  const tipo = String(estado || "").replace(/_/g, " ");
  return { ...PERMISO, label: tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : PERMISO.label };
};

export const LEYENDA_PERIODO: EstadoDia[] = ["presente", "asistio", "retardo", "falta_por_retardo", "falta", "fuera_de_horario", "descanso"];

export const hhmm = (fecha?: string | null) => (fecha ? fecha.slice(11, 16) : "—");

export const minutos = (n?: number | null) => {
  if (!n) return "";
  const h = Math.floor(n / 60);
  return h ? `${h} h ${n % 60} min` : `${n} min`;
};

export const horas = (n?: number | null) => (n == null ? "—" : `${Math.round(n * 10) / 10} h`);
