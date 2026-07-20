import { CalendarDays, MapPin, Package, Truck, User } from "lucide-react";

const ESTATUS_LABELS: Record<string, string> = {
  programado:         "Programado",
  arribo:             "Arribo",
  inspeccion_entrada: "Insp. Entrada",
  "carga_/_descarga": "Carga / Descarga",
  inspeccion_salida:  "Insp. Salida",
  terminado:          "Terminado",
};

function estatusToStatus(estatus: string) {
  if (estatus === "terminado") return "completado" as const;
  return "entrada" as const;
}

export function mapTransportistaBitacoraGrid(raw: any, base: any) {
  const details = [
    { icon: <Truck className="h-3 w-3" />,       label: "Transportista", value: raw?.proveedor_cliente },
    { icon: <User className="h-3 w-3" />,         label: "Conductor",     value: raw?.conductor },
    { icon: <Package className="h-3 w-3" />,      label: "Material",      value: raw?.material },
    { icon: <MapPin className="h-3 w-3" />,       label: "Andén",         value: raw?.anden_asignado },
    { icon: <CalendarDays className="h-3 w-3" />, label: "Ingreso",       value: raw?.fecha_hora_ingreso },
  ];

  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: raw?.tipo_de_operacion || "",
    title: raw?.placas || "Sin placas",
    description: raw?.proveedor_cliente || "Sin transportista",
    images: [],
    status: estatusToStatus(raw?.estatus || ""),
    statusLabel: ESTATUS_LABELS[raw?.estatus] || raw?.estatus || "",
    detailsList: details,
    modalDetailsList: details,
    rawData: raw,
  };
}
