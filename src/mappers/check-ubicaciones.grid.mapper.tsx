import { MapPin, Route, User, Building2, Calendar } from "lucide-react";

export function mapCheckUbicacionGrid(raw: any, base: any) {
  const rondinData = raw?.rondin || {};

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
    : raw?.rondin_area || "-";

  const tipoArea = Array.isArray(raw?.tipo_de_area)
    ? raw.tipo_de_area.join(", ")
    : raw?.tipo_de_area || "-";

  const ubicacion = raw?.incidente_location?.[0] || rondinData?.ubicacion || "-";
  const nombreRecorrido = raw?.nombre_recorrido || rondinData?.nombre_recorrido || "-";
  const asignado = raw?.asignado_a || rondinData?.asignado_a || "-";
  const incidenciasCount = tieneIncidencias ? raw.grupo_incidencias_check.length : null;
  const nombreArea = raw?.rondin_area ? raw.rondin_area[0] : "-";

  return {
    ...base,
    id: raw?.id || "no-id",
    folio: raw?.folio || rondinData?.folio || "S/F",
    visit_type: tipoArea,
    title: `${nombreArea}`,
    description: ubicacion,
    images,
    status: tieneIncidencias ? "con_incidencias" : "sin_incidencias",
    statusLabel: tieneIncidencias
      ? `${incidenciasCount} incidencia${incidenciasCount! > 1 ? "s" : ""}`
      : "Sin incidencias",
    badgesList: [
      {
        customClass: "bg-blue-50 hover:bg-blue-50 px-4 py-1 text-xs font-bold text-blue-600 rounded-xl border border-blue-100 shadow-none",
        label: raw?.folio || rondinData?.folio || "S/F",
      },
      {
        customClass: tieneIncidencias
          ? "bg-red-100 hover:bg-red-100 px-4 py-1 text-xs font-bold text-red-600 rounded-xl border-0 shadow-none"
          : "bg-green-100 hover:bg-green-100 px-4 py-1 text-xs font-bold text-green-600 rounded-xl border-0 shadow-none",
        label: tieneIncidencias
          ? `${incidenciasCount} incidencia${incidenciasCount! > 1 ? "s" : ""}`
          : "Sin incidencias",
      },
      {
        customClass: "bg-slate-100 hover:bg-slate-100 px-4 py-1 text-xs font-bold text-slate-600 rounded-xl border-0 shadow-none capitalize",
        label: rondinArea,
      },
    ],
    detailsList: [
      { icon: <MapPin className="h-3 w-3" />, label: "ÁREA", value:  `Área: ${rondinArea }`},
      { icon: <Route className="h-3 w-3" />, label: "RONDIN", value: `Rondín: ${nombreRecorrido}` },
      { icon: <User className="h-3 w-3" />, label: "REALIZADO POR", value: `Realizado por: ${asignado}` },
      { icon: <Building2 className="h-3 w-3" />, label: "UBICACIÓN", value: ubicacion },
      { icon: <Calendar className="h-3 w-3" />, label: "FECHA", value: raw?.fecha_inspeccion_area || raw?.created_at || "-" },
    ],
    modalDetailsList: [
      { icon: null, label: "Área",          value: rondinArea },
      { icon: null, label: "Tipo",          value: tipoArea },
      { icon: null, label: "Rondin",     value: nombreRecorrido },
      { icon: null, label: "Realizado por", value: asignado },
      { icon: null, label: "Ubicación",     value: ubicacion },
      { icon: null, label: "Fecha",         value: raw?.fecha_inspeccion_area || raw?.created_at || "-" },
      { icon: null, label: "Estado del check", value: raw?.check_status?.replace(/_/g, " ") || "-" },
      { icon: null, label: "Comentario",    value: raw?.comentario_check_area || "-" },
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