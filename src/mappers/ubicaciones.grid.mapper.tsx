import { MapPin, Navigation, Layers, Phone } from "lucide-react";
import { NormalizedUbicacion } from "@/lib/ubicaciones";

export function mapUbicacionGrid(raw: NormalizedUbicacion, base: any) {
  const { nombre, direccion, colonia, ciudad, estado, pais, telefono, email, areasCount, geolocalizacion } = raw;

  const images = ["/sin_imagen_rondines.png"];

  const direccionCompleta = [direccion, colonia, ciudad, estado]
    .filter(Boolean)
    .join(", ");

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

  return {
    ...base,
    title: nombre,
    description: direccionCompleta || "Sin dirección registrada",
    visit_type: pais,
    images,
    status: "completado" as any,
    statusLabel: `${areasCount} ${areasCount === 1 ? "área" : "áreas"}`,
    badgesList: [
      {
        customClass:
          "bg-blue-50 hover:bg-blue-50 px-4 py-1 text-xs font-bold text-blue-600 rounded-xl border border-blue-100 shadow-none",
        label: `${areasCount} ${areasCount === 1 ? "área" : "áreas"}`,
      },
      ...(estado
        ? [
            {
              customClass:
                "bg-slate-100 hover:bg-slate-100 px-4 py-1 text-xs font-bold text-slate-600 rounded-xl border-0 shadow-none",
              label: estado,
            },
          ]
        : []),
    ],
    detailsList: [
      { icon: <MapPin className="h-3 w-3" />, label: "DIRECCIÓN", value: direccionCompleta || "-" },
      { icon: <Navigation className="h-3 w-3" />, label: "GEOLOCALIZACIÓN", value: geolocalizacionValue },
      { icon: <Layers className="h-3 w-3" />, label: "ÁREAS", value: String(areasCount) },
    ],
    modalDetailsList: [
      { icon: null, label: "Nombre", value: nombre },
      { icon: null, label: "Dirección", value: direccion || "-" },
      { icon: null, label: "Colonia", value: colonia || "-" },
      { icon: null, label: "Ciudad", value: ciudad || "-" },
      { icon: null, label: "Estado", value: estado || "-" },
      { icon: null, label: "País", value: pais || "-" },
      { icon: <Phone className="h-3 w-3" />, label: "Teléfono", value: telefono || "-" },
      { icon: null, label: "Email", value: email || "-" },
      { icon: null, label: "Áreas", value: String(areasCount) },
      { icon: null, label: "Geolocalización", value: geolocalizacionValue },
    ],
    rawData: raw.raw,
    vehiculos: null,
    equipos: null,
  };
}
