import type {
  AltaCatalogoInput,
  CambioEstatusContrato,
  Contrato,
  ContratoInput,
  EstatusContrato,
  EventoContrato,
  FilaMapeoInput,
  Id,
  ListParams,
  MapeoContrato,
  Pagina,
  Ref,
  Requerimiento,
  SugerenciaMapeo,
} from "@/types/contratistas";
import { callContratistas, CONTRATISTAS_SCRIPTS } from "./client";

const SCRIPT = CONTRATISTAS_SCRIPTS.contratos;

export interface ContratosFiltros extends ListParams {
  relacion_id?: Id;
  estatus?: EstatusContrato[];
  /** Rango sobre la fecha de fin, YYYY-MM-DD. */
  fin_desde?: string;
  fin_hasta?: string;
}

export const listContratos = (filtros: ContratosFiltros = {}) =>
  callContratistas<Pagina<Contrato>>("list_contratos", { ...filtros }, SCRIPT);

export const getContrato = (contrato_id: Id) =>
  callContratistas<Contrato>("get_contrato", { contrato_id }, SCRIPT);

export const createContrato = (contrato: ContratoInput) =>
  callContratistas<Contrato>("create_contrato", { contrato }, SCRIPT);

export const updateContrato = (contrato_id: Id, contrato: Partial<ContratoInput>) =>
  callContratistas<Contrato>("update_contrato", { contrato_id, contrato }, SCRIPT);

/** Pausar, cancelar o reanudar (estatus_manual = null). */
export const changeStatusContrato = (contrato_id: Id, cambio: CambioEstatusContrato) =>
  callContratistas<Contrato>("change_status_contrato", { contrato_id, ...cambio }, SCRIPT);

export const getHistorialContrato = (contrato_id: Id) =>
  callContratistas<EventoContrato[]>("get_historial_contrato", { contrato_id }, SCRIPT);

/**
 * ME-12 · Centros de trabajo para "Ubicaciones de trabajo": el catálogo de
 * Ubicaciones de la cuenta (location_sdk.py, el mismo de Accesos).
 */
export const listCentrosTrabajo = async (): Promise<Ref[]> => {
  const pagina = await callContratistas<{ records?: { record_id?: string; _id?: string; location: string }[] }>(
    "get_catalog_ubicaciones_formatted",
    { locations: [], dynamic_filters: [], limit: 200, offset: 0, facets: [] },
    "location_sdk.py",
  );
  return (pagina?.records ?? []).map((u) => ({ id: u.record_id ?? u._id ?? u.location, nombre: u.location }));
};

/* ---------- Mapeo y homologación de requerimientos (ME-13) ---------- */

/** Catálogo maestro (requerimientos de la cuenta) y filas homologadas del contrato. */
export const getMapeoContrato = (contrato_id: Id) =>
  callContratistas<MapeoContrato>("get_mapeo_contrato", { contrato_id }, SCRIPT);

/**
 * Sugerencia al escribir / Auto-Mapear por Similitud (regla en el back).
 * Con solo_sin_match no toca las filas que ya tienen requerimiento.
 */
export const sugerirMapeo = (filas: FilaMapeoInput[], solo_sin_match = false) =>
  callContratistas<{ filas: SugerenciaMapeo[]; homologados: number; total: number }>(
    "sugerir_mapeo",
    { filas, solo_sin_match },
    SCRIPT,
  );

/** Guardar Configuración: lista completa; los homologados se exigen en el contrato (motor). */
export const saveMapeoContrato = (contrato_id: Id, filas: FilaMapeoInput[]) =>
  callContratistas<MapeoContrato>("save_mapeo_contrato", { contrato_id, filas }, SCRIPT);

/** "Alta en catálogo maestro": crea un requerimiento Documento sin vencimiento. */
export const crearEnCatalogo = (requerimiento: AltaCatalogoInput) =>
  callContratistas<Requerimiento>("crear_en_catalogo", { requerimiento }, SCRIPT);
