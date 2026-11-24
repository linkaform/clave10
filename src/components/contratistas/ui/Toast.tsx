"use client";
// F0-05 · Toast. Diseño: plataforma.dc.html, toast(m) (~7132) y tMsg (~8832).
// Usa el <Toaster> de sonner que ya está en app/layout.tsx (no se monta otro):
// mismo lugar abajo a la derecha, pausa al pasar el cursor y se cierra con la "x".
// Uno a la vez, como en el diseño: un aviso nuevo reemplaza al anterior.
import { toast } from "sonner";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type TipoAviso = "exito" | "error" | "info";

const ID = "c10-aviso";
const DURACION = 3500;

// Colores sólidos con texto blanco en los dos temas (bg-*-600 no se remapea en oscuro).
const ESTILO: Record<TipoAviso, { fondo: string; sombra: string; Icono: typeof Info }> = {
  exito: { fondo: "bg-green-600", sombra: "shadow-[0_10px_24px_rgba(22,163,74,.3)]", Icono: CircleCheck },
  error: { fondo: "bg-red-600", sombra: "shadow-[0_10px_24px_rgba(220,38,38,.3)]", Icono: CircleAlert },
  // El Toaster vive fuera de la pantalla (no hereda data-c10-acc): c10-acc es siempre el azul #2F80ED
  info: { fondo: "bg-c10-acc", sombra: "shadow-[0_10px_24px_rgba(47,128,237,.3)]", Icono: Info },
};

/** Sin tipo explícito, se deduce como en el diseño: "No…", "Error…", "Ningún…" son error. */
export const tipoDe = (mensaje: string): TipoAviso => (/^(No |Error|Ningún)/.test(mensaje) ? "error" : "exito");

/**
 * Aviso de 3.5 s. Redacción impersonal: "Se guardó el registro", "Se copió el RFC".
 *
 *   avisar("Se guardó el contrato");
 *   avisar("No se pudo guardar: sin conexión");   // rojo
 *   avisar("Se inició la descarga", "info");      // azul
 */
export function avisar(mensaje: string, tipo: TipoAviso = tipoDe(mensaje)) {
  const { fondo, sombra, Icono } = ESTILO[tipo];
  const info = tipo === "info";
  return toast.custom(
    (id) => (
      <div
        role={tipo === "error" ? "alert" : "status"}
        className={cn(
          "flex min-h-[52px] w-[360px] font-[Arial,Helvetica,sans-serif] max-w-[calc(100vw-32px)] gap-3 rounded-[14px] py-2.5 pl-4 pr-2 text-white",
          info ? "items-start" : "items-center",
          fondo,
          sombra,
        )}
      >
        <Icono className={cn("size-5 shrink-0", info && "mt-1.5")} aria-hidden />
        <span className={cn("min-w-0 flex-1 text-sm font-semibold leading-[1.35] [text-wrap:pretty]", info && "mt-1.5")}>{mensaje}</span>
        <button
          type="button"
          onClick={() => toast.dismiss(id)}
          title="Cerrar"
          aria-label="Cerrar"
          className="flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/20"
        >
          <X className="size-[18px]" aria-hidden />
        </button>
      </div>
    ),
    {
      id: ID,
      duration: DURACION,
      // El Toaster global le pone fondo, borde y sombra de shadcn a cada aviso; aquí no van.
      className: "!border-0 !bg-transparent !p-0 !shadow-none",
    },
  );
}
