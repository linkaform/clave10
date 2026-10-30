"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, Calendar, Camera, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function IncidenciaListItem({ item, onClick, onImageClick }: { 
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
export function IncidenciaDetailPanel({ item, onBack, onSetImage }: { 
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

export function ComentarioListItem({ item }: { item: any }) {
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

export function ComentarioDetailPanel({ item, onBack }: { item: any; onBack: () => void }) {
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

export function AreaDetailPanel({ area, onBack, onSetImage }: { 
  area: any; 
  onBack: () => void;
  onSetImage?: (url: string) => void;
}) {
  const [areaTab, setAreaTab] = useState<"generales" | "checklist" | "incidencias">("generales");
  const [selectedCheck, setSelectedCheck] = useState<any>(null);  
  // const fotos: { file_name: string; file_url: string }[] = area.fotos || [];
  // const fotoDefault = area.foto_default_area?.file_url ? area.foto_default_area : null;
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
        <p className="text-xs mb-4">
          {area.hora ? (
            <span className="text-slate-400">Área inspeccionada</span>
          ) : (
            <span className="text-red-500 font-bold">Sin inspección</span>
          )}
        </p>

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
