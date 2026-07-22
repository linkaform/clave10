"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, CheckCircle2, UsersRound } from "lucide-react";
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
  es_padre?: boolean;
}

interface AcompananteRaw {
  nombre_acompanante?: string;
  email_acompanante?: string;
  telefono_acompanante?: string;
  foto?: { file_name?: string; file_url?: string }[];
  identificacion?: { file_name?: string; file_url?: string }[];
  link?: string;
  estatus?: string;
  /** Presente cuando este elemento en realidad es el registro completo del pase padre. */
  es_padre?: boolean;
  [key: string]: any;
}

interface MembersCarouselProps {
  /** Pásale directo el objeto que te regresa el servicio, sin transformar nada. */
  searchPass?: {
    /** Miembros del grupo cuando ESTE pase es el pase padre. */
    acompanantes_grupo?: AcompananteRaw[];
    /**
     * Cuando ESTE pase es un pase hijo, el backend regresa aquí un arreglo que
     * incluye el registro completo del pase padre (con es_padre: true) más el
     * resto de los acompañantes del grupo.
     */
    acompanantes_pases?: AcompananteRaw[];
    /** Alternativa: a veces el pase padre viene anidado aquí con su propio acompanantes_grupo. */
    pase_padre?: {
      acompanantes_grupo?: AcompananteRaw[];
      [key: string]: any;
    };
    /** Link interno (no público) al registro del padre — no usar para el botón. */
    url_padre?: string;
    /** Link público al pase padre — este sí se abre en el botón "Ver pase principal". */
    link_padre?: string;
    status_pase?: string;
  } | null;
}

// Convierte el shape "crudo" del backend al shape que usa el carrusel/modal.
// El elemento del padre viene con otro shape (nombre, email, telefono en vez
// de nombre_acompanante, email_acompanante, telefono_acompanante), así que
// hacemos fallback a esos campos cuando los "_acompanante" no existen.
const mapAcompanantes = (acompanantes: AcompananteRaw[] = []): Miembro[] =>
  acompanantes.map((a) => ({
    nombre: a?.nombre_acompanante || a?.nombre || "Sin nombre",
    foto: Array.isArray(a?.foto) && a.foto.length > 0 ? a.foto[0].file_url : undefined,
    identificacion:
      Array.isArray(a?.identificacion) && a.identificacion.length > 0
        ? a.identificacion[0].file_url
        : undefined,
    email: a?.email_acompanante || a?.email || "",
    telefono: a?.telefono_acompanante || a?.telefono || "",
    link: a?.link || "",
    estatus:
      a?.estatus === "activo" ? "Activo" : a?.estatus === "proceso" ? "En proceso" : a?.estatus,
    es_padre: !!a?.es_padre,
  }));

const MembersCarousel: React.FC<MembersCarouselProps> = ({ searchPass }) => {
  const grupoRaw = searchPass?.acompanantes_grupo;
  const pasesRaw = searchPass?.acompanantes_pases;
  const padreGrupoRaw = searchPass?.pase_padre?.acompanantes_grupo;
  const urlPadre = searchPass?.url_padre;
  // const linkPadre = searchPass?.link_padre;
  const statusPase = searchPass?.status_pase;

  // Pase hijo: no es su propio grupo, apunta a uno con url_padre.
  const esPaseHijo = !!urlPadre;

  // Si es pase padre, los miembros vienen en acompanantes_grupo.
  // Si es pase hijo, el backend regresa acompanantes_pases: un arreglo que
  // incluye el registro completo del pase padre (es_padre: true) más el resto
  // de los acompañantes. Lo dejamos en la lista (se pinta distinto en la UI).
  // Si por algún motivo no viene acompanantes_pases, usamos pase_padre.acompanantes_grupo
  // como respaldo (mismo dato, distinta forma de llegar).
  let acompanantesRaw: AcompananteRaw[] | undefined;
  if (esPaseHijo) {
    acompanantesRaw = Array.isArray(pasesRaw) && pasesRaw.length > 0 ? pasesRaw : padreGrupoRaw;
  } else {
    acompanantesRaw = grupoRaw;
  }

  const tieneAcompanantes = Array.isArray(acompanantesRaw) && acompanantesRaw.length > 0;
  const isActivo = statusPase?.toLowerCase() === "activo";
  // Mientras el pase que se está viendo esté "en proceso", no se puede
  // seleccionar miembros para ingreso — ni en el carrusel ni en el modal.
  const paseEnProceso = (statusPase ?? "").toLowerCase().includes("proceso");

  const data = tieneAcompanantes ? mapAcompanantes(acompanantesRaw!) : [];

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openModal, setOpenModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -180 : 180, behavior: "smooth" });
  };

  const toggle = (index: number) => {
    if (paseEnProceso) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

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
              {data.map((miembro, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggle(index)}
                  disabled={paseEnProceso}
                  className={`flex flex-col items-center gap-2 p-4 pt-5 mt-1 rounded-xl border transition-all shrink-0 w-32 relative ${
                    paseEnProceso ? "cursor-default" : "hover:shadow-sm"
                  } ${
                    miembro.es_padre
                      ? "bg-purple-50 border-purple-200 hover:border-purple-300"
                      : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {!paseEnProceso && selected.has(index) && (
                    <div className="absolute top-2 right-2 z-10">
                      <CheckCircle2 className={`w-5 h-5 ${theme.checkIcon} fill-white`} />
                    </div>
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
                        : selected.has(index)
                          ? theme.avatarBorderSelected
                          : "border-slate-100"
                    }`}
                  >
                    <Image src={miembro.foto || "/nouser.svg"} alt={miembro.nombre} fill className="object-cover" />
                  </div>
                  <p
                    className={`text-xs font-semibold text-center leading-tight line-clamp-2 w-full ${
                      miembro.es_padre ? "text-purple-700" : "text-slate-700"
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