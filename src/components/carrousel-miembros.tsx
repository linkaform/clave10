"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MembersModal } from "./modals/miembros-modal";

interface Miembro {
  nombre: string;
  foto?: string;
  estatus?: string;
  tipo_movimiento?: string;
}

interface MembersCarouselProps {
  miembros?: Miembro[];
}

const demoMiembros: Miembro[] = [
  { nombre: "Lupita Pérez",    foto: "/nouser.svg", estatus: "Activo", tipo_movimiento: "Entrada" },
  { nombre: "Maria López",     foto: "/nouser.svg", estatus: "Activo", tipo_movimiento: "Salida"  },
  { nombre: "Laura Sánchez",   foto: "/nouser.svg", estatus: "Activo", tipo_movimiento: "Entrada" },
  { nombre: "Karla Gómez",     foto: "/nouser.svg", estatus: "Activo", tipo_movimiento: "Salida"  },
  { nombre: "Pablo Fernández", foto: "/nouser.svg", estatus: "Activo", tipo_movimiento: "Entrada" },
  { nombre: "Carlos Ramírez",  foto: "/nouser.svg", estatus: "Activo", tipo_movimiento: "Entrada" },
];

const MembersCarousel: React.FC<MembersCarouselProps> = ({ miembros }) => {
  const data = miembros && miembros.length > 0 ? miembros : demoMiembros;
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openModal, setOpenModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -180 : 180, behavior: "smooth" });
  };

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  return (
    <>
      <MembersModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        miembros={data}
      />

      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-slate-700">
              Miembros del grupo seleccionados:{" "}
              <span className="text-slate-900">{selected.size}/{data.length}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Seleccione a los miembros presentes para realizar ingreso</p>
          </div>
          <Button
            type="button"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 text-sm font-semibold shrink-0"
            onClick={() => setOpenModal(true)}
          >
            Ver
          </Button>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-none scroll-smooth flex-1"
            style={{ scrollbarWidth: "none" }}
          >
            {data.map((miembro, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggle(index)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all shrink-0 w-24 relative"
              >
                {selected.has(index) && (
                  <div className="absolute top-1.5 right-1.5 z-10">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-white" />
                  </div>
                )}
                <div
                  className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
                    selected.has(index) ? "border-emerald-400" : "border-slate-100"
                  }`}
                >
                  <Image
                    src={miembro.foto || "/nouser.svg"}
                    alt={miembro.nombre}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-[11px] font-semibold text-slate-700 text-center leading-tight line-clamp-2 w-full">
                  {miembro.nombre}
                </p>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll("right")}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

export default MembersCarousel;