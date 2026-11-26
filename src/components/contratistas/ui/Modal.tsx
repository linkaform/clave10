"use client";
// F0-05 · Modales de crear/editar y de confirmar. Spec: contratistas_ui_spec.md §3.9.
// Diseño: plataforma.dc.html, svEdOpen (crear/editar, ~2303) y cfmOpen (confirmar, ~3614).
// Van sobre Radix Dialog (foco atrapado, Esc, aria) con el estilo del spec; no usan
// components/ui/dialog, que es de otro diseño y lo comparte toda la app.
import { useRef, type FormEvent, type ReactNode } from "react";
import * as D from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAcentoPortal } from "./acento";
import { Boton, BotonIcono } from "./Boton";
import { Consejo, Etiqueta } from "./Campo";

// Encima de los paneles de detalle (z-60) y de la cabecera; el oscurecido cubre toda la pantalla.
const OVERLAY =
  "fixed inset-0 z-[100] bg-slate-900/45 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out duration-200";
const CAJA =
  "pointer-events-auto relative flex max-h-full w-full flex-col rounded-2xl bg-c10-surface shadow-[0_20px_40px_rgba(15,23,42,.25)] outline-none " +
  "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out duration-200";

function Marco({
  abierto, onCerrar, ancho, alto, alerta, children, sinDescripcion, alAbrir,
}: {
  abierto: boolean;
  onCerrar: () => void;
  ancho: number;
  alto?: number;
  alerta?: boolean;
  children: ReactNode;
  sinDescripcion?: boolean;
  alAbrir?: (e: Event) => void;
}) {
  const { ancla, acento } = useAcentoPortal(abierto);
  return (
    <D.Root open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      {ancla}
      <D.Portal>
        <D.Overlay className={OVERLAY} />
        <div data-c10-acc={acento} className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center px-4 py-6 font-[Arial,Helvetica,sans-serif]">
          <D.Content
            role={alerta ? "alertdialog" : "dialog"}
            className={CAJA}
            style={{ maxWidth: ancho, height: alto }}
            onOpenAutoFocus={alAbrir}
            // Con un popover abierto adentro (filtros), Esc cierra el popover y no el modal
            onEscapeKeyDown={(e) => {
              if (document.querySelector("[data-c10-popover]")) e.preventDefault();
            }}
            {...(sinDescripcion ? { "aria-describedby": undefined } : {})}
          >
            {children}
          </D.Content>
        </div>
      </D.Portal>
    </D.Root>
  );
}

export interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: ReactNode;
  /** Texto gris bajo el título ("Elige cómo quieres enviar la invitación."). */
  descripcion?: ReactNode;
  /** Ancho máximo en px (560 por defecto). En pantallas angostas deja 16px por lado. */
  ancho?: number;
  children: ReactNode;
  /**
   * Pie estándar: Cancelar + acción principal del mismo ancho. El cuerpo va dentro
   * de un <form>, así que Enter en un input también guarda.
   */
  onGuardar?: () => void;
  etiquetaGuardar?: string;
  guardando?: boolean;
  /** Pie propio, en lugar del estándar. */
  pie?: ReactNode;
  /** Alto fijo en px (modales de selección: la lista no hace saltar el modal al filtrar). */
  alto?: number;
  /** Parte fija bajo el título, sin scroll: aviso, buscador, "seleccionar todos". */
  cabecera?: ReactNode;
  /** Clases extra del cuerpo con scroll (p. ej. otro padding para una lista). */
  claseCuerpo?: string;
}

/** Crear o editar: título y cerrar arriba, campos con scroll, pie fijo. */
export function Modal({
  abierto, onCerrar, titulo, descripcion, ancho = 560, children, onGuardar, etiquetaGuardar = "Guardar", guardando, pie,
  alto, cabecera, claseCuerpo,
}: ModalProps) {
  // Con pie (formulario) la cabecera lleva línea abajo; sin pie (modal de elegir, p. ej.
  // Invitar contratista) cabecera y cuerpo van juntos, como en el diseño.
  const conPie = !!(onGuardar || pie);
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!guardando) onGuardar?.();
  };
  // Al abrir, el foco va al primer campo y no a la "x" de cerrar (el buscador de la cabecera va primero)
  const cuerpoRef = useRef<HTMLDivElement>(null);
  const cabeceraRef = useRef<HTMLDivElement>(null);
  const alAbrir = (e: Event) => {
    const campo =
      cabeceraRef.current?.querySelector<HTMLElement>("input:not([disabled])") ??
      cuerpoRef.current?.querySelector<HTMLElement>("input:not([disabled]), textarea:not([disabled]), button[aria-haspopup]:not([disabled])");
    if (!campo) return;
    e.preventDefault();
    campo.focus();
  };
  const cuerpo = (
    <div ref={cuerpoRef} className={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-6 py-5", claseCuerpo)}>
      {children}
    </div>
  );
  const piePorDefecto = onGuardar && (
    <div className="flex gap-2 border-t border-c10-sunken px-6 py-4">
      <Boton variante="cancelar" flex onClick={onCerrar} disabled={guardando}>
        Cancelar
      </Boton>
      <Boton type="submit" flex disabled={guardando}>
        {guardando && <Loader2 className="animate-spin" />}
        {etiquetaGuardar}
      </Boton>
    </div>
  );
  return (
    <Marco abierto={abierto} onCerrar={onCerrar} ancho={ancho} alto={alto} sinDescripcion={!descripcion} alAbrir={alAbrir}>
      <div className={cn("flex flex-col gap-3.5 px-6 pt-[22px]", conPie || cabecera ? "border-b border-c10-sunken pb-4" : "pb-1", cabecera && "relative z-[2]")}>
        <div className={cn("flex justify-between gap-3", descripcion ? "items-start" : "items-center", conPie && !cabecera && "pb-0.5")}>
          <div className="flex min-w-0 flex-col gap-1">
            <D.Title className="m-0 text-xl font-semibold tracking-[-0.02em] text-c10-title">{titulo}</D.Title>
            {descripcion && <D.Description className="m-0 text-sm text-c10-secondary [text-wrap:pretty]">{descripcion}</D.Description>}
          </div>
          <D.Close asChild>
            <BotonIcono titulo="Cerrar" icono={<X />} />
          </D.Close>
        </div>
        {cabecera && <div ref={cabeceraRef} className="contents">{cabecera}</div>}
      </div>
      {onGuardar ? (
        <form onSubmit={enviar} noValidate className="flex min-h-0 flex-1 flex-col">
          {cuerpo}
          {pie ?? piePorDefecto}
        </form>
      ) : (
        <>
          {cuerpo}
          {pie && <div className="flex gap-2 border-t border-c10-sunken px-6 py-4">{pie}</div>}
        </>
      )}
    </Marco>
  );
}

export interface ModalConfirmarProps {
  abierto: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
  titulo: string;
  descripcion: ReactNode;
  /** Etiqueta del botón principal, con verbo: "Eliminar Documento". */
  etiqueta?: string;
  /** Eliminar, desactivar…: el botón principal va en rojo. */
  peligro?: boolean;
  icono?: ReactNode;
  /** Label de consejo azul bajo la descripción. */
  consejo?: ReactNode;
  /** El registro afectado, en una caja gris ("Contrato C-142 · Ternium"). */
  elemento?: ReactNode;
  /** Dónde se usa lo que se va a cambiar: lista "Se usa en" con conteos. */
  seUsaEn?: { icono?: ReactNode; etiqueta: string; n: number }[];
  cargando?: boolean;
  /** 440px por defecto (el spec pide 420–480). */
  ancho?: number;
}

/** Confirmación: toda acción destructiva o de cambio de estado pasa por aquí. */
export function ModalConfirmar({
  abierto, onCancelar, onConfirmar, titulo, descripcion, etiqueta = "Confirmar", peligro, icono,
  consejo, elemento, seUsaEn, cargando, ancho = 440,
}: ModalConfirmarProps) {
  return (
    <Marco abierto={abierto} onCerrar={onCancelar} ancho={ancho} alerta>
      <div className="flex flex-col gap-4 overflow-y-auto p-6">
        <div className="flex flex-col gap-1.5">
          <D.Title className="m-0 text-xl font-semibold text-c10-title">{titulo}</D.Title>
          <D.Description className="m-0 text-sm leading-normal text-c10-secondary [text-wrap:pretty]">{descripcion}</D.Description>
        </div>
        {consejo && <Consejo>{consejo}</Consejo>}
        {elemento && <div className="rounded-[10px] bg-c10-panel px-3.5 py-3 text-sm font-medium leading-snug text-c10-text">{elemento}</div>}
        {seUsaEn && seUsaEn.length > 0 && (
          <div className="flex flex-col gap-2">
            <Etiqueta>Se usa en</Etiqueta>
            <div className="flex flex-col overflow-hidden rounded-[10px] shadow-[0_0_0_1px_var(--c10-line)]">
              {seUsaEn.map((u, i) => (
                <div
                  key={u.etiqueta}
                  className={cn("flex min-h-10 items-center gap-2.5 px-3 text-sm text-c10-label", i > 0 && "border-t border-c10-sunken")}
                >
                  {u.icono && <span className="flex size-4 shrink-0 text-c10-meta [&_svg]:size-4">{u.icono}</span>}
                  <span className="min-w-0 flex-auto">{u.etiqueta}</span>
                  <span className="font-semibold tabular-nums text-c10-title">{u.n.toLocaleString("es-MX")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Boton variante="cancelar" flex onClick={onCancelar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton variante={peligro ? "peligro" : "primario"} flex onClick={onConfirmar} disabled={cargando}>
            {cargando ? <Loader2 className="animate-spin" /> : icono}
            {etiqueta}
          </Boton>
        </div>
      </div>
    </Marco>
  );
}
