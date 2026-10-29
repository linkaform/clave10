import { CalendarDays, Clock, MapPin, User } from "lucide-react";

// Colores del badge por estatus de check-in (status_turn del Registro de Asistencia)
const STATUS_CLASSES: Record<string, string> = {
  presente: "bg-green-50 text-green-700 border border-green-200",
  retardo: "bg-orange-50 text-orange-700 border border-orange-200",
  "falta por retardo": "bg-red-50 text-red-700 border border-red-200",
};

const hora = (fecha?: string) => fecha?.substring(11, 16);

export function mapAttendanceGrid(raw: any, base: any) {

  const getPicUrl = (pic: any) =>
    pic && !Array.isArray(pic) && pic.file_url ? pic.file_url : null;

  const startPic = getPicUrl(raw?.attendance_start_pic);
  const endPic = getPicUrl(raw?.attendance_end_pic);
  const photos = [
    startPic && { url: startPic, label: `Entrada ${hora(raw?.attendance_start_time) || ""}`.trim() },
    endPic && { url: endPic, label: `Salida ${hora(raw?.attendance_end_time) || ""}`.trim() },
  ].filter(Boolean) as { url: string; label: string }[];

  const status = raw?.attendance_status || "";
  const turno = raw?.attendance_end_time
    ? `${hora(raw?.attendance_start_time)} → ${hora(raw.attendance_end_time)}`
    : `${hora(raw?.attendance_start_time) || "--:--"} → En turno`;

  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: raw?.attendance_horario || "",
    title: raw?.attendance_name || "Sin nombre",
    description: [raw?.attendance_location, raw?.attendance_area].filter(Boolean).join(" · ") || "Sin ubicación",
    images: photos.map(p => p.url),
    imageLabels: photos.map(p => p.label),
    status: "entrada",
    statusLabel: status || "Sin estatus",
    statusClassName: STATUS_CLASSES[status.toLowerCase()],
    attendance_status: raw?.attendance_status,
    attendance_location: raw?.attendance_location,
    attendance_area: raw?.attendance_area,
    detailsList: [
      { icon: <MapPin className="h-3 w-3" />, label: "Ubicación", value: raw?.attendance_location },
      { icon: <User className="h-3 w-3" />, label: "Guardia", value: raw?.attendance_sup_name ? `Suplente: ${raw.attendance_sup_name}` : raw?.attendance_position },
      { icon: <Clock className="h-3 w-3" />, label: "Turno", value: turno },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha", value: raw?.attendance_start_time?.substring(0, 10) },
    ],
    modalDetailsList: [
      { icon: null, label: "Nombre", value: raw?.attendance_name },
      { icon: null, label: "Puesto", value: raw?.attendance_position },
      { icon: null, label: "Suplente", value: raw?.attendance_sup_name || null },
      { icon: null, label: "Horario", value: raw?.attendance_horario || null },
      { icon: null, label: "Estatus", value: status || "Sin estatus" },
      { icon: null, label: "Ubicación", value: raw?.attendance_location },
      { icon: null, label: "Área", value: raw?.attendance_area },
      { icon: null, label: "Fecha inicio", value: raw?.attendance_start_time },
      { icon: null, label: "Fecha cierre", value: raw?.attendance_end_time || "En turno" },
      { icon: null, label: "Horas trabajadas", value: raw?.attendance_work_hours ? `${raw.attendance_work_hours} hrs` : "---" },
      { icon: null, label: "Comentario inicio", value: raw?.attendance_start_comment || null },
      { icon: null, label: "Comentario cierre", value: raw?.attendance_end_comment || null },
    ],
    rawData: raw,
    vehiculos: [],
    equipos: [],
  };
}
