"use client";
// RG-02 · Tarjeta para elegir una opción con ícono grande: tipo de perfil (paso 1) y
// tipo de persona (paso 2, con detalle). Elegida: anillo y fondo del acento, como
// TarjetaOpcion (F0-15).
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function OpcionIcono({
  Icono, etiqueta, detalle, marcada, onElegir,
}: {
  Icono: LucideIcon;
  etiqueta: string;
  /** Texto gris bajo la etiqueta ("Empresa constituida ante notario…"). */
  detalle?: string;
  marcada: boolean;
  onElegir: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={marcada}
      onClick={onElegir}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl px-4 py-5 text-center outline-none transition-[background,box-shadow] duration-150",
        "focus-visible:ring-2 focus-visible:ring-c10-acc focus-visible:ring-offset-2 focus-visible:ring-offset-c10-surface",
        marcada ? "bg-c10-acc-subtle shadow-[0_0_0_2px_var(--c10-acc)]" : "bg-c10-surface shadow-[0_0_0_1px_var(--c10-line)] hover:bg-c10-panel",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-11 items-center justify-center rounded-xl transition-colors duration-150 [&_svg]:size-[22px]",
          marcada ? "bg-c10-acc-l text-c10-acc" : "bg-c10-sunken text-c10-meta",
        )}
      >
        <Icono />
      </span>
      <span className="flex flex-col gap-1">
        <span className={cn("text-sm", marcada ? "font-semibold text-c10-title" : "text-c10-label")}>{etiqueta}</span>
        {detalle && <span className="text-xs leading-[1.45] text-c10-meta">{detalle}</span>}
      </span>
    </button>
  );
}
