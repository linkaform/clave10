"use client";

import { useQuery } from "@tanstack/react-query";
import { getFormFieldsTransportista, getFormasInspeccionTransportista } from "@/services/endpoints";

// TODO: estos form_id son de la cuenta 10 (hardcodeados temporalmente).
// Si se corre en otra cuenta de Clave10, hay que resolverlos por cuenta.
const TRACTOR_FORM_ID = "157729";
const CONTENEDOR_FORM_ID = "157730";
const SELLO_FORM_ID = "158808";

// field_id de los 3 campos de medida interior — estables aunque se renombre el label.
const CONTENEDOR_MEDIDA_FIELD_IDS = {
  altura: "d412fb9f428dfc231c9bc3f0",
  ancho: "6477c73222d9b7e8dd1de3b9",
  longitud: "d7c19cbd2cfe6b19f848d697",
};

// field_id de los campos de la forma de Inspección de Sello.
const SELLO_ISO_FIELD_ID = "1e534c51db80d867b1922c86";
const SELLO_VVTT_FIELD_ID = "92ab37dbe06381e6100f88f0";
const SELLO_EVIDENCIA_FIELD_IDS: Record<string, string> = {
  foto_sello: "1defc3e446a9ebd00c649dbc",
  sello_puertas: "26f5f07d55f304e9015ae64d",
  puertas_completas: "be928c48d8a6353077ec5eba",
  placas_economico: "d7479071e6aabdeaa10ce41b",
  identificacion_operador: "718a0a37c5a6965b2127d2c0",
};

interface ApiFormField {
  field_id: string;
  label: string;
  field_type: string;
  options: { label: string; value: string }[];
}

interface ApiFormPage {
  page_name: string;
  fields: ApiFormField[];
}

interface ApiFormFieldsResult {
  form_id: string;
  pages: ApiFormPage[];
}

export interface MedidasLabels {
  altura: string;
  ancho: string;
  longitud: string;
}

export interface SelloClasificacionOption {
  value: string;
  sigla: string;
  label: string;
}

export interface SelloVvttPunto {
  key: string;
  sigla: string;
  label: string;
  descripcion: string;
}

export interface PuntoConId {
  field_id: string;
  label: string;
  // Detectados por adyacencia (ver extractPuntos): el radio de cada punto,
  // en la forma real de cuenta 10, va seguido de su propio textarea de
  // comentario y su propio campo de imágenes de evidencia. Cualquier forma
  // custom que replique ese patrón (radio → textarea → images consecutivos)
  // se beneficia igual, sin depender de una lista fija por posición/slug.
  comentarioFieldId?: string;
  evidenciaFieldId?: string;
  // El value real de las opciones "Sí"/"No" de ESTE campo en Linkaform — no se
  // puede asumir que siempre sea el string "sí"/"no": la forma default de
  // cuenta 10 usa "sí" (con acento) porque así se escribió el label ahí, pero
  // una forma custom puede tener "si" (sin acento) u otra variante. Se resuelve
  // por opciones reales del campo, no por texto fijo (ver resolverSiNo).
  siValue?: string;
  noValue?: string;
}

// Normaliza quitando acentos/mayúsculas para comparar "Sí"/"si"/"SI" como iguales.
const MAPA_ACENTOS: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u", ñ: "n",
};
function normalizarTexto(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[áéíóúñ]/g, (c) => MAPA_ACENTOS[c] ?? c);
}

// Resuelve, para un campo radio tipo Sí/No, cuál de sus 2 opciones reales
// corresponde a "sí" y cuál a "no" — comparando value y label normalizados,
// en vez de asumir que el value literal sea "sí"/"no".
function resolverSiNo(options: { label: string; value: string }[]): { siValue?: string; noValue?: string } {
  const si = options.find((o) => normalizarTexto(o.value) === "si" || normalizarTexto(o.label) === "si");
  const no = options.find((o) => normalizarTexto(o.value) === "no" || normalizarTexto(o.label) === "no");
  return { siValue: si?.value, noValue: no?.value };
}

interface InspeccionPuntos {
  puntosTractor: PuntoConId[];
  filasContenedor: PuntoConId[];
  medidasLabelsContenedor: MedidasLabels;
  selloClasificaciones: SelloClasificacionOption[];
  selloVvttPuntos: SelloVvttPunto[];
  selloEvidenciaLabels: Record<string, string>;
  // Forma resuelta para esta ubicación (default de cuenta 10, o una custom
  // configurada en "Configuración de Flujo de Transportistas").
  tractorFormId: string;
  contenedorFormId: string;
  // Candidatos de comentario/evidencia "general" (primer textarea/text y primer
  // campo de imágenes de la forma) — solo se usan en la UI cuando NINGÚN punto
  // trae su propio comentarioFieldId/evidenciaFieldId (ver page.tsx).
  tractorComentarioFieldId: string | null;
  tractorEvidenciaFieldId: string | null;
  contenedorComentarioFieldId: string | null;
  contenedorEvidenciaFieldId: string | null;
}

// Puntos de inspección (radio) con sus campos de comentario/evidencia propios,
// detectados por adyacencia en el orden real de la forma: un radio seguido de
// un textarea es su comentario; el campo de imágenes que sigue es su evidencia.
// Así el guardado deja de depender de una lista fija por posición — sobrevive
// a que se agreguen/quiten/reordenen puntos en Linkaform.
function extractPuntos(fields: ApiFormField[]): PuntoConId[] {
  const puntos: PuntoConId[] = [];
  fields.forEach((f, i) => {
    if (f.field_type !== "radio") return;
    let comentarioFieldId: string | undefined;
    let evidenciaFieldId: string | undefined;
    let cursor = i + 1;
    if (fields[cursor]?.field_type === "textarea") {
      comentarioFieldId = fields[cursor].field_id;
      cursor += 1;
    }
    if (fields[cursor]?.field_type === "images") {
      evidenciaFieldId = fields[cursor].field_id;
    }
    const { siValue, noValue } = resolverSiNo(f.options ?? []);
    puntos.push({
      field_id: f.field_id,
      label: f.label.replace(/^\d+\.\s*/, ""),
      comentarioFieldId,
      evidenciaFieldId,
      siValue,
      noValue,
    });
  });
  return puntos;
}

function extractFilas(fields: ApiFormField[]): PuntoConId[] {
  return fields
    .filter((f) => f.field_type === "checkbox")
    .map((f) => ({ field_id: f.field_id, label: f.label }));
}

// Campo de comentario/evidencia "general" candidato de una forma — se toma el
// primer campo de texto/imágenes que traiga, ya que no hay una convención de
// slug para identificarlos. Solo se usa cuando ningún punto tiene el suyo propio.
function extractPrimerCampoDeTipo(fields: ApiFormField[], fieldTypes: string[]): string | null {
  return fields.find((f) => fieldTypes.includes(f.field_type))?.field_id ?? null;
}

function extractMedidasLabels(
  fields: ApiFormField[],
  fieldIds: { altura: string; ancho: string; longitud: string },
  fallback: MedidasLabels,
): MedidasLabels {
  const labelOf = (fieldId: string, defaultLabel: string) =>
    fields.find((f) => f.field_id === fieldId)?.label ?? defaultLabel;
  return {
    altura: labelOf(fieldIds.altura, fallback.altura),
    ancho: labelOf(fieldIds.ancho, fallback.ancho),
    longitud: labelOf(fieldIds.longitud, fallback.longitud),
  };
}

function extractSelloClasificaciones(
  fields: ApiFormField[],
  fieldId: string,
  fallback: SelloClasificacionOption[],
): SelloClasificacionOption[] {
  const options = fields.find((f) => f.field_id === fieldId)?.options;
  if (!options?.length) return fallback;
  return options.map((o) => ({
    value: o.value,
    label: o.label,
    sigla: o.label.charAt(0).toUpperCase(),
  }));
}

function extractSelloVvttPuntos(
  fields: ApiFormField[],
  fieldId: string,
  fallback: SelloVvttPunto[],
): SelloVvttPunto[] {
  const options = fields.find((f) => f.field_id === fieldId)?.options;
  if (!options?.length) return fallback;
  return options.map((o) => {
    const [label, ...rest] = o.label.split(":");
    const trimmedLabel = label.trim();
    return {
      key: o.value,
      label: trimmedLabel,
      descripcion: rest.join(":").trim(),
      sigla: trimmedLabel.charAt(0).toUpperCase(),
    };
  });
}

function extractSelloEvidenciaLabels(
  fields: ApiFormField[],
  fieldIdsByKey: Record<string, string>,
  fallback: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, fieldId] of Object.entries(fieldIdsByKey)) {
    const label = fields.find((f) => f.field_id === fieldId)?.label;
    // El front ya antepone "N. " al pintar el slot — se quita el que trae la API.
    result[key] = label ? label.replace(/^\d+\.\s*/, "") : fallback[key];
  }
  return result;
}

const FALLBACK_MEDIDAS_LABELS: MedidasLabels = {
  altura: "Altura Interior",
  ancho: "Ancho Interior",
  longitud: "Longitud Interior",
};

const FALLBACK_SELLO_CLASIFICACIONES: SelloClasificacionOption[] = [
  { value: "indicative", sigla: "I", label: "Indicative" },
  { value: "security", sigla: "S", label: "Security" },
  { value: "high_security", sigla: "H", label: "High Security" },
];

const FALLBACK_SELLO_VVTT_PUNTOS: SelloVvttPunto[] = [
  { key: "view", sigla: "V", label: "View", descripcion: "Verificar visualmente el sello" },
  { key: "verify", sigla: "V", label: "Verify", descripcion: "Confirmar que el número coincide con documentos y sistemas" },
  { key: "tug", sigla: "T", label: "Tug", descripcion: "Jalar el sello para confirmar que está asegurado" },
  { key: "twist", sigla: "T", label: "Twist", descripcion: "Girar para detectar manipulación" },
];

const FALLBACK_SELLO_EVIDENCIA_LABELS: Record<string, string> = {
  foto_sello: "Foto del sello",
  sello_puertas: "Sello colocado en las puertas",
  puertas_completas: "Puertas completas del remolque",
  placas_economico: "Placas o económico",
  identificacion_operador: "Identificación del operador",
};

export function useInspeccionPuntosTransportista(ubicacion?: string | null) {
  const { data, isLoading, error } = useQuery<InspeccionPuntos>({
    queryKey: ["inspeccionPuntosTransportista", ubicacion ?? null],
    queryFn: async () => {
      let tractorFormId = TRACTOR_FORM_ID;
      let contenedorFormId = CONTENEDOR_FORM_ID;
      let selloFormId = SELLO_FORM_ID;

      if (ubicacion) {
        try {
          const formasRes = await getFormasInspeccionTransportista(ubicacion);
          const formasRaw = ((formasRes as Record<string, unknown>)?.response as Record<string, unknown>)?.data
            ?? (formasRes as Record<string, unknown>)?.data;
          const formas = formasRaw as { tractor?: string; contenedor?: string; sello?: string } | undefined;
          tractorFormId = formas?.tractor || TRACTOR_FORM_ID;
          contenedorFormId = formas?.contenedor || CONTENEDOR_FORM_ID;
          selloFormId = formas?.sello || SELLO_FORM_ID;
        } catch {
          // Si falla la resolución por ubicación, se sigue con los form_id
          // hardcodeados de la cuenta 10 — mismo fail-open que el backend.
        }
      }

      const res = await getFormFieldsTransportista([
        tractorFormId,
        contenedorFormId,
        selloFormId,
      ]);
      const raw = ((res as Record<string, unknown>)?.response as Record<string, unknown>)?.data
        ?? (res as Record<string, unknown>)?.data;
      const forms = (raw as ApiFormFieldsResult[]) ?? [];
      const byId = new Map(forms.map((f) => [f.form_id, f]));
      const fieldsOf = (formId: string) =>
        byId.get(formId)?.pages.flatMap((p) => p.fields) ?? [];

      return {
        puntosTractor: extractPuntos(fieldsOf(tractorFormId)),
        filasContenedor: extractFilas(fieldsOf(contenedorFormId)),
        medidasLabelsContenedor: extractMedidasLabels(
          fieldsOf(contenedorFormId),
          CONTENEDOR_MEDIDA_FIELD_IDS,
          FALLBACK_MEDIDAS_LABELS,
        ),
        selloClasificaciones: extractSelloClasificaciones(
          fieldsOf(selloFormId),
          SELLO_ISO_FIELD_ID,
          FALLBACK_SELLO_CLASIFICACIONES,
        ),
        selloVvttPuntos: extractSelloVvttPuntos(
          fieldsOf(selloFormId),
          SELLO_VVTT_FIELD_ID,
          FALLBACK_SELLO_VVTT_PUNTOS,
        ),
        selloEvidenciaLabels: extractSelloEvidenciaLabels(
          fieldsOf(selloFormId),
          SELLO_EVIDENCIA_FIELD_IDS,
          FALLBACK_SELLO_EVIDENCIA_LABELS,
        ),
        tractorFormId,
        contenedorFormId,
        tractorComentarioFieldId: extractPrimerCampoDeTipo(fieldsOf(tractorFormId), ["text", "textarea"]),
        tractorEvidenciaFieldId: extractPrimerCampoDeTipo(fieldsOf(tractorFormId), ["images"]),
        // Se excluyen los 3 field_id de medidas — también son field_type "text"
        // y no deben confundirse con un campo de comentario general.
        contenedorComentarioFieldId: extractPrimerCampoDeTipo(
          fieldsOf(contenedorFormId).filter((f) => !Object.values(CONTENEDOR_MEDIDA_FIELD_IDS).includes(f.field_id)),
          ["text", "textarea"],
        ),
        contenedorEvidenciaFieldId: extractPrimerCampoDeTipo(fieldsOf(contenedorFormId), ["images"]),
      };
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  return { data, isLoading, error };
}
