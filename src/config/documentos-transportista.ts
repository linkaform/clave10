// Vocabulario único de "tipo de documento" para transportistas — usado en
// Nuevo Acceso Transportista, Registrar llegada de pase, y el detalle de la
// visita (checklist de documentos requeridos). Los 3 flujos escriben/leen el
// mismo campo real en Mongo (grupo_fotos_y_documentos / tipo_de_documento) —
// antes tenían 3 listas independientes que no coincidían entre sí, así que un
// documento subido desde un flujo no se reconocía como el mismo tipo en los
// otros. Unificado 2026-09.

export interface TipoDocumentoTransportista {
  value: string;
  label: string;
  descripcion?: string;
  // Solo aplica a Recolección: la unidad llega vacía, así que se pide
  // evidencia de la caja/contenedor vacío antes de cargarla.
  soloRecoleccion?: boolean;
  // Ya no se pide ni se ofrece al subir, pero se conserva para que los
  // documentos viejos con ese tipo sigan mostrando su label.
  retirado?: boolean;
}

export const IDENTIFICACION_CHOFER_LABEL = "Identificación del chofer";
export const LICENCIA_LABEL = "Licencia";
export const FOTO_CONDUCTOR_LABEL = "Foto del conductor";
export const FOTO_CAJA_VACIA_LABEL = "Foto de caja vacía";

export const TIPOS_DOCUMENTO_TRANSPORTISTA: TipoDocumentoTransportista[] = [
  { value: "identificacion_chofer", label: IDENTIFICACION_CHOFER_LABEL, descripcion: "INE, pasaporte o gafete de empresa" },
  { value: "licencia", label: LICENCIA_LABEL, descripcion: "Licencia de conducir del chofer" },
  // Flujo simplificado (2610-1323): ya no se pide la foto del conductor.
  { value: "foto_conductor", label: FOTO_CONDUCTOR_LABEL, descripcion: "Fotografía reciente del rostro del conductor", retirado: true },
  { value: "tarjeta_circulacion_vehiculo", label: "Tarjeta de circulación - Vehículo" },
  { value: "tarjeta_circulacion_remolque", label: "Tarjeta de circulación - Remolque" },
  { value: "carta_porte", label: "Carta porte" },
  { value: "factura_orden_compra", label: "Factura / Orden de compra" },
  { value: "foto_placa_vehiculo", label: "Foto de placa de vehículo" },
  { value: "evidencia_carga", label: "Evidencia de carga" },
  { value: "conocimiento_embarque_bl", label: "Conocimiento del embarque (BL)" },
  { value: "contenedor_doc_contenedor", label: "Contenedor / Doc. contenedor" },
  { value: "foto_caja_vacia", label: FOTO_CAJA_VACIA_LABEL, descripcion: "Evidencia de que la caja/contenedor llegó vacío, antes de cargarlo", soloRecoleccion: true },
];

// Acepta un label o un value/slug ya resuelto (idempotente) — sigue cayendo a
// slugificar el texto crudo como red de seguridad si algún día se agrega un
// tipo sin entrada fija en la lista de arriba.
export const tipoRequeridoSlug = (nombreOValue: string): string =>
  TIPOS_DOCUMENTO_TRANSPORTISTA.find((t) => t.label === nombreOValue || t.value === nombreOValue)?.value
    ?? nombreOValue.trim().toLowerCase().replace(/\s+/g, "_");

export const labelDeTipoRequerido = (slug: string): string =>
  TIPOS_DOCUMENTO_TRANSPORTISTA.find((t) => t.value === slug)?.label ?? slug.replace(/_/g, " ");

// Tipos que se ofrecen al subir en Nuevo Acceso y Registrar llegada de pase
// (en entrada la caja no llega vacía, así que se omite la de Recolección).
export const TIPOS_DOCUMENTO_SUBIDA = TIPOS_DOCUMENTO_TRANSPORTISTA.filter((t) => !t.soloRecoleccion && !t.retirado);

// Mínimo de caracteres para licencia y factura / orden de compra: con los
// últimos 4 basta para identificarlas, pero se acepta el dato completo.
export const MIN_CARACTERES_REFERENCIA = 4;
export const tieneMinCaracteres = (valor: string, min = MIN_CARACTERES_REFERENCIA): boolean =>
  valor.replace(/[^0-9a-z]/gi, "").length >= min;
