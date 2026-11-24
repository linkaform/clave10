"use client";
// F0-05 · Lo que rodea a un listado en cualquiera de sus tres modos: selector de vista,
// tarjeta (cards compactas y lista de cards), barra de selección con acciones masivas,
// estados vacíos y botón flotante de "nuevo".
// Diseño: plataforma.dc.html, empViews (~2445), dcVGrid/dcVList (~2712, ~2731),
// dcSelBar (~2759), esVals (~6668) y dfab (~3407).
import { useEffect, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import Image from "next/image";
import type { Table } from "@tanstack/react-table";
import { CheckCheck, LayoutGrid, List, Plus, Table2, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- Modos de vista ----------

export type Vista = "cards" | "lista" | "tabla";

export const VISTAS: { k: Vista; etiqueta: string; Icono: LucideIcon }[] = [
  { k: "cards", etiqueta: "Cards compactas", Icono: LayoutGrid },
  { k: "lista", etiqueta: "Lista de cards", Icono: List },
  { k: "tabla", etiqueta: "Tabla", Icono: Table2 },
];

/** Vista elegida, recordada por sección en el navegador. */
export function useVista(clave: string, inicial: Vista = "cards") {
  const llave = `c10-vista-${clave}`;
  const [vista, setVista] = useState<Vista>(inicial);
  useEffect(() => {
    try {
      const v = localStorage.getItem(llave) as Vista | null;
      if (v && VISTAS.some((x) => x.k === v)) setVista(v);
    } catch {
      /* sin almacenamiento */
    }
  }, [llave]);
  const cambiar = (v: Vista) => {
    setVista(v);
    try {
      localStorage.setItem(llave, v);
    } catch {
      /* sin almacenamiento */
    }
  };
  return [vista, cambiar] as const;
}

/** Botones de 40px unidos: cards compactas → lista de cards → tabla. */
export function SelectorVista({ vista, onCambio, vistas = ["cards", "lista", "tabla"] }: { vista: Vista; onCambio: (v: Vista) => void; vistas?: Vista[] }) {
  return (
    <div role="tablist" aria-label="Modo de visualización" className="flex shrink-0 overflow-hidden rounded-lg shadow-[0_0_0_1px_var(--c10-line)]">
      {VISTAS.filter((v) => vistas.includes(v.k)).map(({ k, etiqueta, Icono }, i) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={vista === k}
          aria-label={etiqueta}
          title={etiqueta}
          onClick={() => onCambio(k)}
          className={cn(
            "flex size-10 items-center justify-center transition-colors duration-150",
            i > 0 && "border-l border-c10-line",
            vista === k ? "bg-c10-acc text-white" : "bg-c10-surface text-c10-secondary hover:text-c10-acc",
          )}
        >
          <Icono className="size-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}

// ---------- Tarjeta ----------

/**
 * Card de los modos cards y lista: sube 3px al pasar el cursor y al presionarla se marca
 * con el acento. El clic abre el detalle; los botones y checkboxes de adentro no lo abren.
 */
export function Tarjeta({
  onAbrir, etiqueta, seleccionada, className, children,
}: {
  onAbrir?: () => void;
  /** "Ver detalle de Ternium México" */
  etiqueta: string;
  seleccionada?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const esControl = (t: EventTarget) => !!(t as HTMLElement).closest("button, a, input, textarea, select, [role=checkbox]");
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={etiqueta}
      data-fsflip=""
      onClick={(e: MouseEvent) => !esControl(e.target) && onAbrir?.()}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        onAbrir?.();
      }}
      className={cn(
        "min-w-0 cursor-pointer rounded-xl bg-c10-surface outline-none transition-[box-shadow,transform] duration-200 ease-in-out",
        "shadow-[0_0_0_1px_var(--c10-line-card),0_1px_2px_rgba(15,23,42,.05)] hover:-translate-y-[3px] hover:shadow-[0_0_0_1px_var(--c10-line-card),0_12px_28px_rgba(15,23,42,.12)]",
        "active:translate-y-0 active:shadow-[0_0_0_2px_var(--c10-acc),0_2px_6px_rgba(15,23,42,.08)] focus-visible:shadow-[0_0_0_2px_var(--c10-acc)]",
        seleccionada && "bg-c10-acc-s",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---------- Selección y acciones masivas ----------

/** Botón de la barra de selección: translúcido o blanco (la acción principal). */
export function BotonBarra({
  children, onClick, blanco, icono, deshabilitado,
}: { children: ReactNode; onClick: () => void; blanco?: boolean; icono?: ReactNode; deshabilitado?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      className={cn(
        "flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg pl-2.5 pr-3 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4",
        // eslint-disable-next-line no-restricted-syntax -- la barra es del color de acento en ambos temas: el botón blanco no cambia
        blanco ? "bg-[#FFFFFF] text-c10-acc-h hover:bg-c10-acc-l" : "bg-white/15 text-white hover:bg-white/25",
      )}
    >
      {icono}
      {children}
    </button>
  );
}

/**
 * Barra flotante al pie cuando hay filas marcadas: "N seleccionados" (con x para quitar),
 * "Seleccionar todos (N)" y las acciones masivas que pase la pantalla.
 */
export function BarraSeleccion<T>({ tabla, children }: { tabla: Table<T>; children?: ReactNode }) {
  const n = tabla.getSelectedRowModel().rows.length;
  if (!n) return null;
  const total = tabla.getPrePaginationRowModel().rows.length;
  const todos = tabla.getIsAllRowsSelected();
  return (
    <div className="pointer-events-none sticky bottom-4 z-[8] flex justify-center">
      <div className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-2xl bg-c10-acc py-2.5 pl-3.5 pr-2.5 shadow-[0_16px_40px_rgba(15,23,42,.25)] animate-in fade-in slide-in-from-bottom-2 duration-200">
        {/* eslint-disable-next-line no-restricted-syntax -- pastilla blanca sobre el acento en ambos temas */}
        <span className="inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-full bg-[#FFFFFF] pl-3 pr-1.5 text-[13px] font-semibold tabular-nums text-c10-acc-h">
          {n.toLocaleString("es-MX")} {n === 1 ? "seleccionado" : "seleccionados"}
          <button
            type="button"
            onClick={() => tabla.toggleAllRowsSelected(false)}
            title="Quitar selección"
            aria-label="Quitar selección"
            className="flex size-5 items-center justify-center rounded-full hover:bg-c10-acc-l"
          >
            <X className="size-3.5" />
          </button>
        </span>
        <span className="h-6 w-px bg-white/35" aria-hidden />
        <div className="flex flex-wrap items-center gap-2">
          {!todos && (
            <BotonBarra icono={<CheckCheck />} onClick={() => tabla.toggleAllRowsSelected(true)}>
              Seleccionar todos ({total.toLocaleString("es-MX")})
            </BotonBarra>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------- Estados vacíos ----------

export type TipoVacio = "sin-registros" | "sin-resultados" | "error" | "tiempo";

const VACIO: Record<TipoVacio, { img: string; titulo: string; texto: string }> = {
  "sin-registros": { img: "norecords", titulo: "No existen registros", texto: "Aún no hay información registrada en esta sección." },
  "sin-resultados": { img: "noresults", titulo: "No se encontraron resultados", texto: "Prueba con otra búsqueda o ajusta los filtros." },
  error: { img: "error", titulo: "No se pudo completar la consulta", texto: "Ocurrió un error al consultar la información. Intenta de nuevo en unos minutos." },
  tiempo: { img: "timeout", titulo: "Se agotó el tiempo de espera", texto: "La consulta tardó demasiado en responder. Intenta de nuevo." },
};

/** Qué estado vacío toca: error (o tiempo agotado) → búsqueda o filtros activos → nada creado. */
export const tipoVacio = ({ error, filtrando }: { error?: unknown; filtrando?: boolean }): TipoVacio => {
  if (error) return /tiempo|timeout|agot/i.test(error instanceof Error ? error.message : String(error)) ? "tiempo" : "error";
  return filtrando ? "sin-resultados" : "sin-registros";
};

/** Imagen, título y texto; ocupa el alto disponible. `accion`: p. ej. un botón Reintentar. */
export function EstadoVacio({
  tipo, titulo, texto, accion, className,
}: { tipo: TipoVacio; titulo?: string; texto?: string; accion?: ReactNode; className?: string }) {
  const v = VACIO[tipo];
  return (
    <div role={tipo === "error" || tipo === "tiempo" ? "alert" : "status"} className={cn("flex min-h-[360px] flex-1 flex-col items-center justify-center gap-3 p-6 text-center", className)}>
      <Image src={`/contratistas/empty-${v.img}.png`} alt="" width={120} height={120} className="size-[120px] object-contain" />
      <span className="flex max-w-[360px] flex-col items-center gap-1">
        <span className="text-base font-semibold text-c10-title">{titulo ?? v.titulo}</span>
        <span className="text-[13px] leading-[1.45] text-c10-meta [text-wrap:pretty]">{texto ?? v.texto}</span>
      </span>
      {accion}
    </div>
  );
}

// ---------- Botón flotante "nuevo" ----------

/** Botón verde redondo abajo a la derecha; al pasar el cursor se abre y muestra el texto. */
export function BotonFlotante({ etiqueta, onClick, icono }: { etiqueta: string; onClick: () => void; icono?: ReactNode }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-30">
      <button
        type="button"
        onClick={onClick}
        aria-label={etiqueta}
        className="group pointer-events-auto flex h-[60px] max-w-[60px] items-center overflow-hidden whitespace-nowrap rounded-full bg-green-600 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(22,163,74,.3)] transition-[max-width,background-color] duration-[250ms] ease-in-out [clip-path:inset(0_round_999px)] hover:max-w-[360px] hover:bg-green-700 focus-visible:max-w-[360px] focus-visible:bg-green-700"
      >
        <span className="relative z-[1] flex size-[60px] shrink-0 items-center justify-center rounded-full [&_svg]:size-6">{icono ?? <Plus />}</span>
        <span className="-translate-x-[60px] pl-0.5 pr-[22px] opacity-0 transition-[transform,opacity] duration-[250ms] ease-in-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
          {etiqueta}
        </span>
      </button>
    </div>
  );
}
