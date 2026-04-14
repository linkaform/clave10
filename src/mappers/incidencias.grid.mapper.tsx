export function mapIncidenciaGrid(raw: any, base: any) {
    const estatus = raw?.estatus?.toLowerCase() || "";
  
    const status = estatus === "abierto" ? "abierto" : "cerrado";
  
    // Badge púrpura: prioridad de la incidencia
    const visit_type = raw?.prioridad_incidencia || "";
  
    // Imágenes de evidencia
    const images = Array.isArray(raw?.evidencia_incidencia) && raw.evidencia_incidencia.length > 0
      ? raw.evidencia_incidencia.map((e: any) => e.file_url).filter(Boolean)
      : ["/blur2.jpg"];
  
    const incidenciaNombre = raw?.incidencia || raw?.tipo_incidencia || raw?.incidente || "Sin incidencia";
  
    return {
      ...base,
      id: raw?._id || "no-id",
      folio: raw?.folio || "S/F",
      visit_type,
      title: incidenciaNombre,
      description: raw?.ubicacion_incidencia || "Sin ubicación",
      images,
      status,
      estatus: raw?.estatus,
      prioridad_incidencia: raw?.prioridad_incidencia,
      ubicacion_incidencia: raw?.ubicacion_incidencia,
      categoria: raw?.categoria,
      detailsList: [
        { icon: null, label: "ÁREA", value: raw?.area_incidencia ? `Área: ${raw.area_incidencia}` : "---" },
        { icon: null, label: "CATEGORÍA", value: raw?.categoria ? `${raw.categoria}` : "---" },
        { icon: null, label: "SUB-CATEGORÍA", value: raw?.sub_categoria ? `${raw.sub_categoria}` : "---" },
        { icon: null, label: "FECHA", value: raw?.fecha_hora_incidencia ? `${raw.fecha_hora_incidencia}` : "---" },
        { icon: null, label: "REPORTA", value: raw?.reporta_incidencia && raw.reporta_incidencia !== false ? `${raw.reporta_incidencia}` : "---" },
      ],
      modalDetailsList: [
        { icon: null, label: "Folio", value: raw?.folio },
        { icon: null, label: "Estatus", value: raw?.estatus },
        { icon: null, label: "Prioridad", value: raw?.prioridad_incidencia },
        { icon: null, label: "Ubicación", value: raw?.ubicacion_incidencia },
        { icon: null, label: "Área", value: raw?.area_incidencia },
        { icon: null, label: "Categoría", value: raw?.categoria },
        { icon: null, label: "Sub-categoría", value: raw?.sub_categoria },
        { icon: null, label: "Incidencia", value: incidenciaNombre },
        { icon: null, label: "Descripción", value: raw?.comentario_incidencia },
        { icon: null, label: "Fecha", value: raw?.fecha_hora_incidencia },
        { icon: null, label: "Reporta", value: raw?.reporta_incidencia && raw.reporta_incidencia !== false ? raw.reporta_incidencia : "Sin asignar" },
        { icon: null, label: "Notificación", value: raw?.notificacion_incidencia },
        {
          icon: null,
          label: "Tags",
          value: Array.isArray(raw?.tags) && raw.tags.length > 0 ? raw.tags : [],
        },
      ],
      rawData: raw,
      vehiculos: [],
      equipos: [],
    };
  }