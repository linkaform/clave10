/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ArrowUpRight, Camera } from "lucide-react";
import { PhotoRecord } from "@/types/bitacoras";
import { cn } from "@/lib/utils";

export interface ModalBadgeItem {
  label: string;
  value: string;
  customClass?: string;
}

interface PhotoCheckAreaModalProps {
  record: PhotoRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges?: ModalBadgeItem[];
  children?: React.ReactNode;
}

interface ListItemProps {
  label: string;
  value: string | string[];
}

function ListItem({ label, value }: ListItemProps) {
  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-0.5">{label}</p>
      <div className="flex flex-wrap gap-2 items-center">
        {Array.isArray(value) ? (
          value.map((val, i) => (
            <Badge key={i} variant="outline"
              className="bg-slate-100 text-slate-600 border-0 rounded-md px-2 py-0.5 text-xs font-normal shadow-none">
              {val}
            </Badge>
          ))
        ) : (
          <p className="text-[15px] font-medium text-[#1e293b] leading-snug">{value || "\u00A0"}</p>
        )}
      </div>
    </div>
  );
}

export function PhotoCheckAreaModal({
  record,
  open,
  onOpenChange,
  badges = [],
  children,
}: PhotoCheckAreaModalProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"generales" | "checklist" | "incidencias">("generales");

  if (!record) return null;
  
  const rawData = (record as any).rawData || {};
  const rondinData = rawData?.rondin || {};
  const incidencias: any[] = rawData?.grupo_incidencias_check || [];
  const checksData: any[] = rawData?.checks_data || [];
//   const urlRondin = rawData?.url_rondin || "";
  const comentario = rawData?.comentario_check_area || "-";
  const fechaInspeccion = rawData?.fecha_inspeccion_area || "-";
  const asignado = rondinData?.asignado_a || "-";
  const recorrido = rondinData?.nombre_recorrido || "-";
  const ubicacion = rawData?.incidente_location?.[0] || rondinData?.ubicacion || "-";
  const checkStatus = rawData?.check_status?.replace(/_/g, " ") || "-";
  
  const slides =
    record.images && record.images.length > 0
      ? record.images.map((img, i) => ({ src: img, label: `Imagen ${i + 1}` }))
      : [{ src: "/placeholder.svg", label: "Sin imagen" }];

  const prevSlide = () => setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
  const nextSlide = () => setSlideIndex((i) => (i + 1) % slides.length);

  const tabs = [
    { key: "generales", label: "Generales" },
    { key: "checklist", label: "Checklist" },
    { key: "incidencias", label: "Incidencias" },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSlideIndex(0); setActiveTab("generales"); } }}>
      <DialogContent className="p-0 overflow-hidden !max-w-[1000px] w-[95vw] sm:w-[92vw] h-[95vh] rounded-3xl shadow-2xl flex flex-col border-none bg-background">
        <DialogTitle className="sr-only">Detalle — {record.title}</DialogTitle>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden sm:flex-row">

          {/* LEFT: Image carousel */}
          <div className="relative sm:w-[50%] lg:w-[55%] shrink-0 bg-background flex flex-col min-h-[450px] sm:min-h-0 p-4">
            <div className="relative flex-1 group overflow-hidden rounded-2xl shadow-xl bg-zinc-950 border border-border/40">
              <Image
                key={slides[slideIndex].src}
                src={slides[slideIndex].src}
                alt={slides[slideIndex].label}
                fill
                className="object-contain transition-all duration-700 ease-in-out"
                priority
                onError={(e) => { (e.target as HTMLImageElement).src = "/sin_imagen_rondines.png"; }}
              />

              {slides.length > 1 && (
                <div className="absolute inset-x-4 inset-y-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none px-2">
                  <button onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="pointer-events-auto h-11 w-11 flex items-center justify-center bg-white hover:bg-white/90 text-black rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="pointer-events-auto h-11 w-11 flex items-center justify-center bg-white hover:bg-white/90 text-black rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95">
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              )}

              {slides.length > 1 && (
                <div className="absolute top-5 right-5 z-30">
                  <span className="bg-black/40 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 tracking-widest uppercase">
                    {slideIndex + 1} / {slides.length}
                  </span>
                </div>
              )}

              {fechaInspeccion && (
                <div className="absolute bottom-6 left-5 z-30">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                    <span className="text-[10px] font-medium text-white/80">{fechaInspeccion}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Info panel */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden bg-background">
            <div className="px-8 pt-8 pb-4 shrink-0 space-y-3">

              {/* Badges + botón ir al rondín */}
              <div className="flex flex-wrap gap-1.5">
                {badges.slice(0, 3).map((badge, idx) => (
                    <div key={idx} className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full border",
                    badge.customClass || "bg-primary/5 border-primary/20 text-primary"
                    )}>
                    <span className="text-[9px] font-black uppercase tracking-[0.1em]">
                        {badge.label}{badge.value}
                    </span>
                    </div>
                ))}
                {incidencias.length > 0 && (
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                    <span className="text-[9px] font-black uppercase tracking-[0.1em]">
                        {incidencias.length} incidencia{incidencias.length > 1 ? "s" : ""}
                    </span>
                    </div>
                )}
                </div>

                {/* Title + botón */}
                <div className="flex items-start justify-between gap-4 pt-4">
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-tight">{record.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
                </div>
                {rondinData?.id && (
                    <a
                    href={`/dashboard/rondines?tab=rondines&id=${rondinData.id}`}
                    className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold transition-all shadow-lg shadow-blue-200 border border-blue-500">
                    Ir al rondín
                    <ArrowUpRight className="w-4 h-4" />
                    </a>
                )}
                </div>

              {/* Tabs */}
              <div className="flex gap-0 border-b border-slate-200">
                {tabs.map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "px-4 pb-2 pt-1 text-sm font-medium border-b-2 transition-colors",
                      activeTab === tab.key
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    )}>
                    {tab.label}
                    {tab.key === "incidencias" && incidencias.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-red-600 text-[9px] font-bold">
                        {incidencias.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="overflow-y-auto flex-1 px-8 py-4 no-scrollbar">

            {activeTab === "generales" && (
            <div className="space-y-3">
                <div className="flex flex-col">
                <ListItem label="Ubicación" value={ubicacion} />
                <ListItem label="Rondin" value={recorrido} />
                <ListItem label="Realizado por" value={asignado} />
                <ListItem label="Fecha de inspección" value={fechaInspeccion} />
                <ListItem label="Estatus del check" value={checkStatus} />
                </div>
                {comentario && (
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1">Comentarios</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{comentario}</p>
                </div>
                )}
            </div>
            )}

              {activeTab === "checklist" && (
                <div>
                  {checksData.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-6">Sin checklist registrado</p>
                  ) : (
                    <div className="space-y-2">
                      {checksData.map((check: any, i: number) => {
                        const comentarioCheck = check.comentarios_check || "Sin comentarios";
                        const fecha = check.fecha_check || "";
                        const evidencia = check.evidencias_check?.[0]?.file_url || null;
                        return (
                          <div key={i} className="flex items-center gap-3 py-3 px-3 bg-slate-100 border border-slate-100 rounded-xl">
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-200 relative">
                              {evidencia ? (
                                <Image src={evidencia} alt={`Check ${i + 1}`} fill className="object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).src = "/sin_imagen_rondines.png"; }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Camera className="w-4 h-4 text-slate-300" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 leading-tight">{comentarioCheck}</p>
                              {fecha && <p className="text-xs text-slate-400 mt-0.5">{fecha}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "incidencias" && (
                <div>
                  {incidencias.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-6">Sin incidencias registradas</p>
                  ) : (
                    <div className="space-y-3">
                      {incidencias.map((inc: any, i: number) => {
                        const img = inc.incidente_evidencia?.[0]?.file_url || "/sin_imagen_rondines.png";
                        const subcategoria = inc.sub_categoria || inc.subcategoria || "";
                        const categoria = inc.categoria || "";
                        const incidente = inc.incidencia || inc.incidente_open || "Sin incidente";
                        const accion = inc.incidente_accion || "";
                        const comentarioInc = inc.comentario_incidente_bitacora || "";
                        return (
                          <div key={i} className="rounded-xl border border-slate-100 overflow-hidden">
                            <div className="flex items-start gap-3 p-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                                <Image src={img} alt={incidente} fill className="object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).src = "/sin_imagen_rondines.png"; }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 leading-tight">{incidente}</p>
                                <div className="flex gap-1.5 mt-1 flex-wrap">
                                  {categoria && (
                                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{categoria}</span>
                                  )}
                                  {subcategoria && (
                                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-500">{subcategoria}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {comentarioInc && (
                              <div className="bg-slate-50 border-t border-slate-100 px-3 py-2">
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Comentario</p>
                                <p className="text-xs text-slate-600">{comentarioInc}</p>
                              </div>
                            )}
                            {accion && (
                              <div className="bg-green-50 border-t border-green-100 px-3 py-2">
                                <p className="text-[10px] font-bold uppercase text-green-600 mb-0.5">Acción tomada</p>
                                <p className="text-xs text-green-700">{accion}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {children && <div className="space-y-4 mt-4">{children}</div>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}