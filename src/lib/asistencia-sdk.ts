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
    }
  | { estatus: "ausente"; ultimo_cierre: string | null };

export const getAsistencia = () => runPresencia<Asistencia>({ option: "get_asistencia" });

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
