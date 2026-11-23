// Configuración del cliente: recursos (servicio/perfil/equipo), requerimientos
// y sesiones (CF-01 a CF-04).
import type {
  Id,
  ListParams,
  Pagina,
  Participante,
  RecursoContrato,
  RecursoInput,
  AplicacionRecurso,
  AplicacionRequerimiento,
  ClaseEquipo,
  Requerimiento,
  RequerimientoInput,
  Sesion,
  SesionInput,
  TipoRecurso,
  TipoRequerimiento,
  Ambito,
  EstatusSesion,
  Estatus,
} from "@/types/contratistas";
import { CONTRATISTAS_SCRIPTS, callContratistas } from "./client";

const CONF = CONTRATISTAS_SCRIPTS.configuracion;

/* ---------- Recursos ---------- */

export interface RecursosFiltros extends ListParams {
  categoria?: string;
  clase?: ClaseEquipo;
  estatus?: Estatus;
}

export const listRecursos = (tipo: TipoRecurso, filtros: RecursosFiltros = {}) =>
  callContratistas<Pagina<RecursoContrato>>("list_recursos", { tipo, ...filtros }, CONF);

export const getRecurso = (recurso_id: Id) =>
  callContratistas<RecursoContrato>("get_recurso", { recurso_id }, CONF);

/** Alta (sin id) o edición completa. Borrar = guardar con estatus Inactivo. */
export const saveRecurso = (recurso: RecursoInput, recurso_id?: Id) =>
  callContratistas<RecursoContrato>("save_recurso", { recurso, recurso_id }, CONF);

/** Pestaña Aplicación del detalle: requerimientos ligados y contratos donde se usa. */
export const getAplicacionRecurso = (recurso_id: Id) =>
  callContratistas<AplicacionRecurso>("get_aplicacion_recurso", { recurso_id }, CONF);

/* ---------- Requerimientos ---------- */

export interface RequerimientosFiltros extends ListParams {
  tipo?: TipoRequerimiento;
  ambito?: Ambito;
  estatus?: Estatus;
}

export const listRequerimientos = (filtros: RequerimientosFiltros = {}) =>
  callContratistas<Pagina<Requerimiento>>("list_requerimientos", { ...filtros }, CONF);

export const getRequerimiento = (requerimiento_id: Id) =>
  callContratistas<Requerimiento>("get_requerimiento", { requerimiento_id }, CONF);

export const saveRequerimiento = (requerimiento: RequerimientoInput, requerimiento_id?: Id) =>
  callContratistas<Requerimiento>("save_requerimiento", { requerimiento, requerimiento_id }, CONF);

/** Pestaña Aplicación del detalle: dónde se exige y a quién. */
export const getAplicacionRequerimiento = (requerimiento_id: Id) =>
  callContratistas<AplicacionRequerimiento>("get_aplicacion_requerimiento", { requerimiento_id }, CONF);

/* ---------- Sesiones ---------- */

export interface SesionesFiltros extends ListParams {
  estatus?: EstatusSesion;
  desde?: string;
  hasta?: string;
}

export const listSesiones = (filtros: SesionesFiltros = {}) =>
  callContratistas<Pagina<Sesion>>("list_sesiones", { ...filtros });

export const getSesion = (sesion_id: Id) =>
  callContratistas<Sesion>("get_sesion", { sesion_id });

export const saveSesion = (sesion: SesionInput, sesion_id?: Id) =>
  callContratistas<Sesion>("save_sesion", { sesion, sesion_id });

export const cancelSesion = (sesion_id: Id, motivo: string) =>
  callContratistas<Sesion>("cancel_sesion", { sesion_id, motivo });

/** Inscribir, registrar asistencia o calificar (CF-04). */
export const saveParticipantes = (sesion_id: Id, participantes: Participante[]) =>
  callContratistas<Sesion>("save_participantes", { sesion_id, participantes });
