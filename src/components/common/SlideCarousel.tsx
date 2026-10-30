"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const NO_IMAGE = "/sin_imagen_rondines.png";

export interface Slide {
  src: string;
  label: string;
}

/** Atributo del zoom: es un portal fuera del panel, no debe cerrarlo (ver ResizableLogSheet). */
export const PANEL_KEEP_OPEN_SELECTOR = "[data-panel-keep]";

interface Props {
  slides: Slide[];
  index: number;
  onIndexChange: (index: number) => void;
  /** Titulo sobre el pie de la imagen (el pie muestra ademas la etiqueta de la foto). */
  caption?: string;
  className?: string;
}

// Carrusel de fotos de los paneles de detalle: flechas, contador y zoom a pantalla completa.
export function SlideCarousel({ slides, index, onIndexChange, caption, className }: Props) {
  const [zoomOpen, setZoomOpen] = useState(false);
  const safeIndex = Math.min(index, slides.length - 1);
  const slide = slides[safeIndex];
  const move = (step: number) => onIndexChange((safeIndex + step + slides.length) % slides.length);

  return (
    <>
      <div className={cn("relative h-56 group overflow-hidden rounded-md border border-slate-200 bg-slate-100", className)}>
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.label}
          fill
          className="object-contain cursor-pointer"
          onClick={() => setZoomOpen(true)}
          onError={(e) => ((e.target as HTMLImageElement).src = NO_IMAGE)}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-60 transition-opacity" />
        </div>
        {slides.length > 1 && (
          <>
            <SlideButton side="left" onClick={() => move(-1)} />
            <SlideButton side="right" onClick={() => move(1)} />
            <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {safeIndex + 1} / {slides.length}
            </span>
          </>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 pointer-events-none">
          {caption && <p className="text-white text-xs font-semibold truncate">{caption}</p>}
          <p className="text-white/60 text-[10px]">{slide.label}</p>
        </div>
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent
          data-panel-keep
          className="p-0 max-w-5xl w-full bg-white overflow-hidden rounded-2xl shadow-2xl border-0"
        >
          <DialogTitle className="sr-only">Imagen</DialogTitle>
          <div className="relative w-full bg-slate-50" style={{ height: "80vh" }}>
            <Image src={slide.src} alt={slide.label} fill className="object-contain p-4" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SlideButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-20 h-8 w-8 flex items-center justify-center bg-white/90 text-black rounded-full shadow-lg hover:scale-105 transition-all",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/** Slides de una lista de urls; sin fotos queda el placeholder. */
export const toSlides = (urls: string[], label = "Imagen"): Slide[] =>
  urls.length > 0
    ? urls.map((src, i) => ({ src, label: `${label} ${i + 1}` }))
    : [{ src: NO_IMAGE, label: "Sin imagen" }];
