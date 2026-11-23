import type {
  CambioEstatusContrato,
  Contrato,
  ContratoInput,
  EstatusContrato,
  EventoContrato,
  Id,
  ListParams,
  Pagina,
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
