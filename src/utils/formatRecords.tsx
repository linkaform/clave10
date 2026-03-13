import { PhotoRecord } from "@/types/bitacoras";
import { Briefcase, User, CalendarDays } from "lucide-react";

export type RegistryType = 
    "bitacora" |
    "asistencia_personal";

export function formatPhotoRecord(raw: any, type: RegistryType): PhotoRecord {
  const base = {
    id: raw?._id || raw?.id || "no-id",
    folio: raw?.folio || "S/F",
  };

  switch (type) {
    case "bitacora":
      return {
        ...base,
        title: raw?.nombre_visitante || "Visitante desconocido",
        description: raw?.perfil_visita || "Visita General",
        images: [
          raw?.fotografia?.[0]?.file_url.replace(".jpg", ".thumbnail") || "",
          raw?.identificacion?.[0]?.file_url.replace(".jpg", ".thumbnail") || "",
        ],
        status: raw?.status_visita === "Entrada" ? "entrada" : "salida",
        detailsList: [
            { icon: <CalendarDays className="h-3 w-3" />, value: raw?.fecha_entrada },
            { icon: <User className="h-3 w-3" />, value: `Visita a: ${raw?.visita_a?.[0]?.nombre}`},
            { icon: <Briefcase className="h-3 w-3" />, value: raw?.contratista },
        ] ,
        rawData: raw
      };

    default:
      return {
        ...base,
        title: "Registro Desconocido",
        description: "No se encontró un formateador para este tipo",
        images: [],
        status: "cerrado",
        rawData: []
      };
  }
}