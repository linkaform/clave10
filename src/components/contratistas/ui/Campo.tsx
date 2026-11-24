"use client";
// F0-05 · Campos de formulario. Spec: contratistas_ui_spec.md §3.3, §3.4 y §3.9.
// <Campo> pone la etiqueta (con * si es obligatorio) y el error debajo; el control
// de adentro toma solo el id y el estado de error, sin pasárselos a mano:
//
//   <Campo etiqueta="Nombre" obligatorio error={err.nombre}>
//     <Entrada value={nombre} onChange={...} placeholder="Nombre del contrato" />
//   </Campo>
import {
  createContext, forwardRef, useContext, useEffect, useId, useRef, useState,
  type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes,
} from "react";
import { Check, ChevronDown, Info, Minus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const CampoCtx = createContext<{ id?: string; errorId?: string; invalido?: boolean }>({});

/** Lo que comparten input, select y textarea: borde, foco y error. */
const CONTROL =
  "w-full border bg-c10-surface text-sm text-c10-title outline-none transition-[border-color,box-shadow] duration-150 ease-in-out placeholder:text-c10-faint " +
  "focus:border-c10-acc focus:shadow-[0_0_0_3px_rgba(59,130,246,.15)] disabled:cursor-not-allowed disabled:opacity-50";
const borde = (invalido?: boolean) => (invalido ? "border-red-600" : "border-c10-line");

/** Etiqueta de campo: uppercase 11px, semibold. */
export function Etiqueta({ children, obligatorio, htmlFor }: { children: ReactNode; obligatorio?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[11px] font-semibold uppercase tracking-[.04em] text-c10-label">
      {children}
      {obligatorio && <span className="text-red-600"> *</span>}
    </label>
  );
}

export function Campo({
  etiqueta, obligatorio, error, ayuda, extra, className, children,
}: {
  etiqueta?: ReactNode;
  obligatorio?: boolean;
  /** Mensaje bajo el campo ("Selecciona el tipo"). Si viene, el control se pinta en rojo. */
  error?: string | false | null;
  /** Texto de ayuda gris bajo el campo (cuando no hay error). */
  ayuda?: ReactNode;
  /** Algo a la derecha de la etiqueta, p. ej. un chip "3 seleccionados". */
  extra?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      {(etiqueta || extra) && (
        <div className="flex items-center justify-between gap-2">
          {etiqueta && <Etiqueta htmlFor={id} obligatorio={obligatorio}>{etiqueta}</Etiqueta>}
          {extra}
        </div>
      )}
      <CampoCtx.Provider value={{ id, errorId: error ? errorId : undefined, invalido: !!error }}>{children}</CampoCtx.Provider>
      {error ? (
        <span id={errorId} className="text-xs text-red-600">{error}</span>
      ) : (
        ayuda && <span className="text-xs text-c10-faint">{ayuda}</span>
      )}
    </div>
  );
}

const useCampo = (id?: string, invalido?: boolean) => {
  const c = useContext(CampoCtx);
  const inv = invalido ?? c.invalido;
  return { id: id ?? c.id, inv, "aria-invalid": inv || undefined, "aria-describedby": c.errorId };
};

type EntradaProps = InputHTMLAttributes<HTMLInputElement> & { invalido?: boolean };

/** Input de 40px. */
export const Entrada = forwardRef<HTMLInputElement, EntradaProps>(function Entrada({ invalido, id, className, ...props }, ref) {
  const { inv, ...a } = useCampo(id, invalido);
  return <input ref={ref} {...a} className={cn(CONTROL, "h-10 rounded-lg px-3", borde(inv), className)} {...props} />;
});

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalido?: boolean };

/** Textarea con radio 12 y alto mínimo de 3 renglones. */
export const AreaTexto = forwardRef<HTMLTextAreaElement, AreaProps>(function AreaTexto({ invalido, id, className, rows = 3, ...props }, ref) {
  const { inv, ...a } = useCampo(id, invalido);
  return (
    <textarea
      ref={ref}
      rows={rows}
      {...a}
      className={cn(CONTROL, "min-h-[84px] resize-y rounded-xl px-3 py-2.5 leading-[1.45]", borde(inv), className)}
      {...props}
    />
  );
});

/** Buscador: ícono a la izquierda, 40px. */
export const Buscador = forwardRef<HTMLInputElement, EntradaProps>(function Buscador({ className, placeholder = "Buscar", ...props }, ref) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-c10-faint" aria-hidden />
      <Entrada ref={ref} type="search" placeholder={placeholder} aria-label={placeholder} className="pl-9" {...props} />
    </div>
  );
});

export interface Opcion<V extends string = string> {
  valor: V;
  etiqueta: string;
  icono?: ReactNode;
}

/** Dropdown del spec: chevron que gira, menú 6px abajo, opción elegida en azul con check. */
export function Selector<V extends string>({
  opciones, valor, onCambio, placeholder = "Selecciona", deshabilitado, invalido, id, className, compacto, arriba, etiqueta,
}: {
  opciones: Opcion<V>[];
  valor: V | null | undefined;
  onCambio: (v: V) => void;
  placeholder?: string;
  deshabilitado?: boolean;
  invalido?: boolean;
  id?: string;
  className?: string;
  /** 32px y del ancho de su texto (p. ej. "Mostrar 10" de la paginación). */
  compacto?: boolean;
  /** El menú abre hacia arriba (al pie de la pantalla). */
  arriba?: boolean;
  /** aria-label cuando no hay <Campo> con etiqueta. */
  etiqueta?: string;
}) {
  const { inv, ...a } = useCampo(id, invalido);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const sel = opciones.find((o) => o.valor === valor);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => !caja.current?.contains(e.target as Node) && setAbierto(false);
    // Dentro de un modal, Esc cierra solo el menú. Radix escucha en document (captura);
    // window en captura corre antes, así que aquí se puede detener.
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    window.addEventListener("keydown", esc, true);
    return () => {
      document.removeEventListener("mousedown", fuera);
      window.removeEventListener("keydown", esc, true);
    };
  }, [abierto]);

  return (
    <div ref={caja} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        {...a}
        disabled={deshabilitado}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={etiqueta}
        onClick={() => setAbierto((v) => !v)}
        className={cn(
          CONTROL,
          "flex items-center justify-between gap-2 rounded-lg text-left",
          compacto ? "h-8 min-w-16 pl-3 pr-2 font-medium tabular-nums" : "h-10 px-3",
          borde(inv),
          abierto && "border-c10-acc shadow-[0_0_0_3px_rgba(59,130,246,.15)]",
          !sel && "text-c10-faint",
        )}
      >
        <span className="flex min-w-0 items-center gap-2 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-c10-meta">
          {sel?.icono}
          <span className="truncate">{sel?.etiqueta ?? placeholder}</span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-[transform,color] duration-200", abierto ? "rotate-180 text-c10-acc" : "text-c10-faint")}
          aria-hidden
        />
      </button>
      {abierto && (
        <div
          role="listbox"
          className={cn(
            "absolute inset-x-0 z-30 flex",
            arriba ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]",
            "max-h-[300px] flex-col gap-0.5 overflow-y-auto rounded-xl bg-c10-surface p-1 shadow-[0_0_0_1px_var(--c10-line),0_12px_28px_rgba(15,23,42,.12)] animate-in fade-in slide-in-from-bottom-2 duration-200",
          )}
        >
          {opciones.map((o) => {
            const on = o.valor === valor;
            return (
              <button
                key={o.valor}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => {
                  onCambio(o.valor);
                  setAbierto(false);
                }}
                className={cn(
                  "flex h-[34px] shrink-0 items-center gap-2 rounded-lg px-2.5 text-left text-sm [&_svg]:size-4 [&_svg]:shrink-0",
                  on ? "bg-c10-acc-s font-semibold text-c10-acc" : "text-c10-title hover:bg-c10-sunken",
                )}
              >
                {o.icono}
                <span className="min-w-0 flex-1 truncate">{o.etiqueta}</span>
                {on && <Check className="!size-3.5 text-c10-acc" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Checkbox de 20px. `mixto` = algunos marcados (encabezado "Seleccionar todos"). */
export function Casilla({
  marcada, mixto, onCambio, titulo, deshabilitada, className,
}: {
  marcada: boolean;
  mixto?: boolean;
  onCambio: (marcada: boolean) => void;
  /** title y aria-label: "Seleccionar todos", "Seleccionar D-123". */
  titulo: string;
  deshabilitada?: boolean;
  className?: string;
}) {
  const on = marcada || mixto;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixto ? "mixed" : marcada}
      title={titulo}
      aria-label={titulo}
      disabled={deshabilitada}
      onClick={(e) => {
        e.stopPropagation(); // dentro de una card o fila no abre el detalle
        onCambio(!marcada);
      }}
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] text-white outline-none transition-colors duration-150",
        "focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,.15)] disabled:cursor-not-allowed disabled:opacity-40",
        on ? "border-c10-acc bg-c10-acc" : "border-c10-line-strong bg-c10-surface",
        className,
      )}
    >
      {mixto ? <Minus className="size-[13px]" strokeWidth={3} /> : marcada ? <Check className="size-[13px]" strokeWidth={3} /> : null}
    </button>
  );
}

/** Label de consejo azul: mide lo que ocupa su texto, no todo el ancho. */
export function Consejo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex w-fit max-w-full items-start gap-2 rounded-lg bg-c10-acc-s px-3 py-2.5 text-[13px] leading-[1.45] text-c10-acc-h shadow-[inset_0_0_0_1px_var(--c10-acc-b)]",
        className,
      )}
    >
      <Info className="mt-px size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
