// Sanciones de empleados y de empresas contratistas (R-07 y ME-05).
// Back: lkf-sanic-apps/addons/accesos/contratistas_sanciones.py (sanciones_sdk.py).
import type { Archivo, Id, Ref } from "./comun";

export type SujetoSancion = "Empleado" | "Empresa";
export type MotivoSancion =
  | "Retardos"
  | "Falta injustificada"
  | "No portar EPP"
  | "Abandono de puesto"
  | "Incumplimiento de procedimiento"
  | "Conducta inapropiada"
  | "Otro";
/** Calculado: con días sin acceso, Vigente hasta que termina; amonestación = Cumplida. */
export type EstatusSancion = "Vigente" | "Cumplida";

export interface ComentarioSancion {
  autor: string;
  fecha: string;
  texto: string;
  evidencias: Archivo[];
}

export interface Sancion {
  id: Id;
  /** S-0001 (el diseño lo pinta como #S-…). */
  folio: string;
  sujeto_tipo: SujetoSancion;
  empleado: Ref | null;
  /** Empresa sancionada (la del empleado o la contratista). */
  empresa: Ref | null;
  /** Empresa que registró (solo ella edita, borra e imprime). */
  registra: Ref | null;
  /** null = sanción interna a un empleado propio. */
  relacion: Ref | null;
  contrato: Ref | null;
  motivo: MotivoSancion;
  motivo_otro: string | null;
  fecha: string | null;
  sin_acceso: boolean;
  dias_sin_acceso: number;
  inicio_suspension: string | null;
  fin_suspension: string | null;
  /** Quién registró (usuario). */
  registro: string;
  acta: Archivo | null;
  comentarios: ComentarioSancion[];
  /** Total de evidencias del hilo. */
  evidencias: number;
  estatus: EstatusSancion;
  editable?: boolean;
}

export interface SancionInput {
  /** Solo al alta. */
  sujeto_tipo?: SujetoSancion;
  empleado_id?: Id;
  /** Obligatoria con sujeto Empresa. */
  relacion_id?: Id;
  contrato_id?: Id;
  motivo?: MotivoSancion;
  /** Obligatorio con motivo Otro. */
  motivo_otro?: string;
  fecha?: string;
  /** Solo empleados: 1 a 8 días con fecha de inicio. */
  sin_acceso?: boolean;
  dias_sin_acceso?: number;
  inicio_suspension?: string;
  /** Solo al alta: primer comentario del hilo. */
  comentario?: string;
  evidencias?: Archivo[];
}

export interface SancionesFiltros {
  empleado_id?: Id;
  relacion_id?: Id;
  sujeto_tipo?: SujetoSancion;
  estatus?: EstatusSancion;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface OpcionesSancion {
  motivos: MotivoSancion[];
  max_dias_sin_acceso: number;
  sujetos: SujetoSancion[];
}
