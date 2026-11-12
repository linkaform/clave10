import { AttendanceResumen, buildResumen } from "../../components/attendanceStatus";
import { EmployeeAttendance, duracionJornada, horasDia } from "./employees";
import { MESES, fromISO, toISO, weekStart } from "./period";

// Reglas de ley (reforma art. 123). Por ahora fijas; "Reglas de Jornada" las hará configurables.
export const LAW = { week: 48, xw: 12, xd: 4, xdays: 4, rest: 6, warn: 75 };

export type LawAlert = { level: "alerta" | "aviso"; text: string; week: string; explain: string };

const TRABAJADO = ["presente", "retardo", "en_turno", "sin_salida"];
// Días que no cuentan para el % de asistencia (no se esperaba que viniera)
const NO_ESPERADO = ["sin_registro", "dia_libre", "vacaciones", "incapacidad", "permiso", "home_office", "trabajo_fuera", "por_llegar"];

export type EmployeeMetrics = {
  resumen: AttendanceResumen; // conteos por estatus solo de los días del periodo
  horas: number;          // trabajadas, sin el turno en curso
  horasVivo: number;      // incluye el turno en curso
  esperadas: number | null;
  pct: number | null;     // horas ÷ esperadas
  extra: number;          // suma por semana de (hechas − esperadas) cuando es ≥ 0.5 h
  triple: number;         // extra arriba de LAW.xw por semana
  alerts: LawAlert[];
  laborales: number;
  aPagar: number;
  asistPct: number | null; // días con asistencia ÷ días esperados (calendario)
  revisar: boolean;
};

const explain = (t: string, level: "alerta" | "aviso") => {
  if (t.startsWith("Extra semanal"))
    return level === "aviso"
      ? `Se acerca al límite de ${LAW.xw} h extra por semana (aviso al ${LAW.warn}%).`
      : `Supera las ${LAW.xw} h extra permitidas por semana. Las horas arriba del límite se pagan al triple.`;
  if (t.startsWith("Extra en un día")) return `Un día tuvo más de ${LAW.xd} h extra, el máximo permitido en un mismo día.`;
  if (t.includes("días con extra")) return `Las horas extra solo pueden repartirse en máximo ${LAW.xdays} días por semana.`;
  if (t.includes("sin descanso")) return `Trabajó más de ${LAW.rest} días seguidos. Por cada ${LAW.rest} días de trabajo corresponde al menos un día de descanso.`;
  return "";
};

export const employeeMetrics = (emp: EmployeeAttendance, fechas: string[], now = new Date()): EmployeeMetrics => {
  const hoy = toISO(now);
  const jornada = duracionJornada(emp.jornada);
  let horas = 0, horasVivo = 0, esperadas = 0, conJornada = false;
  let laborales = 0, faltas = 0, incap = 0, asist = 0, esperados = 0, sinSalida = 0;
  const weeks = new Map<string, { done: number; exp: number; days: number; maxd: number }>();

  fechas.forEach(fecha => {
    const day = emp.dias[fecha];
    const status = day?.status ?? "sin_registro";
    const enCurso = fecha === hoy && !!day?.fecha_inicio && !day.closed;
    const h = horasDia(emp, day, enCurso, now);
    const t = h.trabajadas ?? 0;
    horasVivo += t;
    if (!enCurso) horas += t;
    if (h.esperadas != null) {
      esperadas += h.esperadas;
      conJornada = true;
    }
    if (status !== "dia_libre" && status !== "sin_registro") laborales++;
    if (status === "falta") faltas++;
    if (status === "incapacidad") incap++;
    if (status === "sin_salida") sinSalida++;
    if (!NO_ESPERADO.includes(status)) {
      esperados++;
      if (TRABAJADO.includes(status)) asist++;
    }
    if (enCurso) return;
    const wk = toISO(weekStart(fromISO(fecha)));
    const w = weeks.get(wk) ?? { done: 0, exp: 0, days: 0, maxd: 0 };
    w.done += t;
    w.exp += h.esperadas ?? 0;
    const base = status === "dia_libre" ? 0 : jornada ?? 0;
    const excedente = t - base;
    if (t > 0 && jornada != null && excedente >= 0.5) {
      w.days++;
      w.maxd = Math.max(w.maxd, excedente);
    }
    weeks.set(wk, w);
  });

  let extra = 0, triple = 0;
  const alerts: LawAlert[] = [];
  weeks.forEach((w, wk) => {
    const s = w.done - w.exp;
    if (s >= 0.5) extra += s;
    if (!conJornada) return;
    const ws = fromISO(wk);
    const week = `Semana del ${ws.getDate()} de ${MESES[ws.getMonth()]}`;
    const xw = Math.max(0, s);
    triple += Math.max(0, xw - LAW.xw);
    const push = (level: "alerta" | "aviso", text: string) => alerts.push({ level, text, week, explain: explain(text, level) });
    if (xw > LAW.xw) push("alerta", `Extra semanal ${xw.toFixed(1)} h (máx. ${LAW.xw})`);
    else if (xw >= (LAW.xw * LAW.warn) / 100) push("aviso", `Extra semanal ${xw.toFixed(1)} de ${LAW.xw} h`);
    if (w.maxd > LAW.xd) push("alerta", `Extra en un día ${w.maxd.toFixed(1)} h (máx. ${LAW.xd})`);
    if (w.days > LAW.xdays) push("alerta", `${w.days} días con extra (máx. ${LAW.xdays})`);
  });

  // Días seguidos sin descanso dentro del periodo
  let run = 0, maxRun = 0, runEnd = "";
  fechas.forEach(fecha => {
    run = TRABAJADO.includes(emp.dias[fecha]?.status ?? "") ? run + 1 : 0;
    if (run > maxRun) {
      maxRun = run;
      runEnd = fecha;
    }
  });
  if (maxRun > LAW.rest) {
    const ws = weekStart(fromISO(runEnd));
    const text = `${maxRun} días seguidos sin descanso (máx. ${LAW.rest})`;
    alerts.push({ level: "alerta", text, week: `Semana del ${ws.getDate()} de ${MESES[ws.getMonth()]}`, explain: explain(text, "alerta") });
  }

  const esp = conJornada ? esperadas : null;
  return {
    resumen: buildResumen(fechas.map(f => emp.dias[f]).filter(Boolean)),
    horas,
    horasVivo,
    esperadas: esp,
    pct: esp ? (horas / esp) * 100 : null,
    extra,
    triple,
    alerts,
    laborales,
    aPagar: Math.max(0, laborales - faltas - incap),
    asistPct: esperados ? (asist / esperados) * 100 : null,
    revisar: faltas > 0 || sinSalida > 0 || alerts.some(a => a.level === "alerta"),
  };
};

// Colores del % de horas: <90 rojo, >105 naranja, si no verde
export const pctTone = (p: number) =>
  p < 90 ? { bar: "bg-red-600", text: "text-red-700" } : p > 105 ? { bar: "bg-orange-600", text: "text-orange-700" } : { bar: "bg-green-600", text: "text-green-700" };

// % de asistencia del calendario: ≥90 verde, ≥70 ámbar, si no rojo
export const asistTone = (p: number) => (p >= 90 ? "text-green-700" : p >= 70 ? "text-amber-700" : "text-red-700");
