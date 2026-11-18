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
import { callContratistas } from "./client";

export interface ContratosFiltros extends ListParams {
  relacion_id?: Id;
  estatus?: EstatusContrato[];
  /** Rango sobre la fecha de fin, YYYY-MM-DD. */
  fin_desde?: string;
  fin_hasta?: string;
}

export const listContratos = (filtros: ContratosFiltros = {}) =>
  callContratistas<Pagina<Contrato>>("list_contratos", { ...filtros });

export const getContrato = (contrato_id: Id) =>
  callContratistas<Contrato>("get_contrato", { contrato_id });

export const createContrato = (contrato: ContratoInput) =>
  callContratistas<Contrato>("create_contrato", { contrato });

export const updateContrato = (contrato_id: Id, contrato: Partial<ContratoInput>) =>
  callContratistas<Contrato>("update_contrato", { contrato_id, contrato });

/** Pausar, cancelar o reanudar (estatus_manual = null). */
export const changeStatusContrato = (contrato_id: Id, cambio: CambioEstatusContrato) =>
  callContratistas<Contrato>("change_status_contrato", { contrato_id, ...cambio });

export const getHistorialContrato = (contrato_id: Id) =>
  callContratistas<EventoContrato[]>("get_historial_contrato", { contrato_id });
