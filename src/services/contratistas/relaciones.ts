import type {
  AsignacionInput,
  Direccion,
  Estatus,
  Id,
  ListParams,
  MatrizAsignacion,
  FilaAsignacion,
  Incumplimientos,
  ResultadoNotificacion,
  Pagina,
  Relacion,
  RelacionFila,
  RelacionInput,
} from "@/types/contratistas";
import { CONTRATISTAS_SCRIPTS, callContratistas } from "./client";

const SCRIPT = CONTRATISTAS_SCRIPTS.relaciones;

export interface RelacionesFiltros extends ListParams {
  estatus?: Estatus;
}

/** Lista única Clientes/Contratistas: misma fila, contraparte ya resuelta. */
export const listRelaciones = (direccion: Direccion, filtros: RelacionesFiltros = {}) =>
  callContratistas<Pagina<RelacionFila>>("list_relaciones", { direccion, ...filtros }, SCRIPT);

export const getRelacion = (relacion_id: Id) =>
  callContratistas<Relacion>("get_relacion", { relacion_id }, SCRIPT);

export const createRelacion = (relacion: RelacionInput) =>
  callContratistas<Relacion>("create_relacion", { relacion }, SCRIPT);

export const updateRelacion = (
  relacion_id: Id,
  cambios: { notas?: string; requerimientos_asignados?: Id[] },
) => callContratistas<Relacion>("update_relacion", { relacion_id, cambios }, SCRIPT);

export const changeStatusRelacion = (relacion_id: Id, estatus: Estatus) =>
  callContratistas<Relacion>("change_status_relacion", { relacion_id, estatus }, SCRIPT);

/**
 * Subcontrataciones hacia abajo de una relación (sin incluirla), ordenadas por
 * nivel; armar el árbol con `relacion_padre` (R-08). La raíz ve toda la cadena;
 * un intermedio, de su relación hacia abajo.
 */
export const getArbolRelacion = (relacion_id: Id) =>
  callContratistas<Relacion[]>("get_arbol_relacion", { relacion_id }, SCRIPT);

/* ---------- Asignación de requerimientos (MX-05) ---------- */

export interface AsignacionFiltros extends ListParams {
  estatus?: Estatus;
  /** Solo estas columnas. */
  requerimiento_ids?: Id[];
}

/** Matriz contratista × requerimiento de empresa (la empresa activa es el cliente). */
export const getAsignacionRequerimientos = (filtros: AsignacionFiltros = {}) =>
  callContratistas<MatrizAsignacion>("get_asignacion_requerimientos", { ...filtros }, SCRIPT);

/**
 * Guarda las filas con cambios (lista completa de cada una). Valida todo antes
 * de escribir: solo el cliente, solo relaciones activas. Recalcula el motor.
 */
export const saveAsignacionRequerimientos = (asignaciones: AsignacionInput[]) =>
  callContratistas<{ guardadas: number; items: FilaAsignacion[] }>(
    "save_asignacion_requerimientos",
    { asignaciones },
    SCRIPT,
  );

/* ---------- Notificar incumplimientos (MX-03) ---------- */

/** Destinatarios del modal (con requerimiento_id: solo ese requerimiento). */
export const getIncumplimientos = (relacion_ids: Id[], requerimiento_id?: Id) =>
  callContratistas<Incumplimientos>("get_incumplimientos", { relacion_ids, requerimiento_id }, SCRIPT);

/**
 * Correo al representante legal + aviso en la bandeja de los usuarios del
 * contratista + historial en la relación. Solo el cliente y con la relación
 * activa; las que no tienen incumplimientos regresan en `omitidas`.
 */
export const notificarIncumplimientos = (relacion_ids: Id[], motivo: string, requerimiento_id?: Id) =>
  callContratistas<ResultadoNotificacion>(
    "notificar_incumplimientos",
    { relacion_ids, motivo, requerimiento_id },
    SCRIPT,
  );
