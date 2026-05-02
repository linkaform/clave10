// rondin.bitacora.list.mapper.ts
export function mapRondinBitacoraList(raw: any, base: any) {
    const estatus = raw?.estatus_recorrido?.toLowerCase() || "";
  
    const statusStyles: Record<string, string> = {
      realizado: "bg-green-100 text-green-600 hover:bg-green-100",
      en_proceso: "bg-blue-100 text-blue-600 hover:bg-blue-100",
      programado: "bg-purple-100 text-purple-600 hover:bg-purple-100",
      cancelado: "bg-red-100 text-red-600 hover:bg-red-100",
    };
  
    const status = estatus === "realizado" ? "abierto"
      : estatus === "en_proceso" ? "corriendo"
      : estatus === "cancelado" ? "cancelado"
      : "cerrado";
  
    const areas = Array.isArray(raw?.areas) ? raw.areas : [];
    const incidencias = Array.isArray(raw?.incidencias) ? raw.incidencias : [];
    const tieneIncidencias = incidencias.length > 0;
  
    // Fotos de las áreas
    const fotos = areas
      .flatMap((a: any) => a?.detalle?.fotos ?? [])
      .map((f: any) => f?.file_url)
      .filter(Boolean);
  
    const images = fotos.length > 0 ? fotos : ["/mountain.svg"];
  
    const areaNames = areas.map((a: any) => a?.area).filter(Boolean);
  
    // const areasConCheck = areas.filter((a: any) => a?.detalle?.hora_de_check);
  
    return {
      ...base,
      id: raw?.id || raw?._id || "no-id",
      folio: raw?.folio || "S/F",
      visit_type: raw?.tipo_rondin?.toUpperCase() || "",
      title: raw?.nombre_recorrido || "Rondín sin nombre",
      description: raw?.ubicacion || "Sin ubicación",
      images,
      status,
  
      badgesList: [
        {
          customClass: "bg-blue-50 hover:bg-blue-50 px-4 py-1 text-xs font-bold text-blue-600 rounded-xl border border-blue-100 shadow-none",
          label: raw?.folio || "S/F",
        },
        {
          customClass: `px-4 py-1 text-xs font-semibold rounded-xl whitespace-nowrap capitalize ${statusStyles[estatus] ?? "bg-gray-100 text-gray-600 hover:bg-gray-100"}`,
          label: raw?.estatus_recorrido?.replace(/_/g, " ") || "Sin estatus",
        },
        ...(tieneIncidencias ? [{
          customClass: "bg-red-100 hover:bg-red-100 px-4 py-1 text-xs font-medium text-red-600 rounded-xl border-0 shadow-none",
          label: `${incidencias.length} incidencia${incidencias.length > 1 ? "s" : ""}`,
        }] : [{
          customClass: "bg-green-100 hover:bg-green-100 px-4 py-1 text-xs font-medium text-green-600 rounded-xl border-0 shadow-none",
          label: "Sin incidencias",
        }]),
      ],
      detailsList: [
        { icon: null, label: "UBICACIÓN", value: raw?.ubicacion || "-" },
        { icon: null, label: "REALIZADO POR", value: raw?.asignado_a || "Guardia en turno" },
        { icon: null, label: "INICIO", value: raw?.fecha_hora_inicio || "-" },
        { icon: null, label: "FINALIZACIÓN", value: raw?.fecha_hora_fin || raw?.updated_at || "-" },
        { icon: null, label: "DURACIÓN", value: raw?.duracion_rondin ? `${raw.duracion_rondin} min` : "-" },
        { icon: null, label: "ÁREAS INSPECCIONADAS", value: raw?.cantidad_areas_inspeccionadas ? `${raw.cantidad_areas_inspeccionadas}` : "0" },
        { icon: null, label: "ÁREAS", value: areaNames },
      ],
  
      modalDetailsList: [
        { icon: null, label: "Folio", value: raw?.folio },
        { icon: null, label: "Ubicación", value: raw?.ubicacion },
        { icon: null, label: "Estatus", value: raw?.estatus_recorrido?.replace(/_/g, " ") },
        { icon: null, label: "Fecha programada", value: raw?.fecha_hora_programada_inicio },
        { icon: null, label: "Fecha inicio", value: raw?.fecha_hora_inicio },
        { icon: null, label: "Duración", value: raw?.duracion_rondin ? `${raw.duracion_rondin} min` : "-" },
        { icon: null, label: "Áreas inspeccionadas", value: raw?.cantidad_areas_inspeccionadas ? `${raw.cantidad_areas_inspeccionadas}` : "0" },
        { icon: null, label: "% Avance", value: raw?.porcentaje_avance ? `${raw.porcentaje_avance}` : "0%" },
        { icon: null, label: "Tipo", value: raw?.tipo_rondin?.toUpperCase() || "-" },
        { icon: null, label: "Asignado a", value: raw?.asignado_a || "Sin asignar" },
        { icon: null, label: "Áreas", value: areaNames },
      ],
  
      rawData: raw,
      vehiculos: [],
      equipos: [],
      areas: raw?.areas,
      incidencias: raw?.incidencias,
    };
  }