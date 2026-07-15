import { CalendarDays, MapPin, User, Package, Tag } from "lucide-react";
export const isValidImageUrl = (url: string) => {
  try {
    const { hostname } = new URL(url);
    return ["f001.backblazeb2.com"].includes(hostname); 
  } catch {
    return false;
  }
};
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

export function mapArticuloConcesionadoList(raw: any, base: any) {
  const equipos: any[] = raw?.grupo_equipos || [];
  const firstEquipo = equipos[0];

  // 1. Imágenes de imagen_equipo_concesion (de TODOS los equipos)
  const imagenesEquipo = equipos
    .flatMap((e: any) => e?.imagen_equipo_concesion || [])
    .map((i: any) => i?.file_url)
    .filter((url: string) => Boolean(url) && isValidImageUrl(url));

  // 2. Imágenes de evidencia_entrega (de TODOS los equipos)
  const imagenesEvidencia = equipos
    .flatMap((e: any) => e?.evidencia_entrega || [])
    .map((i: any) => i?.file_url)
    .filter((url: string) => Boolean(url) && isValidImageUrl(url));

  // Primero imagen_equipo_concesion, luego evidencia_entrega
  const images = [...imagenesEquipo, ...imagenesEvidencia];
  const finalImages = images.length > 0 ? images : ["/sin_imagen_rondines.png"];

  const statusConfig = getStatusConfig(raw?.status_concesion);
  const persona = raw?.persona_nombre_concesion || raw?.persona_nombre_otro || "Sin nombre";
  const equipoNames = equipos.map((e: any) => e.nombre_equipo).filter(Boolean);
  const categoria = firstEquipo?.categoria_equipo_concesion || "";
  const maxLength = 50;
  const equiposText = equipoNames.join(", ");

  const totalUnidades = equipos.reduce(
    (acc: number, e: any) => acc + Number(e.cantidad_equipo_concesion ?? 0), 0
  );
  const totalDevueltas = equipos.reduce(
    (acc: number, e: any) => acc + Number(e.cantidad_equipo_devuelto ?? 0), 0
  );
  const porcentajeDevolucion = totalUnidades > 0
    ? Math.round((totalDevueltas / totalUnidades) * 100)
    : 0;

  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: raw?.caseta_concesion || "",
    // title: persona,
    title: equiposText.length > maxLength 
      ? equiposText.slice(0, maxLength) + "..." 
      : equiposText || "Sin equipos",
    images:finalImages,
    status: raw?.status_concesion?.toLowerCase() || "abierto",
    statusLabel: raw?.status_concesion || "",
    devolucionProgreso: {
      devueltas: totalDevueltas,
      total: totalUnidades,
      porcentaje: porcentajeDevolucion,
    },
    badgesList: [
      {
        isEstatus: true,
        label: statusConfig.label,
        customClass: "",
      },
      ...(categoria ? [{
        customClass: "bg-purple-100 hover:bg-purple-100 px-4 py-1 text-xs font-medium text-purple-600 rounded-xl border-0 shadow-none",
        label: categoria.split("/")[0],
      }] : []),
      {
        customClass: "bg-indigo-100 hover:bg-indigo-100 px-4 py-1 text-xs font-medium text-indigo-600 rounded-xl border-0 shadow-none",
        label: raw?.folio,
      },
    ],
    detailsList: [
      { icon: <User className="h-3 w-3" />, label: "Solicitante", value: persona },
      { icon: <MapPin className="h-3 w-3" />, label: "Caseta", value: raw?.caseta_concesion },
      { icon: <MapPin className="h-3 w-3" />, label: "Ubicación", value: raw?.ubicacion_concesion },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha concesión", value: raw?.fecha_concesion },
      {
        icon: <CalendarDays className="h-3 w-3" />,
        label: "Fecha cierre",
        value: raw?.fecha_cierre_concesion || "Pendiente",
        customClass: raw?.fecha_cierre_concesion ? "text-green-600 font-semibold" : "text-amber-500 font-semibold",
      },
      {
        icon: <Package className="h-3 w-3" />,
        label: "areas",
        value: equipoNames,
      },
    ],
    modalDetailsList: [
      { icon: <User className="h-3 w-3" />, label: "Solicitante", value: persona },
      { icon: <MapPin className="h-3 w-3" />, label: "Caseta", value: raw?.caseta_concesion },
      { icon: <MapPin className="h-3 w-3" />, label: "Ubicación", value: raw?.ubicacion_concesion },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha concesión", value: raw?.fecha_concesion },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha cierre", value: raw?.fecha_cierre_concesion || "Pendiente" },
      { icon: <Tag className="h-3 w-3" />, label: "Observación", value: raw?.observacion_concesion },
      { icon: <Package className="h-3 w-3" />, label: "Equipos", value: equipoNames },
    ],
    rawData: raw,
    vehiculos: null,
    equipos: null,
  };
}