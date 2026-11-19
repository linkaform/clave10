// Fuente: specs/relaciones/relaciones-001-modelo-de-datos.md (clave10-sdk).
import type { Archivo, EmpresaRef, Estatus, Id, Ref } from "./comun";
import type { EstatusRepse } from "./empresa";

/** Desde dónde mira la empresa activa: sus clientes o sus contratistas. */
export type Direccion = "clientes" | "contratistas";

export interface Relacion {
  id: Id;
  folio: string;
  cliente: EmpresaRef;
  contratista: EmpresaRef;
  relacion_padre: Id | null;
  nivel: number;
  requerimientos_asignados: Ref[];
  estatus: Estatus;
  fecha_alta: string;
  notas?: string;
  num_contratos: number;
  cumplimiento_pct: number;
}

/** Fila de la lista única Clientes/Contratistas (R-04): contraparte ya resuelta. */
export interface RelacionFila {
  id: Id;
  folio: string;
  contraparte: EmpresaRef & { logo?: Archivo };
  representante?: { nombre: string; email?: string };
  repse?: {
    folio: string;
    fin: string;
    dias_restantes: number;
    estatus: EstatusRepse;
  };
  num_contratos: number;
  cumplimiento_pct: number;
  estatus: Estatus;
}

export interface RelacionInput {
  /** La contraparte; el otro lado es siempre la empresa activa. */
  contraparte_id: Id;
  direccion: Direccion;
  relacion_padre?: Id | null;
  notas?: string;
}
