import { MapPin, Navigation, ShieldCheck } from "lucide-react";
import { NormalizedArea } from "@/lib/areas";

export function mapAreaGrid(raw: NormalizedArea, base: any) {
  const { nombre, ubicacion, tipo, estado, disponibilidad, tagId, foto } = raw;

  const images = foto ? [foto] : ["/sin_imagen_rondines.png"];
  const esDisponible = disponibilidad.toLowerCase() === "disponible";

  const coords = raw.raw.geolocalizacion_area_ubicacion?.[0];
  const tieneGeolocalizacion =
    !!coords && (coords.latitude !== 0 || coords.longitude !== 0);
  const mapsUrl = tieneGeolocalizacion
    ? `https://www.google.com/maps?q=${coords!.latitude},${coords!.longitude}`
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
    description: ubicacion,
    visit_type: tipo,
    images,
    status: (esDisponible ? "disponible" : "ocupada") as any,
    statusLabel: disponibilidad || "-",
    badgesList: [
      {
        customClass:
          "bg-slate-100 hover:bg-slate-100 px-4 py-1 text-xs font-bold text-slate-600 rounded-xl border-0 shadow-none capitalize",
        label: tipo,
      },
      tagId
        ? {
            customClass:
              "bg-blue-50 hover:bg-blue-50 px-4 py-1 text-xs font-bold text-blue-600 rounded-xl border border-blue-100 shadow-none",
            label: "Con tag",
          }
        : {
            customClass:
              "bg-slate-100 hover:bg-slate-100 px-4 py-1 text-xs font-bold text-slate-500 rounded-xl border-0 shadow-none",
            label: "Sin tag",
          },
      ...(disponibilidad
        ? [
            {
              customClass: esDisponible
                ? "bg-green-100 hover:bg-green-100 px-4 py-1 text-xs font-bold text-green-600 rounded-xl border-0 shadow-none"
                : "bg-amber-100 hover:bg-amber-100 px-4 py-1 text-xs font-bold text-amber-600 rounded-xl border-0 shadow-none",
              label: disponibilidad,
            },
          ]
        : []),
    ],
    detailsList: [
      { icon: <MapPin className="h-3 w-3" />, label: "UBICACIÓN", value: ubicacion },
      { icon: <Navigation className="h-3 w-3" />, label: "GEOLOCALIZACIÓN", value: geolocalizacionValue },
      ...(estado
        ? [{ icon: <ShieldCheck className="h-3 w-3" />, label: "ESTATUS", value: estado }]
        : []),
    ],
    modalDetailsList: [
      { icon: null, label: "Nombre", value: nombre },
      { icon: null, label: "Ubicación", value: ubicacion },
      { icon: null, label: "Tipo", value: tipo },
      { icon: null, label: "Estatus", value: estado || "-" },
      { icon: null, label: "Disponibilidad", value: disponibilidad || "-" },
      { icon: null, label: "Tag/QR", value: tagId || "Sin tag" },
      { icon: null, label: "Geolocalización", value: geolocalizacionValue },
    ],
    rawData: raw.raw,
    vehiculos: null,
    equipos: null,
  };
}
