// Documentos (ME-06, F0-13, MX-02) y cumplimiento (ME-07, MX-01, MX-04).
import type {
  Ambito,
  CumplimientoFila,
  CumplimientoFiltros,
  Documento,
  DocumentoInput,
  EstadoCumplimiento,
  EstatusDocumento,
  Id,
  ListParams,
  Pagina,
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
