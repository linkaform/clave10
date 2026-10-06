import { Layers, MapPin, Navigation, Phone } from "lucide-react";
import { NormalizedUbicacion } from "@/lib/ubicaciones";

export function mapUbicacionGrid(raw: NormalizedUbicacion, base: any) {
  const { nombre, direccion, colonia, ciudad, estado, telefono, geolocalizacion, areasCount } = raw;

  const domicilio = [direccion, colonia].filter(Boolean).join(", ");
  const ciudadEstado = [ciudad, estado].filter(Boolean).join(", ");

  const mapsUrl = geolocalizacion
    ? `https://www.google.com/maps?q=${geolocalizacion.latitude},${geolocalizacion.longitude}`
    : null;
  const geolocalizacionValue = mapsUrl ? (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-blue-600 hover:underline"
    >
      Ver en mapa
    </a>
  ) : (
    "N/A"
  );

  const areasLabel = `${areasCount} ${areasCount === 1 ? "área" : "áreas"}`;

  return {
    ...base,
    folio: raw.folio || base.folio,
    title: nombre,
    description: ciudadEstado || domicilio || "-",
    images: ["/sin_imagen_rondines.png"],
    status: "none" as any,
    badgesList: [
      {
        customClass:
          "bg-blue-50 hover:bg-blue-50 px-4 py-1 text-xs font-bold text-blue-600 rounded-xl border border-blue-100 shadow-none",
        label: areasLabel,
      },
    ],
    detailsList: [
      { icon: <MapPin className="h-3 w-3" />, label: "DIRECCIÓN", value: domicilio || "-" },
      { icon: <Phone className="h-3 w-3" />, label: "TELÉFONO", value: telefono || "-" },
      { icon: <Layers className="h-3 w-3" />, label: "ÁREAS", value: areasLabel },
      { icon: <Navigation className="h-3 w-3" />, label: "GEOLOCALIZACIÓN", value: geolocalizacionValue },
    ],
    modalDetailsList: [],
    // record_id normalizado: el click de la tarjeta abre el panel con él.
    rawData: { ...raw.raw, record_id: raw.recordId },
    vehiculos: null,
    equipos: null,
  };
}
