"use client";
// CF-03 · Chips y renglones que comparten la tabla, el calendario y el detalle de sesiones.
import type { ReactNode } from "react";
import {
  BookOpen, DoorOpen, GraduationCap, HardHat, ListChecks, MapPin, MessagesSquare, MonitorSmartphone, Presentation,
  Radio, Video, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASE_CHIP, ChipEstado } from "@/components/contratistas/ui";
import { ESTATUS_SESION_TONO } from "@/mappers/contratistas.mapper";
import type { EstatusSesion, Sesion, TipoSesion } from "@/types/contratistas";
import { COLOR_TIPO, MATERIAL, type TipoMaterial } from "./sesiones";

export const ICONO_TIPO: Record<TipoSesion, LucideIcon> = {
  Curso: GraduationCap, Capacitación: HardHat, Plática: MessagesSquare, Inducción: DoorOpen,
};
export const ICONO_MODALIDAD: Record<Sesion["modalidad"], LucideIcon> = {
  Presencial: MapPin, Virtual: Video, Híbrida: MonitorSmartphone,
};
export const ICONO_MATERIAL: Record<TipoMaterial, LucideIcon> = {
  Video, Lectura: BookOpen, Presentación: Presentation, Cuestionario: ListChecks, "Clase en vivo": Radio,
};

export function ChipTipoSesion({ tipo, className }: { tipo: TipoSesion; className?: string }) {
  const Icono = ICONO_TIPO[tipo];
  return (
    <span className={cn(CLASE_CHIP, COLOR_TIPO[tipo].chip, className)}>
      <Icono className="size-3 shrink-0" aria-hidden />
      {tipo}
    </span>
  );
}

export function ChipModalidad({ modalidad }: { modalidad: Sesion["modalidad"] }) {
  const Icono = ICONO_MODALIDAD[modalidad];
  return (
    <span className={cn(CLASE_CHIP, "bg-c10-sunken text-c10-label")}>
      <Icono className="size-3 shrink-0" aria-hidden />
      {modalidad}
    </span>
  );
}

export const ChipEstatusSesion = ({ estatus }: { estatus: EstatusSesion }) => (
  <ChipEstado texto={estatus} tono={ESTATUS_SESION_TONO[estatus]} />
);

/** Ícono del tipo de material en su cuadro de color. */
export function IconoMaterial({ tipo }: { tipo: TipoMaterial }) {
  const Icono = ICONO_MATERIAL[tipo];
  return (
    <span
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4", MATERIAL[tipo].color)}
      aria-hidden
    >
      <Icono />
    </span>
  );
}

/** "14 / 20" con barra; sin cupo, solo inscritos. */
export function Ocupacion({ inscritos, cupo }: { inscritos: number; cupo?: number | null }) {
  const pct = cupo ? Math.min(100, Math.round((inscritos / cupo) * 100)) : 0;
  const lleno = !!cupo && inscritos >= cupo;
  return (
    <span className="flex w-full min-w-[96px] flex-col gap-1">
      <span className="flex items-baseline gap-1 tabular-nums">
        <span className="font-semibold text-c10-title">{inscritos}</span>
        <span className="text-xs text-c10-meta">{cupo ? `/ ${cupo}` : "· sin límite"}</span>
      </span>
      {!!cupo && (
        <span className="h-1 w-full overflow-hidden rounded-full bg-c10-sunken">
          <span className={cn("block h-full rounded-full", lleno ? "bg-amber-500" : "bg-c10-acc")} style={{ width: `${pct}%` }} />
        </span>
      )}
    </span>
  );
}

/** Renglón de dato con ícono (detalle y popover del calendario). */
export function Linea({ icono, valor, nombre }: { icono: ReactNode; valor: ReactNode; nombre: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-c10-meta [&_svg]:size-4" aria-hidden>{icono}</span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="break-words text-sm text-c10-title">{valor}</span>
        <span className="text-xs text-c10-meta">{nombre}</span>
      </div>
    </div>
  );
}
