"use client";
// F0-05 · Botones de Contratistas. Spec: contratistas_ui_spec.md §3.1 y §3.2.
// El azul sale del acento del modo (bg-c10-acc), que pone F0-03 con data-c10-acc:
// azul en Mi empresa, naranja en Contratistas y violeta en Clientes. Crear es
// siempre verde y destruir siempre rojo.
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type VarianteBoton = "primario" | "crear" | "peligro" | "cancelar" | "contorno" | "texto";

const VARIANTE: Record<VarianteBoton, string> = {
  primario: "bg-c10-acc font-semibold text-white hover:bg-c10-acc-h",
  crear: "bg-green-600 font-semibold text-white hover:bg-green-700",
  peligro: "bg-red-600 font-semibold text-white hover:bg-red-700",
  cancelar: "bg-c10-sunken font-medium text-c10-label hover:bg-c10-line",
  contorno:
    "border border-c10-line bg-c10-surface font-medium text-c10-label hover:border-c10-acc hover:text-c10-acc focus-visible:border-c10-acc focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,.15)]",
  // Texto inline (Editar, Agregar): sin fondo ni alto fijo; el hover solo subraya
  texto: "h-auto gap-1.5 px-0 font-semibold text-c10-acc hover:underline",
};

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  /** md = 40px (por defecto), sm = 36px para acciones compactas. */
  tam?: "md" | "sm";
  /** Ícono de lucide a la izquierda. En "crear" ya va el "+". */
  icono?: ReactNode;
  /** Ocupa el espacio que le toca (pie de modal: botones del mismo ancho). */
  flex?: boolean;
}

/** Etiquetas en Camel Case con verbo + objeto: "Guardar Cambios", "Nuevo Contrato". */
export const Boton = forwardRef<HTMLButtonElement, BotonProps>(function Boton(
  { variante = "primario", tam = "md", icono, flex, type = "button", className, children, ...props },
  ref,
) {
  const ico = icono ?? (variante === "crear" ? <Plus /> : null);
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm outline-none transition-colors duration-150 ease-in-out",
        "disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        variante !== "texto" && (tam === "sm" ? "h-9 px-4" : "h-10 px-[18px]"),
        VARIANTE[variante],
        flex && "min-w-0 flex-1 basis-0",
        className,
      )}
      {...props}
    >
      {ico}
      {children}
    </button>
  );
});

export interface BotonIconoProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  /** Se usa como title y aria-label: los botones de ícono siempre llevan tooltip nativo. */
  titulo: string;
  icono: ReactNode;
  /** En tablas el botón es cuadrado con radio 8; fuera, circular. */
  enTabla?: boolean;
  /** Dentro de cards: solo el ícono gris, sin fondo. */
  sinFondo?: boolean;
  /** Eliminar: el hover se pone rojo. */
  peligro?: boolean;
}

/** 32×32 con ícono de 16px. */
export const BotonIcono = forwardRef<HTMLButtonElement, BotonIconoProps>(function BotonIcono(
  { titulo, icono, enTabla, sinFondo, peligro, type = "button", className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      title={titulo}
      aria-label={titulo}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center outline-none transition-colors duration-150 ease-in-out",
        "disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4 focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,.15)]",
        enTabla ? "rounded-lg" : "rounded-full",
        sinFondo
          ? cn("text-c10-faint", peligro ? "hover:text-red-600" : "hover:text-c10-acc")
          : cn(
              "bg-c10-sunken text-c10-secondary",
              peligro ? "hover:bg-red-100 hover:text-red-600" : "hover:bg-c10-acc-l hover:text-c10-acc",
            ),
        className,
      )}
      {...props}
    >
      {icono}
    </button>
  );
});

/** "Ver más / Ver menos" al pie de un listado. */
export function VerMas({ abierto, onClick, children }: { abierto: boolean; onClick: () => void; children?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={abierto}
      className="flex h-9 w-full items-center justify-center gap-1.5 border-t border-c10-sunken text-[13px] font-semibold text-c10-acc transition-colors duration-150 hover:bg-c10-acc-s"
    >
      {children ?? (abierto ? "Ver menos" : "Ver más")}
      <ChevronDown className={cn("size-4 transition-transform duration-200", abierto && "rotate-180")} aria-hidden />
    </button>
  );
}
