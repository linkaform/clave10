"use client";
// F0-14 · Piezas del selector de vigencia: panel con interruptor, segmentado, pastillas
// (días, semanas, meses) con "Todos", número corto, frecuencia por horas y "Repetir cada".
// Diseño: plataforma.dc.html, estilos de rqGFs / rqVMods (~2390) y ssnR (~2181).
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Casilla, Entrada, Etiqueta, Interruptor, Selector } from "../ui";
import { UNIDADES, type Unidad } from "./textos";

/** Panel gris con ícono, título, ayuda e interruptor opcional; el contenido aparece al encenderlo. */
export function PanelVigencia({
  icono, titulo, ayuda, activa, onActiva, children, className,
}: {
  icono?: ReactNode;
  titulo: string;
  ayuda?: ReactNode;
  activa?: boolean;
  /** Sin esto no lleva interruptor (Sesiones: "Vigencia personalizada"). */
  onActiva?: (v: boolean) => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-xl bg-c10-sunken px-4 py-3.5", className)}>
      <div className="flex items-center gap-3">
        {icono && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-c10-surface text-c10-acc [&_svg]:size-4" aria-hidden>
            {icono}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold text-c10-title">{titulo}</span>
          {ayuda && <span className="text-xs text-c10-meta">{ayuda}</span>}
        </span>
        {onActiva && <Interruptor valor={!!activa} onCambio={onActiva} etiqueta={titulo} />}
      </div>
      {children && <div className="flex flex-col gap-4 duration-200 animate-in fade-in">{children}</div>}
    </section>
  );
}

export interface OpcionSegmento<V extends string> {
  valor: V;
  etiqueta: string;
  icono?: ReactNode;
}

/** Botones del mismo ancho, uno elegido: "Por Vigencia | Periódico", "Diaria | Semanal | …". */
export function Segmentado<V extends string>({
  opciones, valor, onCambio, etiqueta,
}: { opciones: OpcionSegmento<V>[]; valor: V; onCambio: (v: V) => void; etiqueta: string }) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="flex overflow-hidden rounded-lg bg-c10-surface shadow-[0_0_0_1px_var(--c10-line)]">
      {opciones.map((o) => {
        const on = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onCambio(o.valor)}
            className={cn(
              "flex h-10 min-w-0 flex-1 items-center justify-center gap-2 px-3 text-sm outline-none transition-colors duration-150 [&_svg]:size-4 [&_svg]:shrink-0",
              "focus-visible:z-10 focus-visible:shadow-[inset_0_0_0_2px_var(--c10-acc)] [&:not(:first-child)]:border-l [&:not(:first-child)]:border-c10-line",
              on ? "bg-c10-acc font-semibold text-white" : "font-medium text-c10-label hover:bg-c10-sunken",
            )}
          >
            {o.icono}
            <span className="truncate">{o.etiqueta}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Título de un grupo: en mayúsculas ("DÍAS DE LA SEMANA *") o como pregunta ("Selecciona los días"). */
function TituloGrupo({ children, mayusculas, obligatorio, id }: { children: ReactNode; mayusculas?: boolean; obligatorio?: boolean; id: string }) {
  if (mayusculas)
    return (
      <span id={id}>
        <Etiqueta obligatorio={obligatorio}>{children}</Etiqueta>
      </span>
    );
  return (
    <span id={id} className="text-[13px] font-medium text-c10-label">
      {children}
    </span>
  );
}

/**
 * Pastillas de 30px para elegir días, semanas, meses o periodicidad. Varias a la vez, o una
 * con `unica`. `todos` agrega a la derecha la casilla "Todos los días" (con estado intermedio).
 */
export function Pastillas<V extends string | number>({
  opciones, valor, onCambio, titulo, mayusculas, obligatorio, todos, unica, error,
}: {
  opciones: { valor: V; etiqueta: string }[];
  valor: V[];
  onCambio: (v: V[]) => void;
  titulo: string;
  mayusculas?: boolean;
  obligatorio?: boolean;
  /** "Todos los días", "Todas las semanas", "Todos los meses". */
  todos?: string;
  unica?: boolean;
  error?: string | false | null;
}) {
  const id = useId();
  const n = opciones.filter((o) => valor.includes(o.valor)).length;
  const alternar = (v: V) => onCambio(unica ? [v] : valor.includes(v) ? valor.filter((x) => x !== v) : [...valor, v]);
  const marcarTodos = () => onCambio(n === opciones.length ? [] : opciones.map((o) => o.valor));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <TituloGrupo id={id} mayusculas={mayusculas} obligatorio={obligatorio}>
          {titulo}
        </TituloGrupo>
        {todos && !unica && (
          <span className="flex items-center gap-2">
            <Casilla marcada={n === opciones.length} mixto={n > 0 && n < opciones.length} onCambio={marcarTodos} titulo={todos} />
            <span className="cursor-pointer select-none text-[13px] text-c10-label" onClick={marcarTodos} aria-hidden>
              {todos}
            </span>
          </span>
        )}
      </div>
      <div
        role={unica ? "radiogroup" : "group"}
        aria-labelledby={id}
        aria-invalid={!!error || undefined}
        className="flex flex-wrap gap-1.5"
      >
        {opciones.map((o) => {
          const on = valor.includes(o.valor);
          return (
            <button
              key={o.valor}
              type="button"
              role={unica ? "radio" : "checkbox"}
              aria-checked={on}
              onClick={() => alternar(o.valor)}
              className={cn(
                "inline-flex h-[30px] items-center whitespace-nowrap rounded-full px-3 text-[13px] outline-none transition-colors duration-150",
                "focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,.25)]",
                on ? "bg-c10-acc font-semibold text-white" : "bg-c10-surface font-medium text-c10-label hover:bg-c10-line",
                error && !on && "ring-1 ring-red-600/40",
              )}
            >
              {o.etiqueta}
            </button>
          );
        })}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

/** Renglón de texto con controles en medio: "Vigente por [1] [año(s)]". */
export function Fila({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2 text-sm text-c10-label", className)}>{children}</div>;
}

/** Bloque con etiqueta en mayúsculas y ayuda gris: "PLAZO DE ENTREGA *", "TOLERANCIA". */
export function Grupo({
  titulo, obligatorio, ayuda, children, className,
}: { titulo: string; obligatorio?: boolean; ayuda?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Etiqueta obligatorio={obligatorio}>{titulo}</Etiqueta>
      {children}
      {ayuda && <span className="text-xs text-c10-meta">{ayuda}</span>}
    </div>
  );
}

/**
 * Número corto (72px). Mientras se escribe puede quedar vacío; al salir del campo se
 * ajusta a [min, max] o regresa al último valor válido.
 */
export function Numero({
  valor, onCambio, min = 1, max, etiqueta, className, invalido,
}: {
  valor: number;
  onCambio: (n: number) => void;
  min?: number;
  max?: number;
  etiqueta: string;
  className?: string;
  invalido?: boolean;
}) {
  const [texto, setTexto] = useState(String(valor));
  const [antes, setAntes] = useState(valor);
  if (valor !== antes) {
    setAntes(valor);
    setTexto(String(valor));
  }
  const ajustar = (n: number) => Math.max(min, max === undefined ? n : Math.min(max, n));
  return (
    <Entrada
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      aria-label={etiqueta}
      value={texto}
      invalido={invalido}
      onChange={(e) => {
        const t = e.target.value.replace(/\D/g, "").slice(0, 4);
        setTexto(t);
        const n = Number(t);
        if (t && n >= min && (max === undefined || n <= max)) onCambio(n);
      }}
      onBlur={() => {
        const n = texto ? ajustar(Number(texto)) : valor;
        setTexto(String(n));
        if (n !== valor) onCambio(n);
      }}
      className={cn("w-[72px] text-center tabular-nums", className)}
    />
  );
}

const OPCIONES_UNIDAD = UNIDADES.map((u) => ({ valor: u, etiqueta: u }));

/** "{texto} [N] [unidad]": "Vigente por", "Repetir cada", "Aprobado es válido por". */
export function CadaUnidad({
  texto, n, onN, unidad, onUnidad, invalido,
}: { texto: string; n: number; onN: (n: number) => void; unidad: Unidad | null; onUnidad: (u: Unidad) => void; invalido?: boolean }) {
  return (
    <Fila>
      {texto}
      <Numero valor={n} onCambio={onN} etiqueta={`${texto}: cantidad`} />
      <Selector opciones={OPCIONES_UNIDAD} valor={unidad} onCambio={onUnidad} etiqueta={`${texto}: unidad`} invalido={invalido} className="w-[140px]" />
    </Fila>
  );
}

/** "Frecuencia por horas" con interruptor; encendido: "Cada [N] hora(s)". */
export function FrecuenciaHoras({
  activa, onActiva, horas, onHoras,
}: { activa: boolean; onActiva: (v: boolean) => void; horas: number; onHoras: (n: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-c10-title">Frecuencia por horas</span>
        <Interruptor valor={activa} onCambio={onActiva} etiqueta="Frecuencia por horas" />
      </div>
      {activa && (
        <Fila className="duration-200 animate-in fade-in">
          Cada
          <Numero valor={horas} onCambio={onHoras} max={24} etiqueta="Cada cuántas horas" />
          hora(s)
        </Fila>
      )}
    </div>
  );
}

/** Campo de hora de 140px. */
export function Hora({ valor, onCambio, etiqueta, invalido }: { valor: string; onCambio: (v: string) => void; etiqueta?: string; invalido?: boolean }) {
  return (
    <Entrada
      type="time"
      value={valor}
      onChange={(e) => onCambio(e.target.value)}
      aria-label={etiqueta}
      invalido={invalido}
      className="w-[140px] tabular-nums"
    />
  );
}
