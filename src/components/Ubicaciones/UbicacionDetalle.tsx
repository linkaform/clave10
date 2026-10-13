"use client";

import { useMemo, useState } from "react";
import {
  MoveLeft,
  MapPin,
  Navigation,
  Phone,
  Mail,
  Layers,
  Building2,
  Users,
  Settings,
} from "lucide-react";
import { useGetUbicacionById } from "@/hooks/Ubicaciones/useGetUbicacionById";
import { useCatalogDirecciones } from "@/hooks/Areas/useCatalogDirecciones";
import { normalizeUbicacion } from "@/lib/ubicaciones";
import { EditarUbicacionForm } from "./EditarUbicacionForm";
import { AreasDeUbicacion } from "./AreasDeUbicacion";
import { EmpleadosDeUbicacion } from "./EmpleadosDeUbicacion";

export type UbicacionTab = "generales" | "areas" | "empleados" | "configuracion";

const TABS: { key: UbicacionTab; label: string; icon: typeof Building2 }[] = [
  { key: "generales", label: "Generales", icon: Building2 },
  { key: "areas", label: "Áreas", icon: Layers },
  { key: "empleados", label: "Empleados", icon: Users },
  { key: "configuracion", label: "Configuración", icon: Settings },
];

const UbicacionDetalle = ({
  id,
  onClose,
  initialTab = "generales",
}: {
  id: string;
  onClose?: () => void;
  /** Tab con el que abre; el lápiz de editar abre en "configuracion". */
  initialTab?: UbicacionTab;
}) => {
  const { ubicacion, isLoadingUbicacion } = useGetUbicacionById(id);
  const [activeTab, setActiveTab] = useState<UbicacionTab>(initialTab);

  const normalized = useMemo(() => (ubicacion ? normalizeUbicacion(ubicacion, 0) : null), [ubicacion]);
  // La forma de Ubicaciones no trae el teléfono del contacto: se toma del catálogo.
  const { direcciones } = useCatalogDirecciones();
  const contactoCatalogo = direcciones.find((d) => d.nombre_direccion === normalized?.contacto);

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

  if (!normalized) {
    return <div className="p-8 text-center text-gray-400">Ubicación no encontrada</div>;
  }

  const { nombre, direccion, colonia, ciudad, estado, pais, codigoPostal, geolocalizacion, folio } = normalized;
  const telefono = normalized.telefono || contactoCatalogo?.telefono || "";
  const email = normalized.email || contactoCatalogo?.email || "";

  const mapsUrl = geolocalizacion
    ? `https://www.google.com/maps?q=${geolocalizacion.latitude},${geolocalizacion.longitude}`
    : null;

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen px-4 pt-2">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
              >
                <MoveLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900">{nombre}</h2>
          </div>
          {folio && (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 ring-1 ring-blue-300/50">
              # {folio}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-4 min-h-[300px] min-w-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 border-b border-gray-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="px-2 pb-2">
          {activeTab === "generales" && (
            <div>
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
          )}

          {activeTab === "areas" && <AreasDeUbicacion ubicacion={nombre} />}

          {activeTab === "empleados" && <EmpleadosDeUbicacion ubicacion={nombre} />}

          {activeTab === "configuracion" && (
            <div className="max-w-2xl">
              <EditarUbicacionForm ubicacion={normalized} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UbicacionDetalle;
