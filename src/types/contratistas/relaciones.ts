// Fuente: specs/relaciones/relaciones-001-modelo-de-datos.md (clave10-sdk).
import type { Archivo, EmpresaRef, Estatus, Id, Pagina, Ref } from "./comun";
import type { Requerimiento } from "./contratos";
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

/* ---------- Asignación de requerimientos (MX-05) ---------- */

/** Columna: requerimiento activo de ámbito Empresa, con lo que pide el tooltip. */
export type ColumnaAsignacion = Pick<
  Requerimiento,
  | "id"
  | "nombre"
  | "tipo"
  | "plataforma"
  | "plataforma_url"
  | "vigencia_modo"
  | "vigencia"
  | "periodicidad"
  | "aviso"
  | "requiere_acuse"
  | "limitante"
> & {
  /** A cuántos contratistas activos se les solicita (sin filtros). */
  solicitados: number;
};

/** Fila: un contratista de la empresa activa (ella es el cliente). */
export interface FilaAsignacion {
  relacion_id: Id;
  folio: string;
  contratista: EmpresaRef;
  estatus: Estatus;
  /** false = contratista inactivo (fila atenuada, sin edición). */
  editable: boolean;
  /** Ids de requerimientos asignados (puede incluir alguno ya inactivo). */
  asignados: Id[];
  /** "N de M": n asignados activos de M requerimientos de empresa activos. */
  solicitados: { n: number; m: number };
}

export interface MatrizAsignacion extends Pagina<FilaAsignacion> {
  requerimientos: ColumnaAsignacion[];
}

export interface AsignacionInput {
  relacion_id: Id;
  /** Lista completa de lo que queda asignado a ese contratista. */
  requerimientos: Id[];
}
