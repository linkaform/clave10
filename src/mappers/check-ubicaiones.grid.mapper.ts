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

  return {
    ...base,
    id: raw?.id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: tipoArea,
    title: rondinArea,
    description: raw?.comentario_check_area || "Sin comentario",
    images,
    status: tieneIncidencias ? "abierto" : "cerrado",
    detailsList: [
      { icon: null, label: "ÁREA", value: rondinArea },
      { icon: null, label: "TIPO", value: tipoArea },
      { icon: null, label: "UBICACIÓN", value: ubicacion },
      { icon: null, label: "FECHA", value: raw?.created_at || "---" },
      { icon: null, label: "ESTATUS", value: raw?.check_status?.replace(/_/g, " ") || "---" },
      { icon: null, label: "INCIDENCIAS", value: tieneIncidencias ? String(raw.grupo_incidencias_check.length) : "Sin incidencias" },
    ],
    modalDetailsList: [
      { icon: null, label: "Área", value: rondinArea },
      { icon: null, label: "Tipo", value: tipoArea },
      { icon: null, label: "Ubicación", value: ubicacion },
      { icon: null, label: "Fecha", value: raw?.created_at || "---" },
      { icon: null, label: "Estatus check", value: raw?.check_status?.replace(/_/g, " ") || "---" },
      { icon: null, label: "Comentario", value: raw?.comentario_check_area || "---" },
      { icon: null, label: "Incidencias", value: tieneIncidencias ? String(raw.grupo_incidencias_check.length) : "Sin incidencias" },
    ],
    rawData: raw,
    vehiculos: [],
    equipos: [],
    map_data: [],
  };
}