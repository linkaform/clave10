import { useQuery } from "@tanstack/react-query";
import { getInspeccionRecord } from "@/services/endpoints";

export interface EvidenciaFile {
  file_name: string;
  file_url: string;
}

export type FieldValue =
  | { kind: "bool"; value: boolean; comment?: string; evidencia?: EvidenciaFile[] }
  | { kind: "array"; items: string[]; comment?: string; evidencia?: EvidenciaFile[] }
  | { kind: "photos"; files: EvidenciaFile[] }
  | { kind: "text"; value: string };

export interface InspeccionField {
  key: string;
  label: string;
  value: FieldValue;
}

export interface InspeccionSection {
  titulo: string;
  campos: InspeccionField[];
}

export interface InspeccionRecord {
  folio: string | null;
  createdAt: string | null;
  tipo: string;
  secciones: InspeccionSection[];
}

// ─── Meta fields to skip ───────────────────────────────────────────────────────
const META_KEYS = new Set(["_id", "created_at", "folio"]);

// ─── Labels legibles para campos específicos ───────────────────────────────────
export const FIELD_LABELS: Record<string, string> = {
  "1_foto_del_sello":                         "Foto del sello",
  "2_sello_colocado_en_las_puertas":          "Sello colocado en las puertas",
  "3_puertas_completas_del_remolque":         "Puertas completas del remolque",
  "4_placas_o_economico":                     "Placas / No. económico",
  "5_identificacion_del_operador":            "Identificación del operador",
  "matriz_vttt_marca_cada_accion_verificada": "Matriz VVTT",
  "numero_de_sello_esperado_revisado":        "No. de sello esperado",
  "numero_de_sello_fisico":                   "No. de sello físico",
  "tipo_de_sello_clasificacion_iso_17712":    "Tipo de sello (ISO 17712)",
  "comentarios":                              "Comentarios",
};

// ─── Medidas compartidas ───────────────────────────────────────────────────────
const MEDIDAS_KEYS = ["altura_interior", "longitud_interior", "ancho_interior"];

// ─── Agrupación de campos por tipo ────────────────────────────────────────────
const TRACTOR_SECTIONS: { titulo: string; keys: string[] }[] = [
  {
    titulo: "Exterior",
    keys: [
      "pared_frontal_externa",
      "paredes_externa",
      "techo_externo",
      "piso_externo_trailer_contenedor_caja",
      "puertas_externa",
      "defensa",
      "llantas_y_rines_tractor_y_remolque",
    ],
  },
  {
    titulo: "Mecánico",
    keys: [
      "motor_caja_de_la_bateria_caja_y_filtros_de_aire",
      "ejes_de_transmision",
      "quinta_rueda",
      "tanque_de_combustible",
      "tanque_de_aire",
      "escape_mofles",
      "unidad_de_refrigeracion",
      "chasis",
    ],
  },
  {
    titulo: "Cabina",
    keys: [
      "cabina_dormitorio_puertas_y_compartimientos_de_herramientas_seccion_de_pasajero_y_techo",
      "piso_tractor",
    ],
  },
];

const REMOLQUE_SECTIONS: { titulo: string; keys: string[] }[] = [
  {
    titulo: "Exterior",
    keys: [
      "pared_frontal_externa",
      "paredes_externa",
      "techo_externo",
      "piso_externo_trailer_contenedor_caja",
      "puertas_externa",
    ],
  },
  {
    titulo: "Mecánico",
    keys: [
      "ejes_de_transmision",
      "quinta_rueda",
      "tanque_de_aire",
      "escape_mofles",
      "unidad_de_refrigeracion",
      "chasis",
    ],
  },
  {
    titulo: "Medidas interiores",
    keys: MEDIDAS_KEYS,
  },
];

const SELLO_SECTIONS: { titulo: string; keys: string[] }[] = [
  {
    titulo: "Datos del sello",
    keys: [
      "tipo_de_sello_clasificacion_iso_17712",
      "numero_de_sello_esperado_revisado",
      "numero_de_sello_fisico",
      "matriz_vttt_marca_cada_accion_verificada",
      "comentarios",
    ],
  },
  {
    titulo: "Evidencia fotográfica",
    keys: [
      "1_foto_del_sello",
      "2_sello_colocado_en_las_puertas",
      "3_puertas_completas_del_remolque",
      "4_placas_o_economico",
      "5_identificacion_del_operador",
    ],
  },
];

const CONTENEDOR_SECTIONS: { titulo: string; keys: string[] }[] = [
  {
    titulo: "Interior",
    keys: [
      "pared_interior_frontal",
      "pared_interior_lado_izquierdo",
      "pared_interior_lado_derecho",
      "techo_cubierta_superior",
      "piso_interior",
      "puertas_interiores_exteriores",
      "exterior_parte_inferior_del_contenedor_bastidor_o_chasis",
    ],
  },
  {
    titulo: "Medidas interiores",
    keys: MEDIDAS_KEYS,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isPhotoArray(raw: unknown): raw is EvidenciaFile[] {
  return Array.isArray(raw) && raw.length > 0 &&
    typeof raw[0] === "object" && raw[0] !== null && "file_url" in raw[0];
}

function parseValue(raw: unknown): FieldValue {
  if (isPhotoArray(raw)) return { kind: "photos", files: raw };
  if (Array.isArray(raw)) return { kind: "array", items: raw.map(String) };
  const s = String(raw ?? "").toLowerCase().trim();
  if (s === "sí" || s === "si" || s === "yes" || s === "true")
    return { kind: "bool", value: true };
  if (s === "no" || s === "false")
    return { kind: "bool", value: false };
  return { kind: "text", value: String(raw ?? "") };
}

function getComment(data: Record<string, unknown>, key: string): string | undefined {
  const v = data[`${key}_comentarios`];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function getEvidencia(data: Record<string, unknown>, key: string): EvidenciaFile[] | undefined {
  const v = data[`${key}_evidencia`];
  if (!Array.isArray(v) || v.length === 0) return undefined;
  return (v as EvidenciaFile[]).filter((f) => f?.file_url);
}

function buildSections(
  data: Record<string, unknown>,
  groups: { titulo: string; keys: string[] }[],
): InspeccionSection[] {
  const used = new Set<string>();
  const sections: InspeccionSection[] = [];

  // Mark all _comentarios / _evidencia keys as used upfront so they never land in "Otros"
  for (const key of Object.keys(data)) {
    if (key.endsWith("_comentarios") || key.endsWith("_evidencia")) used.add(key);
  }

  for (const g of groups) {
    const campos: InspeccionField[] = [];
    for (const key of g.keys) {
      if (key in data) {
        const base = parseValue(data[key]);
        const comment = getComment(data, key);
        const evidencia = getEvidencia(data, key);
        const value: FieldValue =
          base.kind === "bool"
            ? { ...base, comment, evidencia }
            : base.kind === "array"
            ? { ...base, comment, evidencia }
            : base;
        campos.push({ key, label: FIELD_LABELS[key] ?? humanize(key), value });
        used.add(key);
      }
    }
    if (campos.length) sections.push({ titulo: g.titulo, campos });
  }

  // Campos restantes no agrupados ni meta
  const extras: InspeccionField[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (!META_KEYS.has(key) && !used.has(key)) {
      const base = parseValue(val);
      const comment = getComment(data, key);
      const evidencia = getEvidencia(data, key);
      const value: FieldValue =
        base.kind === "bool"
          ? { ...base, comment, evidencia }
          : base.kind === "array"
          ? { ...base, comment, evidencia }
          : base;
      extras.push({ key, label: FIELD_LABELS[key] ?? humanize(key), value });
    }
  }
  if (extras.length) sections.push({ titulo: "Otros", campos: extras });

  return sections;
}

function normalizeBaseType(tipo: string): string {
  return tipo
    .replace(/^salida_/, "")  // quita prefijo salida_
    .replace(/_\d+$/, "");    // quita sufijo _1, _2, etc.
}

function mapRaw(data: Record<string, unknown>, tipo: string): InspeccionRecord {
  const baseType = normalizeBaseType(tipo);
  let groups: { titulo: string; keys: string[] }[] = [];

  if (baseType === "tractor") groups = TRACTOR_SECTIONS;
  else if (baseType === "remolque") groups = REMOLQUE_SECTIONS;
  else if (baseType === "contenedor") groups = CONTENEDOR_SECTIONS;
  else if (baseType === "sello") groups = SELLO_SECTIONS;

  return {
    folio: (data.folio as string | null) ?? null,
    createdAt: (data.created_at as string | null) ?? null,
    tipo,
    secciones: buildSections(data, groups),
  };
}

function extractId(url: string): string {
  return url.split("/").filter(Boolean).pop() ?? url;
}

export const useGetInspeccionRecord = (url: string | undefined, tipo: string) => {
  const recordId = url ? extractId(url) : "";

  const { data, isLoading, error } = useQuery<InspeccionRecord | null>({
    queryKey: ["inspeccionRecord", recordId, tipo],
    queryFn: async () => {
      const res = await getInspeccionRecord(recordId, tipo);
      const raw = ((res as Record<string, unknown>)?.response as Record<string, unknown>)?.data
        ?? (res as Record<string, unknown>)?.data;
      if (!raw) return null;
      return mapRaw(raw as Record<string, unknown>, tipo);
    },
    enabled: !!recordId && !!tipo,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  return { data: data ?? null, isLoading, error };
};
