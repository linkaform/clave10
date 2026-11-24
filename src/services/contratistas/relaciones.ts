import type {
  Direccion,
  Estatus,
  Id,
  ListParams,
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
