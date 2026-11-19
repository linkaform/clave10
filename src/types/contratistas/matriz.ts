// F0-12 · Motor de matriz genérico. Lo usan las 4 matrices de Contratistas:
// MX-01 (contratista × obligación), ME-07 (obligación × periodo),
// MX-04 (empleado × requerimiento) y MX-05 (asignación con casillas).
// El motor no sabe de documentos ni de periodos: recibe filas, columnas y el
// estado de cada celda; qué entra y qué acciones hay lo decide cada pantalla.
import type { ReactNode } from "react";

/** Estados de celda (ST en el diseño). */
export type EstadoCelda =
  | "ok"     // Aceptado
  | "rev"    // Por revisar
  | "rech"   // Rechazado
  | "venc"   // Vencido
  | "pend"   // Por subir
  | "falta"  // No entregado
  | "na"     // No aplica
  | "par"    // Parcial (la celda agrupa varios periodos y no todos cumplen)
  | "fut";   // Por transcurrir (periodo futuro)

export interface MatrizFila {
  id: string;
  nombre: string;
  /** RFC, perfil o lo que vaya bajo el nombre. */
  subtitulo?: string;
  /** Si no viene, se calculan del nombre. */
  iniciales?: string;
  /** Bolita junto al nombre (p. ej. estatus Activo/Inactivo). */
  punto?: { color: string; titulo: string };
  /** Contenido extra junto al subtítulo (p. ej. "Alerta enviada"). */
  marca?: ReactNode;
}

export interface MatrizColumna {
  id: string;
  etiqueta: string;
  /** Si viene, el encabezado es clicable (p. ej. abrir la vista por requerimiento). */
  onClick?: () => void;
}

export interface MatrizCelda {
  estado: EstadoCelda;
  /**
   * Estados de los periodos que agrupa la celda (cuatrimestre, año). Sirve
   * para que los chips encuentren la celda aunque su estado visible sea
   * "Parcial". Si no viene, se usa `[estado]`.
   */
  estados?: EstadoCelda[];
  /** Número en la esquina: periodos con inconsistencias cuando agrupa. */
  contador?: number;
  /** Tooltip de la celda. Por defecto: "<columna>: <estado>". */
  titulo?: string;
}

/** Desglose por mes/periodo dentro del popover. */
export interface PopoverPeriodo {
  etiqueta: string;
  estado: EstadoCelda;
  titulo?: string;
  /** Periodo en curso: se pinta con reloj de arena y borde. */
  enCurso?: boolean;
  onClick?: () => void;
}

export interface PopoverAccion {
  etiqueta: string;
  icono?: ReactNode;
  onClick: () => void;
  /** Botón azul al pie (Ver Cumplimiento / Ir al detalle). */
  primaria?: boolean;
  /** Rojo (Rechazar). */
  destructiva?: boolean;
}

/** Lo que la pantalla devuelve para llenar el popover de una celda. */
export interface ContenidoPopover {
  titulo: string;
  subtitulo?: string;
  /** Texto junto al chip de estado (periodo, "Ejercicio 2026 · 3 de 5 meses aceptados"). */
  periodo?: string;
  desglose?: PopoverPeriodo[];
  /** Columnas del desglose (6 mensual, 3 cuatrimestral…). */
  desgloseColumnas?: number;
  campos?: { etiqueta: string; valor: ReactNode; color?: string }[];
  /** Aviso azul (no aplica, sin periodos…). */
  nota?: string;
  /** Aviso rojo (motivo de rechazo, falta). */
  alerta?: string;
  acciones?: PopoverAccion[];
}

export type OrdenDir = "" | "asc" | "desc";
