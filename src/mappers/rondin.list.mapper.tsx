export function mapRondinList(raw: any, base: any) {
  const estatus = raw?.estatus_rondin?.toLowerCase() || "";
  
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
    images: Array.isArray(raw?.images_data) && raw.images_data.length > 0
    ? raw.images_data
        .map((img: any) => img?.foto_area)
        .filter(Boolean)
    : ["/mountain.svg","/mountain.svg","/mountain.svg","/mountain.svg","/mountain.svg","/mountain.svg"],
    status,
    estatus_rondin: raw?.estatus_rondin,
    tipo_rondin: raw?.tipo_rondin,
    ubicacion: raw?.ubicacion,
    recurrencia: raw?.recurrencia,
    badgesList: [
      {
        customClass: `px-4 py-1 text-xs font-semibold rounded-xl whitespace-nowrap ${
          estatus === "corriendo"
            ? "bg-green-100 text-green-600 hover:bg-green-100"
            : estatus === "pausado"
            ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-100"
            : estatus === "cancelado"
            ? "bg-red-100 text-red-600 hover:bg-red-100"
            : "bg-gray-100 text-gray-600 hover:bg-gray-100"
        }`,
        label: raw?.estatus_rondin || "Sin estatus",
      },
      {
        customClass:
          "bg-purple-100 hover:bg-purple-100 px-4 py-1 text-xs font-medium text-purple-600 rounded-xl border-0 shadow-none",
        label: raw?.tipo_rondin?.toUpperCase() || "QR",
      },
      {
        customClass:
          "bg-indigo-100 hover:bg-indigo-100 px-4 py-1 text-xs font-medium text-indigo-600 rounded-xl border-0 shadow-none",
        label: raw?.folio || "",
      },
    ],
    detailsList: [
      { icon: null, label: "UBICACIÓN", value: raw?.ubicacion || "Sin ubicación" },
      { icon: null, label: "RECURRENCIA", value: raw?.recurrencia || "---" },
      { icon: null, label: "DURACIÓN ESPERADA", value: raw?.duracion_esperada_rondin || "---" },
      { icon: null, label: "FECHA INICIO", value: raw?.fecha_inicio_rondin || "---" },
      { icon: null, label: "FECHA FIN", value: raw?.fecha_final_rondin || "---" },
      { icon: null, label: "CHECKPOINTS", value: `${raw?.cantidad_de_puntos ?? 0} puntos` },
      { icon: null, label: "ASIGNADO A", value: raw?.asignado_a || "Sin asignar" },
      {
        icon: null,
        label: "ÁREAS",
        value: Array.isArray(raw?.areas)
          ? raw.areas.map((a: any) => (typeof a === "string" ? a : a?.rondin_area))
          : [],
      },
    ],
    modalDetailsList: [
      { icon: null, label: "Folio", value: raw?.folio },
      { icon: null, label: "Ubicación", value: raw?.ubicacion },
      { icon: null, label: "Estatus", value: raw?.estatus_rondin },
      { icon: null, label: "Tipo", value: raw?.tipo_rondin?.toUpperCase() || "QR" },
      { icon: null, label: "Recurrencia", value: raw?.recurrencia },
      { icon: null, label: "Duración esperada", value: raw?.duracion_esperada_rondin },
      { icon: null, label: "Fecha de Inicio", value: raw?.fecha_inicio_rondin },
      { icon: null, label: "Fecha Fin", value: raw?.fecha_final_rondin },
      { icon: null, label: "Checkpoints", value: `${raw?.cantidad_de_puntos ?? 0}` },
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
    map_data:raw.map_data,
    areas: raw.areas
  };
}