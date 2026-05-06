export function mapFallaList(raw: any, base: any) {
  const estatus = raw?.falla_estatus?.toLowerCase() || "";

  const status = estatus === "resuelto" ? "resuelto" : "abierto";

  const visit_type = raw?.falla_objeto_afectado || "";

  const images =
    Array.isArray(raw?.falla_evidencia) && raw.falla_evidencia.length > 0
      ? raw.falla_evidencia.map((e: any) => e.file_url).filter(Boolean)
      : ["/blur2.jpg"];

  const fallaNombre = raw?.falla || "Sin falla";

  const estatusClass =
    estatus === "abierto"
      ? "bg-green-100 text-green-600 hover:bg-green-100"
      : estatus === "resuelto"
      ? "bg-blue-100 text-blue-600 hover:bg-blue-100"
      : "bg-gray-100 text-gray-600 hover:bg-gray-100";

  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type,
    title: fallaNombre,
    description: raw?.falla_ubicacion || "Sin ubicación",
    images,
    status,
    falla_estatus: raw?.falla_estatus,
    falla_ubicacion: raw?.falla_ubicacion,
    falla_caseta: raw?.falla_caseta,
    badgesList: [
      {
        customClass: `px-4 py-1 text-xs font-semibold rounded-xl whitespace-nowrap ${estatusClass}`,
        label: raw?.falla_estatus || "Sin estatus",
      },
      {
        customClass:
          "bg-orange-100 hover:bg-orange-100 px-4 py-1 text-xs font-medium text-orange-600 rounded-xl border-0 shadow-none whitespace-nowrap",
        label: raw?.falla_objeto_afectado || "Sin objeto",
      },
      {
        customClass:
          "bg-indigo-100 hover:bg-indigo-100 px-4 py-1 text-xs font-medium text-indigo-600 rounded-xl border-0 shadow-none",
        label: raw?.folio || "",
      },
    ],
    detailsList: [
      { icon: null, label: "CASETA", value: raw?.falla_caseta || "---" },
      { icon: null, label: "OBJETO AFECTADO", value: raw?.falla_objeto_afectado || "---" },
      { icon: null, label: "FECHA", value: raw?.falla_fecha_hora || "---" },
      { icon: null, label: "REPORTA", value: raw?.falla_reporta_nombre || "---" },
      { icon: null, label: "RESPONSABLE", value: raw?.falla_responsable_solucionar_nombre || "---" },
    ],
    modalDetailsList: [
      { icon: null, label: "Folio", value: raw?.folio },
      { icon: null, label: "Estatus", value: raw?.falla_estatus },
      { icon: null, label: "Falla", value: fallaNombre },
      { icon: null, label: "Objeto afectado", value: raw?.falla_objeto_afectado },
      { icon: null, label: "Ubicación", value: raw?.falla_ubicacion },
      { icon: null, label: "Caseta", value: raw?.falla_caseta },
      { icon: null, label: "Comentarios", value: raw?.falla_comentarios },
      { icon: null, label: "Fecha", value: raw?.falla_fecha_hora },
      { icon: null, label: "Reporta", value: raw?.falla_reporta_nombre || "Sin asignar" },
      { icon: null, label: "Responsable", value: raw?.falla_responsable_solucionar_nombre || "Sin asignar" },
    ],
    rawData: raw,
    vehiculos: [],
    equipos: [],
  };
}