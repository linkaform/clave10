"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search, ArrowLeft, Camera, Calendar, FileText, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { MapItem } from "@/components/table/rondines/recorridos/table";
import dynamic from "next/dynamic";
import ViewImage from "@/components/modals/view-image";
const MapView = dynamic(() => import("@/components/map-v2"), { ssr: false });

interface PhotoDetailModalProps {
  record: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
  mapData?: MapItem[];
  action?: React.ReactNode | ((record: any) => React.ReactNode);
}

interface ListItemProps {
  label: string;
  value: string | string[];
}

function ListItem({ label, value }: ListItemProps) {
  return (
    <div className="py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-0.5">{label}</p>
      <div className="flex flex-wrap gap-1.5 items-center">
        {Array.isArray(value) ? (
          value.map((val, i) => (
            <Badge key={i} variant="outline"
              className="bg-slate-100 text-slate-600 border-0 rounded-md px-2 py-0.5 text-sm font-normal shadow-none">
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
function IncidenciaListItem({ item, onClick, onImageClick }: { 
  item: any; 
  onClick: () => void;
  onImageClick?: (url: string) => void;
}) {
  const img = item.evidencias?.[0]?.file_url || item.incidente_evidencia?.[0]?.file_url || "/sin_imagen_rondines.png";
  const incidente = item.incidente || item.incidente_open || "Sin incidente";
  const fecha = item.fecha_hora_incidente || item.fecha_hora_incidente_bitacora || "";  

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 py-3 px-3 mb-2 last:mb-0 bg-slate-100 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
    >
      <div 
        className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-200 relative"
        onClick={(e) => { e.stopPropagation(); onImageClick?.(img); }}
      >
        <Image 
          src={img} 
          alt={incidente} 
          fill 
          className="object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/sin_imagen_rondines.png"; }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{incidente}</p>
        {fecha && (  
          <p className="text-xs text-slate-400 mt-0.5">{fecha}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
    </div>
  );
}
function IncidenciaDetailPanel({ item, onBack, onSetImage }: { 
  item: any; 
  onBack: () => void;
  onSetImage?: (url: string) => void;
}) {
  const evidencias: any[] = item.evidencias || item.incidente_evidencia || [];
  const documentos: any[] = item.documentos || item.incidente_documento || [];
  const subcategoria = item.subcategoria || item.sub_categoria || "-";
  const incidente = item.incidente || item.incidente_open || "Sin incidente";
  const comentarios = item.comentarios || item.comentario_incidente_bitacora || "-";
  const accionTomada = item.accion_tomada || item.incidente_accion || "-";
  const fechaHora = item.fecha_hora_incidente || item.fecha_hora_incidente_bitacora || "-";
  const area = item.area_incidente || item.nombre_area_salida || "-";
  const categoria = item.categoria || "-";

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="px-6 pt-4 pb-0 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </button>

        <div className="flex items-start justify-between gap-3 mb-5">
          <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">{incidente}</h3>
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            {subcategoria && (
              <span className="text-[13px] font-bold px-3 py-1 rounded-full bg-red-100 text-red-600 border border-red-200">
                {subcategoria}
              </span>
            )}
            {categoria && categoria !== "-" && (
              <span className="text-[13px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {categoria}
              </span>
            )}
          </div>
        </div>

        <div className="border-b border-slate-100 mb-4" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 no-scrollbar space-y-4 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Área</p>
          <p className="text-sm font-medium text-slate-800">{area}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Fecha y hora</p>
          <p className="text-sm font-medium text-slate-800">{fechaHora}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Comentarios</p>
          <p className="text-sm text-slate-700 leading-relaxed">{comentarios}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Acción tomada</p>
          <p className="text-sm text-slate-700 leading-relaxed">{accionTomada}</p>
        </div>

        {/* Evidencias — solo en carrusel central, thumbnails clickeables */}
        {evidencias.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Evidencias ({evidencias.length})
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {evidencias.map((ev: any, i: number) => {
                const url = typeof ev === "string" ? ev : ev.file_url;
                return (
                  <div
                    key={i}
                    className="relative w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-100 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                    style={{ height: "90px" }}
                    onClick={() => onSetImage?.(url)}
                  >
                    <Image
                      src={url}
                      alt={`Evidencia ${i + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/sin_imagen_rondines.png"; }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Documentos */}
        {documentos.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Documentos ({documentos.length})
              </p>
            </div>
            <div className={`space-y-2 ${documentos.length > 5 ? "max-h-[220px] overflow-y-auto pr-1" : ""}`}>
              {documentos.map((doc: any, i: number) => {
                const url = typeof doc === "string" ? doc : doc.file_url;
                const name = typeof doc === "string"
                  ? `Documento ${i + 1}`
                  : (doc.file_name || `Documento ${i + 1}`);
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-700 group-hover:text-blue-600 truncate flex-1">
                      {name}
                    </p>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ComentarioListItem({ item }: { item: any }) {
  const texto = item.grupo_comentarios_generales_texto || "";
  const fecha = item.grupo_comentarios_generales_fecha || "";
  const autor = item.grupo_comentarios_generales_autor || item.autor || "Guardia en turno";

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold text-slate-800">{autor}</p>
        {fecha && <p className="text-[13px] text-slate-500">{fecha}</p>}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{texto}</p>
    </div>
  );
}

function ComentarioDetailPanel({ item, onBack }: { item: any; onBack: () => void }) {
  const texto = item.grupo_comentarios_generales_texto || "";
  const fecha = item.grupo_comentarios_generales_fecha || "";

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="px-6 pt-5 pb-4 shrink-0 border-b border-slate-100 flex items-center gap-3">
        <button
          onClick={onBack}
          className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detalle de comentario</p>
          <h3 className="text-base font-extrabold text-blue-600 leading-tight truncate">Comentario general</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar space-y-5">
        {fecha && (
          <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Fecha y hora</p>
            </div>
            <p className="text-xs font-semibold text-slate-700">{fecha}</p>
          </div>
        )}

        {texto && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Comentario</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
              <p className="text-sm text-slate-600 leading-relaxed">{texto}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AreaDetailPanel({ area, onBack, onSetImage }: { 
  area: any; 
  onBack: () => void;
  onSetImage?: (url: string) => void;
}) {
  const [areaTab, setAreaTab] = useState<"generales" | "checklist" | "incidencias">("generales");
  const [selectedCheck, setSelectedCheck] = useState<any>(null);  
  // const fotos: { file_name: string; file_url: string }[] = area.fotos || [];
  const fotoDefault = area.foto_default_area?.file_url ? area.foto_default_area : null;
  const checksData: any[] = [];
  const incidenciasArea: any[] = area.incidencias || [];
  const comentarios: string = area.comentarios || "";
  const tiempoTraslado = area.tiempo_traslado !== "" ? area.tiempo_traslado : null;
  const horaCheck = area.hora || "";
  // const ubicacion = area.ubicacion || area.ubicacion_rondin || "-";
  // const recorrido = area.nombre_recorrido || "-";
  const realizadoPor = area.asignado_a || "-";
  if (selectedCheck) {
    return (
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background animate-in fade-in slide-in-from-right-4 duration-200">
        <div className="px-6 pt-4 pb-0 shrink-0">
          <button
            onClick={() => setSelectedCheck(null)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </button>
          <h3 className="text-2xl font-extrabold text-slate-800 leading-tight mb-0.5">Detalle del check</h3>
          <div className="border-b border-slate-100 mb-4 mt-4" />
        </div>
        <div className="flex-1 overflow-y-auto px-6 no-scrollbar space-y-4 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Fecha y hora</p>
            <p className="text-sm font-medium text-slate-800">{selectedCheck.fecha_check || "-"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Comentarios</p>
            <p className="text-sm text-slate-700 leading-relaxed">{selectedCheck.comentarios_check || "Sin comentarios"}</p>
          </div>
          {selectedCheck.evidencias_check?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Evidencias ({selectedCheck.evidencias_check.length})
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {selectedCheck.evidencias_check.map((ev: any, i: number) => (
                  <div
                    key={i}
                    className="relative w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-100 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                    style={{ height: "90px" }}
                    onClick={() => onSetImage?.(ev.file_url)}
                  >
                    <Image
                      src={ev.file_url}
                      alt={`Evidencia ${i + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/sin_imagen_rondines.png"; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="px-6 pt-4 pb-0 shrink-0">
 
      <div className="flex gap-2 justify-end mb-3">
        {area.folio_rondin && (
          <span className="text-[13px] font-bold  px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            {area.folio_rondin}
          </span>
        )}
        {(() => {
          const estatus = area.estatus_recorrido || "";
          const statusMap: Record<string, { label: string; class: string }> = {
            realizado: { label: "Realizado", class: "bg-green-100 text-green-600 border-green-200" },
            en_proceso: { label: "En proceso", class: "bg-blue-100 text-blue-600 border-blue-200" },
            programado: { label: "Programado", class: "bg-purple-100 text-purple-600 border-purple-200" },
            cancelado: { label: "Cancelado", class: "bg-red-100 text-red-600 border-red-200" },
          };
          const s = statusMap[estatus] ?? { label: estatus || "Sin estatus", class: "bg-slate-100 text-slate-500 border-slate-200" };
          return (
            <span className={cn("text-[13px] font-bold  px-3 py-1 rounded-full border", s.class)}>
              {s.label}
            </span>
          );
        })()}
       {checksData.length > 0 && (
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
            {checksData.length} Checklist
          </span>
        )}
        {incidenciasArea.length > 0 && (
          <span className="text-[11px] font-bold  px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
            {incidenciasArea.length} incidencia{incidenciasArea.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
       {/* Volver */}
        <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium mb-4 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver al rondín
      </button>

        {/* Título */}
        <h3 className="text-2xl font-extrabold text-slate-800 leading-tight mb-0.5">{area.nombre}</h3>
        <p className="text-xs text-slate-400 mb-4">Área inspeccionada</p>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-slate-200">
          {(["generales", "checklist", "incidencias"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAreaTab(tab)}
              className={cn(
                "px-4 pb-2 pt-1 text-sm font-medium border-b-2 transition-colors capitalize",
                areaTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">

        {/* TAB: GENERALES */}
        {areaTab === "generales" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {/* <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Ubicación</p>
                <p className="text-sm font-medium text-slate-800">{ubicacion|| "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Recorrido</p>
                <p className="text-sm font-medium text-slate-800">{recorrido|| "-"}</p>
              </div> */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Realizado por</p>
                <p className="text-sm font-medium text-slate-800">{realizadoPor || "Guardia en turno"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Fecha de inspección</p>
                <p className="text-sm font-medium text-slate-800">{horaCheck || "-"}</p>
              </div>
              {tiempoTraslado !== null && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Tiempo traslado</p>
                  <p className="text-sm font-medium text-slate-800">{tiempoTraslado|| "0"} min</p>
                </div>
              )}
            </div>

            {comentarios && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Comentarios</p>
                <p className="text-sm text-slate-700 leading-relaxed">{comentarios}</p>
              </div>
            )}

            {fotoDefault && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Foto del área
                  </p>
                </div>
                <div
                  className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50 relative cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                  style={{ height: "150px" , width:"150px"}}
                  onClick={() => onSetImage?.(fotoDefault.file_url)}
                >
                  <Image
                    src={fotoDefault.file_url}
                    alt={fotoDefault.file_name || "Foto del área"}
                    fill
                    className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/sin_imagen_rondines.png"; }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                    <p className="text-white text-[9px] truncate">{fotoDefault.file_name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* TAB: CHECKLIST */}
      {areaTab === "checklist" && (
        <div>
          {checksData.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-6">
              Sin checklist registrado
            </p>
          ) : (
            <div>
              {checksData.map((check: any, i: number) => {
                const comentario = check.comentarios_check || "Sin comentarios";
                const fecha = check.fecha_check || "";
                const evidencia =
                  check.evidencias_check?.[0]?.file_url ||
                  "/sin_imagen_rondines.png";

                // Valor del checklist
                const respuesta = check.respuesta_check; // "SI" | "NO" | "N/A"

                const badgeStyles = {
                  SI: "bg-green-100 text-green-700 border-green-200",
                  NO: "bg-red-100 text-red-700 border-red-200",
                  "N/A": "bg-slate-100 text-slate-600 border-slate-200",
                };

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedCheck(check)}
                    className="flex items-center gap-3 py-3 px-3 mb-2 last:mb-0 bg-slate-100 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-200 relative">
                      {evidencia ? (
                        <Image
                          src={evidencia}
                          alt={`Check ${i + 1}`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/sin_imagen_rondines.png";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">
                          {comentario}
                        </p>

                        {respuesta && (
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${
                              badgeStyles[
                                respuesta as keyof typeof badgeStyles
                              ]
                            }`}
                          >
                            {respuesta}
                          </span>
                        )}
                      </div>

                      {fecha && (
                        <p className="text-xs text-slate-400 mt-0.5">{fecha}</p>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
        {/* TAB: INCIDENCIAS */}
        {areaTab === "incidencias" && (
          <div>
            {incidenciasArea.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-6">Sin incidencias en esta área</p>
            ) : (
              <div className="space-y-0">
                {incidenciasArea.map((inc: any, i: number) => {
                  const img = inc.evidencias?.[0]?.file_url || inc.incidente_evidencia?.[0]?.file_url || "/sin_imagen_rondines.png";
                  const fecha = inc.fecha_hora_incidente || inc.fecha_hora || "";
                  const subcategoria = inc.subcategoria || inc.sub_categoria || "";
                  const incidente = inc.incidente || "Sin incidente";
                  const accion = inc.accion_tomada || inc.incidente_accion || "";
                  const comentarioInc = inc.comentarios || inc.comentario_incidente_bitacora || "";

                  return (
                    <div key={i} className="py-3 border-b border-slate-100 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                          <Image
                            src={img}
                            alt={incidente}
                            fill
                            className="object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/sin_imagen_rondines.png"; }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{incidente}</p>
                          {fecha && <p className="text-[10px] text-slate-400 mt-0.5">{fecha}</p>}
                          {subcategoria && (
                            <span className="inline-block mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              {subcategoria}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                      </div>
                      {comentarioInc && (
                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mt-2 ml-15">
                          <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Comentario</p>
                          <p className="text-xs text-slate-600">{comentarioInc}</p>
                        </div>
                      )}
                      {accion && (
                        <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 mt-2">
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
  action
}: PhotoDetailModalProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"incidencias" | "comentarios">("incidencias");
  const [areaSearch, setAreaSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [selectedIncidencia, setSelectedIncidencia] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [selectedComentario, setSelectedComentario] = useState<any>(null);
  const [expandedAreas, setExpandedAreas] = useState(false);
  
  const comentariosGenerales = Array.isArray(record?.rawData?.comentarios_generales) && record.rawData.comentarios_generales.length > 0
  ? record.rawData.comentarios_generales
  : Array.isArray(record?.comentarios_generales) && record.comentarios_generales.length > 0
  ? record.comentarios_generales
  : [];

  if (!record) return null;
  const slides =
  selectedImages.length > 0
    ? selectedImages.map((src, i) => ({ src, label: `Evidencia ${i + 1}` }))
    : selectedArea
    ? selectedArea.fotos
        .map((f: any) => f.file_url)
        .filter((url: string) => url?.startsWith("https://"))
        .length > 0
      ? selectedArea.fotos
          .filter((f: any) => f.file_url?.startsWith("https://"))
          .map((f: any) => ({ src: f.file_url, label: f.file_name || "Foto" }))
      : [{ src: "/sin_imagen_rondines.png", label: "Sin imagen" }]
    : record.images && record.images.filter((img: string) => img && img !== "/mountain.svg" && img?.startsWith("https://")).length > 0
    ? record.images
        .filter((img: string) => img && img !== "/mountain.svg" && img?.startsWith("https://"))
        .map((img: any, i: number) => ({ src: img, label: `Imagen ${i + 1}` }))
    : [{ src: "/sin_imagen_rondines.png", label: "Sin imagen" }];

  const prevSlide = () => setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
  const nextSlide = () => setSlideIndex((i) => (i + 1) % slides.length);
  const handleSelectArea = (area: any) => {
    setSelectedArea({
      ...area,
      ubicacion_rondin: record?.rawData?.ubicacion || "—",
      nombre_recorrido: record?.rawData?.nombre_recorrido || record?.title || "—",
      asignado_a: record?.rawData?.asignado_a || "Guardia en turno",
      estatus_recorrido: record?.rawData?.estatus_recorrido || "",
      folio_rondin: record?.rawData?.folio || record?.folio || "",
      checks_data: record?.rawData?.checks_data || record?.checks_data || [],
    });
    setSelectedIncidencia(null);
    setSelectedImages([]);
    setSlideIndex(0);
  };
  const handleBack = () => {
    setSelectedArea(null);
    setSelectedIncidencia(null);
    setSelectedImages([]);
    setSlideIndex(0);
  };
  // Mapear áreas con estructura correcta del servicio
  const rawAreas = record?.rawData?.areas || record?.areas || [];
  const realAreas = rawAreas.map((a: any) => ({
    nombre: a?.area || a?.detalle?.area || a?.rondin_area || "",
    hora: a?.detalle?.hora_de_check || "",
    img: a?.detalle?.fotos?.[0]?.file_url || a?.foto_area?.[0]?.file_url || "/placeholder.svg",
    fotos: a?.detalle?.fotos || a?.foto_area || [],
    foto_default_area: a?.foto_default_area || null,
    incidencias: a?.detalle?.incidencias || [],
    comentarios: a?.detalle?.comentarios || "",
    tiempo_traslado: a?.detalle?.tiempo_traslado ?? "",
    checks_data: a?.checks_data ?? [],
    raw: a,
  }));
  // Solo incidencias reales, sin demo
  const incidencias = Array.isArray(record?.rawData?.incidencias) && record.rawData.incidencias.length > 0
    ? record.rawData.incidencias
    : Array.isArray(record?.incidencias) && record.incidencias.length > 0
    ? record.incidencias
    : [];

  const filteredAreas = realAreas.filter((a: any) =>
    a.nombre?.toLowerCase().includes(areaSearch.toLowerCase())
  );

  const totalAreas = realAreas.length;
  const inspectedAreas = realAreas.filter((a: any) => a.hora).length;
  const progress = totalAreas > 0 ? Math.round((inspectedAreas / totalAreas) * 100) : 0;
  const detailsList = record.modalDetailsList || [];
  const rightPanel = selectedArea
    ? <AreaDetailPanel area={selectedArea} onBack={handleBack} onSetImage={(url) => { setSelectedImages([url]); setSlideIndex(0); }} />
    : selectedIncidencia
    ? <IncidenciaDetailPanel 
      item={selectedIncidencia} 
      onBack={() => { setSelectedIncidencia(null); }} 
      onSetImage={(url) => { setSelectedImages([url]); setSlideIndex(0); }}
      />
    : selectedComentario                                                          
    ? <ComentarioDetailPanel item={selectedComentario} onBack={() => setSelectedComentario(null)} /> 
    : (
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background">
        <div className="px-6 pt-1 pb-1 shrink-0">
        <div className="flex flex-wrap gap-1.5 justify-end mb-3">
        {record.folio && (
          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#2987F7]">
            <span className="text-[13px] font-black tracking-[0.1em]">#{record.folio}</span>
          </div>
        )}
        {record.visit_type && (
          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F3E8FF] text-[#9159F4]">
            <span className="text-[13px] font-black tracking-[0.1em]">{record.visit_type}</span>
          </div>
        )}
        {(() => {
          const estatus = record?.rawData?.estatus_recorrido || "";
          const statusMap: Record<string, { label: string; class: string }> = {
            realizado: { label: "Realizado", class: "bg-green-100 text-green-600" },
            en_proceso: { label: "En proceso", class: "bg-blue-100 text-blue-600" },
            programado: { label: "Programado", class: "bg-purple-100 text-purple-600" },
            cancelado: { label: "Cancelado", class: "bg-red-100 text-red-600" },
          };
          const s = statusMap[estatus] ?? { label: estatus || "Sin estatus", class: "bg-slate-100 text-slate-500" };
          if (!estatus) return null;
          return (
            <div className={cn("inline-flex items-center px-2 py-0.5 rounded-full", s.class)}>
              <span className="text-[13px] font-black tracking-[0.1em]">{s.label}</span>
            </div>
          );
        })()}
          {(() => {
            const totalInc = incidencias.length;
            if (totalInc > 0) {
              return (
                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                  <span className="text-[13px] font-black tracking-[0.1em]">{totalInc} incidencia{totalInc > 1 ? "s" : ""}</span>
                </div>
              );
            }
            return (
              <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                <span className="text-[13px] font-black tracking-[0.1em]">Sin incidencias</span>
              </div>
            );
          })()}
        </div>
          {record.title && (
            <h4 className="text-slate-700 font-bold text-lg">{record.title}</h4>
          )}
        </div>

        <div className="px-6 shrink-0">
  <div className="grid grid-cols-2 gap-x-6 gap-y-0 border-t border-slate-100 pt-3">
    {[
      { label: "Ubicación", key: "UBICACIÓN" },
      { label: "Realizado por", key: "REALIZADO POR" },
      { label: "Inicio", key: "INICIO" },
      { label: "Finalización", key: "FINALIZACIÓN" },
      { label: "Duración", key: "DURACIÓN" },
      { label: "Áreas Inspeccionadas", key: "ÁREAS INSPECCIONADAS" },
    ].map(({ label, key }) => {
      const found = detailsList.find((item: any) =>
        item.label?.toUpperCase().includes(key)
      );
      return (
        <div key={label} className="col-span-1">
          <ListItem label={label} value={found?.value || "'"} />
        </div>
      );
    })}

        {detailsList
          .filter((item: any) => {
            const upper = item.label?.toUpperCase() || "";
            return (
              !upper.includes("UBICACIÓN") &&
              !upper.includes("UBICACION") &&
              !upper.includes("REALIZADO") &&
              !upper.includes("INICIO") &&
              !upper.includes("FINALIZACIÓN") &&
              !upper.includes("FINALIZACION") &&
              !upper.includes("DURACIÓN") &&
              !upper.includes("DURACION") &&
              !upper.includes("TIPO") &&
              !upper.includes("ÁREA") &&
              !upper.includes("AREA")
            );
          })
          .map((item: any, index: number) => {
            const hasValue = Array.isArray(item.value)
              ? item.value.length > 0
              : item.value !== null && item.value !== undefined && item.value !== "";
            if (!hasValue) return null;
            const isFullWidth = Array.isArray(item.value);
            return (
              <div key={index} className={isFullWidth ? "col-span-2" : "col-span-1"}>
                <ListItem label={item.label} value={item.value} />
              </div>
            );
          })}

      {(() => {
        const areasItem = detailsList.find(
          (item: any) =>
            item.label?.toUpperCase().includes("ÁREA") ||
            item.label?.toUpperCase().includes("AREA")
        );

        if (
          !areasItem ||
          !Array.isArray(areasItem.value) ||
          areasItem.value.length === 0
        )
          return null;

        const showAll = expandedAreas;
        const visibleAreas = showAll
          ? areasItem.value
          : areasItem.value.slice(0, 6);

        const hiddenCount = areasItem.value.length - 6;

        return (
          <div className="col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1">
              {areasItem.label}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {visibleAreas.map((areaName: string, i: number) => {
                const matchedArea = realAreas.find(
                  (a: any) =>
                    a.nombre?.toLowerCase() === areaName?.toLowerCase()
                );

                return (
                  <button
                    key={i}
                    onClick={() =>
                      matchedArea && handleSelectArea(matchedArea)
                    }
                    className={`px-2 py-0.5 rounded-md text-sm font-normal border-0 bg-slate-100 text-slate-600 shadow-none transition-colors
                      ${
                        matchedArea
                          ? "hover:bg-blue-100 hover:text-blue-600 cursor-pointer"
                          : "cursor-default"
                      }`}
                  >
                    {areaName}
                  </button>
                );
              })}

              {!showAll && hiddenCount > 0 && (
                <button
                  onClick={() => setExpandedAreas(true)}
                  className="px-2 py-0.5 rounded-md text-sm font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  +{hiddenCount}
                </button>
              )}
            </div>
          </div>
        );
      })()}
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
                {tab === "incidencias" && incidencias.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-[9px] font-bold">
                    {incidencias.length}
                  </span>
                )}
                {tab === "comentarios" && comentariosGenerales.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold">
                    {comentariosGenerales.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
            {activeTab === "incidencias" && (
              <div>
                {incidencias.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-6">Sin incidencias registradas</p>
                ) : (
                  incidencias.map((item: any, i: number) => (
                    <IncidenciaListItem
                      key={item.id || i}
                      item={item}
                      onClick={() => {
                        setSelectedIncidencia(item);
                        const urls = (item.evidencias || item.incidente_evidencia || [])
                          .map((e: any) => e.file_url)
                          .filter(Boolean);
                        if (urls.length > 0) {
                          setSelectedImages(urls);
                          setSlideIndex(0);
                        }
                      }}
                      onImageClick={(url) => {
                        const urls = (item.evidencias || item.incidente_evidencia || [])
                          .map((e: any) => e.file_url)
                          .filter(Boolean);
                        const idx = urls.indexOf(url);
                        setSelectedImages(urls);
                        setSlideIndex(idx >= 0 ? idx : 0);
                      }}
                    />
                  ))
                )}
              </div>
            )}
           {activeTab === "comentarios" && (
              <div>
                {comentariosGenerales.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-6">Sin comentarios registrados</p>
                ) : (
                  comentariosGenerales.map((item: any, i: number) => (
                    <ComentarioListItem key={i} item={item} />
                  ))
                )}
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
    );

  return (
    <Dialog open={open} onOpenChange={(v) => { 
      onOpenChange(v); 
      if (!v) { 
        setSlideIndex(0); 
        setAreaSearch(""); 
        setSelectedArea(null); 
        setSelectedIncidencia(null);  
        setSelectedComentario(null); 
        setSelectedImages([]); 
      } 
    }}>
     <DialogContent className="p-0 overflow-hidden !max-w-[1400px] w-[98vw] h-[95vh] rounded-3xl shadow-2xl flex flex-col border-none bg-background">
        <DialogTitle className="sr-only">Detalle — {record.title}</DialogTitle>

        {action && (
          <div className="absolute top-3 right-14 z-50">
            {typeof action === "function" ? (action as any)(record) : action}
          </div>
        )}

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
              {filteredAreas.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Sin áreas registradas</p>
              ) : (
                filteredAreas.map((area: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectArea(area)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl p-2 cursor-pointer transition-colors",
                      selectedArea?.nombre === area.nombre
                        ? "bg-blue-50 ring-1 ring-blue-200"
                        : "hover:bg-white"
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-slate-200 relative">
                    <Image 
                      src={area.img} 
                      alt={area.nombre} 
                      fill 
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/sin_imagen_rondines.png"; }}
                    />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 leading-tight truncate">{area.nombre}</p>
                      {area.hora ? (
                        <p className="text-[10px] text-slate-500">{area.hora}</p> 
                      ) : (
                        <p className="text-[10px] text-slate-500">Sin check</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col w-[380px] shrink-0 border-r border-slate-100 overflow-hidden bg-background">
          <div className="relative h-[50%] group overflow-hidden bg-gray-100 border-b border-slate-200">
            <Image
              key={slides[slideIndex].src}
              src={slides[slideIndex].src}
              alt={slides[slideIndex].label}
              fill
              className="object-contain transition-all duration-500 ease-in-out cursor-pointer"
              priority
              onClick={() => setViewImageOpen(true)}
              onError={(e) => { (e.target as HTMLImageElement).src = "/sin_imagen_rondines.png"; }}
            />
            {/* overlay hint */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-60 transition-opacity" />
            </div>

            {slides[slideIndex].src !== "/placeholder.svg" && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 z-10 pointer-events-none">
                <p className="text-white text-xs font-semibold">
                  {selectedArea?.nombre || record.title}
                </p>
                <p className="text-white/60 text-[10px]">
                  {slides[slideIndex].label}
                </p>
              </div>
            )}

            {slides.length > 1 && (
              <>
                <div className="absolute inset-x-3 inset-y-0 flex items-center justify-between z-20 pointer-events-none">
                  <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="pointer-events-auto h-9 w-9 flex items-center justify-center bg-white/90 text-black rounded-full shadow-lg transition-all hover:scale-105">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
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

          <div className="hidden">
            <ViewImage
              imageUrl={slides.map((s: { src: any; label: any; }) => ({ file_url: s.src, file_name: s.label }))}
            />
          </div>
            <div className="flex-1 mb-5 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <div className="h-full w-full">
                <MapView map_data={mapData??[]} areas={record?.areas || []}/>
              </div>
            </div>
            {(() => {
            const areassinGeo = (mapData ?? []).filter(
              (item: any) =>
                !item.geolocation_area ||
                (item.geolocation_area.latitude === 0 && item.geolocation_area.longitude === 0)
            );
            if (areassinGeo.length === 0) return null;
            return (
              <div className="mx-2 mb-2 px-2 py-1.5 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-0.5">
                  ⚠ Geolocalización no disponible
                </p>
                <p className="text-[10px] text-red-400 leading-snug">
                  {areassinGeo.map((a: any) => a.nombre_area || a.nombre || "Área sin nombre").join(", ")}
                </p>
              </div>
            );
          })()}
          </div>

          {rightPanel}
        </div>
      </DialogContent>


      {viewImageOpen && (
        <Dialog open={viewImageOpen} onOpenChange={setViewImageOpen}>
          <DialogContent className="p-0 max-w-5xl w-full bg-white overflow-hidden rounded-2xl shadow-2xl border-0">
            <DialogTitle className="sr-only">Imagen</DialogTitle>
            <div className="relative w-full bg-slate-50" style={{ height: '80vh' }}>
              <Image
                src={slides[slideIndex].src}
                alt={slides[slideIndex].label}
                fill
                className="object-contain p-4"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

    </Dialog>
  );
}