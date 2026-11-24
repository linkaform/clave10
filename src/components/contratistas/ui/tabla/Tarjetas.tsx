"use client";
// F0-05 · Cards de los modos "cards compactas" y "lista de cards". Diseño: plataforma.dc.html,
// emVGrid (~2633) y emVList (~2658), Mi empresa › Empleados. Cada pantalla pone su foto,
// sus filas y sus acciones; la forma, el hover, la selección y la barra son iguales en todas.
import type { ReactNode } from "react";
import { Copy, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { semaforo } from "@/mappers/contratistas.mapper";
import { Casilla } from "../Campo";
import { avisar } from "../Toast";
import { Tarjeta } from "./Listado";

interface Seleccion {
  marcada: boolean;
  onCambio: (v: boolean) => void;
  /** "Seleccionar Gabriela Mendoza" */
  titulo: string;
}

/** Zona de foto vacía. */
export function SinImagen({ texto = "Sin foto" }: { texto?: string }) {
  return (
    <span className="flex h-full flex-col items-center justify-center gap-2 text-[13px] font-medium text-c10-meta">
      <ImageIcon className="size-6 text-c10-faint" aria-hidden />
      {texto}
    </span>
  );
}

const CasillaFoto = ({ s }: { s: Seleccion }) => (
  <span className="absolute left-1.5 top-1.5 z-[3] flex size-8 items-center justify-center">
    <Casilla titulo={s.titulo} marcada={s.marcada} onCambio={s.onCambio} className="shadow-[0_1px_3px_rgba(15,23,42,.18)]" />
  </span>
);

const Punto = ({ estatus }: { estatus: { texto: string; activo: boolean } }) => (
  <span
    title={estatus.texto}
    aria-label={estatus.texto}
    className={cn("size-2 shrink-0 rounded-full", estatus.activo ? "bg-green-600" : "bg-slate-400")}
  />
);

/** Fila de card compacta: ícono · "Etiqueta:" · valor (y copiar, para RFC, CURP, NSS). */
export function FilaDato({
  icono, etiqueta, children, copiar,
}: { icono?: ReactNode; etiqueta: string; children?: ReactNode; copiar?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-[13px] leading-[18px] text-c10-secondary">
      {icono && <span className="flex size-[13px] shrink-0 [&_svg]:size-[13px]">{icono}</span>}
      <span className="shrink-0">{etiqueta}:</span>
      <span className="min-w-0 truncate tabular-nums">{children ?? "---"}</span>
      {copiar && <BotonCopiar valor={copiar} etiqueta={etiqueta} />}
    </div>
  );
}

/** Botón de 24px para copiar CURP, NSS o RFC, con el toast "Se copió el …". */
export function BotonCopiar({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <button
      type="button"
      title="Copiar"
      aria-label={`Copiar ${etiqueta}`}
      onClick={() => {
        navigator.clipboard?.writeText(valor).catch(() => {});
        avisar(`Se copió el ${etiqueta}`);
      }}
      className="-my-[3px] flex size-6 shrink-0 items-center justify-center rounded-full text-c10-faint transition-colors duration-150 hover:bg-c10-acc-l hover:text-c10-acc"
    >
      <Copy className="size-[13px]" />
    </button>
  );
}

const COLOR = {
  verde: { barra: "bg-green-600", texto: "text-green-700" },
  ambar: { barra: "bg-amber-500", texto: "text-amber-700" },
  rojo: { barra: "bg-red-600", texto: "text-red-600" },
};

/**
 * Cumplimiento con barra de semáforo (≥ 90 verde, 51–89 ámbar, ≤ 50 rojo).
 * "fila": dentro de una card compacta. "bloque": en la lista de cards, a todo lo ancho.
 */
export function BarraCumplimiento({
  pct, detalle, variante = "fila", icono, onClick,
}: { pct: number; detalle?: string; variante?: "fila" | "bloque"; icono?: ReactNode; onClick?: () => void }) {
  const c = COLOR[semaforo(pct)];
  const ancho = `${Math.max(0, Math.min(100, pct))}%`;
  const Raiz = onClick ? "button" : "div";
  if (variante === "bloque") {
    return (
      <Raiz type={onClick ? "button" : undefined} onClick={onClick} className="col-span-full flex min-w-0 flex-col gap-1 text-left">
        <span className="text-[11px] font-medium uppercase tracking-[.05em] text-c10-faint">Cumplimiento</span>
        <span className="flex min-w-0 items-center gap-3 tabular-nums">
          <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-c10-line">
            <span className={cn("block h-full rounded-full", c.barra)} style={{ width: ancho }} />
          </span>
          <span className={cn("shrink-0 text-sm font-semibold", c.texto)}>{pct}%</span>
          {detalle && <span className="shrink-0 whitespace-nowrap text-xs text-c10-meta">{detalle}</span>}
        </span>
      </Raiz>
    );
  }
  return (
    <Raiz
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={detalle}
      className={cn("flex w-full min-w-0 items-center gap-2 text-left text-[13px] leading-[18px] text-c10-secondary", onClick && "hover:text-c10-acc")}
    >
      {icono && <span className="flex size-[13px] shrink-0 [&_svg]:size-[13px]">{icono}</span>}
      <span className="shrink-0">Cumplimiento:</span>
      <span className="h-1 min-w-10 flex-1 overflow-hidden rounded-full bg-c10-line">
        <span className={cn("block h-full rounded-full", c.barra)} style={{ width: ancho }} />
      </span>
      <span className={cn("shrink-0 font-semibold tabular-nums", c.texto)}>{pct}%</span>
    </Raiz>
  );
}

/** Dato de la lista de cards: nombre de campo arriba y valor (con copiar opcional). */
export function DatoLista({ nombre, children, copiar }: { nombre: string; children?: ReactNode; copiar?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[.05em] text-c10-faint">{nombre}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="min-w-0 text-sm tabular-nums text-c10-text [overflow-wrap:anywhere]">{children ?? "---"}</span>
        {copiar && <BotonCopiar valor={copiar} etiqueta={nombre} />}
      </span>
    </div>
  );
}

interface BaseCard {
  /** "Ver detalle de Gabriela Mendoza" */
  etiqueta: string;
  onAbrir?: () => void;
  seleccion?: Seleccion;
  /** Foto o logo; sin ella va la zona vacía. */
  imagen?: ReactNode;
  textoSinImagen?: string;
  titulo: ReactNode;
  /** Botones de ícono redondos (Editar, Eliminar). */
  acciones?: ReactNode;
  children?: ReactNode;
}

/** Card compacta: foto arriba, nombre con punto de estatus, filas y pie de acciones. Sin folio (spec §3.11). */
export function TarjetaCompacta({
  etiqueta, onAbrir, seleccion, imagen, textoSinImagen, titulo, estatus, acciones, children,
}: BaseCard & { estatus?: { texto: string; activo: boolean } }) {
  return (
    <Tarjeta etiqueta={etiqueta} onAbrir={onAbrir} seleccionada={seleccion?.marcada} className="flex flex-col overflow-hidden">
      <div className="relative h-[176px] shrink-0 overflow-hidden border-b border-c10-line-card bg-c10-sunken">
        {imagen ?? <SinImagen texto={textoSinImagen} />}
        {seleccion && <CasillaFoto s={seleccion} />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-4 pb-3.5 pt-4">
        <div className="mb-1 flex min-w-0 items-center gap-2">
          <span className="min-w-0 text-sm font-bold text-c10-title [text-wrap:pretty]">{titulo}</span>
          {estatus && <Punto estatus={estatus} />}
        </div>
        {children}
      </div>
      {acciones && <div className="flex gap-2 border-t border-c10-sunken px-4 pb-3.5 pt-3">{acciones}</div>}
    </Tarjeta>
  );
}

/** Card de la lista: foto a la izquierda; nombre, chips (estatus, folio), datos y acciones a la derecha. */
export function TarjetaLista({
  etiqueta, onAbrir, seleccion, imagen, textoSinImagen, titulo, chips, acciones, children,
}: BaseCard & { chips?: ReactNode }) {
  return (
    <Tarjeta etiqueta={etiqueta} onAbrir={onAbrir} seleccionada={seleccion?.marcada} className="flex flex-wrap gap-x-6 gap-y-5 p-5">
      <div className="relative h-[232px] max-w-full flex-[0_0_300px] overflow-hidden rounded-lg bg-c10-panel shadow-[inset_0_0_0_1px_var(--c10-line-card)]">
        {imagen ?? <SinImagen texto={textoSinImagen} />}
        {seleccion && <CasillaFoto s={seleccion} />}
      </div>
      <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <span className="min-w-0 text-lg font-bold text-c10-title [text-wrap:pretty]">{titulo}</span>
          {chips && <div className="flex flex-wrap gap-1.5">{chips}</div>}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(180px,100%),1fr))] gap-x-6 gap-y-4">{children}</div>
        {acciones && <div className="mt-auto flex gap-2 border-t border-c10-sunken pt-3.5">{acciones}</div>}
      </div>
    </Tarjeta>
  );
}

/** Cuadrícula de cards compactas (268px mínimo) y columna de la lista. */
export const RejillaCards = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(268px,1fr))] gap-4">{children}</div>
);
export const ColumnaLista = ({ children }: { children: ReactNode }) => <div className="flex flex-col gap-3">{children}</div>;

export type { Seleccion as SeleccionCard };
