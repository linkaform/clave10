import { AttendanceResumen, buildResumen } from "../../components/attendanceStatus";
import { MESES, fromISO, toISO } from "./period";

// Solicitud autorizada de FORMATO_VACACIONES que cae en el día
export type Solicitud = {
  folio?: string;
  parcial?: boolean;
  fecha_inicio: string;
  fecha_fin: string;
  tipo?: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  dias?: number | null;
  comentario?: string | null;
};

export type AttendanceDay = {
  fecha: string;
  dia: number;
  status: string;
  fecha_inicio?: string;
  fecha_cierre?: string;
  closed?: boolean;
  tipo_dia_libre?: string;
  cierre_automatico?: string;
  solicitud?: Solicitud;
  ubicacion?: string;
};

export type Jornada = {
  nombre: string;
  hora_entrada: string;
  hora_salida: string;
  tolerancia_retardo?: number | null;
};

// Fila que regresa get_report (una por empleado y ubicación)
export type EmployeeLocationRow = {
  employee_id: number;
  nombre: string;
  departamento?: string;
  puesto?: string;
  jornada?: Jornada | null;
  ubicacion: string;
  asistencia_mes: AttendanceDay[];
  resumen: AttendanceResumen;
};

export type EmployeeAttendance = {
  employee_id: number;
  nombre: string;
  departamento: string;
  puesto: string;
  jornada: Jornada | null;
  ubicaciones: string[];
  dias: Record<string, AttendanceDay>;
  resumen: AttendanceResumen;
};

// Si un empleado tiene registros en varias ubicaciones el mismo día, gana el estatus con más peso
const statusPriority: Record<string, number> = {
  home_office: 7,
  trabajo_fuera: 7,
  incapacidad: 10,
  permiso: 9,
  vacaciones: 8,
  presente: 7,
  en_turno: 6,
  retardo: 5,
  sin_salida: 4,
  dia_libre: 3,
  por_llegar: 2,
  falta: 1,
  sin_registro: 0,
};

export const mergeEmployees = (rows: EmployeeLocationRow[]): EmployeeAttendance[] => {
  const map = new Map<number, EmployeeAttendance>();
  rows.forEach(row => {
    const emp = map.get(row.employee_id) ?? {
      employee_id: row.employee_id,
      nombre: row.nombre,
      departamento: row.departamento ?? "",
      puesto: row.puesto ?? "",
      jornada: null,
      ubicaciones: [],
      dias: {},
      resumen: row.resumen,
    };
    emp.jornada = emp.jornada ?? row.jornada ?? null;
    if (row.ubicacion && row.ubicacion !== "Sin ubicación" && !emp.ubicaciones.includes(row.ubicacion)) {
      emp.ubicaciones.push(row.ubicacion);
    }
    row.asistencia_mes.forEach(day => {
      const current = emp.dias[day.fecha];
      if (!current || (statusPriority[day.status] ?? 0) > (statusPriority[current.status] ?? 0)) {
        emp.dias[day.fecha] = { ...day, ubicacion: row.ubicacion };
      }
    });
    map.set(row.employee_id, emp);
  });
  map.forEach(emp => {
    emp.resumen = buildResumen(Object.values(emp.dias));
  });
  return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
};

export const hora = (fecha?: string) => fecha?.substring(11, 16);

// Si la salida quedó en otro día (p. ej. la cerró el check-in siguiente) se indica la fecha
export const horaSalida = (day?: AttendanceDay) => {
  if (!day?.fecha_cierre) return undefined;
  const cierre = day.fecha_cierre.substring(0, 10);
  if (cierre === day.fecha) return hora(day.fecha_cierre);
  const d = fromISO(cierre);
  return `${hora(day.fecha_cierre)} · ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
};

// "YYYY-MM-DD HH:MM:SS" en hora local
const parseFecha = (value: string) => new Date(value.replace(" ", "T"));

// Hora de comida no pagada: el horario no la trae, se descuenta fija en turnos de más de 6 h
export const COMIDA_HORAS = 1;
const sinComida = (horas: number) => (horas > 6 ? horas - COMIDA_HORAS : horas);

// Horas entre la entrada y la salida (menos la comida); si el turno sigue abierto, hasta la hora actual
export const horasTrabajadas = (inicio?: string | null, cierre?: string | null, enCurso = false, now = new Date()) => {
  if (!inicio) return null;
  const fin = cierre ? parseFecha(cierre) : enCurso ? now : null;
  if (!fin) return null;
  const horas = (fin.getTime() - parseFecha(inicio).getTime()) / 3_600_000;
  return horas >= 0 ? { horas: sinComida(horas), enCurso: !cierre } : null;
};

export const formatHoras = (h: ReturnType<typeof horasTrabajadas>, unidad = "") =>
  h ? `${h.horas.toFixed(1)}${unidad}${h.enCurso ? " en curso" : ""}` : undefined;

// Olvidó cerrar: la salida quedó en otro día y justo antes de su siguiente check-in,
// así que las horas no reflejan lo trabajado. Los turnos largos sin ese patrón (p. ej. de 24 h) son reales.
export const esCierreTardio = (inicio?: string | null, cierre?: string | null, siguienteInicio?: string | null) => {
  if (!inicio || !cierre || !siguienteInicio || cierre.substring(0, 10) === inicio.substring(0, 10)) return false;
  const diff = parseFecha(siguienteInicio).getTime() - parseFecha(cierre).getTime();
  return diff >= 0 && diff <= 10 * 60_000;
};

export type TipoCierre = { label: string; texto: string };

// "Automática": lo cerró el sistema (viene en el comentario del registro).
// "Cierre tardío": registros sin esa marca que se cerraron hasta el día siguiente (heurística).
export const tipoCierre = (
  inicio?: string | null,
  cierre?: string | null,
  siguienteInicio?: string | null,
  comentarioAutomatico?: string | null,
): TipoCierre | null => {
  if (comentarioAutomatico) return { label: "Automática", texto: `El sistema cerró el turno: ${comentarioAutomatico}.` };
  if (esCierreTardio(inicio, cierre, siguienteInicio)) {
    return { label: "Cierre tardío", texto: "No cerró su turno ese día; lo cerró hasta el siguiente. Las horas no reflejan lo trabajado." };
  }
  return null;
};

export const cierreDia = (emp: EmployeeAttendance, day?: AttendanceDay) =>
  day
    ? tipoCierre(day.fecha_inicio, day.fecha_cierre, day.fecha_cierre ? emp.dias[day.fecha_cierre.substring(0, 10)]?.fecha_inicio : null, day.cierre_automatico)
    : null;

const hhmm = (value?: string) => value?.substring(0, 5) ?? "";

export const jornadaLabel = (j?: Jornada | null) =>
  j ? `${j.nombre}${j.hora_entrada ? ` ${hhmm(j.hora_entrada)}–${hhmm(j.hora_salida)}` : ""}` : "";

// Segunda línea bajo el nombre: departamento, o la ubicación si no tiene
export const employeeSub = (emp: EmployeeAttendance) =>
  emp.departamento || emp.ubicaciones.join(", ") || "Sin ubicación";

// Permiso por horas en un día con check-in (el día conserva el estatus del check-in)
export const permisoParcial = (day?: AttendanceDay) =>
  day?.solicitud?.parcial && !day.tipo_dia_libre ? day.solicitud : undefined;

export const horasSolicitud = (s?: Solicitud) =>
  s?.parcial && s.hora_inicio && s.hora_fin ? `${s.hora_inicio.substring(0, 5)}–${s.hora_fin.substring(0, 5)}` : "";

const toMin = (hhmmss?: string) => {
  if (!hhmmss) return null;
  const [h, m] = hhmmss.split(":").map(Number);
  return Number.isNaN(h) ? null : h * 60 + (m || 0);
};

// Duración de la jornada en horas, menos la comida (turno nocturno cruza la medianoche)
export const duracionJornada = (j?: Jornada | null) => {
  const entrada = toMin(j?.hora_entrada);
  const salida = toMin(j?.hora_salida);
  if (entrada == null || salida == null) return null;
  const min = salida > entrada ? salida - entrada : salida + 1440 - entrada;
  return sinComida(min / 60);
};

// Estatus de días laborales que deben cubrir su jornada
const ESPERADOS = ["presente", "retardo", "falta", "sin_salida"];

export type HorasDia = { trabajadas: number | null; esperadas: number | null; enCurso: boolean; ajustada: boolean };

// Horas de un día: trabajadas (entrada→salida, o hasta ahora si sigue en turno) y esperadas según su jornada.
// En un cierre tardío las trabajadas se topan a la jornada para no inflar los totales.
export const horasDia = (emp: EmployeeAttendance, day: AttendanceDay | undefined, enCurso: boolean, now = new Date()): HorasDia => {
  const jornada = duracionJornada(emp.jornada);
  const esperadas = day && ESPERADOS.includes(day.status) ? jornada : null;
  const h = horasTrabajadas(day?.fecha_inicio, day?.fecha_cierre, enCurso, now);
  const tardio = !!day && cierreDia(emp, day)?.label === "Cierre tardío";
  const ajustada = !!h && tardio && jornada != null && h.horas > jornada;
  return { trabajadas: h ? (ajustada ? jornada : h.horas) : null, esperadas, enCurso: !!h?.enCurso, ajustada };
};

export const resumenHoras = (emp: EmployeeAttendance, now = new Date()) => {
  const hoy = toISO(now);
  let trabajadas = 0, esperadas = 0, conJornada = false;
  Object.values(emp.dias).forEach(day => {
    const enCurso = day.fecha === hoy && !!day.fecha_inicio && !day.closed;
    const h = horasDia(emp, day, enCurso, now);
    trabajadas += h.trabajadas ?? 0;
    if (h.esperadas != null) {
      esperadas += h.esperadas;
      conJornada = true;
    }
  });
  return { trabajadas, esperadas: conJornada ? esperadas : null };
};
