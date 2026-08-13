import { CalendarDays, MapPin, Package, Truck, User } from "lucide-react";

const IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|gif|webp)$/i;

function getDocumentImages(documentos: any[]): string[] {
  if (!Array.isArray(documentos)) return [];
  return documentos
    .map((doc) => doc?.file_url)
    .filter((url): url is string => !!url && IMAGE_EXTENSION_REGEX.test(url))
    .map((url) => url.replace(IMAGE_EXTENSION_REGEX, ".thumbnail"));
}

export const ESTATUS_LABELS: Record<string, string> = {
  programado:         "Programado",
  arribo:             "Arribo",
  inspeccion_entrada: "Insp. Entrada",
  "carga_/_descarga": "Carga / Descarga",
  inspeccion_salida:  "Insp. Salida",
  terminado:          "Terminado",
};

export const ESTATUS_BADGE: Record<string, string> = {
  programado:         "bg-gray-100 text-gray-600",
  arribo:             "bg-blue-100 text-blue-700",
  inspeccion_entrada: "bg-violet-100 text-violet-700",
  "carga_/_descarga": "bg-emerald-100 text-emerald-700",
  inspeccion_salida:  "bg-orange-100 text-orange-700",
  terminado:          "bg-green-100 text-green-700",
};

function estatusToStatus(estatus: string) {
  if (estatus === "terminado") return "completado" as const;
  return "entrada" as const;
}

export function mapTransportistaBitacoraList(raw: any, base: any) {
  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: raw?.tipo_de_operacion || "",
    title: raw?.placas || "Sin placas",
    description: raw?.proveedor_cliente || "Sin transportista",
    images: getDocumentImages(raw?.documentos),
    status: estatusToStatus(raw?.estatus || ""),
    statusLabel: ESTATUS_LABELS[raw?.estatus] || raw?.estatus || "",
    badgesList: [
      {
        label: "",
        value: ESTATUS_LABELS[raw?.estatus] || raw?.estatus || "",
        customClass: `px-3 py-0.5 text-xs font-semibold rounded-full border-0 shadow-none ${ESTATUS_BADGE[raw?.estatus] || "bg-gray-100 text-gray-600"}`,
      },
      ...(raw?.num_de_pase ? [{
        label: "",
        value: raw.num_de_pase,
        customClass: "bg-blue-50 text-blue-600 px-3 py-0.5 text-xs font-semibold rounded-full border-0 shadow-none",
      }] : [{
        label: "",
        value: "SIN PASE",
        customClass: "bg-amber-50 text-amber-600 px-3 py-0.5 text-xs font-semibold rounded-full border-0 shadow-none",
      }]),
    ],
    detailsList: [
      { icon: <Truck className="h-3 w-3" />,       label: "Transportista", value: raw?.proveedor_cliente },
      { icon: <User className="h-3 w-3" />,         label: "Conductor",     value: raw?.conductor },
      { icon: <Package className="h-3 w-3" />,      label: "Material",      value: raw?.material },
      { icon: <MapPin className="h-3 w-3" />,       label: "Andén",         value: raw?.anden_asignado },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Ingreso",       value: raw?.fecha_hora_ingreso },
    ],
    modalDetailsList: [
      { icon: <Truck className="h-3 w-3" />,       label: "Transportista", value: raw?.proveedor_cliente },
      { icon: <User className="h-3 w-3" />,         label: "Conductor",     value: raw?.conductor },
      { icon: <Package className="h-3 w-3" />,      label: "Material",      value: raw?.material },
      { icon: <MapPin className="h-3 w-3" />,       label: "Andén",         value: raw?.anden_asignado },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Ingreso",       value: raw?.fecha_hora_ingreso },
    ],
    rawData: raw,
  };
}
