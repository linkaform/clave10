/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";
import { Imagen } from "@/components/upload-Image";

// Llamadas al SDK nuevo (lkf-sanic-apps) para la pantalla publica de
// "Invitacion de contratista". Mismo endpoint y shape de payload que el resto
// del script-runner; lo unico que cambia es el script_name.
// Ver knowledge/patterns/clave10_front_explorer_screen.md seccion 13.

/**
 * Respuesta del alta. No hay consulta previa de disponibilidad a proposito:
 * un endpoint publico que contesta "ese ya existe" es un oraculo para enumerar
 * el padron. Se intenta crear y, si choca, regresa `username_ocupado` con
 * alternativas para reintentar.
 *
 * `username` es el DOMINIO que escogio el contratista (<valor>.clave10.com).
 * Se llama username en el cable porque es lo que la plataforma pide para dar
 * de alta y para iniciar sesion; el concepto de "dominio" es de la pantalla.
 */
export interface AltaContratista {
  created: boolean;
  /** El CORREO ya tiene cuenta: no es reintento, es mandarlo a iniciar sesion. */
  already_exists: boolean;
  /** El DOMINIO choco: usa `sugerencias` y vuelve a intentar el alta. */
  username_ocupado?: boolean;
  /** El dominio que reboto (el que se mando, ya normalizado). */
  username?: string;
  sugerencias?: string[];
  user_id?: number | null;
}

export interface InvitacionCheck {
  invitacion_valida: boolean;
  razon_social: string;
  email: string;
  ya_aceptada: boolean;
  estatus_solicitud: string;
  user_exists: boolean;
}

export interface ContratistaRecord {
  record_id: string;
  folio?: string;
  razon_social?: string;
  rfc?: string;
  email_contratista?: string;
  telefono?: string;
  id_cuenta?: number;
  servicios?: string[];
  estatus_solicitud?: string;
  alta_fiscal?: Imagen[];
  identificacion?: Imagen[];
  comprobante_domicilio?: Imagen[];
}

export interface PerfilContratista {
  razon_social?: string;
  rfc?: string;
  telefono?: string;
  servicios?: string[];
  alta_fiscal?: Imagen[];
  identificacion?: Imagen[];
  comprobante_domicilio?: Imagen[];
  marcar_completada?: boolean;
}

const SCRIPT = "contratistas_sdk.py";

/**
 * A diferencia de los otros `*-sdk.ts`, aqui el token se pasa EXPLICITO.
 *
 * Esta pagina es publica y puede abrirse en un navegador que ya trae la sesion
 * de un usuario interno en localStorage. Si dependieramos de getValidToken(),
 * las escrituras se harian con la identidad equivocada. Pasando el token del
 * contratista a mano eso es imposible. El fallback a getValidToken() solo
 * aplica al caso "ya tenia sesion".
 */
const runScript = async (payload: Record<string, any>, jwt?: string | null) => {
  const token = jwt !== undefined ? jwt : await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ script_name: SCRIPT, ...payload }),
  });
  return response.json();
};

/** Compuerta publica: valida la invitacion y dice si el correo ya tiene cuenta. */
export const checkInvitacionSdk = async (
  record_id: string,
  email: string,
  account_id: number,
) =>
  runScript(
    { option: "check_invitacion", record_id, email, account_id },
    null, // sin JWT a proposito
  );

/**
 * Alta del contratista. Despues se inicia sesion con el username elegido.
 * Ver AltaContratista: puede responder `username_ocupado` en vez de crear.
 */
export const crearCuentaContratistaSdk = async (
  account_id: number,
  data: {
    record_id: string;
    email: string;
    /** El dominio elegido, sin el sufijo .clave10.com */
    username: string;
    password: string;
    password2: string;
    nombre: string;
    apellidos?: string;
    telefono?: string;
    puesto?: string;
  },
) => runScript({ option: "crear_cuenta_contratista", account_id, ...data }, null);

/** El contratista acepta: el backend escribe SU account_id en el registro. */
export const aceptarInvitacionSdk = async (
  record_id: string,
  account_id: number,
  jwt: string,
) => runScript({ option: "aceptar_invitacion", record_id, account_id }, jwt);

export const getContratistaByIdSdk = async (
  record_id: string,
  account_id: number,
  jwt: string,
) => runScript({ option: "get_contratista_by_id", record_id, account_id }, jwt);

export const updateContratistaSdk = async (
  record_id: string,
  account_id: number,
  data: PerfilContratista,
  jwt: string,
) => runScript({ option: "update_contratista", record_id, account_id, ...data }, jwt);
