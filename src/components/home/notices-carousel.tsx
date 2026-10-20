"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HomeCard } from "./home-card";

// Fijas por ahora: no hay endpoint de noticias/comunicados. Imágenes en public/home.
const NEWS = [
  {
    tag: "Comunicado",
    dot: "bg-[#192A4E]",
    isNew: true,
    date: "Hoy · 07:30",
    img: "/home/aviso-1.webp",
    title: "Mañana 10 de octubre no habrá operación en Planta Monterrey por mantenimiento general de subestación eléctrica",
    text: "Por trabajos de mantenimiento preventivo en la subestación eléctrica principal, la planta permanecerá sin operación de 06:00 a 22:00. Solo podrán ingresar contratistas con pase vigente, personal de mantenimiento autorizado y el equipo de Protección Civil. Todo ingreso debe registrarse con identificación oficial y validarse contra la lista autorizada.",
    link: "Ver lista autorizada",
  },
  {
    tag: "Recordatorio",
    dot: "bg-[#B45309]",
    isNew: true,
    date: "Ayer · 18:00",
    img: "/home/aviso-2.webp",
    title: "Simulacro de evacuación el martes a las 11:00 en todos los edificios",
    text: "El simulacro iniciará con la activación de la alarma general. Cada caseta debe cerrar accesos vehiculares, suspender el registro de visitas y dirigir a las personas que estén dentro hacia su punto de reunión asignado.",
    link: "Ver protocolo",
  },
  {
    tag: "Manual",
    dot: "bg-[#2F80ED]",
    date: "7 oct",
    img: "/home/aviso-3.webp",
    title: "Nuevo manual de registro de transportistas",
    text: "Se actualizó el flujo de inspección de entrada y salida en control de patio. A partir del lunes es obligatorio fotografiar la caja de la unidad abierta, los sellos de seguridad y la licencia del operador.",
    link: "Descargar manual",
  },
  {
    tag: "Noticia",
    dot: "bg-[#16A34A]",
    date: "5 oct",
    img: "/home/aviso-4.webp",
    title: "Reconocimiento al turno nocturno de Caseta Sur",
    text: "Durante septiembre, el turno nocturno de Caseta Sur cerró el mes con cero incidencias sin registrar y el 100% de rondines completados a tiempo.",
    link: "Leer más",
  },
];

export function NoticesCarousel({ className }: { className?: string }) {
  const [idx, setIdx] = React.useState(0);
  const [expanded, setExpanded] = React.useState(false);
  const [lightbox, setLightbox] = React.useState(false);

  const cur = NEWS[idx];
  const go = (step: number) => {
    setExpanded(false);
    setIdx((i) => (i + step + NEWS.length) % NEWS.length);
  };

  return (
    <HomeCard className={cn("!flex-col sm:!flex-row p-2.5 min-h-[220px]", className)}>
      <div className="relative flex-[0_0_180px] sm:flex-[0_1_44%] min-h-[160px] rounded-[14px] overflow-hidden bg-slate-100">
        <Image src={cur.img} alt={cur.title} fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover" />
        <button
          type="button"
          title="Ver imagen en grande"
          onClick={() => setLightbox(true)}
          className="absolute top-2.5 right-2.5 z-[3] h-[30px] w-[30px] rounded-full bg-white/90 text-slate-700 flex items-center justify-center transition-colors hover:bg-white">
          <Maximize2 className="h-[15px] w-[15px]" />
        </button>
      </div>

      <div className="flex-1 min-w-0 min-h-0 px-3 pt-3.5 pb-2 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className={cn("h-1.5 w-1.5 rounded-full", cur.dot)} />
          <span className="font-semibold text-slate-700">{cur.tag}</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500 whitespace-nowrap">{cur.date}</span>
          {cur.isNew && (
            <span className="h-[18px] px-[7px] rounded-full bg-[#EFF6FF] text-[10px] font-bold text-[#2F80ED] flex items-center">
              Nueva
            </span>
          )}
        </div>
        <div className="text-[15px] font-semibold leading-[1.35] tracking-[-0.01em] text-slate-900 line-clamp-2">
          {cur.title}
        </div>
        <div className={cn("flex-1 min-h-5 text-[13px] leading-5 text-slate-600", expanded ? "overflow-y-auto" : "overflow-hidden")}>
          <div className={cn(!expanded && "line-clamp-2")}>{cur.text}</div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="self-start h-[22px] text-[13px] font-semibold text-[#2F80ED] hover:text-[#1E6FDB]">
          {expanded ? "Ver menos" : "Leer más"}
        </button>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="flex-1 min-w-0 flex items-center gap-1 text-[13px] font-medium text-[#2F80ED] truncate">
            {cur.link}
            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
          </span>
          <div className="flex items-center gap-1.5">
            <PagerButton label="Noticia anterior" onClick={() => go(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </PagerButton>
            <span className="min-w-9 text-center text-xs text-slate-500 tabular-nums">
              {idx + 1} de {NEWS.length}
            </span>
            <PagerButton label="Noticia siguiente" onClick={() => go(1)}>
              <ChevronRight className="h-4 w-4" />
            </PagerButton>
          </div>
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-slate-900/80 flex items-center justify-center p-6"
          onClick={() => setLightbox(false)}>
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/90 text-slate-700 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
          <div className="relative w-full max-w-4xl h-[80vh]">
            <Image src={cur.img} alt={cur.title} fill sizes="100vw" className="object-contain" />
          </div>
        </div>
      )}
    </HomeCard>
  );
}

function PagerButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center transition-colors hover:bg-[#EFF6FF] hover:text-[#2F80ED]">
      {children}
    </button>
  );
}
