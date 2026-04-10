export function mapAttendanceList(raw: any, base: any) {

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

  const estatusClass =
    recordStatus === "entrada"
      ? "bg-green-100 text-green-600 hover:bg-green-100"
      : recordStatus === "resuelto"
      ? "bg-blue-100 text-blue-600 hover:bg-blue-100"
      : recordStatus === "pausado"
      ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-100"
      : recordStatus === "salida"
      ? "bg-red-100 text-red-600 hover:bg-red-100"
      : "bg-gray-100 text-gray-600 hover:bg-gray-100";

  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: raw?.attendance_position || "",
    title: raw?.attendance_name || "Sin nombre",
    description: raw?.attendance_location || "Sin ubicación",
    images,
    status: recordStatus,
    attendance_status: raw?.attendance_status,
    attendance_location: raw?.attendance_location,
    attendance_area: raw?.attendance_area,
    badgesList: [
      {
        customClass: `px-4 py-1 text-xs font-semibold rounded-xl whitespace-nowrap ${estatusClass}`,
        label: raw?.attendance_status || "Sin estatus",
      },
      {
        customClass:
          "bg-purple-100 hover:bg-purple-100 px-4 py-1 text-xs font-medium text-purple-600 rounded-xl border-0 shadow-none whitespace-nowrap",
        label: raw?.attendance_position || "Sin puesto",
      },
      {
        customClass:
          "bg-indigo-100 hover:bg-indigo-100 px-4 py-1 text-xs font-medium text-indigo-600 rounded-xl border-0 shadow-none",
        label: raw?.folio || "",
      },
    ],
    detailsList: [
      { icon: null, label: "UBICACIÓN", value: raw?.attendance_location ? `Ubicación: ${raw.attendance_location}` : "---" },
      { icon: null, label: "CASETA", value: raw?.attendance_area ? `Caseta: ${raw.attendance_area}` : "---" },
      { icon: null, label: "INICIO", value: raw?.attendance_start_time ? `Fecha inicio: ${raw.attendance_start_time}` : "---" },
      { icon: null, label: "FIN", value: raw?.attendance_end_time ? `Fecha cierre: ${raw.attendance_end_time}` : "---" },
      { icon: null, label: "ESTATUS", value: raw?.attendance_status || "Sin Asistencia" },
    ],
    modalDetailsList: [
      { icon: null, label: "Folio", value: raw?.folio },
      { icon: null, label: "Nombre", value: raw?.attendance_name },
      { icon: null, label: "Puesto", value: raw?.attendance_position },
      { icon: null, label: "Estatus", value: raw?.attendance_status },
      { icon: null, label: "Ubicación", value: raw?.attendance_location },
      { icon: null, label: "Área", value: raw?.attendance_area },
      { icon: null, label: "Inicio", value: raw?.attendance_start_time },
      { icon: null, label: "Fin", value: raw?.attendance_end_time },
    ],
    rawData: raw,
    vehiculos: [],
    equipos: [],
  };
}