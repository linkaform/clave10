import { CalendarDays, MapPin, User, Package, Tag } from "lucide-react";
import { isValidImageUrl } from "./concesionados.list.mapper";

const getStatusConfig = (status: string) => {
  switch (status?.toLowerCase()) {
    case "abierto":
      return { label: "Abierto", class: "bg-amber-500 text-white hover:bg-amber-500" };
    case "devuelto":
      return { label: "Devuelto", class: "bg-green-600 text-white hover:bg-green-600" };
    case "parcial":
      return { label: "Parcial", class: "bg-blue-600 text-white hover:bg-blue-600" };
    default:
      return { label: status || "Sin estatus", class: "bg-slate-400 text-white hover:bg-slate-400" };
  }
};

export function mapArticuloConcesionadoGrid(raw: any, base: any) {
  const equipos: any[] = raw?.grupo_equipos || [];

  // Fotos de TODOS los equipos con el nombre de su equipo: primero
  // imagen_equipo_concesion, luego evidencia_prestamo.
  const fotosDe = (campo: string) =>
    equipos.flatMap((e: any) =>
      (e?.[campo] || [])
        .map((i: any) => ({ url: i?.file_url, equipo: e?.nombre_equipo || "" }))
        .filter((f: { url: string }) => Boolean(f.url) && isValidImageUrl(f.url)),
    );
  const fotos = [...fotosDe("imagen_equipo_concesion"), ...fotosDe("evidencia_prestamo")];
  const finalImages = fotos.length > 0 ? fotos.map((f) => f.url) : ["/sin_imagen_rondines.png"];

  const statusConfig = getStatusConfig(raw?.status_concesion);
  const persona = raw?.persona_nombre_concesion || raw?.persona_nombre_otro || "Sin nombre";
  const equipoNames = equipos.map((e: any) => e.nombre_equipo).filter(Boolean);
  const truncate = (text: string, max = 33) =>
    text.length > max ? text.slice(0, max) + "..." : text;
  const createdBy = raw?.created_by || "-";

  // Varios artículos en un folio (2610-1305): el título es el primero con
  // "+N" y el renglón lleva lo devuelto de todo el folio.
  const totalUnidades = equipos.reduce((acc: number, e: any) => acc + Number(e.cantidad_equipo_concesion ?? 0), 0);
  const totalDevueltas = equipos.reduce((acc: number, e: any) => acc + Number(e.cantidad_equipo_devuelto ?? 0), 0);

  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: `Creado por: ${createdBy}` || "No disponible",
    title: equipoNames[0] || "Sin equipos",
    titleBadge: equipos.length > 1 ? `+${equipos.length - 1} artículo${equipos.length > 2 ? "s" : ""}` : undefined,
    images: finalImages,
    // Con varios artículos, cada foto dice de cuál es.
    imageLabels: equipos.length > 1 && fotos.length > 0 ? fotos.map((f) => f.equipo) : undefined,
    status: raw?.status_concesion?.toLowerCase() || "abierto",
    statusLabel: statusConfig.label,
    detailsList: [
      {
        icon: <Package className="h-3 w-3" />,
        label: "DEVUELTAS",
        value: `Devueltas: ${totalDevueltas} / ${totalUnidades}`,
      },
      {
        icon: <User className="h-3 w-3" />,
        label: "Solicitante",
        value: persona ? truncate(`Solicitante: ${persona}`) : "",
      },
      {
        icon: <MapPin className="h-3 w-3" />,
        label: "CASETA",
        value: truncate(raw?.caseta_concesion ? `Caseta: ${raw.caseta_concesion}` : "Caseta: No disponible"),
      },
      {
        icon: <MapPin className="h-3 w-3" />,
        label: "UBICACIÓN",
        value: raw?.ubicacion_concesion ? truncate(`Ubicación: ${raw.ubicacion_concesion}`) : "",
      },

    ],
    modalDetailsList: [
      { icon: <User className="h-3 w-3" />, label: "Persona", value: persona },
      { icon: <MapPin className="h-3 w-3" />, label: "Caseta", value: raw?.caseta_concesion },
      { icon: <MapPin className="h-3 w-3" />, label: "Ubicación", value: raw?.ubicacion_concesion },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha concesión", value: raw?.fecha_concesion },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha cierre", value: raw?.fecha_cierre_concesion || "Pendiente" },
      { icon: <Tag className="h-3 w-3" />, label: "Observación", value: raw?.observacion_concesion },
      {
        icon: <Package className="h-3 w-3" />,
        label: "Equipos",
        value: equipoNames,
      },
      {
        icon: <User className="h-3 w-3" />,
        label: "Creado por",
        value: createdBy,
      },
    ],
    rawData: raw,
    vehiculos: null,
    equipos: null,
  };
}