"use client";
// Interruptor (switch) de 36×20: carril con el acento al encenderse y bolita blanca.
// Lo usan los filtros (FiltroInterruptor) y la vigencia (F0-14).
import { cn } from "@/lib/utils";

export function Interruptor({
  valor, onCambio, etiqueta, deshabilitado, className,
}: {
  valor: boolean;
  onCambio: (v: boolean) => void;
  /** aria-label: "Vigencia", "Frecuencia por horas". */
  etiqueta: string;
  deshabilitado?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={valor}
      aria-label={etiqueta}
      disabled={deshabilitado}
      onClick={() => onCambio(!valor)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full outline-none transition-colors duration-150",
        "focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,.15)] disabled:cursor-not-allowed disabled:opacity-50",
        valor ? "bg-c10-acc" : "bg-c10-line-strong",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] size-3.5 rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,.2)] transition-[left] duration-150",
          valor ? "left-[19px]" : "left-[3px]",
        )}
      />
    </button>
  );
}
