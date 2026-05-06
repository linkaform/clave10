export function mapRondinIncidenciaGrid(raw: any, base: any) {
    const images = Array.isArray(raw?.evidencias) && raw.evidencias.length > 0
      ? raw.evidencias.map((e: any) => e.file_url).filter(Boolean)
      : ["/blur2.jpg"];
  
    const incidenciaNombre = raw?.incidente || "Sin incidencia";
  
    return {
      ...base,
      id: raw?._id || raw?.id || "no-id",
      folio: raw?.folio || "S/F",
      visit_type: raw?.categoria || "",
      title: incidenciaNombre,
      description: raw?.ubicacion_incidente || "Sin ubicación",
      images,
      status: "abierto",
      detailsList: [
        { icon: null, label: "RECORRIDO", value: raw?.nombre_del_recorrido || "---" },
        { icon: null, label: "ÁREA", value: raw?.area_incidente || "---" },
        { icon: null, label: "CATEGORÍA", value: raw?.categoria || "---" },
        { icon: null, label: "SUB-CATEGORÍA", value: raw?.subcategoria || "---" },
        { icon: null, label: "FECHA", value: raw?.fecha_hora_incidente || "---" },
        { icon: null, label: "COMENTARIOS", value: raw?.comentarios || "---" },
        { icon: null, label: "ACCIÓN", value: raw?.accion_tomada || "---" },
      ],
      modalDetailsList: [
        { icon: null, label: "Folio", value: raw?.folio },
        { icon: null, label: "Recorrido", value: raw?.nombre_del_recorrido },
        { icon: null, label: "Ubicación", value: raw?.ubicacion_incidente },
        { icon: null, label: "Área", value: raw?.area_incidente },
        { icon: null, label: "Categoría", value: raw?.categoria },
        { icon: null, label: "Sub-categoría", value: raw?.subcategoria },
        { icon: null, label: "Incidencia", value: incidenciaNombre },
        { icon: null, label: "Comentarios", value: raw?.comentarios },
        { icon: null, label: "Acción tomada", value: raw?.accion_tomada },
        { icon: null, label: "Fecha", value: raw?.fecha_hora_incidente },
      ],
      rawData: raw,
      vehiculos: [],
      equipos: [],
    };
  }