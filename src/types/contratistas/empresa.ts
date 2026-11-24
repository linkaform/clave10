// Fuente: specs/empresa/empresa-001-modelo-de-datos.md (clave10-sdk).
import type { Archivo, Estatus, Id, Ref } from "./comun";

export interface Domicilio {
  cp: string;
  tipo_vialidad?: string;
  vialidad: string;
  num_exterior?: string;
  num_interior?: string;
  colonia?: string;
  localidad?: string;
  municipio: string;
  estado: string;
  entre_calle?: string;
  y_calle?: string;
}

export type RolContacto = "Representante legal" | "Apoderado legal" | "Contacto";

export interface Contacto {
  nombre: string;
  rol: RolContacto;
  telefono?: string;
  email?: string;
}

export type EstatusRepse = "Vigente" | "Por vencer" | "Vencido" | "Sin REPSE";

export interface Repse {
  folio: string;
  inicio: string;
  fin: string;
  aviso?: Archivo;
  estatus: EstatusRepse;
}

export interface Empresa {
  id: Id;
  folio: string;
  razon_social: string;
  nombre_comercial?: string;
  rfc: string;
  tipo_persona: "moral" | "fisica";
  curp?: string;
  regimen_fiscal?: string;
  actividad_preponderante?: string;
  objeto_social?: string;
  estatus_sat?: Estatus;
  domicilio_fiscal?: Domicilio;
  repse?: Repse;
  actividades_stps: { clave: string; descripcion: string }[];
  acta?: {
    num_escritura: string;
    fecha_protocolizacion: string;
    notario: string;
    num_notaria: string;
    entidad: string;
    archivo?: Archivo;
  };
  registros_patronales: {
    nrp: string;
    descripcion?: string;
    trabajadores_registrados?: number;
  }[];
  contactos: Contacto[];
  logo?: Archivo;
  es_propia: boolean;
  estatus: Estatus;
}

/** Lo editable de una empresa (sin folio, id ni calculados). */
export type EmpresaInput = Omit<Empresa, "id" | "folio" | "es_propia" | "repse"> & {
  repse?: Omit<Repse, "estatus">;
};

export interface EmpleadoContratista {
  id: Id;
  folio: string;
  nombre: string;
  foto?: Archivo;
  curp: string;
  rfc?: string;
  nss?: string;
  /** null = empresa propia */
  empresa: { id: Id; razon_social: string } | null;
  puesto?: string;
  registro_patronal?: string;
  salario_base_cotizacion?: number;
  alta_imss?: string;
  perfiles: Ref[];
  disponible_para_contratos: boolean;
  vetado?: { fecha: string; motivo: string; por: string };
  estatus: Estatus;
  usuario_id?: number;
  /** Usuario de la app ligado (sin cuenta = no viene). */
  usuario?: { id: number; username: string; email: string };
  /** Ubicación de la empresa (ME-02). */
  centro_trabajo?: Ref | null;
  /** Contratos no cancelados donde está ligado; vacío = "Libre". */
  contratos?: { id: Id; folio: string; objeto: string }[];
  /** Filas del motor (ME-15) del empleado; null = sin requerimientos. */
  cumplimiento_pct?: number | null;
  /** false = empleado de otra empresa (solo lectura). Solo en get_empleado. */
  editable?: boolean;
}

/**
 * Cuenta del empleado: sin cuenta (no inicia sesión), ligar un usuario
 * existente o crear uno (se manda la liga de activación al correo).
 */
export type CuentaEmpleadoInput =
  | { modo: "sin_cuenta" }
  | { modo: "ligar"; usuario_id: number }
  | { modo: "crear"; username: string; email: string; telefono: string };

/**
 * Alta y edición. En update_empleado solo se mandan las llaves que cambian;
 * `cuenta` ausente = no tocar la cuenta. Puesto no se escribe (es catálogo).
 */
export interface EmpleadoInput {
  nombre: string;
  curp: string;
  rfc?: string;
  nss?: string;
  foto?: Archivo | null;
  registro_patronal?: string;
  salario_base_cotizacion?: number;
  alta_imss?: string;
  /** ids de Recursos de contrato tipo Perfil (también acepta Ref). */
  perfiles?: (Id | Ref)[];
  disponible_para_contratos?: boolean;
  estatus?: Estatus;
  centro_trabajo?: Ref | null;
  cuenta?: CuentaEmpleadoInput;
}

/** Paso 1 del alta manual (analizar_documentos_empleado). No guarda nada. */
export interface AnalisisDocumentosEmpleado {
  documentos: {
    archivo: Archivo;
    estado: "ok" | "ilegible" | "error";
    error?: string;
    tipo?: "INE" | "CURP" | "Comprobante de domicilio" | "Constancia de situación fiscal" | "CV" | "Otro";
    confianza?: number;
    datos?: { nombre?: string; curp?: string; rfc?: string; nss?: string };
  }[];
  /** Lo que se prellena en el paso 2 (marca "IA"). */
  sugerido: { nombre?: string; curp?: string; rfc?: string; nss?: string };
  inconsistencias: (
    | { campo: string; valores: { valor: string; documento: string }[] }
    | { campo: string; mensaje: string }
  )[];
  alertas: string[];
}

/** validar_carga_empleados. Las CURP repetidas se omiten; con errores no se carga. */
export interface ValidacionCargaEmpleados {
  valido: boolean;
  total: number;
  por_cargar: number;
  omitidos: { fila: number; curp: string; motivo: string }[];
  errores: { fila: number; mensaje: string }[];
  muestra: { nombre: string; curp: string; rfc: string; nss: string }[];
}

export interface ResultadoCargaEmpleados {
  creados: { fila: number; id: Id; folio: string; nombre: string }[];
  omitidos: { fila: number; curp: string; motivo: string }[];
  fallidos: { fila: number; curp: string; error: string }[];
}
