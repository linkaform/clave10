import { PhotoStatus } from "@/types/bitacoras";
import { Briefcase, CheckCircle, Clock, MapPin } from "lucide-react";

export function mapAsistenciaGrid(raw: any, base: any) {
  return {
    ...base,
    id: String(raw?.employee_id || `${raw?.nombre}-${raw?.ubicacion}`),
    folio: String(raw?.employee_id || ""),
    visit_type: raw?.puesto || "Guardia de Seguridad",
    title: raw?.nombre || "Empleado desconocido",
    description: raw?.ubicacion || "Sin ubicación",
    images: ["/blur.jpg"],
    status: "pendiente back" as PhotoStatus,
    detailsList: [
      { icon: <Clock className="h-3 w-3" />, label: "TURNO", value: raw?.turno || "Sin turno asignado" },
      { icon: <MapPin className="h-3 w-3" />, label: "UBICACIÓN", value: raw?.ubicacion || "Sin ubicación" },
      { icon: <Briefcase className="h-3 w-3" />, label: "CASETA", value: raw?.caseta || "Sin caseta" },
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