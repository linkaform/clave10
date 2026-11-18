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
}

export type EmpleadoInput = Omit<EmpleadoContratista, "id" | "folio" | "vetado">;
