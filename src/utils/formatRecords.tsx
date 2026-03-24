import { PhotoRecord, ListRecord } from "@/types/bitacoras";
import { Briefcase, User, CalendarDays, Contact, MapPin } from "lucide-react";
import { capitalizeFirstLetter } from "../lib/utils";
import { cn } from "@/lib/utils";

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
          raw?.fotografia?.[0]?.file_url?.replace(".jpg", ".thumbnail") || null,
          raw?.identificacion?.[0]?.file_url?.replace(".jpg", ".thumbnail") ||
            null,
        ].filter((url): url is string => url !== null),
        status: raw?.status_visita === "Entrada" ? "entrada" : "salida",
        badgesList: [
          {
            customClass: cn(
              "px-4 py-1 text-xs font-semibold rounded-xl whitespace-nowrap ml-2",
              raw?.status_visita === "Entrada"
                ? "bg-green-600 text-white hover:bg-green-600"
                : "bg-red-600 text-white hover:bg-red-600",
            ),
            label: capitalizeFirstLetter(raw?.status_visita) || "Desconocido",
          },
          {
            customClass:
              "bg-purple-100 hover:bg-purple-100 px-4 py-1 text-xs font-medium text-purple-600 rounded-xl border-0 shadow-none",
            label: capitalizeFirstLetter(raw?.perfil_visita) || "Desconocido",
          },
          {
            customClass:
              "bg-indigo-100 hover:bg-indigo-100 px-4 py-1 text-xs font-medium text-indigo-600 rounded-xl border-0 shadow-none",
            label: raw?.folio,
          },
        ],
        detailsList: [
          {
            icon: <MapPin className="h-3 w-3" />,
            label: "Ubicación",
            value: raw?.ubicacion,
          },
          {
            icon: <Briefcase className="h-3 w-3" />,
            label: "Caseta",
            value: raw?.caseta_entrada,
          },
          {
            icon: <User className="h-3 w-3" />,
            label: "Visita a",
            value: raw?.visita_a?.[0]?.nombre,
          },
          {
            icon: <Briefcase className="h-3 w-3" />,
            label: "Tema de la cita",
            value: "Falta Campo en Forma",
          },
          {
            icon: <CalendarDays className="h-3 w-3" />,
            label: "Fecha de entrada",
            value: raw?.fecha_entrada,
          },
          {
            icon: <CalendarDays className="h-3 w-3" />,
            label: "Fecha de salida",
            value: raw?.fecha_salida ?? "---",
            customClass: "text-red-600 font-semibold",
          },
          {
            icon: <Contact className="h-3 w-3" />,
            label: "Áreas permitidas",
            value: [
              "Recepción - Hardcode",
              "Oficinas Administrativas - Hardcode",
              "Sala de Juntas A - Hardcode",
            ],
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
          raw?.fotografia?.[0]?.file_url?.replace(".jpg", ".thumbnail") || null,
          raw?.identificacion?.[0]?.file_url?.replace(".jpg", ".thumbnail") ||
            null,
        ].filter((url): url is string => url !== null),
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
