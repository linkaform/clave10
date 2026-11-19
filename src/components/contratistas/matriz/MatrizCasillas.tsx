"use client";
// F0-12 · Variante de casillas del motor (Asignación de requerimientos, MX-05).
// Cada celda es un checkbox; el del encabezado marca la columna y el de la fila
// marca la fila. Los cambios quedan en borrador hasta Guardar Cambios.
import { useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import { colorAvatar, iniciales } from "@/lib/contratistas/matriz";
import type { MatrizColumna, MatrizFila } from "@/types/contratistas/matriz";
import { BarraFlotante, BotonBarra, Casilla } from "./piezas";

export interface FilaCasillas extends MatrizFila {
  /** Invitación aún no aceptada: se marca la fila. */
  invitacionPendiente?: boolean;
}

export interface MatrizCasillasProps {
  filas: FilaCasillas[];
  columnas: MatrizColumna[];
  /** Lo guardado: ids de columna marcados por fila. */
  asignadas: Record<string, string[]>;
  /** Recibe solo las filas con cambios, con su lista completa de columnas. */
  onGuardar: (cambios: Record<string, string[]>) => Promise<void> | void;
  etiquetaFila: string;
  /** Singular y plural para "N contratistas con cambios". */
  unidad: [string, string];
  mensajeGuardado?: string;
  barra?: ReactNode;
  onFilaClick?: (fila: FilaCasillas) => void;
  paginacion?: (total: number) => ReactNode;
  vacio?: ReactNode;
  stickyTop?: number;
  anchoNombre?: number;
}

const iguales = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export function MatrizCasillas(p: MatrizCasillasProps) {
  const [borrador, setBorrador] = useState<Record<string, string[]>>({});
  const [guardando, setGuardando] = useState(false);
  const hdRef = useRef<HTMLDivElement>(null);

  const valor = (filaId: string) => borrador[filaId] ?? p.asignadas[filaId] ?? [];
  const sucias = useMemo(() => Object.keys(borrador), [borrador]);

  /** Aplica un cambio a varias filas y quita del borrador las que vuelven a lo guardado. */
  const aplicar = (ids: string[], f: (actual: string[]) => string[]) =>
    setBorrador((b) => {
      const n = { ...b };
      ids.forEach((id) => {
        const nuevo = f(b[id] ?? p.asignadas[id] ?? []);
        if (iguales(nuevo, p.asignadas[id] ?? [])) delete n[id];
        else n[id] = nuevo;
      });
      return n;
    });

  const ids = p.filas.map((f) => f.id);
  const cols = p.columnas.map((c) => c.id);
  const colOn = (c: string) => p.filas.filter((f) => valor(f.id).includes(c)).length;
  const totalOn = p.filas.reduce((n, f) => n + valor(f.id).length, 0);
  const todo = p.filas.length > 0 && totalOn === p.filas.length * cols.length;

  const alternarColumna = (c: string) => {
    const on = colOn(c) === p.filas.length;
    aplicar(ids, (v) => (on ? v.filter((x) => x !== c) : v.includes(c) ? v : [...v, c]));
  };
  const alternarFila = (id: string) => {
    const on = valor(id).length === cols.length;
    aplicar([id], () => (on ? [] : cols.slice()));
  };
  const alternarCelda = (id: string, c: string) =>
    aplicar([id], (v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]));
  const alternarTodo = () => aplicar(ids, () => (todo ? [] : cols.slice()));

  const guardar = async () => {
    setGuardando(true);
    try {
      await p.onGuardar(borrador);
      setBorrador({});
      toast.success(p.mensajeGuardado ?? "Se guardaron los cambios");
    } catch (e) {
      toast.error(`No se pudieron guardar los cambios: ${(e as Error).message}`);
    } finally {
      setGuardando(false);
    }
  };

  const anchoNombre = p.anchoNombre ?? 300;
  const grid = `${anchoNombre}px 120px repeat(${Math.max(1, cols.length)}, minmax(140px, 1fr))`;
  const minW = anchoNombre + 120 + Math.max(1, cols.length) * 140;

  return (
    <section className="flex min-w-0 flex-col gap-3">
      {p.barra && <div className="flex flex-wrap items-center gap-x-3 gap-y-2">{p.barra}</div>}
      <div className="rounded-xl bg-white shadow-[0_0_0_1px_#E2E8F0]">
        <div className="sticky z-[4]" style={{ top: p.stickyTop ?? 0 }}>
          <div ref={hdRef} className="overflow-hidden rounded-t-xl bg-[var(--c10-acc-l,#DBEAFE)]">
            <div style={{ minWidth: minW }}>
              <div className="grid min-h-14" style={{ gridTemplateColumns: grid }}>
                <span className="sticky left-0 z-[2] flex items-center gap-2 whitespace-nowrap bg-[var(--c10-acc-l,#DBEAFE)] px-3 py-2 text-xs font-semibold uppercase tracking-[.05em] text-[#475569] shadow-[1px_0_0_var(--c10-acc-b,#BFDBFE)]">
                  <Casilla tam={20} marcada={todo} mixto={!todo && totalOn > 0} titulo={todo ? "Quitar todos" : "Marcar todos"} onClick={alternarTodo} deshabilitada={!p.filas.length} />
                  {p.etiquetaFila}
                </span>
                <span className="flex items-center whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-[.05em] text-[#475569]">Solicitados</span>
                {p.columnas.map((c) => {
                  const n = colOn(c.id), on = n === p.filas.length && n > 0;
                  return (
                    <span key={c.id} className="flex min-w-0 items-center gap-2 px-3 py-2">
                      <Casilla tam={20} marcada={on} mixto={!on && n > 0} titulo={on ? `Quitar ${c.etiqueta} a todos` : `Solicitar ${c.etiqueta} a todos`}
                        onClick={() => alternarColumna(c.id)} deshabilitada={!p.filas.length} />
                      <span title={c.etiqueta}
                        className="line-clamp-3 min-w-0 break-words text-xs font-semibold uppercase leading-[1.3] tracking-[.05em] text-[#475569] [text-wrap:balance]">
                        {c.onClick
                          ? <button type="button" onClick={c.onClick} className="text-left uppercase hover:text-[var(--c10-acc,#2F80ED)] hover:underline">{c.etiqueta}</button>
                          : c.etiqueta}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-b-xl" onScroll={(e) => { if (hdRef.current) hdRef.current.scrollLeft = e.currentTarget.scrollLeft; }}>
          <div style={{ minWidth: minW }}>
            {p.filas.map((f) => {
              const v = valor(f.id), n = v.length, sucia = f.id in borrador;
              const filaOn = n === cols.length && n > 0;
              return (
                <div key={f.id} className="grid min-h-14 items-center border-t border-[#F1F5F9] bg-white"
                  style={{ gridTemplateColumns: grid }} title={f.invitacionPendiente ? "Invitación pendiente de aceptar" : undefined}>
                  <div className="sticky left-0 z-[2] flex min-w-0 items-center gap-2 self-stretch bg-inherit px-3 py-2 shadow-[1px_0_0_#E2E8F0]">
                    <Casilla tam={20} marcada={filaOn} mixto={!filaOn && n > 0} titulo={filaOn ? "Quitar todos" : "Solicitar todos"} onClick={() => alternarFila(f.id)} />
                    <span className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                      style={{ background: f.invitacionPendiente ? "#94A3B8" : colorAvatar(f.id) }}>
                      {f.iniciales ?? iniciales(f.nombre)}
                    </span>
                    <button type="button" onClick={p.onFilaClick ? () => p.onFilaClick!(f) : undefined} title={p.onFilaClick ? "Ver detalle" : f.nombre}
                      className={`flex min-w-0 flex-col gap-px text-left ${p.onFilaClick ? "cursor-pointer" : "cursor-default"}`}>
                      <span className="flex min-w-0 max-w-full items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-[#0F172A]">{f.nombre}</span>
                        {f.punto && <span title={f.punto.titulo} className="size-2 shrink-0 rounded-full" style={{ background: f.punto.color }} />}
                        {sucia && <span title="Cambios sin guardar" className="size-1.5 shrink-0 rounded-full bg-[var(--c10-acc,#2F80ED)]" />}
                      </span>
                      <span className="flex items-center gap-1.5 whitespace-nowrap text-xs tabular-nums text-[#94A3B8]">
                        {f.subtitulo}
                        {f.invitacionPendiente && (
                          <span className="inline-flex h-[18px] items-center rounded-full bg-[rgba(245,158,11,.14)] px-2 text-[11px] font-semibold text-[#B45309]">Invitación pendiente</span>
                        )}
                      </span>
                    </button>
                  </div>
                  <span className="flex px-3 py-2">
                    <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded-full px-[9px] text-[11px] font-semibold tabular-nums"
                      style={n ? { background: "var(--c10-acc-l,#DBEAFE)", color: "var(--c10-acc-h,#1E6FDB)" } : { background: "#F1F5F9", color: "#475569" }}>
                      {n} de {cols.length}
                    </span>
                  </span>
                  {p.columnas.map((c) => {
                    const on = v.includes(c.id);
                    return (
                      <span key={c.id} className="flex items-center px-3 py-2">
                        <Casilla tam={20} marcada={on} titulo={`${on ? "Quitar" : "Solicitar"} ${c.etiqueta}`} onClick={() => alternarCelda(f.id, c.id)} />
                      </span>
                    );
                  })}
                </div>
              );
            })}
            {!p.filas.length && (p.vacio ?? (
              <div className="flex min-h-[240px] items-center justify-center border-t border-[#F1F5F9] text-sm text-[#64748B]">No se encontraron registros</div>
            ))}
          </div>
        </div>
      </div>
      {p.paginacion?.(p.filas.length)}

      {sucias.length > 0 && (
        <BarraFlotante etiqueta={`${sucias.length} ${p.unidad[sucias.length === 1 ? 0 : 1]} con cambios`}>
          <BotonBarra onClick={() => setBorrador({})} deshabilitado={guardando}><X />Descartar Cambios</BotonBarra>
          <BotonBarra blanco onClick={guardar} deshabilitado={guardando}><Save />{guardando ? "Guardando…" : "Guardar Cambios"}</BotonBarra>
        </BarraFlotante>
      )}
    </section>
  );
}
