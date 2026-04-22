"use client";

import { useState, useId } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map-v2"), { ssr: false });

interface MapItem {
  nombre_area: string;
  geolocation_area?: { latitude: number; longitude: number };
  id: string;
}

interface PhotoDetailModalProps {
  record: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
  mapData?: MapItem[];
}

interface ListItemProps {
  label: string;
  value: string | string[];
}

const DEMO_MAP_DATA: MapItem[] = [
  { id: "1", nombre_area: "Almacén Central", geolocation_area: { latitude: 25.6866, longitude: -100.3161 } },
  { id: "2", nombre_area: "Zona de Carga",   geolocation_area: { latitude: 25.6872, longitude: -100.3148 } },
  { id: "3", nombre_area: "Estacionamiento", geolocation_area: { latitude: 25.6858, longitude: -100.3155 } },
  { id: "4", nombre_area: "Perímetro Norte", geolocation_area: { latitude: 25.6880, longitude: -100.3140 } },
  { id: "5", nombre_area: "Oficinas Planta Baja", geolocation_area: { latitude: 25.6863, longitude: -100.3168 } },
];

const DEMO_INCIDENCIAS = [
  { id: "1", title: "Seguridad - Puerta sin cerrar", time: "22:30:15", img: "/mountain.svg" },
  { id: "2", title: "Mantenimiento - Iluminación",   time: "23:15:42", img: "/mountain.svg" },
  { id: "3", title: "Seguridad - Objeto sospechoso", time: "23:45:10", img: "/mountain.svg" },
];
const DEMO_COMENTARIOS = [
  { id: "1", title: "Todo en orden al inicio",       time: "22:05:00", img: "/mountain.svg" },
  { id: "2", title: "Revisión completada sin novedades", time: "23:50:00", img: "/mountain.svg" },
];

const DEMO_AREAS = [
  { nombre: "Almacén Central",    hora: "22:15:10", img: "/mountain.svg" },
  { nombre: "Zona de Carga",      hora: "22:18:12", img: "/mountain.svg" },
  { nombre: "Estacionamiento",    hora: "22:21:14", img: "/mountain.svg" },
  { nombre: "Perímetro Norte",    hora: "22:24:16", img: "/mountain.svg" },
  { nombre: "Oficinas Planta Baja", hora: "22:27:18", img: "/mountain.svg" },
  { nombre: "Sala de Máquinas",   hora: "22:30:20", img: "/mountain.svg" },
  { nombre: "Caseta de Vigilancia", hora: "22:33:22", img: "/mountain.svg" },
  { nombre: "Zona de Descanso",   hora: "22:36:24", img: "/mountain.svg" },
  { nombre: "Baños Planta Baja",  hora: "22:39:26", img: "/mountain.svg" },
];

function ListItem({ label, value }: ListItemProps) {
  return (
    <div className="py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-0.5">{label}</p>
      <div className="flex flex-wrap gap-1.5 items-center">
        {Array.isArray(value) ? (
          value.map((val, i) => (
            <Badge key={i} variant="outline"
              className="bg-slate-100 text-slate-600 border-0 rounded-md px-2 py-0.5 text-xs font-normal shadow-none">
              {val}
            </Badge>
          ))
        ) : (
          <p className="text-[14px] font-medium text-[#1e293b] leading-snug">{value || "\u00A0"}</p>
        )}
      </div>
    </div>
  );
}

function IncidenciaItem({ title, time, img }: { title: string; time: string; img: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100 relative">
        <Image src={img} alt={title} fill className="object-cover" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 leading-tight truncate">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

export function PhotoRondinCardModal({
  record,
  open,
  onOpenChange,
  children,
  mapData,
}: PhotoDetailModalProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"incidencias" | "comentarios">("incidencias");
  const [areaSearch, setAreaSearch] = useState("");
  const modalId = useId();

  if (!record) return null;

  const slides =
    record.images && record.images.length > 0
      ? record.images.map((img: any, i: number) => ({ src: img, label: `Imagen ${i + 1}` }))
      : [{ src: "/placeholder.svg", label: "Sin imagen" }];

  const prevSlide = () => setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
  const nextSlide = () => setSlideIndex((i) => (i + 1) % slides.length);

  const effectiveMapData = mapData && mapData.length > 0 ? mapData : DEMO_MAP_DATA;

  const filteredAreas = DEMO_AREAS.filter(a =>
    a.nombre.toLowerCase().includes(areaSearch.toLowerCase())
  );

  const totalAreas = DEMO_AREAS.length;
  const inspectedAreas = DEMO_AREAS.length; 
  const progress = Math.round((inspectedAreas / totalAreas) * 100);

  const detailsList = record.modalDetailsList || [];

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSlideIndex(0); setAreaSearch(""); } }}>
      <DialogContent className="p-0 overflow-hidden !max-w-[1400px] w-[98vw] h-[95vh] rounded-3xl shadow-2xl flex flex-col border-none bg-background">
        <DialogTitle className="sr-only">Detalle — {record.title}</DialogTitle>

        <div className="px-6 pt-5 pb-3 shrink-0 border-b border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Detalle del rondín</p>
          <h2 className="text-xl font-extrabold text-blue-600 leading-tight">{record.title}</h2>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">

          <div className="w-[240px] shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/60 overflow-hidden">
            <div className="px-4 pt-5 pb-3 shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Áreas inspeccionadas</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-black text-slate-800">{inspectedAreas}/{totalAreas}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="px-3 pb-2 shrink-0">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar área..."
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  className="text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-400 w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 no-scrollbar">
              {filteredAreas.map((area, idx) => (
                <div key={idx} className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-white transition-colors">
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-slate-200 relative">
                    <Image src={area.img} alt={area.nombre} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 leading-tight truncate">{area.nombre}</p>
                    <p className="text-[10px] text-slate-400">{area.hora}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col w-[380px] shrink-0 border-r border-slate-100 overflow-hidden bg-background h-full">
          <div className="relative flex-1 group overflow-hidden bg-zinc-950">
            <Image
              key={slides[slideIndex].src}
              src={slides[slideIndex].src}
              alt={slides[slideIndex].label}
              fill
              className="object-contain transition-all duration-500 ease-in-out"
              priority
            />

            {record.images && record.images.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 z-10">
                <p className="text-white text-xs font-semibold">Almacén Central - Entrada Principal</p>
                <p className="text-white/60 text-[10px]">2026-03-24 22:15:32</p>
              </div>
            )}

            {slides.length > 1 && (
              <>
                <div className="absolute inset-x-3 inset-y-0 flex items-center justify-between z-20 pointer-events-none">
                  <button onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="pointer-events-auto h-9 w-9 flex items-center justify-center bg-white/90 text-black rounded-full shadow-lg transition-all hover:scale-105">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="pointer-events-auto h-9 w-9 flex items-center justify-center bg-white/90 text-black rounded-full shadow-lg transition-all hover:scale-105">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="absolute top-3 right-3 z-30">
                  <span className="bg-black/50 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {slideIndex + 1} / {slides.length}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex-1">
            <div className="h-full w-full">
              {/* <MapView map_data={effectiveMapData} /> */}
            </div>
          </div>

          </div>

          <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background">
            <div className="px-6 pt-6 pb-4 shrink-0">
              <div className="flex flex-wrap gap-1.5 justify-end mb-3">
                {record.folio && (
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#2987F7]">
                    <span className="text-[9px] font-black uppercase tracking-[0.1em]">#{record.folio}</span>
                  </div>
                )}
                {record.visit_type && (
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F3E8FF] text-[#9159F4]">
                    <span className="text-[9px] font-black uppercase tracking-[0.1em]">{record.visit_type}</span>
                  </div>
                )}
                {record.status && (
                  <div className={cn("inline-flex items-center px-2 py-0.5 rounded-full",
                    record.status === "Realizado" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600")}>
                    <span className="text-[9px] font-black uppercase tracking-[0.1em]">{record.status}</span>
                  </div>
                )}
              </div>

              {record.description && (
                <p className="text-sm text-slate-500">{record.description}</p>
              )}
            </div>

            <div className="px-6 shrink-0">
              <div className="grid grid-cols-2 gap-x-6 gap-y-0 border-t border-slate-100 pt-3">
                {detailsList.map((item:any, index:number) => {
                  const hasValue = Array.isArray(item.value)
                    ? item.value.length > 0
                    : item.value !== null && item.value !== undefined && item.value !== "";
                  if (!hasValue) return null;
                  const isFullWidth = Array.isArray(item.value);
                  return (
                    <div key={index} className={isFullWidth ? "col-span-2" : "col-span-1"}>
                      <ListItem label={item.label || `Detalle ${index + 1}`} value={item.value} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0 px-6 mt-3 overflow-hidden">
              <div className="flex gap-0 border-b border-slate-200 shrink-0">
                {(["incidencias", "comentarios"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 pb-2 pt-1 text-sm font-medium border-b-2 transition-colors capitalize",
                      activeTab === tab
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    )}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
                {activeTab === "incidencias" && (
                  <div>
                    {DEMO_INCIDENCIAS.map((item) => (
                      <IncidenciaItem key={item.id} {...item} />
                    ))}
                  </div>
                )}
                {activeTab === "comentarios" && (
                  <div>
                    {DEMO_COMENTARIOS.map((item) => (
                      <IncidenciaItem key={item.id} {...item} />
                    ))}
                  </div>
                )}
              </div>

              {children && (
                <div className="pt-3 border-t border-slate-100 shrink-0">
                  {children}
                </div>
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}