import { PhotoStatus } from "@/types/bitacoras";
import { CheckCircle, Clock } from "lucide-react";

export function mapAsistenciaList(raw: any, base: any) {
  return {
    ...base,
    id: String(raw?.employee_id || `${raw?.nombre}-${raw?.ubicacion}`),
    folio: String(raw?.employee_id || ""),
    visit_type: raw?.puesto || "Guardia de Seguridad",
    title: raw?.nombre || "Empleado desconocido",
    description: raw?.puesto || "Guardia de Seguridad",
    images: ["/blur.jpg"],
    status: "completado" as PhotoStatus,
    badgesList: [
      {
        customClass:
          "bg-blue-100 hover:bg-blue-100 px-4 py-1 text-xs font-medium text-blue-600 rounded-xl border-0 shadow-none",
        label: raw?.ubicacion || "Sin ubicación",
      },
      {
        customClass: `px-4 py-1 text-xs font-semibold rounded-xl whitespace-nowrap ${
          (raw?.resumen?.faltas ?? 0) === 0
            ? "bg-green-100 text-green-600 hover:bg-green-100"
            : "bg-red-100 text-red-600 hover:bg-red-100"
        }`,
        label:
          (raw?.resumen?.faltas ?? 0) === 0
            ? "Al corriente"
            : `${raw?.resumen?.faltas} faltas`,
      },
    ],
    detailsList: [
      { icon: null, label: "TURNO", value: raw?.turno || "Sin turno asignado" },
      { icon: null, label: "UBICACIÓN", value: raw?.ubicacion || "Sin ubicación" },
      { icon: null, label: "CASETA", value: raw?.caseta || "---" },
      {
        icon: <CheckCircle className="h-3 w-3 text-green-500" />,
        label: "ASISTENCIAS",
        value: `${raw?.resumen?.asistencias ?? 0}`,
      },
      {
        icon: <Clock className="h-3 w-3 text-blue-400" />,
        label: "RETARDOS",
        value: `${raw?.resumen?.retardos ?? 0}`,
      },
    ],
    modalDetailsList: [],
    rawData: raw,
    vehiculos: [],
    equipos: [],
  };
}