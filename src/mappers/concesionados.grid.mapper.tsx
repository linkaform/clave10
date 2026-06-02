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
  const firstEquipo = equipos[0];
  const images = firstEquipo?.imagen_equipo_concesion?.length > 0
  ? firstEquipo.imagen_equipo_concesion
      .map((i: any) => i.file_url)
      .filter((url: string) => Boolean(url) && isValidImageUrl(url))
  : [];
  const finalImages = images.length > 0 ? images : ["/sin_imagen_rondines.png"];
  const statusConfig = getStatusConfig(raw?.status_concesion);
  const persona = raw?.persona_nombre_concesion || raw?.persona_nombre_otro || "Sin nombre";
  const equipoNames = equipos.map((e: any) => e.nombre_equipo).filter(Boolean);
  const maxLength = 50;
  const equiposText = equipoNames.join(", ");
  const truncate = (text: string, max = 33) =>
    text.length > max ? text.slice(0, max) + "..." : text;

  const totalUnidades = equipos.reduce((acc: number, e: any) => acc + Number(e.cantidad_equipo_concesion ?? 0), 0);
  const totalDevueltas = equipos.reduce((acc: number, e: any) => acc + Number(e.cantidad_equipo_devuelto ?? 0), 0);
  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: raw?.caseta_concesion || "No disponible",
      // title: persona,
    title: equiposText.length > maxLength 
      ? equiposText.slice(0, maxLength) + "..." 
      : equiposText || "Sin equipos",
    images:finalImages,
    status: raw?.status_concesion?.toLowerCase() || "abierto",
    statusLabel: statusConfig.label,
    detailsList: [
      {
        icon: <Package className="h-3 w-3" />,
        label: "EQUIPOS",
        value: equipoNames.length > 0 ? truncate(`Equipos: ${equipoNames.join(", ")}`) : "",
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
      {
        icon: <Package className="h-3 w-3" />,
        label: "DEVUELTAS",
        value: `Devueltas: ${totalDevueltas} / ${totalUnidades}`,
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
    ],
    rawData: raw,
    vehiculos: null,
    equipos: null,
  };
}