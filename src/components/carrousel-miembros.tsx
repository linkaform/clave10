"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, CheckCircle2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MembersModal } from "./modals/miembros-modal";
import { Miembro, AcompanantesSearchPass, useAcompanantesPase } from "@/hooks/useAcompanantesPase";

interface MembersCarouselProps {
  /** Pásale directo el objeto que te regresa el servicio, sin transformar nada. */
  searchPass?: AcompanantesSearchPass | null;
  /** Se llama cada vez que cambia la selección (desde el carrusel o desde el modal), con los miembros actualmente seleccionados. */
  onSeleccionMiembros?: (miembros: Miembro[]) => void;
}

const MembersCarousel: React.FC<MembersCarouselProps> = ({ searchPass, onSeleccionMiembros }) => {
  const {
    data,
    tieneAcompanantes,
    esPaseHijo,
    paseEnProceso,
    isActivo,
    statusPase,
    esSeleccionable,
  } = useAcompanantesPase(searchPass);
  // const linkPadre = searchPass?.link_padre;

  // Selección compartida entre el carrusel y el modal: un Set con los ids
  // reales de los pases seleccionados (no índices, no objetos Miembro) —
  // así ambas vistas siempre están viendo/editando el mismo estado, y lo
  // que se expone hacia afuera ya son ids de pase listos para usarse.
  const [selectedPases, setSelectedPases] = useState<Set<string>>(new Set());
  const [openModal, setOpenModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -180 : 180, behavior: "smooth" });
  };

  const togglePase = (id: string) => {
    const miembro = data.find((m) => m.id === id);
    if (!miembro || !esSeleccionable(miembro)) return;
    setSelectedPases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Si el pase pasa a estar en proceso mientras hay una selección activa,
  // la limpiamos (ya no aplica "ingreso" pendiente válido).
  useEffect(() => {
    if (paseEnProceso) {
      setSelectedPases(new Set());
    }
  }, [paseEnProceso]);

  // Avisa hacia arriba (si el consumidor de MembersCarousel lo necesita)
  // cada vez que cambia la selección, con los objetos Miembro completos.
  useEffect(() => {
    if (!onSeleccionMiembros) return;
    onSeleccionMiembros(data.filter((m) => selectedPases.has(m.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPases]);

  // No renderiza nada si el pase no tiene acompañantes ni es un pase hijo
  if (!tieneAcompanantes && !esPaseHijo) return null;

  // Paleta dinámica según el estatus del pase (verde si activo, azul si no)
  const theme = isActivo
    ? {
        sectionBg: "bg-emerald-50",
        sectionBorder: "border-emerald-200",
        text: "text-emerald-700",
        dot: "bg-emerald-400",
        primaryBtn: "bg-emerald-600 hover:bg-emerald-700",
        checkIcon: "text-emerald-500",
        avatarBorderSelected: "border-emerald-400",
      }
    : {
        sectionBg: "bg-blue-50",
        sectionBorder: "border-blue-200",
        text: "text-blue-700",
        dot: "bg-blue-400",
        primaryBtn: "bg-blue-600 hover:bg-blue-700",
        checkIcon: "text-blue-500",
        avatarBorderSelected: "border-blue-400",
      };

  return (
    <div className={`${theme.sectionBg} border ${theme.sectionBorder} rounded-2xl p-4 mx-4 mb-4`}>
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full">
            <UsersRound className="w-3.5 h-3.5" />
            {esPaseHijo ? "PASE VINCULADO" : "PASE CON ACOMPAÑANTES"}
            <span className={`w-2 h-2 rounded-full ${theme.dot}`} title={statusPase || ""} />
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {tieneAcompanantes && (
            <Button
              type="button"
              size="sm"
              className={`${theme.primaryBtn} text-white rounded-xl px-4 text-xs font-semibold`}
              onClick={() => setOpenModal(true)}
            >
              Ver listado completo
            </Button>
          )}

          {/* {esPaseHijo && (
            <Button
              type="button"
              size="sm"
              className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 text-xs font-semibold flex items-center gap-1.5"
              onClick={() => window.open(linkPadre || urlPadre, "_blank", "noopener,noreferrer")}
            >
              Ver pase principal
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )} */}
        </div>
      </div>

      <p className={`text-sm ${theme.text} mb-3`}>
        {esPaseHijo
          ? tieneAcompanantes
            ? "Pase perteneciente a un pase con acompañantes — a continuación los miembros de su grupo."
            : "Pase perteneciente a un pase con acompañantes."
          : "Pase con acompañantes — a continuación los miembros de su grupo."}
        {paseEnProceso && tieneAcompanantes && (
          <span className="block text-xs text-amber-600 font-medium mt-1">
            La selección para ingreso está deshabilitada mientras el pase esté en proceso.
          </span>
        )}
      </p>

      {tieneAcompanantes && (
        <>
          <MembersModal
            open={openModal}
            onClose={() => setOpenModal(false)}
            miembros={data}
            puedeSeleccionar={!paseEnProceso}
            selectedPases={selectedPases}
            onTogglePase={togglePase}
          />

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
              className="flex gap-3 overflow-x-auto overflow-y-visible scrollbar-none scroll-smooth flex-1 pt-2"
              style={{ scrollbarWidth: "none" }}
            >
              {data.map((miembro) => (
                <button
                  key={miembro.id}
                  type="button"
                  onClick={() => togglePase(miembro.id)}
                  disabled={!esSeleccionable(miembro)}
                  className={`flex flex-col items-center gap-2 p-4 pt-5 mt-1 rounded-xl border transition-all shrink-0 w-32 relative ${
                    !esSeleccionable(miembro) ? "cursor-not-allowed" : "hover:shadow-sm"
                  } ${
                    !esSeleccionable(miembro)
                      ? "bg-slate-50 border-slate-200 opacity-60 grayscale"
                      : miembro.es_padre
                        ? "bg-purple-50 border-purple-200 hover:border-purple-300"
                        : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {esSeleccionable(miembro) && selectedPases.has(miembro.id) && (
                    <div className="absolute top-2 right-2 z-10">
                      <CheckCircle2 className={`w-5 h-5 ${theme.checkIcon} fill-white`} />
                    </div>
                  )}
                  {!esSeleccionable(miembro) && !miembro.es_padre && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 text-[9px] font-bold text-white bg-slate-400 px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm">
                      En proceso
                    </span>
                  )}
                  {miembro.es_padre && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 text-[9px] font-bold text-white bg-purple-600 px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm">
                      Titular
                    </span>
                  )}
                  <div
                    className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                      miembro.es_padre
                        ? "border-purple-400"
                        : selectedPases.has(miembro.id)
                          ? theme.avatarBorderSelected
                          : !esSeleccionable(miembro)
                            ? "border-slate-200"
                            : "border-slate-100"
                    }`}
                  >
                    <Image src={miembro.foto || "/nouser.svg"} alt={miembro.nombre} fill className="object-cover" />
                  </div>
                  <p
                    className={`text-xs font-semibold text-center leading-tight line-clamp-2 w-full ${
                      miembro.es_padre
                        ? "text-purple-700"
                        : !esSeleccionable(miembro)
                          ? "text-slate-400"
                          : "text-slate-700"
                    }`}
                  >
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
        </>
      )}
    </div>
  );
};

export default MembersCarousel;