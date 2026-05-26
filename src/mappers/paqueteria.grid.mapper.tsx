import { CalendarDays, MapPin, Package, User, Truck, Archive } from "lucide-react";

export function mapPaqueteriaGrid(raw: any, base: any) {
  const images = Array.isArray(raw?.fotografia_paqueteria) && raw.fotografia_paqueteria.length > 0
    ? raw.fotografia_paqueteria.map((f: any) => f.file_url).filter(Boolean)
    : ["/sin_imagen_rondines.png"];

  const isEntregado = raw?.estatus_paqueteria?.toLowerCase() === "entregado";

  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: raw?.proveedor || "",
    title: raw?.descripcion_paqueteria || "Sin nombre",
    // description: raw?.descripcion_paqueteria || "Sin descripción",
    images,
    status: isEntregado ? "entregado" : "guardado",
    statusLabel: isEntregado ? "Entregado" : "Guardado",
    detailsList: [
      {
        icon: <Truck className="h-3 w-3" />,
        label: "PROVEEDOR",
        value: raw?.proveedor ? `Proveedor: ${raw.proveedor}` : "-",
      },
      {
        icon: <Archive className="h-3 w-3" />,
        label: "LOCKER",
        value: raw?.guardado_en_paqueteria ? `Locker: ${raw.guardado_en_paqueteria}` : "-",
      },
      {
        icon: <MapPin className="h-3 w-3" />,
        label: "ÁREA",
        value: raw?.area_paqueteria ? `Área: ${raw.area_paqueteria}` : "-",
      },
      {
        icon: <CalendarDays className="h-3 w-3" />,
        label: "RECIBIDO",
        value: raw?.fecha_recibido_paqueteria ? `Recibido: ${raw.fecha_recibido_paqueteria}` : "-",
      },
      {
        icon: <CalendarDays className="h-3 w-3" />,
        label: "ENTREGADO",
        value: raw?.fecha_entregado_paqueteria ? `Entregado: ${raw.fecha_entregado_paqueteria}` : "-",
        customClass: isEntregado ? "text-green-600 font-medium" : "text-slate-400",
      },
    ],
    modalDetailsList: [
      { icon: <User className="h-3 w-3" />, label: "Recibe", value: raw?.quien_recibe_paqueteria },
      { icon: <Truck className="h-3 w-3" />, label: "Proveedor", value: raw?.proveedor },
      { icon: <Archive className="h-3 w-3" />, label: "Locker", value: raw?.guardado_en_paqueteria },
      { icon: <MapPin className="h-3 w-3" />, label: "Área", value: raw?.area_paqueteria },
      { icon: <MapPin className="h-3 w-3" />, label: "Ubicación", value: raw?.ubicacion_paqueteria },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha recibido", value: raw?.fecha_recibido_paqueteria },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha entregado", value: raw?.fecha_entregado_paqueteria || "No entregado" },
      { icon: <User className="h-3 w-3" />, label: "Entregado a", value: raw?.entregado_a_paqueteria || "Pendiente" },
      { icon: <Package className="h-3 w-3" />, label: "Descripción", value: raw?.descripcion_paqueteria },
    ],
    rawData: raw,
    vehiculos: null,
    equipos: null,
  };
}
