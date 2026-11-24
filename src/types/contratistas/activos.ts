// Activos de Mi Empresa y sus mantenimientos (ME-08).
// Back: lkf-sanic-apps/addons/accesos/contratistas_activos.py (activos_sdk.py).
// Forma: activos_fijos (Activo_Fijo, la que lee Concesiones) + página Contratista.
import type { Archivo, Id, Ref } from "./comun";

export type ClaseActivo = "Vehículo" | "Equipo" | "Herramienta";
export type InventarioActivo = "Único" | "Stock";
export type PrioridadMantenimiento = "Alta" | "Media" | "Baja";
export type EstatusMantenimiento = "Abierta" | "En proceso" | "Cerrada";

export interface LecturaActivo {
  valor: number | null;
  fecha: string | null;
}

export interface VehiculoActivo {
  tipo: string | null;
  serie_chasis: string | null;
  serie_motor1: string | null;
  serie_motor2: string | null;
  kilometraje: LecturaActivo;
  horometro: LecturaActivo;
  kilometraje2: LecturaActivo;
  horometro2: LecturaActivo;
}

export interface Activo {
  id: Id;
  /** A-0001 */
  folio: string;
  nombre: string;
  clase: ClaseActivo;
  foto: Archivo | null;
  marca: string | null;
  modelo: string | null;
  estado: "Activo" | "Inactivo";
  /** Concesionado: false = No disponible (también si está Inactivo). */
  disponible: boolean;
  inventario: InventarioActivo;
  /** Solo Stock. */
  cantidad: number | null;
  ubicacion: string | null;
  area: string | null;
  asignado: Ref | null;
  adquisicion: string | null;
  costo: number | null;
  ultimo_mantenimiento: string | null;
  /** null = activo de siempre de la cuenta (empresa propia). */
  empresa: Ref | null;
  vehiculo?: VehiculoActivo;
  mantenimientos_abiertos?: number;
}

export interface ActivoInput {
  nombre: string;
  clase: ClaseActivo;
  costo: number;
  ubicacion: string;
  area: string;
  foto: Archivo;
  /** Default Único; Stock solo en Herramienta. */
  inventario?: InventarioActivo;
  cantidad?: number;
  marca?: string | null;
  modelo?: string | null;
  adquisicion?: string | null;
  ultimo_mantenimiento?: string | null;
  /** Obligatorio al editar (diseño). */
  asignado_id?: Id | null;
  vehiculo?: Partial<Omit<VehiculoActivo, "kilometraje" | "horometro" | "kilometraje2" | "horometro2">> & {
    marca?: string;
    modelo?: string;
    kilometraje?: LecturaActivo;
    horometro?: LecturaActivo;
    kilometraje2?: LecturaActivo;
    horometro2?: LecturaActivo;
  };
  /** Resultado de analizarFotoActivo para guardarlo con el activo. */
  lectura_ia?: Record<string, unknown>;
}

export interface ActivosFiltros {
  clase?: ClaseActivo;
  disponible?: boolean;
  estado?: "Activo" | "Inactivo";
  inventario?: InventarioActivo;
  ubicacion?: string;
  mantenimiento_desde?: string;
  mantenimiento_hasta?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface OpcionesActivo {
  ubicaciones: { ubicacion: string; areas: string[] }[];
  /** Cascada tipo → marca → modelo (catálogo de vehículos de la cuenta). */
  vehiculos: { tipo: string; marcas: { marca: string; modelos: string[] }[] }[];
  clases: ClaseActivo[];
  inventarios: InventarioActivo[];
  prioridades: PrioridadMantenimiento[];
}

export interface CampoIA<T = string> {
  valor: T;
  confianza: number;
}

export interface AnalisisFotoActivo {
  legible: boolean;
  /** "Identificado como …" */
  identificado: string | null;
  /** false = "Captúralo manualmente". */
  modelo_detectado: boolean;
  campos: {
    nombre?: CampoIA;
    clase?: CampoIA<ClaseActivo>;
    tipo_vehiculo?: CampoIA;
    marca?: CampoIA;
    modelo?: CampoIA;
  };
}

/** Préstamo del activo (módulo Concesiones; se empata por nombre del equipo). */
export interface ConcesionActivo {
  id: Id;
  folio: string;
  persona: string;
  /** En préstamo, Completo, Dañado, Perdido… */
  estatus: string;
  piezas: number;
  fecha: string | null;
  devolucion: string | null;
}

export interface Mantenimiento {
  id: Id;
  /** M-0001 */
  folio: string;
  activo: Ref;
  asignado: Ref;
  prioridad: PrioridadMantenimiento;
  fecha_limite: string | null;
  descripcion: string;
  estatus: EstatusMantenimiento;
  fecha_cierre: string | null;
  historial: {
    estatus: EstatusMantenimiento | "";
    comentario: string;
    evidencias: Archivo[];
    autor: string;
    fecha: string;
  }[];
}

export interface MantenimientoInput {
  activo_id?: Id;
  asignado_id?: Id;
  prioridad?: PrioridadMantenimiento;
  fecha_limite?: string;
  descripcion?: string;
  /** Solo al alta: primer renglón del historial. */
  comentario?: string;
  evidencias?: Archivo[];
}
