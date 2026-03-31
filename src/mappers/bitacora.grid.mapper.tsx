import { Briefcase, CalendarDays, Contact, MapPin, User } from "lucide-react";

export function mapBitacora(raw: any, base: any) {
  return {
    ...base,
    visit_type: raw?.perfil_visita || "",
    title: raw?.nombre_visitante || "Visitante desconocido",
    description: raw?.contratista || "Sin Empresa Registrada",
    images: [
      raw?.fotografia?.[0]?.file_url?.replace(".jpg", ".thumbnail") || null,
      raw?.identificacion?.[0]?.file_url?.replace(".jpg", ".thumbnail") || null,
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
      {
        icon: <Contact className="h-3 w-3" />,
        label: "Áreas permitidas",
        value: raw.grupo_areas_acceso.map(
          (area: { incidente_area: string; commentario_area: string }) =>
            area.incidente_area,
        ),
      },
    ],
    vehiculos: raw.vehiculos || [],
    equipos: raw.equipos || [],
    rawData: raw,
  };
}

export function mapBitacoraEquipos(raw: any, base: any) {
  return {
    ...base,
    visit_type: raw?.perfil_visita || "",
    title: raw?.nombre_visitante || "Visitante desconocido",
    description: raw?.contratista || "Sin Empresa Registrada",
    images: [
      raw?.equipos?.[0]?.foto_equipo?.[0]?.file_url?.replace(
        ".jpg",
        ".thumbnail",
      ) || null,
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
      {
        icon: <Contact className="h-3 w-3" />,
        label: "Áreas permitidas",
        value: raw.grupo_areas_acceso.map(
          (area: { incidente_area: string; commentario_area: string }) =>
            area.incidente_area,
        ),
      },
    ],
    vehiculos: raw.vehiculos || [],
    equipos: raw.equipos || [],
    rawData: raw,
  };
}

export function mapBitacoraVehiculos(raw: any, base: any) {
  return {
    ...base,
    visit_type: raw?.perfil_visita || "",
    title: raw?.nombre_visitante || "Visitante desconocido",
    description: raw?.contratista || "Sin Empresa Registrada",
    images: [
      raw?.vehiculos?.[0]?.foto_vehiculo?.[0]?.file_url?.replace(
        ".jpg",
        ".thumbnail",
      ) || null,
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
      {
        icon: <Contact className="h-3 w-3" />,
        label: "Áreas permitidas",
        value: raw.grupo_areas_acceso.map(
          (area: { incidente_area: string; commentario_area: string }) =>
            area.incidente_area,
        ),
      },
    ],
    vehiculos: raw.vehiculos || [],
    equipos: raw.equipos || [],
    rawData: raw,
  };
}
