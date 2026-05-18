"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ViewImage from "@/components/modals/view-image";

export interface ModalBadgeItem {
  label: string;
  value: string;
  customClass?: string;
}

interface ViewIncidenciaModalProps {
  record: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges?: ModalBadgeItem[];
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-4 border-b border-slate-100 pb-1">
      {children}
    </p>
  );
}

export function ViewIncidenciaModal({
  record,
  open,
  onOpenChange,
  badges = [],
}: ViewIncidenciaModalProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"generales" | "patrimonial" | "seguimientos">("generales");

  if (!record) return null;

  const raw = record.rawData || record;
  const evidencias: { file_url: string }[] = raw?.evidencia_incidencia || [];
  const personas: any[] = raw?.personas_involucradas_incidencia || [];
  const acciones: any[] = raw?.acciones_tomadas_incidencia || [];
  const afectaciones: any[] = raw?.afectacion_patrimonial_incidencia || [];
  const seguimientos: any[] = raw?.seguimientos_incidencia || [];

  const slides = evidencias.length > 0
    ? evidencias.map((e, i) => ({ src: e.file_url, label: `Imagen ${i + 1}` }))
    : [{ src: "/sin_imagen_rondines.png", label: "Sin imagen" }];

  const prevSlide = () => setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
  const nextSlide = () => setSlideIndex((i) => (i + 1) % slides.length);

  const tabs = [
    { key: "generales", label: "Generales" },
    { key: "patrimonial", label: "Afectación patrimonial" },
    { key: "seguimientos", label: "Seguimientos" },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSlideIndex(0); setActiveTab("generales"); } }}>
        <DialogContent className="p-0 overflow-hidden !max-w-[1200px] w-[95vw] sm:w-[92vw] h-[95vh] rounded-3xl shadow-2xl flex flex-col border-none bg-background">
        <DialogTitle className="sr-only">Detalle — {raw?.incidencia}</DialogTitle>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden sm:flex-row">

          {/* LEFT: carrusel */}
          <div className="relative sm:w-[45%] shrink-0 bg-background flex flex-col min-h-[350px] sm:min-h-0 p-4">
            <div className="relative flex-1 group overflow-hidden rounded-2xl shadow-xl bg-zinc-950 border border-border/40">
              <Image
                key={slides[slideIndex].src}
                src={slides[slideIndex].src}
                alt={slides[slideIndex].label}
                fill
                className="object-contain transition-all duration-700"
                priority
                onError={(e) => { (e.target as HTMLImageElement).src = "/sin_imagen_rondines.png"; }}
              />
              {slides.length > 1 && (
                <>
                  <div className="absolute inset-x-4 inset-y-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none px-2">
                    <button onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                      className="pointer-events-auto h-10 w-10 flex items-center justify-center bg-white hover:bg-white/90 text-black rounded-full shadow-xl transition-all">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                      className="pointer-events-auto h-10 w-10 flex items-center justify-center bg-white hover:bg-white/90 text-black rounded-full shadow-xl transition-all">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="absolute top-4 right-4 z-30">
                    <span className="bg-black/40 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                      {slideIndex + 1} / {slides.length}
                    </span>
                  </div>
                </>
              )}
              {raw?.fecha_hora_incidencia && (
                <div className="absolute bottom-5 left-4 z-30">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                    <span className="text-[10px] font-medium text-white/80">{raw.fecha_hora_incidencia}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: info */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden bg-background">
            <div className="px-7 pt-7 pb-3 shrink-0 space-y-3">

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {badges.map((badge, idx) => (
                  <div key={idx} className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full border",
                    badge.customClass || "bg-primary/5 border-primary/20 text-primary"
                  )}>
                    <span className="text-[9px] font-black uppercase tracking-[0.1em]">{badge.label}{badge.value}</span>
                  </div>
                ))}
              </div>

              {/* Título */}
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 leading-tight">{raw?.incidencia || "Incidencia"}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{raw?.categoria} / {raw?.sub_categoria}</p>
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
                    {tab.key === "seguimientos" && seguimientos.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[9px] font-bold">
                        {seguimientos.length}
                      </span>
                    )}
                    {tab.key === "patrimonial" && afectaciones.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-600 text-[9px] font-bold">
                        {afectaciones.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="overflow-y-auto flex-1 px-7 py-3 space-y-2">

              {/* GENERALES */}
              {activeTab === "generales" && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {/* <InfoRow label="Folio" value={raw?.folio} /> */}
                    <InfoRow label="Estatus" value={raw?.estatus} />
                    <InfoRow label="Prioridad" value={raw?.prioridad_incidencia} />
                    <InfoRow label="Ubicación" value={raw?.ubicacion_incidencia} />
                    <InfoRow label="Lugar del incidente" value={raw?.area_incidencia} />
                    <InfoRow label="Fecha y hora" value={raw?.fecha_hora_incidencia} />
                    <InfoRow label="Reporta" value={raw?.reporta_incidencia} />
                    <InfoRow label="Notificación" value={raw?.notificacion_incidencia} />
                    <InfoRow label="Reporta" value={raw?.reporta_incidencia} />
                    <InfoRow label="Subcategoría" value={raw?.sub_categoria} />
                    <InfoRow label="Tipo de daño" value={Array.isArray(raw?.tipo_dano_incidencia) ? raw.tipo_dano_incidencia.join(", ") : raw?.tipo_dano_incidencia} />
                    </div>
                    {raw?.comentario_incidencia && (
                    <div className="py-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Comentarios</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{raw.comentario_incidencia}</p>
                    </div>
                    )}
                    {raw?.documento_incidencia?.length > 0 && (
                    <div className="py-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Documentos</p>
                        <div className="flex flex-col gap-1">
                        {raw.documento_incidencia.map((doc: any, i: number) => (
                            <a key={i} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            📄 {doc.file_name}
                            </a>
                        ))}
                        </div>
                    </div>
                    )}
                  {/* Personas involucradas */}
                  {personas.length > 0 && (
                    <>
                      <SectionTitle>Personas involucradas</SectionTitle>
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              {["Nombre", "Rol", "Sexo", "Puesto", "Atención médica", "Retenido"].map(h => (
                                <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {personas.map((p, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-medium text-slate-700">{p.nombre_completo || "-"}</td>
                                <td className="px-3 py-2 text-slate-600">{p.rol || "-"}</td>
                                <td className="px-3 py-2 text-slate-600">{p.sexo || "-"}</td>
                                <td className="px-3 py-2 text-slate-600">{p.puesto || "-"}</td>
                                <td className="px-3 py-2 text-slate-600">{p.atencion_medica || "-"}</td>
                                <td className="px-3 py-2 text-slate-600">{p.retenido || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* Acciones tomadas */}
                  {acciones.length > 0 && (
                    <>
                      <SectionTitle>Acciones tomadas</SectionTitle>
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              {["Acciones", "Responsable", "Autoridad", "Folio ref.", "Llamó a policía"].map(h => (
                                <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {acciones.map((a, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-slate-700 max-w-[200px]">{a.acciones_tomadas || "-"}</td>
                                <td className="px-3 py-2 text-slate-600">{a.responsable || "-"}</td>
                                <td className="px-3 py-2 text-slate-600">{a.autoridad || "-"}</td>
                                <td className="px-3 py-2 text-slate-600">{a.numero_folio_referencia || "-"}</td>
                                <td className="px-3 py-2 text-slate-600">{a.llamo_a_policia || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* AFECTACIÓN PATRIMONIAL */}
              {activeTab === "patrimonial" && (
                <div>
                  {afectaciones.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-6">Sin afectación patrimonial registrada</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            {["Tipo", "Descripción", "Estatus", "Monto estimado", "Duración estimada"].map(h => (
                              <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {afectaciones.map((af, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-medium text-slate-700">{af.tipo_afectacion || "-"}</td>
                              <td className="px-3 py-2 text-slate-600 max-w-[180px]">{af.descripcion_afectacion || "-"}</td>
                              <td className="px-3 py-2 text-slate-600">{af.estatus_afectacion || "-"}</td>
                              <td className="px-3 py-2 text-slate-600">${af.monto_estimado ?? "-"}</td>
                              <td className="px-3 py-2 text-slate-600">{af.duracion_estimada || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SEGUIMIENTOS */}
              {activeTab === "seguimientos" && (
                <div>
                  {seguimientos.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-6">Sin seguimientos registrados</p>
                  ) : (
                    <div className="space-y-3">
                      {seguimientos.map((seg, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 overflow-hidden">
                          <div className="p-3 bg-slate-50 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600">Seguimiento {i + 1}</span>
                            <span className="text-[10px] text-slate-400">{seg.fecha_inicio_seg || ""}</span>
                          </div>
                          <div className="p-3 space-y-2">
                            {seg.accion_correctiva_incidencia && (
                              <div>
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Acción correctiva</p>
                                <p className="text-sm text-slate-700">{seg.accion_correctiva_incidencia}</p>
                              </div>
                            )}
                            {seg.incidencia_personas_involucradas && (
                              <div>
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Personas involucradas</p>
                                <p className="text-sm text-slate-700">{seg.incidencia_personas_involucradas}</p>
                              </div>
                            )}
                            {seg.tiempo_transcurrido && (
                              <div>
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Tiempo transcurrido</p>
                                <p className="text-sm text-slate-700">{seg.tiempo_transcurrido}</p>
                              </div>
                            )}
                            {/* Evidencias */}
                            {seg.incidencia_evidencia_solucion?.length > 0 && (
                                <div>
                                    <p className="text-[0px] font-bold uppercase text-slate-400 mb-1">Evidencias</p>
                                    <ViewImage imageUrl={seg.incidencia_evidencia_solucion} size="lg"/>
                                </div>
                                )}
                            {/* Documentos */}
                            {seg.incidencia_documento_solucion?.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Documentos</p>
                                <div className="flex flex-col gap-1">
                                  {seg.incidencia_documento_solucion.map((doc: any, j: number) => (
                                    <a key={j} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                      📄 {doc.file_name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}