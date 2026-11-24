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
  /** MX-03: última alerta de incumplimientos enviada ("Alerta enviada"). */
  ultima_notificacion: UltimaNotificacion | null;
}

export interface UltimaNotificacion {
  fecha: string;
  autor: string;
  correo_enviado: boolean;
  /** Cuántas se han enviado en total. */
  total: number;
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
  ultima_notificacion: UltimaNotificacion | null;
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

/* ---------- Notificar incumplimientos (MX-03) ---------- */

/** Rechazado / Vencido / No entregado (= "Por subir" del motor). */
export type EstadoIncumplimiento = "Rechazado" | "Vencido" | "No entregado";

export interface IncumplimientoRequerimiento {
  requerimiento: Ref;
  /** clave "unico" = requerimiento por vigencia; sujeto = empleado o equipo. */
  periodos: { clave: string; estado: EstadoIncumplimiento; sujeto?: string }[];
}

export interface DestinatarioIncumplimiento {
  relacion_id: Id;
  folio: string;
  contratista: EmpresaRef;
  estatus: Estatus;
  /** Representante legal con correo, o el primer contacto con correo; null = solo portal. */
  destinatario: { nombre: string; email: string; rol: string } | null;
  incumplimientos: IncumplimientoRequerimiento[];
  /** "N incumplimientos"; 0 = campana atenuada ("Sin incumplimientos"). */
  total: number;
  mensaje_sugerido: string;
  ultima_notificacion: UltimaNotificacion | null;
}

export interface Incumplimientos {
  items: DestinatarioIncumplimiento[];
  con_incumplimientos: number;
  /** Para uno: detalle; para varios: mensaje genérico. Precarga el Motivo. */
  mensaje_sugerido: string;
}

export interface ResultadoNotificacion {
  enviadas: number;
  items: {
    relacion_id: Id;
    folio: string;
    contratista: EmpresaRef;
    correo: string | null;
    correo_enviado: boolean;
    sin_correo?: boolean;
    error_correo?: string;
    /** Usuarios de la empresa avisados en su bandeja. */
    portal: number;
    incumplimientos: number;
    fecha: string;
  }[];
  /** Relaciones sin incumplimientos (no se notificaron). */
  omitidas: { relacion_id: Id; folio: string; motivo: string }[];
}
