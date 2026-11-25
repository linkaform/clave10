// F0-13 · Piezas internas de las tarjetas del documento (encabezado con ícono y contador).
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Tarjeta blanca del cuerpo del panel del documento. */
export function TarjetaDocumento({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-xl bg-c10-surface p-5 shadow-[0_0_0_1px_var(--c10-line-card)]", className)}>
      {children}
    </section>
  );
}

/** Ícono + título + lo que vaya a la derecha (contador, botón). */
export function EncabezadoTarjeta({ icono, titulo, children }: { icono: ReactNode; titulo: string; children?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex size-4 shrink-0 text-c10-acc [&_svg]:size-4" aria-hidden>{icono}</span>
      <h3 className="m-0 text-sm font-semibold text-c10-title">{titulo}</h3>
      {children}
    </div>
  );
}

export function Contador({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[22px] items-center rounded-full bg-c10-acc-l px-[9px] text-[11px] font-semibold tabular-nums text-c10-acc-h">
      {children}
    </span>
  );
}
