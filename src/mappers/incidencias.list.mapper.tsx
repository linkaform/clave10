export function mapIncidenciaList(raw: any, base: any) {
    const estatus = raw?.estatus?.toLowerCase() || "";
  
    const status = estatus === "abierto" ? "abierto" : "cerrado";
  
    const visit_type = raw?.prioridad_incidencia || "";
  
    const images = Array.isArray(raw?.evidencia_incidencia) && raw.evidencia_incidencia.length > 0
      ? raw.evidencia_incidencia.map((e: any) => e.file_url).filter(Boolean)
      : ["/blur2.jpg"];
  
    const incidenciaNombre = raw?.incidencia || raw?.tipo_incidencia || raw?.incidente || "Sin incidencia";
  
    const estatusClass = estatus === "abierto"
      ? "bg-green-100 text-green-600 hover:bg-green-100"
      : estatus === "cerrado"
      ? "bg-red-100 text-red-600 hover:bg-red-100"
      : "bg-gray-100 text-gray-600 hover:bg-gray-100";
  
    const prioridadClass = raw?.prioridad_incidencia?.toLowerCase() === "critica"
      ? "bg-red-100 text-red-600 hover:bg-red-100"
      : raw?.prioridad_incidencia?.toLowerCase() === "moderada"
      ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-100"
      : "bg-blue-100 text-blue-600 hover:bg-blue-100";
  
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
      badgesList: [
        {
          customClass: `px-4 py-1 text-xs font-semibold rounded-xl whitespace-nowrap ${estatusClass}`,
          label: raw?.estatus || "Sin estatus",
        },
        {
          customClass: `px-4 py-1 text-xs font-medium rounded-xl border-0 shadow-none whitespace-nowrap ${prioridadClass}`,
          label: raw?.prioridad_incidencia || "Sin prioridad",
        },
        {
          customClass: "bg-indigo-100 hover:bg-indigo-100 px-4 py-1 text-xs font-medium text-indigo-600 rounded-xl border-0 shadow-none",
          label: raw?.folio || "",
        },
      ],
      detailsList: [
        { icon: null, label: "ÁREA", value: raw?.area_incidencia || "---" },
        { icon: null, label: "CATEGORÍA", value: raw?.categoria || "---" },
        { icon: null, label: "SUB-CATEGORÍA", value: raw?.sub_categoria || "---" },
        { icon: null, label: "FECHA", value: raw?.fecha_hora_incidencia || "---" },
        { icon: null, label: "REPORTA", value: raw?.reporta_incidencia && raw.reporta_incidencia !== false ? String(raw.reporta_incidencia) : "---" },
        {
          icon: null,
          label: "TAGS",
          value: Array.isArray(raw?.tags) && raw.tags.length > 0 ? raw.tags : [],
        },
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
        { icon: null, label: "Reporta", value: raw?.reporta_incidencia && raw.reporta_incidencia !== false ? String(raw.reporta_incidencia) : "Sin asignar" },
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