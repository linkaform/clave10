"use client";
// F0-12 · Piezas pequeñas del motor de matriz: ícono de estado, celda, casilla,
// chips con contador y barra de selección. Estilos con los tokens de
// contratistas_ui_spec.md; el acento usa var(--c10-acc) con el azul de
// respaldo para tomar el color del modo cuando llegue F0-03.
import type { ReactNode } from "react";
import {
  CalendarX, Check, CheckCheck, CircleAlert, Clock, FileClock, FileX, Minus, SquareMinus, X,
  type LucideIcon,
} from "lucide-react";
import { ESTADOS } from "@/lib/contratistas/matriz";
import type { EstadoCelda, MatrizCelda } from "@/types/contratistas/matriz";

const ICONOS: Record<EstadoCelda, LucideIcon> = {
  ok: Check, rev: Clock, rech: FileX, venc: CalendarX, pend: FileClock, falta: X, na: Minus, par: CircleAlert, fut: Minus,
};

export function IconoEstado({ estado, className = "size-4" }: { estado: EstadoCelda; className?: string }) {
  const I = ICONOS[estado];
  return <I className={className} aria-hidden />;
}

/** Botón de 30 px con el ícono del estado y, si agrupa, el contador en la esquina. */
export function CeldaEstado({
  celda, titulo, atenuada, activa, onClick,
}: { celda: MatrizCelda; titulo: string; atenuada?: boolean; activa?: boolean; onClick?: (ev: React.MouseEvent<HTMLButtonElement>) => void }) {
  const S = ESTADOS[celda.estado];
  return (
    <button
      type="button" title={titulo} aria-label={titulo} onClick={onClick}
      className="relative grid size-[30px] place-items-center rounded-lg transition-[box-shadow,opacity] duration-150 hover:brightness-95"
      style={{ background: S.bg, color: S.fg, opacity: atenuada ? 0.2 : 1, boxShadow: activa ? "0 0 0 2px var(--c10-acc,#2F80ED)" : "none" }}
    >
      <IconoEstado estado={celda.estado} />
      {!!celda.contador && (
        <span
          className="absolute -right-[7px] -top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums text-white"
          style={{ background: S.punto, boxShadow: "0 0 0 1.5px #FFFFFF" }}
        >
          {celda.contador}
        </span>
      )}
    </button>
  );
}

/** Casilla de 18–20 px. `mixto` = parte marcada (encabezado de columna). */
export function Casilla({
  marcada, mixto, titulo, onClick, tam = 18, deshabilitada,
}: { marcada: boolean; mixto?: boolean; titulo: string; onClick: () => void; tam?: 18 | 20; deshabilitada?: boolean }) {
  const on = marcada || mixto;
  return (
    <button
      type="button" role="checkbox" aria-checked={mixto ? "mixed" : marcada} title={titulo} aria-label={titulo}
      onClick={onClick} disabled={deshabilitada}
      className="grid size-8 shrink-0 place-items-center rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className="grid place-items-center rounded-[5px] border-[1.5px] text-white transition-colors duration-150"
        style={{
          width: tam, height: tam,
          borderColor: on ? "var(--c10-acc,#2F80ED)" : "#CBD5E1",
          background: on ? "var(--c10-acc,#2F80ED)" : "#FFFFFF",
        }}
      >
        {mixto ? <Minus className="size-3" strokeWidth={3} /> : marcada ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

/** Chips de estado con contador: filtran la matriz y atenúan las celdas de otros estados. */
export function ChipsEstado({
  chips, onAlternar, onLimpiar,
}: { chips: { estado: EstadoCelda; cuenta: number; activo: boolean }[]; onAlternar: (e: EstadoCelda) => void; onLimpiar: () => void }) {
  return (
    <div role="group" aria-label="Filtrar por estatus" className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
      {chips.map(({ estado, cuenta, activo }) => {
        const S = ESTADOS[estado];
        const gris = estado === "na" || estado === "pend";
        return (
          <button
            key={estado} type="button" role="checkbox" aria-checked={activo} onClick={() => onAlternar(estado)}
            className="flex h-[30px] items-center gap-1.5 rounded-full pl-[5px] pr-2 text-[13px] transition-colors duration-150 hover:bg-[#F1F5F9]"
            style={activo ? { background: gris ? "#E2E8F0" : S.bg, color: S.texto, fontWeight: 600 } : { color: "#0F172A", fontWeight: 500 }}
          >
            <span className="grid size-5 place-items-center rounded-full"
              style={{ background: estado === "na" ? "#F1F5F9" : S.bg, color: estado === "na" ? "#94A3B8" : S.fg }}>
              <IconoEstado estado={estado} className="size-[13px]" />
            </span>
            {S.plural}
            <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full px-[5px] text-[11px] font-bold tabular-nums"
              style={activo
                ? { background: estado === "na" ? "#94A3B8" : S.fg, color: "#FFFFFF" }
                : { background: estado === "na" ? "#F1F5F9" : S.bg, color: S.texto }}>
              {cuenta}
            </span>
          </button>
        );
      })}
      {chips.some((c) => c.activo) && (
        <button type="button" onClick={onLimpiar} className="h-[30px] px-1 text-[13px] font-semibold text-[var(--c10-acc,#2F80ED)] hover:underline">
          Limpiar
        </button>
      )}
    </div>
  );
}

/** Barra azul flotante al pie: "N seleccionados" + acciones. */
export function BarraFlotante({ etiqueta, onQuitar, children }: { etiqueta: string; onQuitar?: () => void; children: ReactNode }) {
  return (
    <div className="pointer-events-none sticky bottom-4 z-[8] flex justify-center">
      <div className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-2xl bg-[var(--c10-acc,#2F80ED)] py-2.5 pl-3.5 pr-2.5 shadow-[0_16px_40px_rgba(47,128,237,.35)] animate-in fade-in slide-in-from-bottom-2 duration-200">
        <span className="inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-full bg-white pl-3 pr-1.5 text-[13px] font-semibold tabular-nums text-[var(--c10-acc-h,#1E6FDB)]">
          {etiqueta}
          {onQuitar && (
            <button type="button" onClick={onQuitar} title="Quitar selección" aria-label="Quitar selección" className="grid size-5 place-items-center rounded-full">
              <X className="size-3.5" />
            </button>
          )}
        </span>
        <span className="h-6 w-px bg-white/35" />
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

export function BotonBarra({
  children, onClick, blanco, deshabilitado, titulo,
}: { children: ReactNode; onClick: () => void; blanco?: boolean; deshabilitado?: boolean; titulo?: string }) {
  return (
    <button
      type="button" onClick={onClick} disabled={deshabilitado} title={titulo}
      className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg pl-3 pr-3.5 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:size-4 ${
        blanco ? "bg-white text-[var(--c10-acc-h,#1E6FDB)] hover:bg-white/90" : "bg-white/15 text-white hover:bg-white/25"
      }`}
    >
      {children}
    </button>
  );
}

export const IconoTodas = ({ todas }: { todas: boolean }) => (todas ? <SquareMinus /> : <CheckCheck />);
