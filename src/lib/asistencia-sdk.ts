import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

const runPresencia = async <T,>(payload: Record<string, unknown>): Promise<T> => {
  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify({ ...payload, script_name: "asistencia_sdk.py" }),
  });
  const data = await response.json();
  const res = data?.response;
  if (!response.ok || data?.success === false || !res || res.data === undefined) {
    // Los errores de negocio de Sanic llegan como {title, msg: [..]}.
    const msg = Array.isArray(res?.msg) ? res.msg.join(" ") : res?.msg;
    throw new Error(msg || "No se pudo completar la operación");
  }
  return res.data as T;
};

// Asistencia (Disponible / Ausente) y Check In / Check Out de cualquier usuario:
// addon employee en Sanic, vía asistencia_sdk.py.
export type Asistencia =
  | {
      estatus: "disponible";
      desde: string;
      status_llegada: "presente" | "retardo" | "falta_por_retardo" | null;
      horario: { nombre: string; entrada: string; salida: string } | null;
      folio: string;
      extra_confirmado: string | null;
      // Ya pasó su salida y no ha dicho si sigue trabajando.
      pregunta_extra: { salida: string } | null;
    }
  | { estatus: "ausente"; ultimo_cierre: string | null };

export const getAsistencia = () => runPresencia<Asistencia>({ option: "get_asistencia" });

export const confirmarExtra = () => runPresencia<Asistencia>({ option: "confirmar_extra" });

export const setAsistencia = (estatus: Asistencia["estatus"]) =>
  runPresencia<Asistencia>({ option: "set_asistencia", estatus });

export type Foto = { file_url?: string; file_name?: string };

export type CheckIn = {
  folio: string;
  ubicacion: string;
  caseta: string;
  desde: string;
  rol: string | null;
  suplente: string | null;
};

export type Lugar = {
  ubicacion: string;
  casetas: {
    caseta: string;
    ocupantes: { user_id: number | null; nombre: string; desde: string; rol: string | null }[];
  }[];
};

export const getCheckIn = () =>
  runPresencia<{ checkin: CheckIn | null }>({ option: "get_checkin" }).then((r) => r.checkin);

export const getLugares = () => runPresencia<Lugar[]>({ option: "get_lugares" });

export const getRolesCheckIn = () => runPresencia<string[]>({ option: "get_roles" });

export const doCheckIn = (data: {
  ubicacion: string;
  caseta: string;
  rol?: string;
  suplente?: string;
  motivo?: string;
  foto: Foto[];
}) => runPresencia<{ checkin: CheckIn | null }>({ option: "checkin", ...data }).then((r) => r.checkin);

export const doCheckOut = (data: { foto: Foto[]; comentario?: string }) =>
  runPresencia<{ checkin: CheckIn | null }>({ option: "checkout", ...data }).then((r) => r.checkin);

// Opciones de la ubicación (impresion_de_pase, auto_acceso) de Configuración Módulo Seguridad.
export const getBoothConfig = (location: string) =>
  runPresencia<string[]>({ option: "get_booth_config", location });

// Reporte de asistencias: lo que le toca a cada persona (su horario) contra lo
// que hizo (su jornada y sus Check In).
export type EstadoDia =
  | "presente"
  | "retardo"
  | "falta_por_retardo"
  | "falta"
  | "no_ha_llegado"
  | "por_llegar"
  | "fuera_de_horario"
  | "descanso"
  | "sin_horario"
  | "sin_registro"
  | (string & {}); // tipos de permiso (vacaciones, enfermedad…)

export type Turno = { entrada: string; salida: string } | null;

export type ReporteHoy = {
  fecha: string;
  hora: string;
  resumen: {
    programados: number;
    a_tiempo: number;
    retardo: number;
    no_ha_llegado: number;
    fuera_de_horario: number;
    dentro: number;
  };
  empleados: {
    user_id: number;
    nombre: string;
    horario: string | null;
    turno: Turno;
    llegada: string | null;
    retraso_min: number | null;
    estado: EstadoDia;
    lugar: string | null;
    rol: string | null;
    jornada_abierta: boolean;
  }[];
};

export type ReportePeriodo = {
  desde: string;
  hasta: string;
  empleados: {
    user_id: number;
    nombre: string;
    horario: string | null;
    dias: { fecha: string; estado: EstadoDia; llegada: string | null; salida: string | null }[];
    resumen: {
      asistencias: number;
      retardos: number;
      faltas: number;
      descansos: number;
      horas_trabajadas: number;
      horas_programadas: number;
      horas_extra: number;
    };
  }[];
};

export type ReporteDia = {
  user_id: number;
  nombre: string;
  fecha: string;
  horario: string | null;
  turno: Turno;
  estado: EstadoDia;
  jornada: {
    folio: string;
    inicio: string;
    cierre: string | null;
    tipo_cierre: string | null;
    horas: number;
    horas_extra: number;
    jornadas: number;
    extra_confirmado: string | null;
    autorizacion_extra: string | null;
    ubicacion: string | null;
  } | null;
  checkins: {
    folio: string;
    ubicacion: string | null;
    caseta: string | null;
    estatus: string;
    desde: string;
    hasta: string | null;
    rol: string | null;
    suplente: string | null;
    tipo_out: string | null;
    comentario: string | null;
    horas: number | null;
    foto_in: Foto[];
    foto_out: Foto[];
  }[];
};

export const getReporteHoy = (locations: string[]) => runPresencia<ReporteHoy>({ option: "reporte_hoy", locations });

export const getReportePeriodo = (desde: string, hasta: string, locations: string[]) =>
  runPresencia<ReportePeriodo>({ option: "reporte_periodo", desde, hasta, locations });

export const getReporteDia = (userId: number, fecha: string) =>
  runPresencia<ReporteDia>({ option: "reporte_dia", user_id: userId, fecha });

export const getReporteUbicaciones = () => runPresencia<string[]>({ option: "reporte_ubicaciones" });
