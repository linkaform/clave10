import { PhotoRecord, ListRecord } from "@/types/bitacoras";
import { Briefcase, User, CalendarDays, Contact, MapPin } from "lucide-react";

export type RegistryType = "bitacora" | "asistencia_personal";

export function formatListRecord(raw: any, type: RegistryType): ListRecord {
  const base = {
    id: raw?._id || raw?.id || "no-id",
    folio: raw?.folio || "S/F",
  };

  switch (type) {
    case "bitacora":
      return {
        ...base,
        visit_type: raw?.status_visita || "",
        title: raw?.nombre_visitante || "Visitante desconocido",
        description: raw?.contratista || "Sin Empresa Registrada",
        images: [
          raw?.fotografia?.[0]?.file_url.replace(".jpg", ".thumbnail") || "",
          raw?.identificacion?.[0]?.file_url.replace(".jpg", ".thumbnail") ||
            "",
        ],
        status: raw?.status_visita === "Entrada" ? "entrada" : "salida",
        detailsList: [
          {
            icon: <CalendarDays className="h-3 w-3" />,
            value: raw?.fecha_entrada,
          },
          {
            icon: <User className="h-3 w-3" />,
            value: `Visita a: ${raw?.visita_a?.[0]?.nombre}`,
          },
          {
            icon: <User className="h-3 w-3" />,
            value: `Ubicacion: ${raw?.ubicacion}`,
          },
          {
            icon: <User className="h-3 w-3" />,
            value: `Caseta de Entrada: ${raw?.caseta_entrada}`,
          },
          {
            icon: <Briefcase className="h-3 w-3" />,
            value: raw?.perfil_visita,
          },
        ],
        modalDetailsList: [
          {
            icon: <CalendarDays className="h-3 w-3" />,
            label: "Fecha de Entrada",
            value: raw?.fecha_entrada,
          },
          {
            icon: <User className="h-3 w-3" />,
            label: "Visita a",
            value: raw?.visita_a?.[0]?.nombre,
          },
          {
            icon: <Contact className="h-3 w-3" />,
            label: "Perfil de Visita",
            value: raw?.perfil_visita,
          },
          {
            icon: <Briefcase className="h-3 w-3" />,
            label: "Empresa",
            value: raw?.contratista,
          },
          {
            icon: <MapPin className="h-3 w-3" />,
            label: "Ubicación",
            value: raw?.ubicacion,
          },
        ],
        rawData: raw,
      };

    default:
      return {
        ...base,
        title: "Registro Desconocido",
        description: "No se encontró un formateador para este tipo",
        images: [],
        status: "cerrado",
        modalDetailsList: [],
        rawData: [],
      };
  }
}

export function formatPhotoRecord(raw: any, type: RegistryType): PhotoRecord {
  const base = {
    id: raw?._id || raw?.id || "no-id",
    folio: raw?.folio || "S/F",
  };

  switch (type) {
    case "bitacora":
      return {
        ...base,
        visit_type: raw?.perfil_visita || "",
        title: raw?.nombre_visitante || "Visitante desconocido",
        description: raw?.contratista || "Sin Empresa Registrada",
        images: [
          raw?.fotografia?.[0]?.file_url.replace(".jpg", ".thumbnail") || "",
          raw?.identificacion?.[0]?.file_url.replace(".jpg", ".thumbnail") ||
            "",
        ],
        status: raw?.status_visita === "Entrada" ? "entrada" : "salida",
        detailsList: [
          {
            icon: <MapPin className="h-3 w-3" />,
            value: `Ubicación: ${raw?.ubicacion}`,
          },
          {
            icon: <User className="h-3 w-3" />,
            value: `Visita a: ${raw?.visita_a?.[0]?.nombre}`,
          },
          {
            icon: <CalendarDays className="h-3 w-3" />,
            value: `Entrada: ${raw?.fecha_entrada?.slice(0, -3)}`,
          },
          {
            icon: <CalendarDays className="h-3 w-3" />,
            value: raw?.fecha_salida
              ? `Salida: ${raw.fecha_salida.slice(0, -3)}`
              : "",
            customClass: "text-red-600",
          },
        ],
        modalDetailsList: [
          {
            icon: <CalendarDays className="h-3 w-3" />,
            label: "Fecha de Entrada",
            value: raw?.fecha_entrada,
          },
          {
            icon: <User className="h-3 w-3" />,
            label: "Visita a",
            value: raw?.visita_a?.[0]?.nombre,
          },
          {
            icon: <Contact className="h-3 w-3" />,
            label: "Perfil de Visita",
            value: raw?.perfil_visita,
          },
          {
            icon: <Briefcase className="h-3 w-3" />,
            label: "Empresa",
            value: raw?.contratista,
          },
          {
            icon: <MapPin className="h-3 w-3" />,
            label: "Ubicación",
            value: raw?.ubicacion,
          },
        ],
        rawData: raw,
      };

    default:
      return {
        ...base,
        title: "Registro Desconocido",
        description: "No se encontró un formateador para este tipo",
        images: [],
        status: "cerrado",
        modalDetailsList: [],
        rawData: [],
      };
  }
}
