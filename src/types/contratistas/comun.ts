// Tipos comunes del proyecto Contratistas.
// Fuente: specs/empresa/empresa-001-modelo-de-datos.md (clave10-sdk).

/** `_id` del registro en LinkaForm. */
export type Id = string;

export type Estatus = "Activo" | "Inactivo";

export type Ambito = "Empresa" | "Persona" | "Equipo";

export interface Archivo {
  name: string;
  file_url: string;
  size?: number;
}

/** Referencia ligera a otro registro (lo que regresa un campo de catálogo). */
export interface Ref {
  id: Id;
  nombre: string;
}

export interface EmpresaRef {
  id: Id;
  razon_social: string;
  rfc: string;
}

export interface Pagina<T> {
  items: T[];
  total: number;
}

export interface ListParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface Recurrencia {
  tipo: "Por día" | "Semanal" | "Mensual" | "Configurable";
  /** 0 = lunes … 6 = domingo */
  dias_semana?: number[];
  cada_horas?: number;
  /** 1–5 */
  semanas_mes?: number[];
  mensual_modo?: "dia" | "ordinal";
  mensual_dia?: number;
  mensual_ordinal?: number;
  mensual_dia_semana?: number;
  /** 1 = enero … 12 = diciembre */
  meses?: number[];
  cada_n?: number;
  unidad?: "día" | "semana" | "mes" | "año";
  /** HH:MM */
  hora_desde?: string;
  hora_hasta?: string;
}
