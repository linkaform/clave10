import { CalendarDays, MapPin, User, Briefcase, Tag } from "lucide-react";
import { PhotoStatus } from "@/types/bitacoras";

const ESTATUS_MAP: Record<string, PhotoStatus> = {
  activo:  "entrada",
  proceso: "en_proceso",
  vencido: "cerrado",
};

export function mapPaseGrid(raw: any, base: any) {
  const status: PhotoStatus = ESTATUS_MAP[raw?.estatus?.toLowerCase()] ?? "cerrado";

  const visitaA = Array.isArray(raw?.visita_a) && raw.visita_a.length > 0
    ? (raw.visita_a[0]?.nombre ?? raw.visita_a[0] ?? "Sin asignar")
    : "Sin asignar";

  const ubicacion = Array.isArray(raw?.ubicacion) && raw.ubicacion.length > 0
    ? raw.ubicacion[0]
    : "Sin ubicación";

  return {
    ...base,
    visit_type: raw?.tipo_de_pase || "",
    title: raw?.nombre || "Sin nombre",
    description: raw?.tema_cita || raw?.descripcion || "Sin descripción",
    images: [raw?.foto?.[0]?.file_url ?? null].filter((u): u is string => !!u),
    status,
    statusLabel: raw?.estatus
      ? raw.estatus.charAt(0).toUpperCase() + raw.estatus.slice(1)
      : "",
    detailsList: [
      {
        icon: <MapPin className="h-3 w-3" />,
        value: `Ubicación: ${ubicacion}`,
      },
      {
        icon: <User className="h-3 w-3" />,
        value: `Visita a: ${visitaA}`,
      },
      {
        icon: <CalendarDays className="h-3 w-3" />,
        value: raw?.fecha_desde_visita
          ? `Desde: ${raw.fecha_desde_visita.slice(0, -3)}`
          : "",
      },
      {
        icon: <CalendarDays className="h-3 w-3" />,
        value: raw?.fecha_desde_hasta
          ? `Vigencia: ${raw.fecha_desde_hasta.slice(0, -3)}`
          : "",
        customClass: status === "cerrado" ? "text-red-600" : "",
      },
    ].filter((d) => d.value),
    modalDetailsList: [
      {
        icon: <Tag className="h-3 w-3" />,
        label: "Tipo de Pase",
        value: raw?.tipo_de_pase ?? "",
      },
      {
        icon: <MapPin className="h-3 w-3" />,
        label: "Ubicación",
        value: ubicacion,
      },
      {
        icon: <User className="h-3 w-3" />,
        label: "Visita a",
        value: String(visitaA),
      },
      {
        icon: <User className="h-3 w-3" />,
        label: "Autorizado por",
        value: raw?.autorizado_por ?? "",
      },
      {
        icon: <Briefcase className="h-3 w-3" />,
        label: "Tema de cita",
        value: raw?.tema_cita ?? "",
      },
      {
        icon: <CalendarDays className="h-3 w-3" />,
        label: "Fecha inicio",
        value: raw?.fecha_desde_visita ?? "",
      },
      {
        icon: <CalendarDays className="h-3 w-3" />,
        label: "Vigencia",
        value: raw?.fecha_desde_hasta ?? "",
      },
    ],
    rawData: raw,
  };
}
