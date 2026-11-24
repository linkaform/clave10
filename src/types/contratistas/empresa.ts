// Fuente: specs/empresa/empresa-001-modelo-de-datos.md (clave10-sdk).
import type { Archivo, EmpresaRef, Estatus, Id, Ref } from "./comun";

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
  /** Posición en la lista: se usa para editar y borrar (no hay id). */
  indice?: number;
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
  /** Calculado: Por vencer = 60 días o menos. */
  estatus: EstatusRepse;
  /** Negativo = vencido. */
  dias_restantes?: number;
  /** Barra "Transcurrido N%" (solo con inicio). */
  transcurrido_pct?: number;
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
  /** Suma de los registros patronales; null = "---" (no cargado). */
  trabajadores_registrados?: number | null;
  contactos: Contacto[];
  logo?: Archivo;
  es_propia: boolean;
  estatus: Estatus;
}

/**
 * Lo editable en Mi Empresa · Generales (ME-01): solo estas 4 llaves; el back
 * ignora cualquier otra. El RFC se guarda en mayúsculas.
 */
export type EmpresaInput = Partial<Pick<Empresa, "razon_social" | "rfc" | "objeto_social" | "domicilio_fiscal">>;

/** Alta o edición de un contacto. Nombre ≥ 3, teléfono ≥ 10 dígitos, correo válido; rol por defecto "Contacto". */
export type ContactoInput = Omit<Contacto, "indice" | "rol"> & { rol?: RolContacto };

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
  /* ---- Solo en get_empleado (detalle, ME-04) ---- */
  fecha_nacimiento?: string;
  genero?: Genero;
  estado_civil?: EstadoCivil;
  /** Correo y teléfono de la cuenta (solo lectura). */
  cuenta?: { email: string; telefono: string };
  /** Catálogo de la forma: solo lectura. */
  domicilio?: { nombre_direccion?: string; direccion?: string; colonia?: string; estado?: string; pais?: string };
  contratacion?: {
    /** compañía y jefe directo son catálogos: solo lectura. */
    compania?: string;
    jefe_directo?: string;
    tipo_contrato?: TipoContratoEmpleado;
    numero_empleado?: number;
    fecha_ingreso?: string;
    /** Calculada: "2 años 8 meses". */
    antiguedad?: string;
    dias_vacaciones?: number;
  };
  preferencias?: PreferenciasEmpleado;
  /** false si está desactivado o vetado. */
  qr_activo?: boolean;
}

export type Genero = "Femenino" | "Masculino";
export type EstadoCivil = "Soltero(a)" | "Casado(a)" | "Viudo(a)" | "Unión libre";
export type TipoContratoEmpleado = "Permanente" | "Eventual" | "Planta" | "Becario";

/** Interruptores de Configuraciones. Solo "disponible" tiene efecto por ahora. */
export interface PreferenciasEmpleado {
  disponible_para_contratos: boolean;
  notificaciones_correo: boolean;
  /** Requiere cuenta. */
  acceso_app: boolean;
  checkin_foto: boolean;
}

export type EstatusDocumentoEmpleado = "Rechazado" | "Vencido" | "Por subir" | "Por revisar" | "Aceptado";

export interface OrigenDocumentoEmpleado {
  tipo: "Perfil" | "Contrato" | "Expediente base" | "Carga";
  nombre: string;
  /** id del contrato cuando tipo = Contrato. */
  id?: Id;
}

/** Renglón de la pestaña Documentos (list_documentos_empleado). */
export interface DocumentoEmpleadoRenglon {
  /** null = documento subido sin requerimiento. */
  requerimiento: Ref | null;
  origen: OrigenDocumentoEmpleado;
  /** "También lo requiere:" */
  tambien_lo_requiere: OrigenDocumentoEmpleado[];
  recurrencia: string | null;
  limitante: boolean;
  estatus: EstatusDocumentoEmpleado;
  periodo?: { clave: string; inicio: string; fin: string; vence: string };
  /** Documento más reciente (ME-06-B); null = Por subir. */
  documento: {
    id: Id;
    folio: string;
    nombre: string;
    archivo: Archivo;
    vigencia_inicio?: string | null;
    vigencia_fin?: string | null;
    versiones: { numero: number; archivo: Archivo; estatus: string; subido_por: string; fecha: string; motivo_rechazo?: string }[];
    /** Motivo de rechazo o último comentario. */
    comentario?: string | null;
  } | null;
}

export interface QrEmpleado {
  /** Lo que codifica el QR: id del empleado. */
  contenido: Id;
  activo: boolean;
  motivo_inactivo?: "Empleado vetado" | "Empleado desactivado";
  nombre: string;
  folio: string;
  /** data:image/png;base64,… */
  imagen: string;
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
  /* Generales (ME-04) */
  fecha_nacimiento?: string;
  genero?: Genero;
  estado_civil?: EstadoCivil;
  tipo_contrato?: TipoContratoEmpleado;
  fecha_ingreso?: string;
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

/* ---- Contratos del empleado (ME-05) ---- */

/** Renglón de la pestaña Contratos (list_contratos_empleado). Activo = contrato vigente. */
export interface ContratoEmpleado {
  id: Id;
  folio: string;
  objeto: string;
  cliente: EmpresaRef;
  contratista: EmpresaRef;
  servicios: Ref[];
  /** Perfiles que cubre en este contrato. */
  perfiles: Ref[];
  fecha_alta: string;
  vigencia: { inicio: string; fin: string };
  estatus_contrato: string;
  estatus: Estatus;
  /** "N de M pendientes" (filas del motor del empleado en el contrato). */
  requerimientos: { pendientes: number; total: number };
}

/** Paso 1 de Ligar Contrato (list_contratos_para_ligar). */
export interface ContratoParaLigar {
  id: Id;
  folio: string;
  objeto: string;
  cliente: EmpresaRef;
  vigencia: { inicio: string; fin: string };
  estatus_contrato: string;
  /** Perfiles que pide el contrato; `ya_lo_tiene` = "Ya está en sus perfiles". */
  perfiles: (Ref & { cantidad: number; asignados: number; ya_lo_tiene: boolean })[];
  /** "Coincide con sus perfiles: …" (los que coinciden van primero). */
  coincide: (Ref & { cantidad: number; asignados: number; ya_lo_tiene: boolean })[];
}

/** Resultado de ligar, editar perfiles o remover. */
export interface ResultadoContratoEmpleado {
  contrato: { id: Id; folio: string };
  /** Perfiles nuevos que se sumaron al empleado ("…y se agregó N perfil(es)"). */
  perfiles_agregados: Ref[];
  empleado: EmpleadoContratista;
}
