import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Imagen } from '../upload-Image';

const ViewImage = ({ imageUrl }: { imageUrl: Imagen | Imagen[] }) => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const images = Array.isArray(imageUrl) ? imageUrl : imageUrl ? [imageUrl] : [];

  if (images.length === 0) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
        <span className="text-slate-300 text-xs">—</span>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <>
      <button
        onClick={() => { setCurrent(0); setOpen(true); }}
        className="relative flex items-center group">
        <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white ring-1 ring-slate-200 shadow-sm hover:ring-blue-400 transition-all">
          <Image
            src={images[0]?.file_url ?? "/nouser.svg"}
            alt="foto"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <ZoomIn className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        {images.length > 1 && (
          <span className="ml-1.5 text-xs text-slate-400 font-medium">
            +{images.length}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-2xl bg-slate-950 border-slate-800 overflow-hidden">
          <DialogTitle className="sr-only">Imágenes</DialogTitle>

          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">
                {current + 1} / {images.length}
              </span>
              {images[current]?.file_name && (
                <span className="text-slate-500 text-xs truncate max-w-[200px]">
                  {images[current].file_name}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative w-full aspect-video bg-slate-900 flex items-center justify-center">
            <Image
              src={images[current]?.file_url ?? "/nouser.svg"}
              alt={images[current]?.file_name ?? `foto-${current}`}
              fill
              className="object-contain p-4"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors backdrop-blur-sm">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors backdrop-blur-sm">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 px-4 py-3 overflow-x-auto border-t border-slate-800">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === current
                      ? "border-blue-500 ring-1 ring-blue-500/50"
                      : "border-slate-700 hover:border-slate-500"
                  }`}>
                  <Image
                    src={img?.file_url ?? "/nouser.svg"}
                    alt={`thumb-${i}`}
                    fill
                    className="object-cover"
                  />
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