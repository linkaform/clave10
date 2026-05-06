export function mapAttendanceGrid(raw: any, base: any) {

  const getPicUrl = (pic: any) =>
    pic && !Array.isArray(pic) && pic.file_url ? pic.file_url : null;

  const startPic = getPicUrl(raw?.attendance_start_pic);
  const endPic = getPicUrl(raw?.attendance_end_pic);
  const images = startPic
    ? [startPic, endPic].filter(Boolean)
    : endPic
    ? [endPic]
    : ["/blur2.jpg"];

  const getAttendanceStatus = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s === "asistencia") return "entrada";          // verde
    if (s === "retardo") return "resuelto";            // azul
    if (s === "falta por retardo") return "pausado";   // amarillo
    if (s === "falta") return "salida";                // rojo
    return "cerrado";                                  // gris (sin asistencia / vacío)
  };

  const recordStatus = getAttendanceStatus(raw?.attendance_status || "");

  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: raw?.attendance_position || "",
    title: raw?.attendance_name || "Sin nombre",
    description: raw?.attendance_location || "Sin ubicación",
    images,
    status: recordStatus,
    statusLabel: raw?.attendance_status || "Sin Asistencia",
    attendance_status: raw?.attendance_status,
    attendance_location: raw?.attendance_location,
    attendance_area: raw?.attendance_area,
    detailsList: [
      { icon: null, label: "UBICACIÓN", value: raw?.attendance_location ? `Ubicación: ${raw.attendance_location}` : "---" },
      { icon: null, label: "CASETA", value: raw?.attendance_area ? `Caseta: ${raw.attendance_area}` : "---" },
      { icon: null, label: "INICIO", value: raw?.attendance_start_time ? `Fecha inicio: ${raw.attendance_start_time}` : "---" },
      { icon: null, label: "FIN", value: raw?.attendance_end_time ? `Fecha cierre: ${raw.attendance_end_time}` : "---" },
      { icon: null, label: "ESTATUS", value: raw?.attendance_status || "Sin Asistencia" },
    ],
    modalDetailsList: [
      { icon: null, label: "Nombre", value: raw?.attendance_name },
      { icon: null, label: "Puesto", value: raw?.attendance_position },
      { icon: null, label: "Estatus", value: raw?.attendance_status || "Sin Asistencia" },
      { icon: null, label: "Ubicación", value: raw?.attendance_location },
      { icon: null, label: "Área", value: raw?.attendance_area },
      { icon: null, label: "Fecha inicio", value: raw?.attendance_start_time },
      { icon: null, label: "Fecha cierre", value: raw?.attendance_end_time },
      { icon: null, label: "Horas trabajadas", value: raw?.attendance_work_hours ? `${raw.attendance_work_hours} hrs` : "---" },
      { icon: null, label: "Comentario inicio", value: raw?.attendance_start_comment || null },
      { icon: null, label: "Comentario cierre", value: raw?.attendance_end_comment || null },
    ],
    rawData: raw,
    vehiculos: [],
    equipos: [],
  };
}