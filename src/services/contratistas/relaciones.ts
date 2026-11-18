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
import { callContratistas } from "./client";

export interface RelacionesFiltros extends ListParams {
  estatus?: Estatus;
}

/** Lista única Clientes/Contratistas: misma fila, contraparte ya resuelta. */
export const listRelaciones = (direccion: Direccion, filtros: RelacionesFiltros = {}) =>
  callContratistas<Pagina<RelacionFila>>("list_relaciones", { direccion, ...filtros });

export const getRelacion = (relacion_id: Id) =>
  callContratistas<Relacion>("get_relacion", { relacion_id });

export const createRelacion = (relacion: RelacionInput) =>
  callContratistas<Relacion>("create_relacion", { relacion });

export const updateRelacion = (
  relacion_id: Id,
  cambios: { notas?: string; requerimientos_asignados?: Id[] },
) => callContratistas<Relacion>("update_relacion", { relacion_id, cambios });

export const changeStatusRelacion = (relacion_id: Id, estatus: Estatus) =>
  callContratistas<Relacion>("change_status_relacion", { relacion_id, estatus });

/** Árbol de subcontratación hacia abajo de una relación (R-03 / R-08). */
export const getArbolRelacion = (relacion_id: Id) =>
  callContratistas<Relacion[]>("get_arbol_relacion", { relacion_id });
