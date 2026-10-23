"use client";

import { Download, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Detalle de un seguimiento de incidencia (texto completo y evidencia).
// Lo usan el detalle de la incidencia y el modal de crear/editar.

const etiqueta = "text-[11px] uppercase tracking-wide text-gray-400";

// "2026-10-02 02:47:31" -> "2026-10-02 02:47"
const fechaCorta = (f?: string) => (f || "").replace(/^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}):\d{2}.*$/, "$1") || "-";

const tipoArchivo = (url = "", nombre = "") => {
  // Se revisa la liga y, si no trae extensión, el nombre del archivo.
  const deTexto = (t: string) => {
    const limpio = (t || "").split("?")[0];
    return limpio.includes(".") ? limpio.split(".").pop()!.toLowerCase() : "";
  };
  const ext = deTexto(url) || deTexto(nombre);
  if (["mp4", "mov", "webm", "m4v"].includes(ext)) return "video";
  if (["mp3", "m4a", "wav", "ogg", "aac", "weba"].includes(ext)) return "audio";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic", "bmp"].includes(ext)) return "imagen";
  return "documento";
};

const Dato = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <p className={etiqueta}>{label}</p>
    <div className="mt-0.5 break-words text-sm text-gray-900">{children || "-"}</div>
  </div>
);

interface SeguimientoDetalleModalProps {
  seguimiento: any | null;
  onClose: () => void;
}

export const SeguimientoDetalleModal = ({ seguimiento: sg, onClose }: SeguimientoDetalleModalProps) => {
  const archivos = sg
    ? [...(sg.incidencia_evidencia_solucion || []), ...(sg.incidencia_documento_solucion || [])].filter((x: any) => x?.file_url)
    : [];
  const imagenes = archivos.filter((x: any) => tipoArchivo(x.file_url, x.file_name) === "imagen");
  const audios = archivos.filter((x: any) => tipoArchivo(x.file_url, x.file_name) === "audio");
  const videos = archivos.filter((x: any) => tipoArchivo(x.file_url, x.file_name) === "video");
  const otros = archivos.filter((x: any) => tipoArchivo(x.file_url, x.file_name) === "documento");
  const fechaInvalida = sg?.tiempo_transcurrido === "La fecha es anterior a la fecha de la incidencia.";

  return (
    <Dialog open={!!sg} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl p-6 gap-0" aria-describedby={undefined}>
        {sg && (
          <>
            <DialogTitle className="text-lg font-bold text-gray-900">Seguimiento</DialogTitle>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Dato label="Fecha y hora">{fechaCorta(sg.fecha_inicio_seg)}</Dato>
              <Dato label="Tiempo transcurrido">
                <span className={fechaInvalida ? "text-red-500" : ""}>{sg.tiempo_transcurrido}</span>
              </Dato>
              {sg.registrado_por && <Dato label="Registrado por">{sg.registrado_por}</Dato>}
              <Dato label="Personas involucradas">{sg.incidencia_personas_involucradas || "---"}</Dato>
            </div>

            <p className={`${etiqueta} mt-5`}>Acción realizada</p>
            <p className="mt-1 whitespace-pre-line break-words text-sm text-gray-700">{sg.accion_correctiva_incidencia || "-"}</p>

            {archivos.length > 0 && (
              <>
                <p className={`${etiqueta} mt-5`}>Evidencia</p>
                <div className="mt-2 space-y-2">
                  {audios.map((x: any, k: number) => (
                    <audio key={`a-${k}`} controls src={x.file_url} className="w-full" />
                  ))}
                  {videos.map((x: any, k: number) => (
                    <video key={`v-${k}`} controls preload="metadata" src={x.file_url} className="max-h-72 w-full rounded-lg bg-black object-contain" />
                  ))}
                  {imagenes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {imagenes.map((x: any, k: number) => (
                        <a key={`i-${k}`} href={x.file_url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={x.file_url} alt={x.file_name || "Evidencia"} className="h-24 w-24 rounded-lg border border-gray-100 object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  {otros.map((x: any, k: number) => (
                    <a
                      key={`d-${k}`}
                      href={x.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="min-w-0 flex-1 truncate">{x.file_name || "Documento"}</span>
                      <Download className="h-4 w-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                Cerrar
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
