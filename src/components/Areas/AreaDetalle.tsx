"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  MoveLeft,
  MapPin,
  Tag as TagIcon,
  Layers,
  Power,
  Printer,
  Route,
  ClipboardCheck,
  ClipboardList,
  AlertTriangle,
  Wrench,
  Settings,
  Navigation,
} from "lucide-react";
import { useGetAreaById } from "@/hooks/Areas/useGetAreaById";
import { useAreaActions } from "@/hooks/Areas/useAreaActions";
import { normalizeArea } from "@/lib/areas";
import { AreaDisponibilidadMenu } from "@/components/table/areas-explorer/AreaDisponibilidadMenu";
import { ChecksAreaDashboard } from "./ChecksAreaDashboard";
import { FallasAreaDashboard } from "./FallasAreaDashboard";

type AreaTab = "rondines" | "checks" | "inspecciones" | "incidencias" | "fallas" | "configuracion";

const TABS: { key: AreaTab; label: string; icon: typeof Route }[] = [
  { key: "rondines", label: "Rondines", icon: Route },
  { key: "checks", label: "Checks Áreas", icon: ClipboardCheck },
  { key: "inspecciones", label: "Inspecciones", icon: ClipboardList },
  { key: "incidencias", label: "Incidencias", icon: AlertTriangle },
  { key: "fallas", label: "Fallas", icon: Wrench },
  { key: "configuracion", label: "Configuración", icon: Settings },
];

const AreaDetalle = ({ id, onClose }: { id: string; onClose?: () => void }) => {
  const router = useRouter();
  const { area, isLoadingArea } = useGetAreaById(id);
  const { handlePrintAreaQR, handleToggleAreaEstado } = useAreaActions();
  const [activeTab, setActiveTab] = useState<AreaTab>("rondines");

  const normalized = useMemo(() => (area ? normalizeArea(area, 0) : null), [area]);

  const handleVolver = () => (onClose ? onClose() : router.push("/dashboard/areas"));

  if (isLoadingArea) {
    return (
      <div className="flex flex-col items-center gap-3 h-32 justify-center">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-base text-slate-500">Cargando área...</span>
      </div>
    );
  }

  if (!normalized) {
    return <div className="p-8 text-center text-gray-400">Área no encontrada</div>;
  }

  const esActiva = normalized.estado?.toLowerCase() === "activa";
  const esDisponible = normalized.disponibilidad?.toLowerCase() === "disponible";

  const coords = normalized.raw.geolocalizacion_area_ubicacion?.[0];
  const tieneGeolocalizacion = !!coords && (coords.latitude !== 0 || coords.longitude !== 0);
  const mapsUrl = tieneGeolocalizacion
    ? `https://www.google.com/maps?q=${coords!.latitude},${coords!.longitude}`
    : null;

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen px-4 pt-2">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleVolver}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
            >
              <MoveLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">{normalized.nombre}</h2>
          </div>

          <div className="flex items-center gap-2">
            {normalized.folio && (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 ring-1 ring-blue-300/50">
                # {normalized.folio}
              </span>
            )}

            {normalized.estado && (
              <span
                className={`inline-flex capitalize items-center px-4 py-1.5 rounded-full text-sm font-semibold ${
                  esActiva
                    ? "bg-green-50 text-green-700 border border-green-200 ring-1 ring-green-300/50"
                    : "bg-slate-50 text-slate-500 border border-slate-200 ring-1 ring-slate-300/50"
                }`}
              >
                <span className={`w-2 h-2 rounded-full mr-2 ${esActiva ? "bg-green-500" : "bg-slate-400"}`} />
                {normalized.estado}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => handlePrintAreaQR(normalized.recordId)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all shadow-sm"
            title="Imprimir QR"
          >
            <Printer className="w-4 h-4" />
            Imprimir QR
          </button>

          <button
            onClick={() => handleToggleAreaEstado(normalized.recordId, normalized.estado)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
              esActiva
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            <Power className="w-4 h-4" />
            {esActiva ? "Desactivar" : "Activar"}
          </button>

          <div
            className="flex items-center justify-center p-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all shadow-sm"
            title="Cambiar disponibilidad"
          >
            <AreaDisponibilidadMenu recordId={normalized.recordId} iconClassName="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Foto + datos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Foto del área</h3>
        <div className="flex flex-col md:flex-row gap-6">
          {normalized.foto ? (
            <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
              <Image src={normalized.foto} alt={normalized.nombre} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-full max-w-md aspect-video rounded-xl flex items-center justify-center bg-slate-100 text-slate-300 text-sm shrink-0">
              Sin foto
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Ubicación
              </label>
              <span className="text-sm font-medium text-gray-800">{normalized.ubicacion || "-"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Layers className="w-3 h-3" /> Tipo
              </label>
              <span className="text-sm font-medium text-gray-800 capitalize">{normalized.tipo || "-"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <TagIcon className="w-3 h-3" /> Tag/QR
              </label>
              <span className="text-sm font-medium text-gray-800">
                {normalized.tagId ? "Con tag" : "Sin tag"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                Disponibilidad
              </label>
              <span
                className={`text-sm font-semibold w-fit px-2 py-0.5 rounded-full border ${
                  esDisponible
                    ? "bg-green-50 text-green-600 border-green-100"
                    : "bg-amber-50 text-amber-600 border-amber-100"
                }`}
              >
                {normalized.disponibilidad || "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Navigation className="w-3 h-3" /> Geolocalización
              </label>
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline w-fit"
                >
                  Ver en mapa
                </a>
              ) : (
                <span className="text-sm font-medium text-gray-800">N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs (mismas secciones que la app móvil) */}
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
          {activeTab === "checks" ? (
            <ChecksAreaDashboard ubicacion={normalized.ubicacion} area={normalized.nombre} />
          ) : activeTab === "fallas" ? (
            <FallasAreaDashboard ubicacion={normalized.ubicacion} area={normalized.nombre} />
          ) : activeTab === "configuracion" ? (
            <div className="flex flex-col gap-4 max-w-sm">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                  Tipo de área
                </label>
                <span className="text-base font-medium text-gray-800 capitalize">{normalized.tipo || "-"}</span>
              </div>
              <p className="text-sm text-gray-400">Edición de área — próximamente.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 gap-2">
              {(() => {
                const Icon = TABS.find((t) => t.key === activeTab)?.icon ?? ClipboardList;
                return <Icon className="w-8 h-8 text-gray-300" />;
              })()}
              <span className="text-sm">
                {TABS.find((t) => t.key === activeTab)?.label} — próximamente.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AreaDetalle;
