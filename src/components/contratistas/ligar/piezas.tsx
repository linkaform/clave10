"use client";
// F0-15 · Piezas de los modales de ligar: casilla dibujada, "seleccionar todos", buscador con
// filtros, fila y tarjeta seleccionables, avatar, barra de pasos, chips, mensaje vacío y "+N".
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Building2, Check, FileText, GraduationCap, HardHat, Minus, SearchCheck, Stethoscope, Truck, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Buscador, CLASE_CHIP } from "../ui";
import { TONO } from "../ui/tonos";
import { FiltrosCabecera } from "../filtros";
import { colorAvatar, iniciales } from "../documento/formato";
import { ariaMarcado, type EstadoGrupo } from "./seleccion";

const ANILLO_FOCO = "outline-none focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,.15)]";

/**
 * Casilla solo dibujada: la usan los botones de esta carpeta, que ya son el control.
 * "bloqueada" = ya ligado: gris con palomita.
 */
export function Marca({ estado, tam = 18 }: { estado: EstadoGrupo | "bloqueada"; tam?: 18 | 20 }) {
  const on = estado === "todos" || estado === "parcial";
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[5px] border-[1.5px] text-white transition-colors duration-150",
        tam === 20 ? "size-5" : "size-[18px]",
        estado === "bloqueada" ? "border-c10-line-strong bg-c10-line-strong" : on ? "border-c10-acc bg-c10-acc" : "border-c10-line-strong bg-c10-surface",
      )}
    >
      {estado === "parcial" ? (
        <Minus className="size-3" strokeWidth={3} />
      ) : estado === "todos" || estado === "bloqueada" ? (
        <Check className="size-3" strokeWidth={3} />
      ) : null}
    </span>
  );
}

/**
 * Casilla de "seleccionar todos" con estado intermedio. Con `children` lleva texto al lado
 * ("12 empleados disponibles"); sin texto es solo la casilla (encabezado de tabla).
 */
export function BotonTodos({
  estado, onAlternar, deshabilitado, tam = 18, titulo = "Seleccionar todos", className, children,
}: {
  estado: EstadoGrupo;
  onAlternar: () => void;
  deshabilitado?: boolean;
  tam?: 18 | 20;
  titulo?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={ariaMarcado(estado)}
      aria-label={children ? undefined : titulo}
      title={titulo}
      disabled={deshabilitado}
      onClick={onAlternar}
      className={cn("flex items-center gap-2.5 rounded-md disabled:cursor-not-allowed disabled:opacity-50", ANILLO_FOCO, className)}
    >
      <Marca estado={estado} tam={tam} />
      {children}
    </button>
  );
}

/** "Seleccionar todos" con el texto de disponibles y el chip de seleccionados. */
export function BarraTodos({
  estado, onAlternar, texto, seleccionados, deshabilitada,
}: {
  estado: EstadoGrupo;
  onAlternar: () => void;
  /** "12 empleados disponibles". */
  texto: string;
  seleccionados: number;
  deshabilitada?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <BotonTodos estado={estado} onAlternar={onAlternar} deshabilitado={deshabilitada} className="text-[13px] font-medium text-c10-label">
        <span>{texto}</span>
      </BotonTodos>
      {seleccionados > 0 && <ChipSeleccionados n={seleccionados} />}
    </div>
  );
}

export interface FiltrosSeleccion {
  /** Grupos con selección (useFiltros().cuenta). */
  cuenta: number;
  onLimpiar: () => void;
  /** FiltroChips, FiltroLista… */
  controles: ReactNode;
}

/** Renglón de búsqueda: [algo antes] [filtros] [buscador] [algo después]. */
export function BarraBusqueda({
  valor, onCambio, placeholder, etiqueta, filtros, antes, despues,
}: {
  valor: string;
  onCambio: (q: string) => void;
  placeholder: string;
  /** aria-label, si debe decir otra cosa que el placeholder. */
  etiqueta?: string;
  filtros?: FiltrosSeleccion;
  antes?: ReactNode;
  despues?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {antes}
      {filtros && <FiltrosCabecera cuenta={filtros.cuenta} onLimpiar={filtros.onLimpiar} filtros={filtros.controles} />}
      <Buscador
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        aria-label={etiqueta ?? placeholder}
        // Dentro de un <Campo> con error, el buscador no se pinta de rojo
        invalido={false}
        className="min-w-0 flex-1"
      />
      {despues}
    </div>
  );
}

/**
 * Fila de una lista de selección. Al hacer clic en cualquier parte se marca; la casilla es el
 * control para teclado y lectores, así dentro de la fila puede haber otros enfocables ("+N").
 * Bloqueada (ya ligada): gris, sin cursor y con title que explica por qué.
 */
export function FilaSeleccion({
  etiqueta, marcada, bloqueada, tituloBloqueada, onAlternar, children, className,
}: {
  /** aria-label de la casilla: el nombre de lo que se elige. */
  etiqueta: string;
  marcada: boolean;
  bloqueada?: boolean;
  tituloBloqueada?: string;
  onAlternar: () => void;
  children: ReactNode;
  className?: string;
}) {
  const alternar = () => !bloqueada && onAlternar();
  return (
    <div
      title={bloqueada ? tituloBloqueada : undefined}
      onClick={alternar}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150",
        bloqueada ? "cursor-default opacity-60" : cn("cursor-pointer", marcada ? "bg-c10-acc-subtle hover:bg-c10-acc-l" : "hover:bg-c10-panel"),
        className,
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={marcada || !!bloqueada}
        aria-disabled={bloqueada || undefined}
        aria-label={bloqueada && tituloBloqueada ? `${etiqueta}: ${tituloBloqueada}` : etiqueta}
        onClick={(e) => {
          e.stopPropagation();
          alternar();
        }}
        className={cn("shrink-0 rounded-[5px]", bloqueada && "cursor-default", ANILLO_FOCO)}
      >
        <Marca estado={bloqueada ? "bloqueada" : marcada ? "todos" : "nada"} />
      </button>
      {children}
    </div>
  );
}

/**
 * Tarjeta seleccionable (contrato, perfil): radio o casilla, con borde de 2px y fondo de
 * acento al marcarse.
 */
export function TarjetaOpcion({
  tipo, marcada, onAlternar, fondo = "surface", children,
}: {
  tipo: "radio" | "checkbox";
  marcada: boolean;
  onAlternar: () => void;
  fondo?: "surface" | "panel";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role={tipo}
      aria-checked={marcada}
      onClick={onAlternar}
      className={cn(
        "flex items-start gap-3 rounded-xl px-3.5 py-3 text-left transition-[background,box-shadow] duration-150 hover:bg-c10-acc-subtle",
        ANILLO_FOCO,
        marcada
          ? "bg-c10-acc-subtle shadow-[0_0_0_2px_var(--c10-acc)]"
          : cn(fondo === "panel" ? "bg-c10-panel" : "bg-c10-surface", "shadow-[0_0_0_1px_var(--c10-line)]"),
      )}
    >
      {tipo === "radio" ? (
        <span
          aria-hidden
          className={cn(
            "mt-0.5 size-[18px] shrink-0 rounded-full bg-c10-surface",
            marcada ? "border-[5px] border-c10-acc" : "border-[1.5px] border-c10-line-strong",
          )}
        />
      ) : (
        <span className="mt-px">
          <Marca estado={marcada ? "todos" : "nada"} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">{children}</span>
    </button>
  );
}

/** Sin resultados: texto gris centrado. */
export function MensajeVacio({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("m-0 px-4 py-10 text-center text-sm text-c10-meta [text-wrap:pretty]", className)}>{children}</p>;
}

/** Círculo con iniciales; el color sale del nombre y no cambia entre listas. */
export function Avatar({ nombre, tam = 36 }: { nombre: string; tam?: 32 | 36 }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        tam === 32 ? "size-8 text-[11px]" : "size-9 text-xs",
        colorAvatar(nombre),
      )}
    >
      {iniciales(nombre)}
    </span>
  );
}

export function ChipSeleccionados({ n }: { n: number }) {
  return <span className={cn(CLASE_CHIP, "bg-c10-acc-l tabular-nums text-c10-acc-h")}>{n === 1 ? "1 seleccionado" : `${n} seleccionados`}</span>;
}

/** Barra de pasos de un modal (tramos de 40px): "Contrato", "Perfiles". */
export function Pasos({ pasos, actual }: { pasos: string[]; actual: number }) {
  return (
    <div role="progressbar" aria-valuemin={1} aria-valuemax={pasos.length} aria-valuenow={actual} aria-valuetext={pasos[actual - 1]} className="flex gap-1.5">
      {pasos.map((p, i) => (
        <span
          key={p}
          title={p}
          style={{ transitionDuration: "250ms" }}
          className={cn("h-1 w-10 rounded-full transition-colors", i < actual ? "bg-c10-acc" : "bg-c10-line")}
        />
      ))}
    </div>
  );
}

// ---------- Chips de requerimientos ----------

export type Ambito = "Empresa" | "Persona" | "Equipo";

const AMBITO: Record<Ambito, { clase: string; Icono: typeof Building2 }> = {
  Empresa: { clase: TONO.success.chip, Icono: Building2 },
  Persona: { clase: TONO.info.chip, Icono: HardHat },
  Equipo: { clase: "bg-violet-100 text-violet-700", Icono: Truck },
};

const TIPO: Record<string, { clase: string; Icono: typeof Building2 }> = {
  Documento: { clase: TONO.neutral.chip, Icono: FileText },
  Examen: { clase: "bg-violet-100 text-violet-700", Icono: Stethoscope },
  "Inspección": { clase: "bg-orange-100 text-orange-800", Icono: SearchCheck },
  "Capacitación": { clase: TONO.success.chip, Icono: GraduationCap },
  Mantenimiento: { clase: TONO.warning.chip, Icono: Wrench },
};

export const iconoAmbito = (a: string) => (AMBITO[a as Ambito] ?? AMBITO.Persona).Icono;
export const iconoTipo = (t: string) => (TIPO[t] ?? TIPO.Documento).Icono;

export function ChipAmbito({ ambito }: { ambito: string }) {
  const { clase, Icono } = AMBITO[ambito as Ambito] ?? { clase: TONO.neutral.chip, Icono: HardHat };
  return (
    <span className={cn(CLASE_CHIP, clase)}>
      <Icono className="size-3" aria-hidden />
      {ambito}
    </span>
  );
}

export function ChipTipoRequerimiento({ tipo }: { tipo: string }) {
  const { clase, Icono } = TIPO[tipo] ?? TIPO.Documento;
  return (
    <span className={cn(CLASE_CHIP, clase)}>
      <Icono className="size-3" aria-hidden />
      {tipo}
    </span>
  );
}

// ---------- "+N" con la lista completa ----------

/**
 * Chip "+N" que al pasar el cursor (o enfocarlo) muestra el resto en un globo. Se pinta en un
 * portal con posición fija para que el scroll de la lista no lo corte. Solo aparece tras una
 * interacción, así que en el servidor nunca se intenta el portal.
 */
export function ChipMas({ titulo, lista, icono }: { titulo: string; lista: string[]; icono?: ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const mostrar = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top });
  };
  return (
    <>
      <span
        tabIndex={0}
        aria-label={`${titulo}: ${lista.join(", ")}`}
        onMouseEnter={(e) => mostrar(e.currentTarget)}
        onMouseLeave={() => setPos(null)}
        onFocus={(e) => mostrar(e.currentTarget)}
        onBlur={() => setPos(null)}
        onClick={(e) => e.stopPropagation()}
        className={cn(CLASE_CHIP, "h-5 cursor-default bg-c10-acc-l px-2 tabular-nums text-c10-acc-h", ANILLO_FOCO)}
      >
        +{lista.length}
      </span>
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{ left: pos.x, top: pos.y }}
            className="pointer-events-none fixed z-[120] flex w-max max-w-[260px] -translate-x-1/2 -translate-y-[calc(100%+10px)] flex-col gap-2 rounded-[14px] bg-c10-surface px-3.5 py-3 font-[Arial,Helvetica,sans-serif] shadow-[0_0_0_1px_var(--c10-line-card),0_12px_32px_rgba(15,23,42,.16)] animate-in fade-in duration-150"
          >
            <span className="flex items-center gap-2">
              {icono && (
                <span className="flex size-7 items-center justify-center rounded-lg bg-c10-sunken text-c10-secondary [&_svg]:size-[15px]">{icono}</span>
              )}
              <span className="text-sm font-semibold text-c10-title">{titulo}</span>
            </span>
            <span className="flex flex-wrap gap-1">
              {lista.map((x) => (
                <span key={x} className={cn(CLASE_CHIP, "bg-c10-sunken text-c10-label")}>
                  {x}
                </span>
              ))}
            </span>
            <span className="absolute -bottom-1.5 left-1/2 -ml-1.5 size-3 rotate-45 bg-c10-surface shadow-[1px_1px_0_var(--c10-line-card)]" />
          </div>,
          document.body,
        )}
    </>
  );
}
