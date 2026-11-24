// Sanciones de empleados y de empresas contratistas (R-07 y ME-05).
import type {
  Archivo,
  Id,
  OpcionesSancion,
  Pagina,
  Sancion,
  SancionInput,
  SancionesFiltros,
} from "@/types/contratistas";
import { CONTRATISTAS_SCRIPTS, callContratistas } from "./client";

const SCRIPT = CONTRATISTAS_SCRIPTS.sanciones;

export const getOpcionesSancion = () => callContratistas<OpcionesSancion>("get_opciones_sancion", {}, SCRIPT);

/** Las que registró la empresa activa o las que le pusieron a ella (o a sus empleados). */
export const listSanciones = (filtros: SancionesFiltros = {}) =>
  callContratistas<Pagina<Sancion>>("list_sanciones", { ...filtros }, SCRIPT);

export const getSancion = (sancion_id: Id) => callContratistas<Sancion>("get_sancion", { sancion_id }, SCRIPT);

/**
 * Sin id = alta (empleado propio: interna; de un contratista: con relación
 * activa; Empresa: relacion_id). Con id = edición de motivo, fecha y suspensión.
 */
export const saveSancion = (sancion: SancionInput, sancion_id?: Id) =>
  callContratistas<Sancion>("save_sancion", { sancion, sancion_id }, SCRIPT);

/** Las dos partes comentan; texto o al menos una evidencia. */
export const commentSancion = (sancion_id: Id, texto = "", evidencias: Archivo[] = []) =>
  callContratistas<Sancion>("comment_sancion", { sancion_id, texto, evidencias }, SCRIPT);

export const deleteSancion = (sancion_id: Id) =>
  callContratistas<{ eliminado: Id; folio: string }>("delete_sancion", { sancion_id }, SCRIPT);

/** Genera el acta (PDF provisional sin diseño) y la guarda en la sanción. */
export const imprimirActa = (sancion_id: Id) =>
  callContratistas<{ acta: Archivo; sancion: Sancion }>("imprimir_acta", { sancion_id }, SCRIPT);
