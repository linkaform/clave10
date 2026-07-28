"use client";

import { useState } from "react";
import {
  MapPin,
  Navigation,
  Phone,
  Mail,
  Layers,
  Pencil,
} from "lucide-react";
import { useGetUbicacionById } from "@/hooks/Ubicaciones/useGetUbicacionById";
import { normalizeUbicacion } from "@/lib/ubicaciones";
import { UbicacionFormModal } from "./UbicacionFormModal";

const UbicacionDetalle = ({ id }: { id: string }) => {
  const { ubicacion, isLoadingUbicacion } = useGetUbicacionById(id);
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoadingUbicacion) {
    return (
      <div className="flex flex-col items-center gap-3 h-32 justify-center">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-base text-slate-500">Cargando ubicación...</span>
      </div>
    );
  }

  if (!ubicacion) {
    return <div className="p-8 text-center text-gray-400">Ubicación no encontrada</div>;
  }

  const normalized = normalizeUbicacion(ubicacion, 0);
  const { nombre, direccion, colonia, ciudad, estado, pais, codigoPostal, telefono, email, areasCount, geolocalizacion, folio } = normalized;

  const mapsUrl = geolocalizacion
    ? `https://www.google.com/maps?q=${geolocalizacion.latitude},${geolocalizacion.longitude}`
    : null;

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen px-4 pt-2">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{nombre}</h2>
          {folio && (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 ring-1 ring-blue-300/50">
              # {folio}
            </span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all shadow-sm"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Dirección y contacto</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Dirección
            </label>
            <span className="text-sm font-medium text-gray-800">
              {[direccion, colonia].filter(Boolean).join(", ") || "-"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ciudad</label>
            <span className="text-sm font-medium text-gray-800">{ciudad || "-"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Estado</label>
            <span className="text-sm font-medium text-gray-800">{estado || "-"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">País</label>
            <span className="text-sm font-medium text-gray-800">{pais || "-"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Código Postal</label>
            <span className="text-sm font-medium text-gray-800">{codigoPostal || "-"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Phone className="w-3 h-3" /> Teléfono
            </label>
            <span className="text-sm font-medium text-gray-800">{telefono || "-"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </label>
            <span className="text-sm font-medium text-gray-800">{email || "-"}</span>
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Navigation className="w-3 h-3" /> Geolocalización
            </label>
            {mapsUrl ? (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline w-fit">
                Ver en mapa
              </a>
            ) : (
              <span className="text-sm font-medium text-gray-800">N/A</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-2 text-gray-800">
          <Layers className="w-4 h-4" />
          <span className="font-semibold text-sm">Áreas registradas</span>
          <span className="ml-auto text-sm font-bold text-blue-600">{areasCount}</span>
        </div>
      </div>

      <UbicacionFormModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        ubicacion={normalized}
      />
    </div>
  );
};

export default UbicacionDetalle;
