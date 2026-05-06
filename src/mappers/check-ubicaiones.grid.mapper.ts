export function mapCheckUbicacionGrid(raw: any, base: any) {
  const tieneIncidencias =
    Array.isArray(raw?.grupo_incidencias_check) &&
    raw.grupo_incidencias_check.length > 0;

  const fotoEvidencia = Array.isArray(raw?.foto_evidencia_area)
    ? raw.foto_evidencia_area
        .map((f: any) => f.file_url)
        .filter((url: string) => url?.startsWith("https://"))
    : [];

  const fotoArea = raw?.foto_area?.[0];
  const validFotosArea = Array.isArray(fotoArea)
    ? fotoArea
        .map((f: any) => f.file_url)
        .filter((url: string) => url?.startsWith("https://"))
    : [];

  const images =
    fotoEvidencia.length > 0
      ? fotoEvidencia
      : validFotosArea.length > 0
        ? validFotosArea
        : ["/mountain.svg"];

  const rondinArea = Array.isArray(raw?.rondin_area)
    ? raw.rondin_area.join(", ")
    : raw?.rondin_area || "---";

  const tipoArea = Array.isArray(raw?.tipo_de_area)
    ? raw.tipo_de_area.join(", ")
    : raw?.tipo_de_area || "---";

  const ubicacion = raw?.incidente_location?.[0] || "---";

  // Badge de incidencias — solo si tiene
  const incidenciasCount = tieneIncidencias
    ? raw.grupo_incidencias_check.length
    : null;

  return {
    ...base,
    id: raw?.id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: tipoArea,
    title: rondinArea,
    description: raw?.comentario_check_area || "Sin comentario",
    images,
    // status vacío — no queremos badge de estatus
    status: tieneIncidencias ? "con_incidencias" : "sin_incidencias",
    statusLabel: tieneIncidencias
      ? `${incidenciasCount} incidencia${incidenciasCount > 1 ? "s" : ""}`
      : "Sin incidencias",
    detailsList: [
      { icon: null, label: "ÁREA",           value: rondinArea },
      { icon: null, label: "RECORRIDO",      value: raw?.nombre_recorrido || "---" },
      { icon: null, label: "REALIZADO POR",  value: raw?.asignado_a || "---" },
      { icon: null, label: "UBICACIÓN",      value: ubicacion },
      { icon: null, label: "FECHA",          value: raw?.fecha_inspeccion_area || raw?.created_at || "---" },
    ],
    modalDetailsList: [
      { icon: null, label: "Área",           value: rondinArea },
      { icon: null, label: "Tipo",           value: tipoArea },
      { icon: null, label: "Recorrido",      value: raw?.nombre_recorrido || "---" },
      { icon: null, label: "Realizado por",  value: raw?.asignado_a || "---" },
      { icon: null, label: "Ubicación",      value: ubicacion },
      { icon: null, label: "Fecha",          value: raw?.fecha_inspeccion_area || raw?.created_at || "---" },
      { icon: null, label: "Estatus check",  value: raw?.check_status?.replace(/_/g, " ") || "---" },
      { icon: null, label: "Comentario",     value: raw?.comentario_check_area || "---" },
      {
        icon: null,
        label: "Incidencias",
        value: tieneIncidencias
          ? raw.grupo_incidencias_check.map((i: any) => i.incidente).join(", ")
          : "Sin incidencias",
      },
    ],
    rawData: raw,
    vehiculos: [],
    equipos: [],
    map_data: [],
  };
}