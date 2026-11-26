"use client";
// F0-06 · Filtros de Contratistas: un solo contenido con tres formas.
//
//   - <ConFiltros>: panel lateral de 280px a la izquierda del listado (≥1100px). Se oculta con
//     la flecha y queda la pastilla flotante para volver a abrirlo; en la vista tabla nace
//     oculto. En pantallas angostas solo está la pastilla, que abre el panel como cajón.
//   - <FiltrosCabecera>: botón de filtros con contador en la cabecera y el contenido en un
//     popover (Empleados; o, con `angosto`, en pantallas angostas fuera de la vista tabla).
//   - Controles: <FiltroChips>, <FiltroLista>, <FiltroFecha>, <FiltroInterruptor>.
//
// El estado vive en useFiltros (contador, limpiar, atajos por URL).
// Diseño: plataforma.dc.html, Documentos (dcSideF, dcPillSide, dcFsFlip ~2701-2710, ~7992) y
// Empleados (emHdrF, emFOpen ~2443). Ficha: lkf-claude, contratistas_f006_filtros.md.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ChevronLeft, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Entrada, Interruptor, Selector, type Opcion } from "../ui";
import type { Vista } from "../ui/tabla/Listado";
import { PERIODOS, type FiltroFecha as ValorFecha, type Periodo } from "./fecha";

/** Ancho desde el que el panel va a un lado del listado; abajo de eso, pastilla y cajón. */
export const ANCHO_PANEL = 1100;

const SOMBRA_CAJA = "shadow-[0_0_0_1px_var(--c10-line-card),0_12px_32px_rgba(15,23,42,.14)]";

// ---------- Piezas ----------

/** Contador redondo de 18px. */
const Globito = ({ n, className }: { n: number; className?: string }) => (
  <span className={cn("inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] text-[11px] font-bold tabular-nums", className)}>{n}</span>
);

/** Título "Filtros", contador, "Limpiar" (solo con filtros puestos) y, a la izquierda, ocultar o a la derecha, cerrar. */
function Cabecera({ cuenta, onLimpiar, onOcultar, onCerrar }: { cuenta: number; onLimpiar: () => void; onOcultar?: () => void; onCerrar?: () => void }) {
  return (
    <div className="flex items-center gap-2 border-b border-c10-line-card pb-2.5">
      {onOcultar && (
        <button
          type="button"
          title="Ocultar filtros"
          aria-label="Ocultar filtros"
          onClick={onOcultar}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-c10-sunken text-c10-secondary transition-colors duration-150 hover:bg-c10-acc-l hover:text-c10-acc"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
      )}
      <span className="text-base font-semibold text-c10-title">Filtros</span>
      {cuenta > 0 && <Globito n={cuenta} className="bg-c10-acc text-white" />}
      <span className="ml-auto flex items-center gap-1">
        {cuenta > 0 && (
          <button type="button" onClick={onLimpiar} className="h-7 rounded-md px-2 text-sm font-semibold text-c10-acc transition-colors hover:bg-c10-acc-subtle">
            Limpiar
          </button>
        )}
        {onCerrar && (
          <button
            type="button"
            title="Cerrar filtros"
            aria-label="Cerrar filtros"
            onClick={onCerrar}
            className="flex size-8 items-center justify-center rounded-full bg-c10-sunken text-c10-secondary transition-colors hover:bg-c10-acc-l hover:text-c10-acc"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </span>
    </div>
  );
}

/** Grupo del panel: separador, título y sus controles. El primero va sin separador. */
export function GrupoFiltro({ titulo, extra, children }: { titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <div role="group" aria-label={titulo} className="flex flex-col gap-2.5 border-t border-c10-sunken pt-3.5 first:border-t-0 first:pt-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-c10-label">{titulo}</span>
        {extra}
      </div>
      {children}
    </div>
  );
}

/** Lista de grupos con su espaciado; lo comparten el panel, el cajón y el popover. */
const Cuerpo = ({ children }: { children: ReactNode }) => <div className="flex flex-col gap-3.5">{children}</div>;

// ---------- Controles ----------

export interface OpcionFiltro {
  valor: string;
  /** Texto del chip; si no viene, el valor. */
  etiqueta?: string;
  /** Registros que coinciden. */
  cuenta?: number;
}

/** Chip de opción del panel: checkbox con etiqueta y contador; elegido = fondo y contador con el acento. */
export function ChipOpcion({ activo, cuenta, onClick, children }: { activo: boolean; cuenta?: number; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={activo}
      onClick={onClick}
      className={cn(
        "inline-flex h-[30px] max-w-full items-center gap-1.5 rounded-full pl-3 text-[13px] transition-colors duration-150",
        cuenta === undefined ? "pr-3" : "pr-2",
        activo ? "bg-c10-acc-l font-semibold text-c10-acc-h" : "bg-c10-panel text-c10-label hover:bg-c10-line",
      )}
    >
      <span className="truncate">{children}</span>
      {cuenta !== undefined && <Globito n={cuenta} className={activo ? "bg-c10-acc text-white" : "bg-c10-acc-l text-c10-acc"} />}
    </button>
  );
}

/** Pocas opciones (Estatus, Cumplimiento, Tipo de propietario): chips, varias a la vez. */
export function FiltroChips({ titulo, opciones, valor, onCambio }: { titulo: string; opciones: OpcionFiltro[]; valor: string[]; onCambio: (v: string[]) => void }) {
  const alternar = (v: string) => onCambio(valor.includes(v) ? valor.filter((x) => x !== v) : [...valor, v]);
  return (
    <GrupoFiltro titulo={titulo}>
      <div className="flex flex-wrap gap-1.5">
        {opciones.map((o) => (
          <ChipOpcion key={o.valor} activo={valor.includes(o.valor)} cuenta={o.cuenta} onClick={() => alternar(o.valor)}>
            {o.etiqueta ?? o.valor}
          </ChipOpcion>
        ))}
      </div>
    </GrupoFiltro>
  );
}

/** Muchas opciones (Categoría, Propietario, Contrato, Perfil…): un selector que agrega cada valor como chip con "x". */
export function FiltroLista({
  titulo, opciones, valor, onCambio, placeholder,
}: { titulo: string; opciones: OpcionFiltro[]; valor: string[]; onCambio: (v: string[]) => void; placeholder?: string }) {
  const nombre = (v: string) => opciones.find((o) => o.valor === v)?.etiqueta ?? v;
  const libres: Opcion[] = opciones
    .filter((o) => !valor.includes(o.valor))
    .map((o) => ({ valor: o.valor, etiqueta: o.cuenta === undefined ? o.etiqueta ?? o.valor : `${o.etiqueta ?? o.valor} (${o.cuenta})` }));
  const ph = placeholder ?? `Selecciona ${titulo.toLowerCase()}`;
  return (
    <GrupoFiltro titulo={titulo}>
      <Selector
        opciones={libres.length ? libres : [{ valor: "", etiqueta: "No hay más opciones" }]}
        valor={null}
        onCambio={(v) => v && onCambio([...valor, v])}
        placeholder={ph}
        etiqueta={ph}
        deshabilitado={!opciones.length}
      />
      {valor.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {valor.map((v) => (
            <span key={v} className="inline-flex h-7 max-w-full items-center gap-1 rounded-full bg-c10-acc-l pl-3 pr-1 text-[13px] font-semibold text-c10-acc-h">
              <span className="truncate">{nombre(v)}</span>
              <button
                type="button"
                title="Quitar"
                aria-label={`Quitar ${nombre(v)}`}
                onClick={() => onCambio(valor.filter((x) => x !== v))}
                className="flex size-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-c10-acc-border"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}
    </GrupoFiltro>
  );
}

const OPCIONES_FECHA: Opcion<Periodo>[] = PERIODOS.map((p) => ({ valor: p, etiqueta: p }));

/** Fecha: Todos, Hoy, Ayer… y Personalizado, que muestra Desde y Hasta. */
export function FiltroFecha({ titulo = "Fecha", valor, onCambio }: { titulo?: string; valor: ValorFecha; onCambio: (v: ValorFecha) => void }) {
  const fechaCampo = (lado: "desde" | "hasta", texto: string) => (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-c10-meta">{texto}</span>
      <Entrada
        type="date"
        aria-label={`Fecha ${lado}`}
        value={valor[lado] ?? ""}
        max={lado === "desde" ? valor.hasta || undefined : undefined}
        min={lado === "hasta" ? valor.desde || undefined : undefined}
        onChange={(e) => onCambio({ ...valor, [lado]: e.target.value })}
        className="px-2.5"
      />
    </label>
  );
  return (
    <GrupoFiltro titulo={titulo}>
      <Selector opciones={OPCIONES_FECHA} valor={valor.periodo} onCambio={(p) => onCambio({ ...valor, periodo: p })} etiqueta={titulo} />
      {valor.periodo === "Personalizado" && (
        <div className="grid grid-cols-2 gap-2">
          {fechaCampo("desde", "Desde")}
          {fechaCampo("hasta", "Hasta")}
        </div>
      )}
    </GrupoFiltro>
  );
}

/** Interruptor de 36×20 con título y, opcional, una línea de ayuda ("Con usuario de Clave 10"). */
export function FiltroInterruptor({
  titulo, descripcion, etiqueta, valor, onCambio,
}: { titulo: string; descripcion?: string; etiqueta?: string; valor: boolean; onCambio: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-c10-sunken pt-3.5 first:border-t-0 first:pt-1">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-c10-label">{titulo}</span>
        {descripcion && <span className="text-xs text-c10-meta">{descripcion}</span>}
      </span>
      <Interruptor valor={valor} onCambio={onCambio} etiqueta={etiqueta ?? titulo} />
    </div>
  );
}

// ---------- Pastilla flotante ----------

/**
 * Pastilla pegada a la orilla izquierda con el ícono de filtros y el contador en rojo.
 * Se puede arrastrar hacia arriba o abajo para que no tape; un clic sin arrastrar la abre.
 * (Misma pieza que BotonFiltros de los reportes, con el acento del modo.)
 */
export function PastillaFiltros({ cuenta, onClick }: { cuenta: number; onClick: () => void }) {
  const [y, setY] = useState<number | null>(null);
  const arrastre = useRef<{ y0: number; top0: number; movio: boolean } | null>(null);
  return (
    <button
      type="button"
      title="Mostrar filtros · arrastra para moverla"
      aria-label={cuenta ? `Mostrar filtros (${cuenta} activos)` : "Mostrar filtros"}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        arrastre.current = { y0: e.clientY, top0: r.top + r.height / 2, movio: false };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const a = arrastre.current;
        if (!a) return;
        if (Math.abs(e.clientY - a.y0) > 4) a.movio = true;
        if (a.movio) setY(Math.min(window.innerHeight - 34, Math.max(110, a.top0 + e.clientY - a.y0)));
      }}
      onPointerUp={() => {
        const movio = arrastre.current?.movio;
        arrastre.current = null;
        if (!movio) onClick();
      }}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick())}
      style={{ top: y ?? "50%", touchAction: "none" }}
      className="fixed left-0 z-[140] flex h-[52px] w-[38px] -translate-y-1/2 cursor-grab items-center justify-center rounded-r-full bg-c10-acc text-white shadow-[0_4px_12px_rgba(47,128,237,.3)] transition-colors animate-in fade-in duration-200 hover:bg-c10-acc-h active:cursor-grabbing"
    >
      <SlidersHorizontal className="size-[18px]" aria-hidden />
      {cuenta > 0 && <Globito n={cuenta} className="absolute -right-1 -top-1.5 bg-red-600 text-white" />}
    </button>
  );
}

// ---------- Utilidades ----------

/** ¿La ventana mide al menos `px`? Antes de montar responde true (pantalla ancha). */
function useAncho(px: number) {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const cambio = () => setOk(mq.matches);
    cambio();
    mq.addEventListener("change", cambio);
    return () => mq.removeEventListener("change", cambio);
  }, [px]);
  return ok;
}

/** Cierra con clic fuera de `caja` y con Esc mientras `abierto`. */
function useCerrarFuera(caja: RefObject<HTMLElement | null>, abierto: boolean, cerrar: () => void, ignorar?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      const t = e.target as Node;
      if (caja.current?.contains(t) || ignorar?.current?.contains(t)) return;
      // Los menús del Selector se pintan dentro de la caja; los de Radix (portal) no se tocan aquí
      if ((t as Element).closest?.("[data-radix-popper-content-wrapper]")) return;
      cerrar();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto, caja, cerrar, ignorar]);
}

// ---------- Formas ----------

interface BaseFiltros {
  /** Cuántos filtros hay puestos (useFiltros().cuenta). */
  cuenta: number;
  onLimpiar: () => void;
  /** Los grupos: <FiltroChips>, <FiltroLista>, <FiltroFecha>, <FiltroInterruptor>… */
  filtros: ReactNode;
}

/**
 * Mueve con animación las piezas marcadas con `data-fsflip` (las <Tarjeta> del kit) desde
 * donde estaban hasta su nuevo lugar, cuando el panel se oculta o se muestra (FLIP).
 * `foto()` se llama justo antes del cambio; la animación corre al pintar el cambio.
 */
function useDeslizar(contenedor: RefObject<HTMLElement | null>, clave: unknown) {
  const antes = useRef<Map<Element, DOMRect> | null>(null);
  useLayoutEffect(() => {
    const R = antes.current;
    antes.current = null;
    if (!R) return;
    R.forEach((a, el) => {
      if (!el.isConnected) return;
      const b = el.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate?.([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 250, easing: "ease-in-out" });
    });
  }, [clave]);
  return () => {
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const els = quieto || !contenedor.current ? [] : [...contenedor.current.querySelectorAll("[data-fsflip]")];
    antes.current = new Map(els.map((e) => [e, e.getBoundingClientRect()]));
  };
}

/**
 * Listado con su panel de filtros.
 *
 * - Pantalla ancha (≥1100px): panel a la izquierda, pegado al hacer scroll. Al ocultarlo
 *   queda la pastilla para volver a abrirlo. En cards y lista el listado toma el espacio de
 *   golpe y las tarjetas se deslizan a su nuevo lugar; en tabla se anima el ancho (250 ms).
 *   En la vista tabla nace oculto; si la persona lo abre o lo cierra, se respeta lo que eligió.
 * - Pantalla angosta: la pastilla abre el panel como cajón. Si la pantalla pone además
 *   <FiltrosCabecera angosto vista={vista}> en su cabecera, pasa `conCabecera` y la pastilla
 *   queda solo para la vista tabla (en cards y lista se filtra desde la cabecera).
 */
export function ConFiltros({
  cuenta, onLimpiar, filtros, vista, conCabecera, tope = "calc(var(--c10-header-h, 65px) + 96px)", children,
}: BaseFiltros & {
  vista?: Vista;
  /** La pantalla tiene <FiltrosCabecera angosto> en su cabecera. */
  conCabecera?: boolean;
  /** Distancia desde arriba a la que se pega el panel (debajo de la cabecera de la sección). */
  tope?: string;
  children: ReactNode;
}) {
  const ancho = useAncho(ANCHO_PANEL);
  const [cerradoA, setCerrado] = useState<boolean | null>(null);
  const [cajon, setCajon] = useState(false);
  const cerrado = cerradoA ?? vista === "tabla";
  const caja = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const contenido = useRef<HTMLDivElement>(null);
  const foto = useDeslizar(contenido, cerrado);
  useCerrarFuera(caja, cajon, () => setCajon(false));

  const voltear = (c: boolean) => {
    if (vista !== "tabla") foto();
    setCerrado(c);
  };

  // Oculto no se puede enfocar con Tab (inert aún no está en los tipos de React 18)
  useEffect(() => {
    if (panel.current) panel.current.inert = cerrado;
  }, [cerrado, ancho]);

  // Al pasar a pantalla ancha el cajón ya no hace falta
  useEffect(() => {
    if (ancho) setCajon(false);
  }, [ancho]);

  const lateral = ancho;
  // Como en el diseño: el ancho solo se anima en tabla; en cards y lista se deslizan las tarjetas
  const tr = vista === "tabla" ? "250ms ease-in-out" : null;
  const pastilla = lateral ? cerrado : !conCabecera || vista === "tabla";
  return (
    <div
      className="grid items-start"
      style={{
        gridTemplateColumns: lateral ? "auto minmax(0, 1fr)" : "minmax(0, 1fr)",
        columnGap: lateral && !cerrado ? 16 : 0,
        transition: tr ? `column-gap ${tr}` : "none",
      }}
    >
      {lateral && (
        <div className="sticky z-[2]" style={{ top: tope, width: cerrado ? 0 : 280, transition: tr ? `width ${tr}` : "none" }}>
          <aside
            ref={panel}
            aria-label="Filtros"
            aria-hidden={cerrado}
            className="flex w-[280px] flex-col gap-3.5 rounded-2xl bg-c10-surface px-[18px] pb-[18px] pt-4 shadow-[0_1px_2px_rgba(15,23,42,.04),0_6px_20px_rgba(15,23,42,.04)]"
            style={{
              maxHeight: `calc(100vh - ${tope} - 24px)`,
              overflowY: cerrado ? "hidden" : "auto",
              clipPath: cerrado ? "inset(0 280px 0 0 round 16px)" : "inset(0 0 0 0 round 16px)",
              opacity: cerrado ? 0 : 1,
              transition: cerrado ? "clip-path 250ms ease-in-out, opacity 0ms linear 250ms" : "clip-path 250ms ease-in-out, opacity 0ms linear 0ms",
            }}
          >
            <Cabecera cuenta={cuenta} onLimpiar={onLimpiar} onOcultar={() => voltear(true)} />
            <Cuerpo>{filtros}</Cuerpo>
          </aside>
        </div>
      )}

      <div ref={contenido} className="min-w-0">{children}</div>

      {pastilla && <PastillaFiltros cuenta={cuenta} onClick={() => (lateral ? voltear(false) : setCajon(true))} />}

      {!lateral && cajon && (
        <>
          <div aria-hidden className="fixed inset-0 z-[150] bg-[color-mix(in_srgb,var(--c10-canvas)_72%,transparent)] animate-in fade-in duration-200" />
          <div
            ref={caja}
            role="dialog"
            aria-label="Filtros"
            className={cn(
              "fixed inset-y-0 left-0 z-[151] flex w-[316px] max-w-[calc(100vw-32px)] flex-col gap-3.5 overflow-y-auto bg-c10-surface px-4 py-5 animate-in slide-in-from-left-4 fade-in duration-200",
              SOMBRA_CAJA,
            )}
          >
            <Cabecera cuenta={cuenta} onLimpiar={onLimpiar} onCerrar={() => setCajon(false)} />
            <Cuerpo>{filtros}</Cuerpo>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Botón de filtros de 40px para la cabecera de la pantalla, con el contenido en un popover.
 * - Siempre visible: pantallas que filtran desde la cabecera (Empleados, modales de selección).
 * - `angosto` + `vista`: acompaña a <ConFiltros conCabecera>; solo aparece en pantalla angosta
 *   y fuera de la vista tabla, que es cuando no hay panel lateral ni pastilla.
 */
export function FiltrosCabecera({
  cuenta, onLimpiar, filtros, angosto, vista, className,
}: BaseFiltros & { angosto?: boolean; vista?: Vista; className?: string }) {
  const ancho = useAncho(ANCHO_PANEL);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const visible = !angosto || (!ancho && vista !== "tabla");
  useCerrarFuera(caja, abierto && visible, () => setAbierto(false));
  if (!visible) return null;
  const marcado = cuenta > 0 || abierto;
  return (
    <div ref={caja} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        title="Filtros"
        aria-label={cuenta ? `Filtros (${cuenta} activos)` : "Filtros"}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className={cn(
          "relative flex size-10 items-center justify-center rounded-lg border outline-none transition-[border-color,color,box-shadow] duration-150",
          "hover:border-c10-acc hover:text-c10-acc focus-visible:border-c10-acc focus-visible:text-c10-acc focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,.15)]",
          marcado ? "border-c10-acc text-c10-acc" : "border-c10-line text-c10-meta",
          cuenta > 0 ? "bg-c10-acc-subtle" : "bg-c10-surface",
        )}
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        {cuenta > 0 && <Globito n={cuenta} className="absolute -right-[7px] -top-[7px] bg-c10-acc text-white" />}
      </button>
      {abierto && (
        <div
          role="dialog"
          aria-label="Filtros"
          data-c10-popover=""
          className={cn(
            "absolute left-0 top-12 z-[31] flex max-h-[480px] w-[316px] max-w-[calc(100vw-32px)] flex-col gap-3 overflow-y-auto rounded-2xl bg-c10-surface p-4 animate-in fade-in slide-in-from-top-1 duration-200",
            SOMBRA_CAJA,
          )}
        >
          <Cabecera cuenta={cuenta} onLimpiar={onLimpiar} />
          <Cuerpo>{filtros}</Cuerpo>
        </div>
      )}
    </div>
  );
}
