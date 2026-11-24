// Documentos (ME-06, F0-13, MX-02) y cumplimiento (ME-07, MX-01, MX-04).
import type {
  AcuseInput,
  Ambito,
  CumplimientoDocumental,
  CumplimientoGenerado,
  CumplimientoFila,
  CumplimientoFiltros,
  Documento,
  DocumentoInput,
  EstadoCumplimiento,
  EstatusDocumento,
  Id,
  ListParams,
  Pagina,
  PeriodoCumplimiento,
  ResumenCumplimiento,
  RevisionDocumento,
} from "@/types/contratistas";
import { CONTRATISTAS_SCRIPTS, callContratistas } from "./client";

/* ---------- Documentos ---------- */

const DOCS = CONTRATISTAS_SCRIPTS.documentos;

export interface DocumentosFiltros extends ListParams {
  dueno_tipo?: Ambito;
  empresa_id?: Id;
  empleado_id?: Id;
  contrato_id?: Id;
  requerimiento_id?: Id;
  estatus?: EstatusDocumento[];
}

export const listDocumentos = (filtros: DocumentosFiltros = {}) =>
  callContratistas<Pagina<Documento>>("list_documentos", { ...filtros }, DOCS);

export const getDocumento = (documento_id: Id) =>
  callContratistas<Documento>("get_documento", { documento_id }, DOCS);

/** Alta o versión nueva (si trae `reemplaza_id`). */
export const uploadDocumento = (documento: DocumentoInput) =>
  callContratistas<Documento>("upload_documento", { documento }, DOCS);

/** Decisión del cliente activo sobre el documento. */
export const reviewDocumento = (documento_id: Id, revision: RevisionDocumento) =>
  callContratistas<Documento>("review_documento", { documento_id, ...revision }, DOCS);

/**
 * MX-02: el dueño cambia con qué clientes comparte. Cliente nuevo entra
 * Pendiente; el que sale pierde su decisión. Solo clientes activos.
 */
export const updateCompartidoDocumento = (documento_id: Id, compartido_con: Id[]) =>
  callContratistas<Documento>("update_compartido_documento", { documento_id, compartido_con }, DOCS);

/** ME-07: el dueño borra un documento que ningún cliente aprobó (si no, 409: reemplazar). */
export const deleteDocumento = (documento_id: Id) =>
  callContratistas<{ eliminado: Id; folio: string }>("delete_documento", { documento_id }, DOCS);

export const commentDocumento = (documento_id: Id, texto: string) =>
  callContratistas<Documento>("comment_documento", { documento_id, texto }, DOCS);

/* ---------- Cumplimiento ---------- */

export const listCumplimiento = (filtros: CumplimientoFiltros = {}) =>
  callContratistas<CumplimientoFila[]>("list_cumplimiento", { ...filtros }, CONTRATISTAS_SCRIPTS.cumplimiento);

/** Fijar No aplica o corregir un estado, con motivo (lo que el diseño llama ccOv). */
export const setEstadoCumplimiento = (
  cumplimiento_id: Id,
  estado: EstadoCumplimiento | null,
  motivo: string,
) => callContratistas<CumplimientoFila>(
    "set_estado_cumplimiento",
    { cumplimiento_id, estado, motivo },
    CONTRATISTAS_SCRIPTS.cumplimiento,
  );

/* ---------- Cumplimiento documental de Mi Empresa (ME-07) ---------- */

const CUMP = CONTRATISTAS_SCRIPTS.cumplimiento;

/** Matriz obligación × periodo y vistas por vigencia del ejercicio (default: año en curso). */
export const getCumplimientoDocumental = (anio?: number) =>
  callContratistas<CumplimientoDocumental>("get_cumplimiento_documental", { anio }, CUMP);

/** Detalle del periodo (sin periodo_clave = documento único de la obligación). */
export const getPeriodoCumplimiento = (requerimiento_id: Id, periodo_clave?: string) =>
  callContratistas<PeriodoCumplimiento>("get_periodo_cumplimiento", { requerimiento_id, periodo_clave }, CUMP);

/**
 * Sube el acuse del periodo; si ya había uno se reemplaza (versión nueva,
 * aprobaciones a Pendiente). Leerlo antes con `analizarDocumento` (F0-11).
 */
export const subirAcuse = (acuse: AcuseInput) =>
  callContratistas<{ documento: Documento; reemplazado: boolean }>("subir_acuse", { acuse }, CUMP);

/** ZIP con CSV de contratos y trabajadores del periodo (ICSOE / SISUB). */
export const generarCumplimiento = (requerimiento_id: Id, periodo_clave: string) =>
  callContratistas<CumplimientoGenerado>("generar_cumplimiento", { requerimiento_id, periodo_clave }, CUMP);

/** ZIP con los archivos del ejercicio (pestañas elegidas) y un resumen .xlsx. */
export const descargarCumplimiento = (anio: number, pestanas?: string[]) =>
  callContratistas<{ archivo: { name: string; file_url: string }; documentos: number; omitidos: unknown[] }>(
    "descargar_cumplimiento",
    { anio, pestanas },
    CUMP,
  );

/** Panel lateral de Generales: anillo y pendientes. */
export const getResumenCumplimiento = (limit = 50) =>
  callContratistas<ResumenCumplimiento>("get_resumen_cumplimiento", { limit }, CUMP);
