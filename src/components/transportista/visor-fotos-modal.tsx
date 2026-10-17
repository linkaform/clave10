"use client";

import { useEffect } from "react";
import Image from "next/image";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Visor de fotos en grande para Nuevo acceso de transportista (2610-1382):
// se abre al tocar una miniatura y permite pasar entre fotos con flechas.
// Usa Radix directo para un overlay más claro que el del Dialog compartido
// (se abre encima de otro modal y el doble oscurecido tapaba todo).

export interface FotoVisor {
  id: string;
  src: string | null;
  etiqueta?: string;
}

interface Props {
  fotos: FotoVisor[];
  indice: number | null;
  onIndice: (i: number | null) => void;
}

export function VisorFotosModal({ fotos, indice, onIndice }: Props) {
  const abierto = indice !== null && !!fotos[indice];
  const foto = abierto ? fotos[indice] : null;
  const total = fotos.length;

  const mover = (paso: number) => {
    if (indice === null || !total) return;
    onIndice((indice + paso + total) % total);
  };

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") mover(-1);
      if (e.key === "ArrowRight") mover(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, indice, total]);

  return (
    <DialogPrimitive.Root open={abierto} onOpenChange={(v) => { if (!v) onIndice(null); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl focus:outline-none">
        <DialogPrimitive.Title className="sr-only">Foto {indice !== null ? indice + 1 : ""} de {total}</DialogPrimitive.Title>
        <div className="relative w-full h-[75vh]">
          <DialogPrimitive.Close
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
            <X className="w-5 h-5" />
          </DialogPrimitive.Close>
          {foto?.src && <Image src={foto.src} alt={foto.etiqueta ?? "Foto"} fill className="object-contain" unoptimized />}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => mover(-1)}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => mover(1)}
                aria-label="Foto siguiente"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-800">
          <span className="text-sm font-medium text-white">{foto?.etiqueta}</span>
          <div className="flex items-center gap-1.5">
            {fotos.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onIndice(i)}
                className={cn(
                  "relative w-12 h-9 rounded-md overflow-hidden border-2 transition-all",
                  i === indice ? "border-white" : "border-transparent opacity-60 hover:opacity-100",
                )}>
                {f.src && <Image src={f.src} alt="" fill className="object-cover" unoptimized />}
              </button>
            ))}
            <span className="ml-2 text-xs text-gray-400">{indice !== null ? indice + 1 : 0} / {total}</span>
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
