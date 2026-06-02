import { CalendarDays, MapPin, User, Archive, Tag, Palette } from "lucide-react";

const getStatusConfig = (estatus: string) => {
  switch (estatus?.toLowerCase()) {
    case "pendiente":
      return { label: "Pendiente", class: "bg-amber-500 text-white hover:bg-amber-500" };
    case "entregado":
      return { label: "Entregado", class: "bg-green-600 text-white hover:bg-green-600" };
    case "donado":
      return { label: "Donado", class: "bg-blue-600 text-white hover:bg-blue-600" };
    default:
      return { label: estatus || "Sin estatus", class: "bg-slate-400 text-white hover:bg-slate-400" };
  }
};

export function mapArticuloPerdidoList(raw: any, base: any) {
  const images = Array.isArray(raw?.foto_perdido) && raw.foto_perdido.length > 0
    ? raw.foto_perdido.map((f: any) => f.file_url).filter(Boolean)
    : ["/sin_imagen_rondines.png"];

  const statusConfig = getStatusConfig(raw?.estatus_perdido);
  const entregador = raw?.quien_entrega === "interno"
    ? raw?.quien_entrega_interno
    : raw?.quien_entrega_externo || "Desconocido";

  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: raw?.tipo_articulo_perdido || "",
    title: raw?.articulo_seleccion || "Artículo sin nombre",
    description: raw?.descripcion || raw?.comentario_perdido || "Sin descripción",
    images,
    status: raw?.estatus_perdido?.toLowerCase() || "pendiente",
    statusLabel: raw?.estatus_perdido || "",
    badgesList: [
      {
        isEstatus: true,
        label: statusConfig.label,
        customClass: statusConfig.class,
      },
      ...(raw?.tipo_articulo_perdido ? [{
        customClass: "bg-purple-100 hover:bg-purple-100 px-4 py-1 text-xs font-medium text-purple-600 rounded-xl border-0 shadow-none",
        label: raw.tipo_articulo_perdido,
      }] : []),
      {
        customClass: "bg-indigo-100 hover:bg-indigo-100 px-4 py-1 text-xs font-medium text-indigo-600 rounded-xl border-0 shadow-none",
        label: raw?.folio,
      },
    ],
    detailsList: [
      { icon: <Tag className="h-3 w-3" />, label: "Artículo", value: raw?.articulo_seleccion },
      { icon: <User className="h-3 w-3" />, label: "Entrega", value: entregador },
      { icon: <Archive className="h-3 w-3" />, label: "Locker", value: raw?.locker_perdido },
      { icon: <MapPin className="h-3 w-3" />, label: "Área", value: raw?.area_perdido },
      { icon: <Palette className="h-3 w-3" />, label: "Color", value: raw?.color_perdido },
      {
        icon: <CalendarDays className="h-3 w-3" />,
        label: "Fecha hallazgo",
        value: raw?.date_hallazgo_perdido || "---",
      },
      {
        icon: <CalendarDays className="h-3 w-3" />,
        label: "Fecha entrega",
        value: raw?.date_entrega_perdido || "Pendiente",
        customClass: raw?.date_entrega_perdido ? "text-green-600 font-semibold" : "text-amber-500 font-semibold",
      },
    ],
    modalDetailsList: [
      { icon: <Tag className="h-3 w-3" />, label: "Artículo", value: raw?.articulo_seleccion },
      { icon: <Tag className="h-3 w-3" />, label: "Tipo", value: raw?.tipo_articulo_perdido },
      { icon: <Palette className="h-3 w-3" />, label: "Color", value: raw?.color_perdido },
      { icon: <Archive className="h-3 w-3" />, label: "Locker", value: raw?.locker_perdido },
      { icon: <MapPin className="h-3 w-3" />, label: "Área", value: raw?.area_perdido },
      { icon: <MapPin className="h-3 w-3" />, label: "Ubicación", value: raw?.ubicacion_perdido },
      { icon: <User className="h-3 w-3" />, label: "Entrega", value: entregador },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha hallazgo", value: raw?.date_hallazgo_perdido },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha entrega", value: raw?.date_entrega_perdido || "Pendiente" },
      { icon: <User className="h-3 w-3" />, label: "Recibe", value: raw?.recibe_perdido || "Pendiente" },
    ],
    rawData: raw,
    vehiculos: null,
    equipos: null,
  };
}