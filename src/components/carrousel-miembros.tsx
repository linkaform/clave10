"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, CheckCircle2, UsersRound, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MembersModal } from "./modals/miembros-modal";

interface Miembro {
  nombre: string;
  foto?: string;
  identificacion?: string;
  email?: string;
  telefono?: string;
  estatus?: string;
  link?: string;
}

interface AcompananteRaw {
  nombre_acompanante?: string;
  email_acompanante?: string;
  telefono_acompanante?: string;
  foto?: { file_name?: string; file_url?: string }[];
  identificacion?: { file_name?: string; file_url?: string }[];
  link?: string;
  estatus?: string;
  [key: string]: any;
}

interface MembersCarouselProps {
  searchPass?: {
    link_padre?:string;
    acompanantes_grupo?: AcompananteRaw[];
    url_padre?: string;
    status_pase?: string;
  } | null;
}

const mapAcompanantes = (acompanantes: AcompananteRaw[] = []): Miembro[] =>
  acompanantes.map((a) => ({
    nombre: a?.nombre_acompanante || "Sin nombre",
    foto: Array.isArray(a?.foto) && a.foto.length > 0 ? a.foto[0].file_url : undefined,
    identificacion:
      Array.isArray(a?.identificacion) && a.identificacion.length > 0
        ? a.identificacion[0].file_url
        : undefined,
    email: a?.email_acompanante || "",
    telefono: a?.telefono_acompanante || "",
    link: a?.link || "",
    estatus:
      a?.estatus === "activo" ? "Activo" : a?.estatus === "proceso" ? "En proceso" : a?.estatus,
  }));

const MembersCarousel: React.FC<MembersCarouselProps> = ({ searchPass }) => {
  const acompanantesRaw = searchPass?.acompanantes_grupo;
  const urlPadre = searchPass?.link_padre;
  const statusPase = searchPass?.status_pase;

  const tieneAcompanantes = Array.isArray(acompanantesRaw) && acompanantesRaw.length > 0;
  const esPaseHijo = !!urlPadre;
  const isActivo = statusPase?.toLowerCase() === "activo";

  const data = tieneAcompanantes ? mapAcompanantes(acompanantesRaw!) : [];

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

  // No renderiza nada si el pase no tiene acompañantes ni es un pase hijo
  if (!tieneAcompanantes && !esPaseHijo) return null;

  // Paleta dinámica según estatus del pase
  const theme = isActivo
    ? {
        sectionBg: "bg-emerald-50",
        sectionBorder: "border-emerald-200",
        text: "text-emerald-700",
        dot: "bg-emerald-400",
        primaryBtn: "bg-emerald-600 hover:bg-emerald-700",
        chevronBtn: "bg-emerald-700 hover:bg-emerald-800",
        checkIcon: "text-emerald-500",
        avatarBorderSelected: "border-emerald-400",
      }
    : {
        sectionBg: "bg-blue-50",
        sectionBorder: "border-blue-200",
        text: "text-blue-700",
        dot: "bg-blue-400",
        primaryBtn: "bg-blue-600 hover:bg-blue-700",
        chevronBtn: "bg-blue-700 hover:bg-blue-800",
        checkIcon: "text-blue-500",
        avatarBorderSelected: "border-blue-400",
      };

  return (
    <div className={`${theme.sectionBg} border ${theme.sectionBorder} rounded-2xl p-4 mx-4 mb-4`}>
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full">
            <UsersRound className="w-3.5 h-3.5" />
            {tieneAcompanantes ? "PASE CON ACOMPAÑANTES" : "PASE VINCULADO"}
            <span className={`w-2 h-2 rounded-full ${theme.dot}`} title={statusPase || ""} />
          </span>
        </div>

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

        {esPaseHijo && !tieneAcompanantes && (
          <Button
            type="button"
            size="sm"
            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 text-xs font-semibold flex items-center gap-1.5"
            onClick={() => window.open(urlPadre, "_blank", "noopener,noreferrer")}
          >
            Ver pase principal
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <p className={`text-sm ${theme.text} mb-3`}>
        {tieneAcompanantes
          ? "Pase con acompañantes — a continuación los miembros de su grupo."
          : "Pase perteneciente a un pase con acompañantes."}
      </p>

      {tieneAcompanantes && (
        <>
          <MembersModal open={openModal} onClose={() => setOpenModal(false)} miembros={data} />

          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className={`w-8 h-8 rounded-full ${theme.chevronBtn} text-white flex items-center justify-center shrink-0 shadow transition-colors`}
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
                      <CheckCircle2 className={`w-5 h-5 ${theme.checkIcon} fill-white`} />
                    </div>
                  )}
                  <div
                    className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
                      selected.has(index) ? theme.avatarBorderSelected : "border-slate-100"
                    }`}
                  >
                    <Image src={miembro.foto || "/nouser.svg"} alt={miembro.nombre} fill className="object-cover" />
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
              className={`w-8 h-8 rounded-full ${theme.chevronBtn} text-white flex items-center justify-center shrink-0 shadow transition-colors`}
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