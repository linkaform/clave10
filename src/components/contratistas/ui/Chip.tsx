// F0-05 · Chips. Spec: contratistas_ui_spec.md §3.6 y §3.11.
// Base: 22px, pill, 11px/600, sin salto de línea.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PRIORIDAD_TONO, TONO, type Prioridad, type Tono } from "./tonos";

const BASE = "inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] text-[11px] font-semibold";

/** Para chips con un color propio (cn(CLASE_CHIP, TONO.success.chip)). */
export const CLASE_CHIP = BASE;

/** Estado con bolita: "Activo", "En proceso"… El tono sale de los mappers (ESTATUS_*_TONO). */
export function ChipEstado({ texto, tono, className }: { texto: string; tono: Tono; className?: string }) {
  return (
    <span className={cn(BASE, TONO[tono].chip, className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", TONO[tono].punto)} aria-hidden />
      {texto}
    </span>
  );
}

export function ChipPrioridad({ prioridad, className }: { prioridad: Prioridad; className?: string }) {
  return <ChipEstado texto={prioridad} tono={PRIORIDAD_TONO[prioridad]} className={className} />;
}

/** Folio con "#": #C-123. Toma el color del acento del modo. */
export function ChipFolio({ folio, className }: { folio: string; className?: string }) {
  return <span className={cn(BASE, "bg-c10-acc-l tabular-nums text-c10-acc-h", className)}>#{folio.replace(/^#/, "")}</span>;
}

/** Tipo o categoría, gris. Puede llevar ícono de 12px. */
export function ChipTipo({ children, icono, className }: { children: ReactNode; icono?: ReactNode; className?: string }) {
  return (
    <span className={cn(BASE, "bg-c10-sunken text-c10-label [&_svg]:size-3 [&_svg]:shrink-0", className)}>
      {icono}
      {children}
    </span>
  );
}

/** KPI junto al título: "12 registros" / "1 registro". */
export function ChipKpi({
  n, singular = "registro", plural, className,
}: { n: number; singular?: string; plural?: string; className?: string }) {
  const txt = n === 1 ? singular : plural ?? `${singular}s`;
  return <span className={cn(BASE, "bg-c10-acc-l tabular-nums text-c10-acc-h", className)}>{n.toLocaleString("es-MX")} {txt}</span>;
}

/** Chip de filtro seleccionable (30px), con contador opcional. */
export function ChipFiltro({
  activo, onClick, cuenta, children, className,
}: { activo: boolean; onClick: () => void; cuenta?: number; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        "inline-flex h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full pl-3 pr-2 text-[13px] transition-colors duration-150",
        cuenta === undefined && "pr-3",
        activo ? "bg-c10-acc font-semibold text-white" : "bg-c10-sunken font-medium text-c10-label hover:bg-c10-line",
        className,
      )}
    >
      {children}
      {cuenta !== undefined && (
        <span
          className={cn(
            "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] text-[11px] font-semibold tabular-nums",
            activo ? "bg-white/25 text-white" : "bg-c10-surface text-c10-secondary",
          )}
        >
          {cuenta}
        </span>
      )}
    </button>
  );
}
