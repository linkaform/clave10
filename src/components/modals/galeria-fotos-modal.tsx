"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FotoGaleria {
  file_url: string;
  file_name?: string;
  tipo?: string;
}

const humanizeTipo = (tipo?: string) =>
  tipo ? tipo.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : undefined;

const IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|gif|webp)$/i;

// Los thumbnails cargan mucho más rápido que el original — se usan en todo
// lo que sea una miniatura (grid, tira de navegación); la foto grande del
// visor sí usa el archivo original para verse con detalle.
export const toThumbnailUrl = (url: string) => url.replace(IMAGE_EXTENSION_REGEX, ".thumbnail");

export function GaleriaFotosModal({
  open,
  onClose,
  fotos,
}: {
  open: boolean;
  onClose: () => void;
  fotos: FotoGaleria[];
}) {
  const [mode, setMode] = useState<"grid" | "viewer">("grid");
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  if (!open) return null;

  const resetZoom = () => { setZoom(1); setPosition({ x: 0, y: 0 }); };
  const openViewer = (i: number) => { setCurrent(i); setMode("viewer"); resetZoom(); };
  const backToGrid = () => { setMode("grid"); resetZoom(); };
  const prev = () => { setCurrent((c) => (c - 1 + fotos.length) % fotos.length); resetZoom(); };
  const next = () => { setCurrent((c) => (c + 1) % fotos.length); resetZoom(); };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(Math.max(z - e.deltaY * 0.001, 1), 4));
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => setDragging(false);

  const handleClose = () => {
    onClose();
    setMode("grid");
    resetZoom();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {mode === "viewer" && (
              <button
                type="button"
                onClick={backToGrid}
                className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <Images className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm font-bold text-gray-800 truncate">
              {mode === "grid" ? `Galería de fotos · ${fotos.length}` : fotos[current]?.file_name || `Foto ${current + 1}`}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {mode === "viewer" && (
              <>
                {fotos.length > 1 && (
                  <span className="text-xs text-gray-400">{current + 1} / {fotos.length}</span>
                )}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(z - 0.25, 1))}
                    className="p-1 rounded hover:bg-white transition-colors text-gray-500 hover:text-gray-800">
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-gray-500 px-1 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
                    className="p-1 rounded hover:bg-white transition-colors text-gray-500 hover:text-gray-800">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={resetZoom}
                    className="p-1 rounded hover:bg-white transition-colors text-gray-500 hover:text-gray-800">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {fotos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16 text-sm text-gray-300">
            Sin fotos registradas
          </div>
        ) : mode === "grid" ? (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {fotos.map((foto, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => openViewer(i)}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 hover:border-blue-300 hover:opacity-90 transition-all">
                  <Image src={toThumbnailUrl(foto.file_url)} fill className="object-cover" alt={foto.file_name ?? `foto-${i}`} unoptimized />
                  {foto.tipo && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-semibold text-center py-1 truncate px-1.5">
                      {humanizeTipo(foto.tipo)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div
              className="relative flex-1 overflow-hidden bg-gray-50"
              style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}>
              <div
                style={{
                  transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  transition: dragging ? "none" : "transform 0.15s ease",
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}>
                <Image
                  src={fotos[current]?.file_url}
                  alt={fotos[current]?.file_name ?? `foto-${current}`}
                  fill
                  className="object-contain"
                  draggable={false}
                  unoptimized
                />
              </div>

              {fotos.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 shadow-lg transition-all z-10">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 shadow-lg transition-all z-10">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {zoom > 1 && (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-full">
                  Arrastra para mover
                </span>
              )}
            </div>

            {fotos.length > 1 && (
              <div className="flex gap-2 px-5 py-3 overflow-x-auto border-t border-gray-100 shrink-0">
                {fotos.map((foto, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrent(i); resetZoom(); }}
                    className={cn(
                      "relative shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all",
                      i === current ? "ring-2 ring-blue-500" : "opacity-50 hover:opacity-100",
                    )}>
                    <Image src={toThumbnailUrl(foto.file_url)} fill className="object-cover" alt={`thumb-${i}`} unoptimized />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default GaleriaFotosModal;
