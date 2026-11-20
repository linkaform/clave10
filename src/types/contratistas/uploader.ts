// F0-10 · Uploader con IA. Contrato entre el componente, el servicio de
// análisis (F0-11, aún sin back: se consume con mock) y la pantalla que lo usa
// (ME-06, ME-03, ME-04, ME-05, ME-07, ME-11, CF-01, R-02, wizard ME-12).

export interface OpcionCombo {
  id: string;
  nombre: string;
  /** Texto gris a la derecha, p. ej. "Empresa" / "Empleado". */
  sub?: string;
}

/** Documento ya existente: sirve para detectar duplicados y nombres repetidos. */
export interface DocumentoExistente {
  id: string;
  folio: string;
  nombre: string;
  archivo_nombre: string;
}

export type AccionAlerta =
  | { tipo: "usar_valor"; etiqueta: string; campo: "registro" | "vigencia_fin"; valor: string }
  | { tipo: "otro_archivo"; etiqueta: string };

/** Inconsistencia detectada por la IA (dupAlerts en el diseño). */
export interface AlertaIA {
  nivel: "error" | "aviso";
  titulo: string;
  detalle: string;
  accion?: AccionAlerta;
}

/** Respuesta de F0-11. */
export interface AnalisisIA {
  legible: boolean;
  /** "Constancia de situación fiscal · Fiscal"; null si no se identificó. */
  tipo: string | null;
  /** Confianza global 0–100 (dupConf). */
  confianza: number;
  nombre_sugerido: string;
  mapeo: { id: string | null; confianza: number };
  propietario: { id: string | null; confianza: number };
  campos: { vigencia_fin?: string; registro?: string };
  alertas: AlertaIA[];
}

export type FaseUploader =
  | "pregunta"    // el archivo ya existe: Reemplazar / Conservar ambos
  | "subiendo"    // % de subida
  | "analizando"  // pasos de la IA
  | "listo"       // check verde, 700 ms y abre revisión
  | "falla"       // no legible o error de red: Reintentar / Capturar manualmente
  | "revision"    // formulario
  | "guardando";

/** Lo que recibe `onSubmit` de la pantalla que consume el uploader. */
export interface ResultadoUploader {
  archivo: { name: string; file_url: string; size: number };
  nombre: string;
  requerimiento_id: string | null;
  propietario_id: string | null;
  comentarios: string[];
  /** Si el usuario eligió Reemplazar: id del documento que recibe la versión. */
  reemplaza_id?: string;
  analisis: AnalisisIA | null;
  mapeo_manual: boolean;
  propietario_manual: boolean;
}
