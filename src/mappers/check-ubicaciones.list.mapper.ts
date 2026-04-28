export function mapCheckUbicacionList(raw: any, base: any) {
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
      badgesList: [
        {
          customClass: "bg-blue-100 hover:bg-blue-100 px-4 py-1 text-xs font-semibold text-blue-700 rounded-xl border-0 shadow-none whitespace-nowrap",
          label: `${areas.length} áreas`,
        },
        {
          customClass: `px-4 py-1 text-xs font-semibold rounded-xl border-0 shadow-none whitespace-nowrap ${tieneIncidencias ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`,
          label: tieneIncidencias ? "Con incidencias" : "Sin incidencias",
        },
        {
          customClass: "bg-slate-100 hover:bg-slate-100 px-4 py-1 text-xs font-medium text-slate-600 rounded-xl border-0 shadow-none",
          label: raw?.created_at?.split(" ")[0] || "",
        },
      ],
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
      map_data: areas.map((a: any) => ({
        id: a.area || `area-${Math.random()}`,
        nombre_area: a.area,
        geolocation_area: { latitude: 0, longitude: 0 },
        foto_area: a?.detalle?.fotos?.length > 0
          ? [{ file_name: a.detalle.fotos[0].file_name, file_url: a.detalle.fotos[0].file_url }]
          : [],
      })),
    };
  }