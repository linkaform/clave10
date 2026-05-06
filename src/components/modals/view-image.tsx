import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Imagen } from '../upload-Image';

const ViewImage = ({ imageUrl }: { imageUrl: Imagen | Imagen[] }) => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const images = Array.isArray(imageUrl) ? imageUrl : imageUrl ? [imageUrl] : [];

  if (images.length === 0) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
        <span className="text-slate-300 text-xs">—</span>
      </div>
    );
  }

  const prev = () => { setCurrent((c) => (c - 1 + images.length) % images.length); resetZoom(); };
  const next = () => { setCurrent((c) => (c + 1) % images.length); resetZoom(); };
  const resetZoom = () => { setZoom(1); setPosition({ x: 0, y: 0 }); };

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

  return (
    <>
      <button
        onClick={() => { setCurrent(0); setOpen(true); resetZoom(); }}
        className="relative flex items-center group">
        <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-slate-200 shadow-sm hover:ring-blue-400 transition-all">
          <Image src={images[0]?.file_url ?? "/nouser.svg"} alt="foto" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <ZoomIn className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        {images.length > 1 && (
          <span className="ml-1.5 text-xs text-slate-400 font-medium">+{images.length}</span>
        )}
      </button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); resetZoom(); }}>
        <DialogContent className="p-0 max-w-5xl w-full bg-white overflow-hidden rounded-2xl shadow-2xl border-0">
          <DialogTitle className="sr-only">Imágenes</DialogTitle>

          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <span className="text-slate-500 text-xs font-medium truncate max-w-sm">
              {images[current]?.file_name || `Imagen ${current + 1}`}
            </span>
            <div className="flex items-center gap-2 mx-6">
              {images.length > 1 && (
                <span className="text-slate-400 text-xs">{current + 1} / {images.length}</span>
              )}
              <div className="flex items-center gap-1 ml-2 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 1))}
                  className="p-1 rounded hover:bg-white transition-colors text-slate-500 hover:text-slate-800">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-slate-500 px-1 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
                  className="p-1 rounded hover:bg-white transition-colors text-slate-500 hover:text-slate-800">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetZoom}
                  className="p-1 rounded hover:bg-white transition-colors text-slate-500 hover:text-slate-800">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div
            className="relative w-full overflow-hidden bg-slate-50"
            style={{ height: '70vh', cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}>
            <div
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transition: dragging ? 'none' : 'transform 0.15s ease',
                width: '100%',
                height: '100%',
                position: 'relative',
              }}>
              <Image
                src={images[current]?.file_url ?? "/nouser.svg"}
                alt={images[current]?.file_name ?? `foto-${current}`}
                fill
                className="object-contain"
                draggable={false}
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 shadow-lg transition-all z-10">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 shadow-lg transition-all z-10">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {zoom > 1 && (
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded-full">
                Arrastra para mover
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 px-5 py-3 overflow-x-auto border-t border-slate-100">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); resetZoom(); }}
                  className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all ${
                    i === current ? "ring-2 ring-blue-500" : "opacity-50 hover:opacity-100"
                  }`}>
                  <Image src={img?.file_url ?? "/nouser.svg"} alt={`thumb-${i}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ViewImage;