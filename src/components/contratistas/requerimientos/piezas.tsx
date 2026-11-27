"use client";
// CF-01 · Chips que comparten la lista y el detalle de requerimientos.
import { cn } from "@/lib/utils";
import { CLASE_CHIP, TONO } from "@/components/contratistas/ui";

/** Columna Limitante: Sí en rojo, No en gris (limBg / limDot del diseño). */
export function ChipLimitante({ si, texto }: { si: boolean; texto?: string }) {
  const t = TONO[si ? "danger" : "neutral"];
  return (
    <span className={cn(CLASE_CHIP, t.chip)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", t.punto)} aria-hidden />
      {texto ?? (si ? "Sí" : "No")}
    </span>
  );
}
