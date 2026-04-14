export function mapRondinGrid(raw: any, base: any) {
  const estatus = raw?.estatus_rondin?.toLowerCase() || "";

  // status controla el badge verde/rojo de la card
  // corriendo → entrada (verde), pausado → "pausado" como custom, resto → salida (rojo)
const status = estatus === "corriendo"
  ? "corriendo"
  : estatus === "pausado"
  ? "pausado"
  : estatus === "cancelado"
  ? "cancelado"
  : "cerrado";

  const visit_type = raw?.tipo_rondin?.toUpperCase() || "QR";

  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type,
    title: raw?.nombre_del_rondin || "Rondín sin nombre",
    description: raw?.ubicacion || "Sin ubicación",
    images: raw?.images_data?.[0]?.foto_area
      ? [raw.images_data[0].foto_area]
      : ["/blur2.jpg"],
    status,
    estatus_rondin: raw?.estatus_rondin,
    tipo_rondin: raw?.tipo_rondin,
    ubicacion: raw?.ubicacion,
    recurrencia: raw?.recurrencia,
    detailsList: [
      { icon: null, label: "RECURRENCIA", value: raw?.recurrencia ? `Recurrencia: ${raw.recurrencia}` : "---" },
      { icon: null, label: "DURACIÓN", value: raw?.duracion_esperada_rondin ? `Duración: ${raw.duracion_esperada_rondin}` : "---" },
      { icon: null, label: "CHECKPOINTS", value: `Checkpoints: ${raw?.cantidad_de_puntos ?? 0} puntos` },
      { icon: null, label: "INICIO", value: raw?.fecha_inicio_rondin ? `Inicio: ${raw.fecha_inicio_rondin}` : "---" },
      {
        icon: null,
        label: "ÁREAS",
        value: Array.isArray(raw?.areas)
          ? raw.areas.map((a: any) => (typeof a === "string" ? a : a?.rondin_area)).join(", ")
          : "---",
      },
    ],
    modalDetailsList: [
      { icon: null, label: "Folio", value: raw?.folio },
      { icon: null, label: "Ubicación", value: raw?.ubicacion },
      { icon: null, label: "Estatus", value: raw?.estatus_rondin },
      { icon: null, label: "Tipo", value: raw?.tipo_rondin?.toUpperCase() || "QR" },
      { icon: null, label: "Recurrencia", value: raw?.recurrencia },
      { icon: null, label: "Duración esperada", value: raw?.duracion_esperada_rondin },
      { icon: null, label: "Checkpoints", value: `${raw?.cantidad_de_puntos ?? 0}` },
      { icon: null, label: "Inicio", value: raw?.fecha_inicio_rondin },
      { icon: null, label: "Asignado a", value: raw?.asignado_a || "Sin asignar" },
      {
        icon: null,
        label: "Áreas",
        value: Array.isArray(raw?.areas)
          ? raw.areas.map((a: any) => (typeof a === "string" ? a : a?.rondin_area))
          : [],
      },
    ],
    rawData: raw,
    vehiculos: [],
    equipos: [],
  };
}