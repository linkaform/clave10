// Fuente: specs/contratos/contratos-001-modelo-de-datos.md (clave10-sdk).
import type { Ambito, Archivo, EmpresaRef, Estatus, Id, Recurrencia, Ref } from "./comun";

/* ---------- Recursos de contrato (Servicio / Perfil / Equipo) ---------- */

export type TipoRecurso = "Servicio" | "Perfil" | "Equipo";
export type ClaseEquipo = "Equipo" | "Vehículo" | "Herramienta";

export interface RecursoContrato {
  id: Id;
  tipo: TipoRecurso;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  clase?: ClaseEquipo;
  /** Con su ámbito para los chips por ámbito de la lista. */
  requerimientos: (Ref & { ambito?: Ambito })[];
  estatus: Estatus;
}

export type RecursoInput = Omit<RecursoContrato, "id" | "requerimientos"> & {
  requerimientos: Id[];
};

/* ---------- Requerimientos ---------- */

export type TipoRequerimiento = "Documento" | "Examen" | "Inspección";

export type Plataforma =
  | "Sin plataforma"
  | "SAT"
  | "IMSS"
  | "INFONAVIT"
  | "STPS"
  | "Registro Público de Comercio"
  | "INE"
  | "Otra";

export type Periodicidad =
  | "Única"
  | "Mensual"
  | "Bimestral"
  | "Trimestral"
  | "Cuatrimestral"
  | "Semestral"
  | "Anual"
  | "Cada 3 años"
  | "Cada 10 años";

export interface Requerimiento {
  id: Id;
  nombre: string;
  descripcion?: string;
  tipo: TipoRequerimiento;
  ambito: Ambito;
  plataforma: Plataforma;
  plataforma_url?: string;
  vigencia_modo: "vigencia" | "periodo";
  /** null = permanente */
  vigencia?: { n: number; unidad: "días" | "meses" | "años" } | null;
  periodicidad?: Periodicidad;
  meses_periodo?: number[];
  dia_limite?: number;
  recurrencia?: Recurrencia;
  tolerancia_dias?: number;
  aviso?: { n: number; unidad: string; repetir: boolean } | null;
  requiere_acuse: boolean;
  limitante: boolean;
  criterios: string[];
  documento_ejemplo?: Archivo;
  examen?: {
    modalidad: "fisico" | "digital";
    intentos: number;
    calificacion_minima: number;
    preguntas_aleatorias: boolean;
    respuestas_aleatorias: boolean;
    vigencia_resultado?: { n: number; unidad: string };
  };
  inspeccion?: string;
  estatus: Estatus;
}

export type RequerimientoInput = Omit<Requerimiento, "id">;

/** Pestaña Aplicación del detalle de un servicio, perfil o equipo (CF-02). */
export interface AplicacionRecurso {
  requerimientos: (Pick<Requerimiento, "id" | "nombre" | "descripcion" | "tipo" | "ambito" | "vigencia_modo" | "vigencia" | "periodicidad" | "limitante" | "estatus">)[];
  contratos: { id: Id; folio: string; objeto: string; contratista: string; cumplimiento_pct: number }[];
}

/** Pestaña Aplicación del detalle de un requerimiento (CF-01). */
export interface AplicacionRequerimiento {
  /** Servicios, perfiles o equipos que lo exigen. */
  exigencia: { id: Id; nombre: string; tipo: "Servicio" | "Perfil" | "Equipo" | "" }[];
  /** Relaciones (como cliente) que lo tienen asignado. */
  relaciones: { id: Id; folio: string; contratista: string }[];
  /** Contratos (como cliente) donde se solicita. */
  contratos: { id: Id; folio: string; contratista: string }[];
  /** Una fila por sujeto y periodo, con su estado de cumplimiento. */
  sujetos: {
    tipo: Ambito;
    sujeto: Ref;
    empresa: Ref;
    contrato: Id | null;
    periodo: string;
    estado: EstadoCumplimiento;
  }[];
}

/* ---------- Contratos ---------- */

export type EstatusContrato =
  | "Activo"
  | "Por vencer"
  | "En documentación"
  | "Vencido"
  | "Pausado"
  | "Cancelado";

export type EstatusUbicacionContrato = "Activa" | "En apertura" | "Inactiva";

export interface CumplimientoContrato {
  total: number;
  contrato: number;
  empleados: number;
  periodicos: number;
}

export interface Contrato {
  id: Id;
  folio: string;
  numero_contrato?: string;
  relacion: Id;
  cliente: EmpresaRef;
  contratista: EmpresaRef;
  objeto: string;
  descripcion?: string;
  monto?: number;
  inicio: string;
  fin: string;
  responsable?: { id: number; nombre: string };
  contrato_firmado?: Archivo;
  permite_subcontratacion: boolean;
  servicios: Ref[];
  perfiles: { perfil: Ref; cantidad: number; requerimientos_excluidos: Id[] }[];
  equipos: {
    equipo: Ref;
    clase: ClaseEquipo;
    cantidad: number;
    requerimientos_excluidos: Id[];
  }[];
  ubicaciones: { ubicacion: Ref; estatus: EstatusUbicacionContrato }[];
  empleados: { empleado: Ref; perfil: Ref; ubicacion?: Ref; fecha_alta: string }[];
  recurrencia?: Recurrencia;
  estatus: EstatusContrato;
  motivo_estatus?: string;
  cumplimiento: CumplimientoContrato;
}

/** Lo que se captura al crear o editar; el back calcula folio, estatus y cumplimiento. */
export type ContratoInput = Omit<
  Contrato,
  "id" | "folio" | "cliente" | "contratista" | "estatus" | "motivo_estatus" | "cumplimiento"
>;

/** Cambio manual de estatus: Pausado, Cancelado o reanudar (null). */
export interface CambioEstatusContrato {
  estatus_manual: "Pausado" | "Cancelado" | null;
  motivo: string;
}

export type EventoContratoTipo =
  | "Creación"
  | "Ubicaciones"
  | "Perfiles"
  | "Equipos"
  | "Servicios"
  | "Empleados"
  | "Monto"
  | "Vigencia"
  | "Estatus"
  | "Pausa"
  | "Reanudación"
  | "Cancelación"
  | "Modificatorio";

export interface EventoContrato {
  id: Id;
  contrato: Id;
  evento: EventoContratoTipo;
  detalle: string;
  antes?: Record<string, unknown>;
  despues?: Record<string, unknown>;
  documento?: Archivo;
  autor: string;
  fecha: string;
}

/* ---------- Documentos ---------- */

export type EstatusDocumento = "Por revisar" | "Aceptado" | "Rechazado" | "Vencido";
export type DecisionAprobacion = "Pendiente" | "Aprobado" | "Rechazado";

export interface DuenoDocumento {
  tipo: Ambito;
  empresa: Ref;
  empleado?: Ref;
  equipo?: Ref;
}

export interface Documento {
  id: Id;
  folio: string;
  nombre: string;
  categoria?: string;
  requerimiento: Ref | null;
  dueno: DuenoDocumento;
  periodo?: { clave: string; inicio: string; fin: string };
  en_ceros: boolean;
  vigencia_inicio?: string;
  vigencia_fin?: string | null;
  archivo: Archivo;
  estatus: EstatusDocumento;
  compartido_con: Ref[];
  contratos: Ref[];
  origen: "Carga" | "Carga masiva" | "Sesión";
  lectura_ia?: Record<string, unknown>;
  versiones: {
    numero: number;
    archivo: Archivo;
    estatus: EstatusDocumento;
    subido_por: string;
    fecha: string;
    motivo_rechazo?: string;
  }[];
  comentarios: { autor: string; fecha: string; texto: string }[];
  aprobaciones: {
    cliente: Ref;
    decision: DecisionAprobacion;
    revisor?: string;
    fecha?: string;
    motivo?: string;
  }[];
}

export interface DocumentoInput {
  nombre: string;
  categoria?: string;
  requerimiento_id?: Id | null;
  dueno: { tipo: Ambito; empresa_id: Id; empleado_id?: Id; equipo_id?: Id; equipo_nombre?: string };
  periodo?: { clave: string; inicio: string; fin: string };
  en_ceros?: boolean;
  vigencia_inicio?: string;
  vigencia_fin?: string | null;
  archivo: Archivo;
  compartido_con?: Id[];
  contratos?: Id[];
  /** Si viene, se agrega como versión nueva de ese documento (Reemplazar). */
  reemplaza_id?: Id;
  /** "Carga masiva" cuando viene del alta en lote; default "Carga". */
  origen?: "Carga" | "Carga masiva";
  /** Resultado de analizar_documento (F0-11) para guardarlo con el documento. */
  lectura_ia?: Record<string, unknown>;
}

export interface RevisionDocumento {
  decision: "Aprobado" | "Rechazado";
  /** Obligatorio al rechazar. */
  motivo?: string;
}

/* ---------- Cumplimiento ---------- */

export type EstadoCumplimiento =
  | "Por transcurrir"
  | "En plazo"
  | "Por subir"
  | "Por revisar"
  | "Cumplido"
  | "Rechazado"
  | "Vencido"
  | "En ceros"
  | "No aplica";

export interface CumplimientoFila {
  id: Id;
  relacion: Id;
  contrato: Id | null;
  requerimiento: Ref;
  limitante: boolean;
  sujeto: { tipo: Ambito; empresa: Ref; empleado?: Ref; equipo?: Ref };
  periodo: { clave: string; inicio: string; fin: string; vence: string };
  documento: Id | null;
  estado: EstadoCumplimiento;
  motivo_manual?: string;
}

export interface CumplimientoFiltros {
  relacion_id?: Id;
  contrato_id?: Id;
  sujeto_tipo?: Ambito;
  empleado_id?: Id;
  anio?: number;
}

/* ---------- Sesiones ---------- */

/** Tipos del diseño (decisión 2026-11-24). */
export type TipoSesion = "Curso" | "Capacitación" | "Plática" | "Inducción";
export type EstatusSesion = "Programada" | "En curso" | "Finalizada" | "Cancelada";

export interface Participante {
  empleado: Ref;
  /** fecha (YYYY-MM-DD) -> asistencia */
  asistencia: Record<string, "Asistió" | "Faltó">;
  calificacion?: number;
  resultado?: "Aprobado" | "No aprobado";
}

export interface Sesion {
  id: Id;
  nombre: string;
  descripcion?: string;
  tipo: TipoSesion;
  instructor?: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio?: string;
  hora_fin?: string;
  recurrencia?: Recurrencia & { repetir_hasta?: string };
  lugar?: string;
  enlace?: string;
  modalidad: "Presencial" | "Virtual" | "Híbrida";
  areas: Ref[];
  cupo?: number;
  /** Requerimientos tipo Examen, ámbito Persona (al terminar). */
  examenes: Ref[];
  /** Requerimientos tipo Documento, ámbito Persona, que cumple quien acredite. */
  otorgados: Ref[];
  temario: {
    tema: string;
    leccion: string;
    minutos?: number;
    material_tipo: "Video" | "Lectura" | "Presentación" | "Cuestionario" | "Clase en vivo";
    material_origen: "Archivo" | "Enlace";
    material?: Archivo | string;
  }[];
  /** Materiales de apoyo (Capacitación, Plática, Inducción). */
  recursos: {
    nombre: string;
    material_tipo: "Video" | "Lectura" | "Presentación" | "Cuestionario" | "Clase en vivo";
    material_origen: "Archivo" | "Enlace";
    material?: Archivo | string;
  }[];
  participantes: Participante[];
  /** Participantes inscritos (barra inscritos/cupo). */
  inscritos?: number;
  motivo_cancelacion?: string;
  estatus: EstatusSesion;
}

/**
 * Alta o edición completa. Exámenes y otorgados aceptan ids o Ref. Curso
 * exige temario; lugar y/o enlace obligatorio. Participantes van por CF-04.
 */
export type SesionInput = Omit<
  Sesion,
  "id" | "modalidad" | "estatus" | "participantes" | "inscritos" | "motivo_cancelacion" | "examenes" | "otorgados"
> & { examenes: (Id | Ref)[]; otorgados: (Id | Ref)[] };
