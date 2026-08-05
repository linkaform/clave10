"use client";

import { useQuery } from "@tanstack/react-query";
import { getFormFieldsTransportista } from "@/services/endpoints";

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

interface InspeccionPuntos {
  puntosTractor: string[];
  filasContenedor: string[];
  medidasLabelsContenedor: MedidasLabels;
  selloClasificaciones: SelloClasificacionOption[];
  selloVvttPuntos: SelloVvttPunto[];
  selloEvidenciaLabels: Record<string, string>;
}

function extractPuntos(fields: ApiFormField[]): string[] {
  return fields
    .filter((f) => f.field_type === "radio")
    .map((f) => f.label.replace(/^\d+\.\s*/, ""));
}

function extractFilas(fields: ApiFormField[]): string[] {
  return fields.filter((f) => f.field_type === "checkbox").map((f) => f.label);
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

export function useInspeccionPuntosTransportista() {
  const { data, isLoading, error } = useQuery<InspeccionPuntos>({
    queryKey: ["inspeccionPuntosTransportista"],
    queryFn: async () => {
      const res = await getFormFieldsTransportista([
        TRACTOR_FORM_ID,
        CONTENEDOR_FORM_ID,
        SELLO_FORM_ID,
      ]);
      const raw = ((res as Record<string, unknown>)?.response as Record<string, unknown>)?.data
        ?? (res as Record<string, unknown>)?.data;
      const forms = (raw as ApiFormFieldsResult[]) ?? [];
      const byId = new Map(forms.map((f) => [f.form_id, f]));
      const fieldsOf = (formId: string) =>
        byId.get(formId)?.pages.flatMap((p) => p.fields) ?? [];

      return {
        puntosTractor: extractPuntos(fieldsOf(TRACTOR_FORM_ID)),
        filasContenedor: extractFilas(fieldsOf(CONTENEDOR_FORM_ID)),
        medidasLabelsContenedor: extractMedidasLabels(
          fieldsOf(CONTENEDOR_FORM_ID),
          CONTENEDOR_MEDIDA_FIELD_IDS,
          FALLBACK_MEDIDAS_LABELS,
        ),
        selloClasificaciones: extractSelloClasificaciones(
          fieldsOf(SELLO_FORM_ID),
          SELLO_ISO_FIELD_ID,
          FALLBACK_SELLO_CLASIFICACIONES,
        ),
        selloVvttPuntos: extractSelloVvttPuntos(
          fieldsOf(SELLO_FORM_ID),
          SELLO_VVTT_FIELD_ID,
          FALLBACK_SELLO_VVTT_PUNTOS,
        ),
        selloEvidenciaLabels: extractSelloEvidenciaLabels(
          fieldsOf(SELLO_FORM_ID),
          SELLO_EVIDENCIA_FIELD_IDS,
          FALLBACK_SELLO_EVIDENCIA_LABELS,
        ),
      };
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  return { data, isLoading, error };
}
