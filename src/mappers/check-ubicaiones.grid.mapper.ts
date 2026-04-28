export function mapCheckUbicacionGrid(raw: any, base: any) {
    const areas = Array.isArray(raw?.areas) ? raw.areas : [];
    const tieneIncidencias = Array.isArray(raw?.incidencias) && raw.incidencias.length > 0;
    const areasConCheck = areas.filter((a: any) => a?.detalle?.hora_de_check);
    const fotos = areas.flatMap((a: any) => a?.detalle?.fotos ?? []).map((f: any) => f.file_url).filter(Boolean);
    const images = fotos.length > 0 ? fotos : ["/mountain.svg"];
    const areaNames = areas.map((a: any) => a.area).filter(Boolean);
  
    return {
      ...base,
      id: raw?.id || "no-id",
      folio: raw?.id || "S/F",
      visit_type: raw?.ubicacion || "",
      title: raw?.nombre_recorrido || "Sin nombre",
      description: raw?.ubicacion || "Sin ubicación",
      images,
      status: tieneIncidencias ? "cerrado" : "abierto",
      detailsList: [
        { icon: null, label: "RECORRIDO", value: raw?.nombre_recorrido || "---" },
        { icon: null, label: "UBICACIÓN", value: raw?.ubicacion || "---" },
        { icon: null, label: "FECHA", value: raw?.created_at || "---" },
        { icon: null, label: "TOTAL CHECKS", value: String(raw?.total_checks ?? 0) },
        { icon: null, label: "CHECKS COMPLETADOS", value: String(areasConCheck.length) },
        { icon: null, label: "ÁREAS", value: areaNames },
      ],
      modalDetailsList: [
        { icon: null, label: "Recorrido", value: raw?.nombre_recorrido },
        { icon: null, label: "Ubicación", value: raw?.ubicacion },
        { icon: null, label: "Fecha", value: raw?.created_at },
        { icon: null, label: "Total checks", value: String(raw?.total_checks ?? 0) },
        { icon: null, label: "Checks completados", value: String(areasConCheck.length) },
        { icon: null, label: "Áreas", value: areaNames },
      ],
      rawData: raw,
      vehiculos: [],
      equipos: [],
    };
  }