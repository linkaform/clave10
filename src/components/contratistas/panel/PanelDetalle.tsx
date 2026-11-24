"use client";
// F0-07 · Panel de detalle lateral. Ficha: contratistas_f007_panel_detalle.md;
// spec: contratistas_ui_spec.md §3.10. Diseño: plataforma.dc.html, dcPOpen (~3779),
// panelIn/panelOut (~6685, ~6762) y dcOutside (~6686).
//
// Un solo componente para todos los paneles: cada tarea pone el contenido de sus tabs;
// aquí van el contenedor, la cabecera, las tabs, el redimensionado y el cierre.
//
//   <PanelDetalle abierto={!!sel} onCerrar={cerrar} titulo={sel.nombre}
//     chips={<ChipFolio folio={sel.folio} />} tabs={TABS} tab={tab} onTab={setTab}
//     accionPrincipal={<Boton>Editar Empleado</Boton>}>
//     {tab === "generales" && <Generales />}
//   </PanelDetalle>
import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as KE, type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Boton, BotonIcono } from "@/components/contratistas/ui/Boton";
import { useAcentoPortal } from "@/components/contratistas/ui/acento";

/** Ancho único para todos los paneles, como en el diseño (tdW). */
const CLAVE_ANCHO = "c10-detail-w";
const MIN = 480;
const POR_DEFECTO = 640;
const maximo = () => Math.min(1440, window.innerWidth - 40);
const acotar = (w: number) => Math.max(MIN, Math.min(maximo(), Math.round(w)));

const leerAncho = () => {
  try {
    const w = Number(localStorage.getItem(CLAVE_ANCHO));
    return acotar(w >= MIN ? w : POR_DEFECTO);
  } catch {
    return POR_DEFECTO;
  }
};
const guardarAncho = (w: number) => {
  try {
    localStorage.setItem(CLAVE_ANCHO, String(w));
  } catch {
    /* sin almacenamiento: el ancho vale solo esta sesión */
  }
};

/**
 * Solo lectura (p. ej. el empleado visto dentro de un contrato o en el detalle de otra
 * empresa): el contenido de cada tab lo lee para ocultar sus botones de edición.
 */
const SoloLecturaCtx = createContext(false);
export const usePanelSoloLectura = () => useContext(SoloLecturaCtx);

/** Marca un botón (el ojo de una fila) para que abrir otra fila no cierre el panel en vista tabla. */
export const PANEL_OJO = { "data-panel-ojo": "" } as const;

export interface TabPanel {
  k: string;
  etiqueta: string;
  /** Contador junto a la etiqueta (Documentos 3). */
  cuenta?: number;
}

export interface PanelDetalleProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: ReactNode;
  /** Folio, estatus, versión… debajo del título. */
  chips?: ReactNode;
  /** Botones de ícono del registro (abrir, descargar, eliminar). Van antes del cerrar, separados por una línea. */
  acciones?: ReactNode;
  tabs?: TabPanel[];
  tab?: string;
  onTab?: (k: string) => void;
  /** Botón principal del pie, junto a "Cerrar" (p. ej. "Revisar Documento"). */
  accionPrincipal?: ReactNode;
  /** Sin pie (solo el botón cerrar de la cabecera). */
  sinPie?: boolean;
  /**
   * Abierto desde una vista de tabla: sin velo, la tabla sigue usable y el panel cierra
   * con un clic fuera (salvo en botones marcados con PANEL_OJO, para cambiar de fila).
   */
  enTabla?: boolean;
  /** Para lectores de pantalla: "Detalle del documento". */
  etiqueta: string;
  /**
   * Título editable: lápiz junto al título → campo en línea. Enter o salir del campo
   * guarda; Esc cancela. Solo si `titulo` es texto.
   */
  onRenombrar?: (nuevo: string) => void;
  /** Mientras llega el registro: skeleton en el cuerpo (de datos o de tabla, según la tab). */
  cargando?: boolean;
  esqueleto?: "datos" | "tabla";
  /**
   * Sin edición: oculta acciones del registro, acción principal y renombrar. Las tabs que
   * no aplican las quita la pantalla; el contenido lo sabe con usePanelSoloLectura().
   */
  soloLectura?: boolean;
  children: ReactNode;
}

export function PanelDetalle({
  abierto, onCerrar, titulo, chips, acciones, tabs, tab, onTab, accionPrincipal, sinPie, enTabla, etiqueta,
  onRenombrar, cargando, esqueleto = "datos", soloLectura, children,
}: PanelDetalleProps) {
  if (soloLectura) {
    acciones = undefined;
    accionPrincipal = undefined;
    onRenombrar = undefined;
  }
  // Se queda montado mientras corre la animación de salida
  const [montado, setMontado] = useState(abierto);
  const [ancho, setAncho] = useState(POR_DEFECTO);
  const panel = useRef<HTMLElement>(null);
  const velo = useRef<HTMLDivElement>(null);
  const { ancla, acento } = useAcentoPortal(abierto);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    if (abierto) setMontado(true);
  }, [abierto]);

  // Entrada: desliza desde la derecha (320 ms) y el velo aparece
  useLayoutEffect(() => {
    if (!abierto || !montado || !panel.current) return;
    setAncho(leerAncho());
    panel.current.animate([{ transform: "translateX(100%)" }, { transform: "translateX(0)" }], { duration: 320, easing: "cubic-bezier(.22,.8,.24,1)" });
    velo.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-out" });
    panel.current.focus({ preventScroll: true });
  }, [abierto, montado]);

  // Salida: sale a la derecha (260 ms) y luego se desmonta
  useEffect(() => {
    if (abierto || !montado || !panel.current) return;
    velo.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-in", fill: "forwards" });
    const a = panel.current.animate([{ transform: "translateX(0)" }, { transform: "translateX(100%)" }], { duration: 260, easing: "cubic-bezier(.4,0,.8,.4)", fill: "forwards" });
    a.onfinish = () => setMontado(false);
    return () => a.cancel();
  }, [abierto, montado]);

  useEffect(() => {
    if (!abierto) return;
    // Esc cierra, salvo que haya un modal abierto encima (ese se cierra primero). Va en
    // document con captura: corre antes que Radix (que cerraría el modal y ya no se vería
    // abierto) y después del Selector, que en window detiene el Esc de su menú.
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector('[role=dialog][data-state=open],[role=alertdialog][data-state=open]')) return;
      // Renombrando: Esc cancela la edición del título, no cierra el panel
      if ((e.target as HTMLElement).closest?.("[data-panel-titulo]")) return;
      cerrar.current();
    };
    // En vista tabla no hay velo: un clic fuera del panel lo cierra
    const fuera = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (panel.current?.contains(t) || t.closest("[data-panel-ojo],[role=dialog],[role=alertdialog],[data-sonner-toaster]")) return;
      cerrar.current();
    };
    const alCambiar = () => setAncho((w) => acotar(w));
    document.addEventListener("keydown", esc, true);
    window.addEventListener("resize", alCambiar);
    if (enTabla) document.addEventListener("pointerdown", fuera, true);
    return () => {
      document.removeEventListener("keydown", esc, true);
      window.removeEventListener("resize", alCambiar);
      document.removeEventListener("pointerdown", fuera, true);
    };
  }, [abierto, enTabla]);

  // Arrastrar el asa izquierda
  const arrastrar = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const x0 = e.clientX;
    const w0 = panel.current?.offsetWidth ?? POR_DEFECTO;
    let ultimo = w0;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const mover = (ev: PointerEvent) => {
      ultimo = acotar(w0 + (x0 - ev.clientX));
      setAncho(ultimo);
    };
    const soltar = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      guardarAncho(ultimo);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  }, []);

  // Con teclado: flechas de 40 en 40 px
  const conTeclado = (e: KE) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const w = acotar(ancho + (e.key === "ArrowLeft" ? 40 : -40));
    setAncho(w);
    guardarAncho(w);
  };

  if (!montado) return ancla;

  return (
    <>
      {ancla}
      {createPortal(
        <div data-c10-acc={acento} className="font-[Arial,Helvetica,sans-serif]">
          <div
            ref={velo}
            onClick={enTabla ? undefined : onCerrar}
            className={cn("fixed inset-0 z-[80]", enTabla ? "pointer-events-none" : "bg-slate-900/20")}
          />
          <aside
            ref={panel}
            role="dialog"
            aria-label={etiqueta}
            tabIndex={-1}
            style={{ width: ancho }}
            className="fixed bottom-0 right-0 top-0 z-[81] flex max-w-full flex-col bg-c10-surface shadow-[0_20px_40px_rgba(15,23,42,.25)] outline-none"
          >
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Ancho del panel"
              aria-valuenow={ancho}
              aria-valuemin={MIN}
              aria-valuemax={1440}
              tabIndex={0}
              title="Arrastra para ajustar el ancho"
              onPointerDown={arrastrar}
              onKeyDown={conTeclado}
              className="group absolute -left-1 bottom-0 top-0 z-[2] flex w-2 cursor-col-resize items-center justify-center outline-none hover:bg-blue-500/10 focus-visible:bg-blue-500/10 max-md:hidden"
            >
              <span className="h-10 w-1 rounded-full bg-c10-line-strong group-hover:bg-c10-acc" />
            </div>

            <header className={cn("flex flex-col gap-3.5 border-b border-c10-line-card px-6 pt-5", !tabs?.length && "pb-4")}>
              <div className="flex items-start gap-3.5">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {onRenombrar && typeof titulo === "string" ? (
                    <TituloEditable titulo={titulo} onRenombrar={onRenombrar} />
                  ) : (
                    <h2 className="m-0 text-xl font-semibold leading-[1.3] tracking-[-0.02em] text-c10-title [text-wrap:pretty]">{titulo}</h2>
                  )}
                  {chips && <div className="flex flex-wrap gap-1.5">{chips}</div>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {acciones}
                  {acciones && <span className="mx-1 h-6 w-px bg-c10-line" aria-hidden />}
                  <BotonIcono titulo="Cerrar" icono={<X />} onClick={onCerrar} />
                </div>
              </div>
              {!!tabs?.length && (
                <div role="tablist" aria-label={`Secciones de ${etiqueta.toLowerCase()}`} className="-mb-px flex gap-5 overflow-x-auto [scrollbar-width:none]">
                  {tabs.map((t) => {
                    const on = t.k === tab;
                    return (
                      <button
                        key={t.k}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onTab?.(t.k)}
                        className={cn(
                          "flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 text-sm transition-colors duration-150",
                          on ? "border-c10-acc font-semibold text-c10-acc" : "border-transparent font-normal text-c10-meta hover:text-c10-acc",
                        )}
                      >
                        {t.etiqueta}
                        {t.cuenta !== undefined && (
                          <span
                            className={cn(
                              "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] text-[11px] font-semibold tabular-nums",
                              on ? "bg-c10-acc-l text-c10-acc-h" : "bg-c10-sunken text-c10-secondary",
                            )}
                          >
                            {t.cuenta}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </header>

            <div
              role={tabs?.length ? "tabpanel" : undefined}
              aria-busy={cargando || undefined}
              className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-c10-panel px-6 py-5"
            >
              {cargando ? (
                esqueleto === "tabla" ? <EsqueletoTabla /> : <EsqueletoDatos />
              ) : (
                <SoloLecturaCtx.Provider value={!!soloLectura}>{children}</SoloLecturaCtx.Provider>
              )}
            </div>

            {!sinPie && (
              <footer className="flex justify-end gap-2 border-t border-c10-line-card px-6 py-4">
                <Boton variante="cancelar" onClick={onCerrar} className="w-[180px]">
                  Cerrar
                </Boton>
                {accionPrincipal}
              </footer>
            )}
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}

/** Título con lápiz para renombrar en línea (diseño: tdTitleEdit, ~3441). */
function TituloEditable({ titulo, onRenombrar }: { titulo: string; onRenombrar: (nuevo: string) => void }) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(titulo);
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editando) campo.current?.select();
  }, [editando]);
  // Al cambiar de registro se sale de la edición
  useEffect(() => setEditando(false), [titulo]);

  const guardar = () => {
    const nuevo = borrador.trim();
    setEditando(false);
    if (nuevo && nuevo !== titulo) onRenombrar(nuevo);
  };

  if (editando) {
    return (
      <input
        ref={campo}
        data-panel-titulo=""
        aria-label="Título"
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={guardar}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            guardar();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setEditando(false);
          }
        }}
        className="-my-[3px] h-9 w-full min-w-0 rounded-lg border border-c10-acc bg-c10-surface px-2.5 text-xl font-semibold tracking-[-0.02em] text-c10-title shadow-[0_0_0_3px_rgba(59,130,246,.15)] outline-none"
      />
    );
  }
  return (
    <div className="flex min-w-0 items-start gap-1">
      <h2 className="m-0 min-w-0 text-xl font-semibold leading-[1.3] tracking-[-0.02em] text-c10-title [text-wrap:pretty]">{titulo}</h2>
      <button
        type="button"
        title="Renombrar"
        aria-label="Renombrar"
        onClick={() => {
          setBorrador(titulo);
          setEditando(true);
        }}
        className="-mt-px flex size-7 shrink-0 items-center justify-center rounded-full text-c10-faint transition-colors duration-150 hover:bg-c10-acc-l hover:text-c10-acc"
      >
        <Pencil className="size-[15px]" />
      </button>
    </div>
  );
}

const Hueso = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <span style={style} className={cn("block animate-pulse rounded-full bg-c10-skeleton", className)} />
);

/** Skeleton de una tarjeta de datos (diseño: pnSkCards). */
function EsqueletoDatos() {
  return (
    <div aria-label="Cargando información" className="flex flex-col gap-4">
      {[6, 4].map((n, k) => (
        <section key={k} className="flex flex-col gap-4 rounded-xl bg-c10-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
          <Hueso className="h-3.5 w-[140px]" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-6 gap-y-4">
            {Array.from({ length: n }, (_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Hueso className="h-2.5 w-2/5" />
                <Hueso className="h-3.5 w-3/4" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Skeleton de una tab con tabla: barra de búsqueda y filas (diseño: pnSkTable). */
function EsqueletoTabla() {
  return (
    <div aria-label="Cargando información" className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <Hueso className="h-3.5 w-[110px]" />
        <Hueso className="h-[22px] w-[72px]" />
        <span className="flex-1" />
        <Hueso className="size-10 rounded-lg" />
        <Hueso className="h-10 w-[240px] max-w-[40%] rounded-lg" />
      </div>
      <div className="overflow-hidden rounded-xl bg-c10-surface shadow-[0_0_0_1px_var(--c10-line)]">
        <div className="h-10 bg-c10-acc-l" />
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="grid h-[52px] grid-cols-[120px_repeat(4,minmax(0,1fr))] items-center gap-4 border-t border-c10-sunken px-3">
            <span className="flex gap-1.5">
              <Hueso className="size-8 rounded-lg" />
              <Hueso className="size-8 rounded-lg" />
            </span>
            {[0, 1, 2, 3].map((j) => (
              <Hueso key={j} className="h-3" style={{ width: `${40 + ((i * 7 + j * 13) % 50)}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Tarjeta blanca del cuerpo del panel. */
export function TarjetaPanel({ titulo, children, className }: { titulo?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-xl bg-c10-surface p-5 shadow-[0_0_0_1px_var(--c10-line-card)]", className)}>
      {titulo && <h3 className="m-0 text-base font-semibold text-c10-title">{titulo}</h3>}
      {children}
    </section>
  );
}

/** Rejilla de datos: tantas columnas como quepan (el panel cambia de ancho). */
export function Datos({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-6 gap-y-[18px]">{children}</div>;
}

/** Nombre de campo y dato. El protagonista es el dato. Vacío: "---". */
export function Dato({ nombre, children, completo }: { nombre: string; children?: ReactNode; completo?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", completo && "col-span-full")}>
      <span className="text-[11px] font-medium uppercase tracking-[.05em] text-c10-faint">{nombre}</span>
      <span className="text-sm font-medium tabular-nums text-c10-title [overflow-wrap:anywhere]">{children ?? "---"}</span>
    </div>
  );
}
