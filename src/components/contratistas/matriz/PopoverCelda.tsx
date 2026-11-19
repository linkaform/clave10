"use client";
// F0-12 · Popover de celda: 320 px, junto a la celda, hacia arriba si abajo no
// caben 420 px; se cierra con scroll, clic fuera o Escape. El contenido y las
// acciones los da la pantalla (ContenidoPopover); aquí solo se dibujan.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, CircleDashed, FileText, Hourglass, Info } from "lucide-react";
import { ESTADOS, POPOVER_ANCHO, type PosPopover } from "@/lib/contratistas/matriz";
import type { ContenidoPopover, EstadoCelda } from "@/types/contratistas/matriz";
import { IconoEstado } from "./piezas";

interface Props {
  pos: PosPopover;
  estado: EstadoCelda;
  contenido: ContenidoPopover;
  onCerrar: () => void;
}

export function PopoverCelda({ pos, estado, contenido: c, onCerrar }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // El scroll dentro del propio popover (cuando no cabe) no lo cierra.
    const cerrar = (e: Event) => {
      if (e.target instanceof Node && ref.current?.contains(e.target)) return;
      onCerrar();
    };
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    // capture: también cierra con el scroll horizontal de la matriz.
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
      window.removeEventListener("keydown", tecla);
    };
  }, [onCerrar]);

  if (typeof document === "undefined") return null;
  const S = ESTADOS[estado];
  const primarias = c.acciones?.filter((a) => a.primaria) ?? [];
  const secundarias = c.acciones?.filter((a) => !a.primaria) ?? [];

  return createPortal(
    <>
      <div className="fixed inset-0 z-[160]" onClick={onCerrar} />
      <div
        ref={ref} role="dialog" aria-label={c.titulo}
        className="fixed z-[161] flex flex-col gap-3 overflow-x-hidden rounded-[14px] bg-white p-3.5 shadow-[0_0_0_1px_#E2E8F0,0_12px_32px_rgba(15,23,42,.16)] animate-in fade-in duration-150"
        style={{
          left: pos.x, top: pos.y, width: POPOVER_ANCHO, maxHeight: pos.maxAlto,
          overflowY: pos.maxAlto < 420 ? "auto" : "visible",
          transform: pos.arriba ? "translateY(-100%)" : "none",
        }}
      >
        <span
          className="absolute size-3 rotate-45 bg-white"
          style={{
            left: pos.flecha, top: pos.arriba ? "auto" : -6, bottom: pos.arriba ? -6 : "auto",
            boxShadow: pos.arriba ? "1px 1px 0 #E2E8F0" : "-1px -1px 0 #E2E8F0",
          }}
        />

        <div className="flex items-start gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#F1F5F9] text-[#475569]"><FileText className="size-4" /></span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold text-[#0F172A]">{c.titulo}</span>
            {c.subtitulo && <span className="truncate text-xs text-[#64748B]">{c.subtitulo}</span>}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] text-[11px] font-semibold"
            style={{ background: S.bg === "transparent" ? "#F1F5F9" : S.bg, color: S.texto }}>
            <span className="size-1.5 rounded-full" style={{ background: S.punto }} />{S.etiqueta}
          </span>
          {c.periodo && <span className="text-xs tabular-nums text-[#64748B]">{c.periodo}</span>}
        </div>

        {!!c.desglose?.length && (
          <>
            <div className="grid gap-x-1.5 gap-y-2" style={{ gridTemplateColumns: `repeat(${c.desgloseColumnas ?? 6}, minmax(0, 1fr))` }}>
              {c.desglose.map((m, i) => {
                const M = ESTADOS[m.estado];
                const fut = m.estado === "fut";
                return (
                  <div key={i} title={m.titulo ?? `${m.etiqueta}: ${M.etiqueta}`} onClick={m.onClick}
                    className={`-m-1 flex min-w-0 flex-col items-center gap-1 rounded-[10px] p-1 transition-colors duration-150 ${m.onClick ? "cursor-pointer hover:bg-[#F1F5F9]" : ""}`}>
                    <span className="grid h-8 w-full place-items-center rounded-lg"
                      style={{
                        background: m.enCurso ? "#FFFFFF" : m.estado === "na" ? "#F1F5F9" : M.bg,
                        color: m.enCurso ? "#94A3B8" : M.fg,
                        boxShadow: fut || m.enCurso ? "inset 0 0 0 1px #E2E8F0" : "none",
                      }}>
                      {fut ? <CircleDashed className="size-3.5" /> : m.enCurso ? <Hourglass className="size-3.5" /> : <IconoEstado estado={m.estado} className="size-3.5" />}
                    </span>
                    <span className="whitespace-nowrap text-[11px] text-[#64748B]">{m.etiqueta}</span>
                  </div>
                );
              })}
            </div>
            <Resumen desglose={c.desglose} />
          </>
        )}

        {!!c.campos?.length && (
          <div className="flex flex-col gap-2.5">
            {c.campos.map((f) => (
              <div key={f.etiqueta} className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] font-medium uppercase tracking-[.05em] text-[#94A3B8]">{f.etiqueta}</span>
                <span className="break-words text-[13px] font-medium leading-[1.35] tabular-nums" style={{ color: f.color ?? "#0F172A" }}>{f.valor}</span>
              </div>
            ))}
          </div>
        )}

        {c.alerta && (
          <div className="flex w-fit max-w-full items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-2 text-xs leading-[1.45] text-[#B91C1C]">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" /><span>{c.alerta}</span>
          </div>
        )}
        {c.nota && (
          <div className="flex w-fit max-w-full items-start gap-2 rounded-lg border border-[var(--c10-acc-b,#BFDBFE)] bg-[var(--c10-acc-s,#EFF6FF)] px-2.5 py-2 text-xs leading-[1.45] text-[var(--c10-acc-h,#1E6FDB)]">
            <Info className="mt-0.5 size-3.5 shrink-0" /><span>{c.nota}</span>
          </div>
        )}

        {!!c.acciones?.length && (
          <div className="flex flex-col gap-2 border-t border-[#F1F5F9] pt-3">
            {secundarias.map((a) => (
              <button key={a.etiqueta} type="button" onClick={a.onClick}
                className={`flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors duration-150 [&>svg]:size-4 ${
                  a.destructiva ? "bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA]" : "bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]"}`}>
                {a.icono}{a.etiqueta}
              </button>
            ))}
            {primarias.map((a) => (
              <button key={a.etiqueta} type="button" onClick={a.onClick}
                className="flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--c10-acc,#2F80ED)] px-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--c10-acc-h,#1E6FDB)] [&>svg]:size-4">
                {a.etiqueta}{a.icono}
              </button>
            ))}
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}

const ORDEN: EstadoCelda[] = ["ok", "rev", "pend", "rech", "venc", "falta", "na"];

/** "3 aceptados · 1 rechazado" bajo el desglose. */
function Resumen({ desglose }: { desglose: NonNullable<ContenidoPopover["desglose"]> }) {
  const n: Partial<Record<EstadoCelda, number>> = {};
  desglose.forEach((m) => { if (m.estado !== "fut" && !m.enCurso) n[m.estado] = (n[m.estado] ?? 0) + 1; });
  const items = ORDEN.filter((k) => n[k]);
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
      {items.map((k) => {
        const S = ESTADOS[k], v = n[k]!;
        const t = (v === 1 ? S.etiqueta : S.plural).toLowerCase();
        return (
          <span key={k} className="inline-flex items-center gap-1.5 text-xs tabular-nums text-[#475569]">
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: S.punto }} />{v} {t}
          </span>
        );
      })}
    </div>
  );
}
