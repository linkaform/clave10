"use client";

import React, { useCallback, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card, HCard, HeatCard, LCard, Tip, VCard } from "./tipos";
import { n } from "../formato";

// ───── Tooltip que sigue al mouse ─────
type TipPos = Tip & { x: number; y: number };

const useTooltip = () => {
  const [tip, setTip] = useState<TipPos | null>(null);
  const bind = useCallback((t?: Tip) => {
    if (!t) return {};
    const move = (e: React.MouseEvent) => {
      const W = window.innerWidth, H = window.innerHeight, h = 64 + t.l.length * 22;
      let x = e.clientX + 16, y = e.clientY + 16;
      if (x + 300 > W) x = Math.max(8, e.clientX - 316);
      if (y + h > H) y = Math.max(8, e.clientY - h - 12);
      setTip({ ...t, x, y });
    };
    return { onMouseEnter: move, onMouseMove: move, onMouseLeave: () => setTip(null) };
  }, []);
  const node = tip && (
    <div role="tooltip" className="pointer-events-none fixed z-50 flex min-w-[230px] max-w-[300px] gap-3 rounded-[14px] bg-c10-surface py-3.5 pl-4 pr-3.5 text-[13px] shadow-[0_12px_32px_rgba(15,23,42,.16)]" style={{ left: tip.x, top: tip.y }}>
      <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-c10-sunken text-c10-meta"><BarChart3 size={16} /></span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <b className="text-sm font-semibold text-c10-title">{tip.h}</b>
        {tip.s && <span className="mb-0.5 text-c10-meta">{tip.s}</span>}
        {tip.tt && <span className="-mt-0.5 mb-1 text-c10-meta">{tip.tt}</span>}
        {tip.l.map((i, k) => {
          const p = i.t.indexOf(": ");
          return (
            <span key={k} className="flex items-start gap-2 text-c10-text">
              {i.col ? <i className="mt-1 h-2.5 w-2.5 flex-none rounded-sm" style={{ background: i.col }} /> : <i className="mt-[7px] h-[5px] w-[5px] flex-none rounded-full bg-c10-faint mx-[2.5px]" />}
              <span>{p >= 0 ? <>{i.t.slice(0, p)}: <b className="tabular-nums">{i.t.slice(p + 2)}</b></> : i.t}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
  return { bind, node };
};

// Qué series se ven con los filtros rápidos activos
const visible = (k: string, act: string[], quick: string[]) => !act.length || !quick.includes(k) || act.includes(k);

const niceMax = (m: number) => {
  if (m <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(m))), f = m / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
};

// ───── Barras horizontales apiladas ─────
// Clic en una fila: (sel de la fila, serie del tramo si se hizo clic en un tramo)
export type OnSelect = (sel: string, serie?: string) => void;

const HBars = ({ card, act, quick, bind, onSelect }: { card: HCard; act: string[]; quick: string[]; bind: ReturnType<typeof useTooltip>["bind"]; onSelect?: OnSelect }) => {
  const fmt = card.fmt ?? n;
  const rows = card.rows.map(r => ({ ...r, vals: r.vals.map((v, i) => (visible(card.series[i].k, act, quick) ? v : 0)) }));
  const tot = (vals: number[]) => vals.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...rows.map(r => Math.max(tot(r.vals), r.mk ?? 0)));
  const lw = card.lw ?? 190;
  return (
    <div className="flex flex-col gap-2">
      {rows.map(r => {
        const t = tot(r.vals);
        const sel = onSelect && r.sel; // solo es seleccionable si la página pasa onSelect y la fila trae sel
        return (
          <div key={r.l} className="grid items-center gap-3" style={{ gridTemplateColumns: `minmax(90px, min(${lw}px, 32%)) minmax(80px, 1fr) minmax(56px, min(84px, 22%))` }}>
            <div className="min-w-0" title={r.l}>
              {sel ? (
                <button type="button" onClick={() => onSelect!(sel)} className="block w-full truncate text-left text-[13px] font-semibold text-c10-title hover:text-button-primary hover:underline">{r.l}</button>
              ) : (
                <div className="truncate text-[13px] font-semibold text-c10-title">{r.l}</div>
              )}
              {r.sub && <div className="truncate text-[11px] text-c10-meta">{r.sub}</div>}
            </div>
            <div {...bind(r.tip)} className={`relative h-3.5 rounded-full bg-c10-sunken ${sel ? "cursor-pointer" : ""}`} onClick={sel ? () => onSelect!(sel) : undefined}>
              <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${(t / max) * 100}%` }}>
                {r.vals.map((v, i) => (v ? (
                  <span
                    key={i}
                    className={`min-w-0 shadow-[inset_-1px_0_0_#fff] ${sel ? "hover:brightness-90" : ""}`}
                    style={{ flex: `${v} 1 0px`, background: r.cols?.[i] ?? card.series[i].col }}
                    onClick={sel ? e => { e.stopPropagation(); onSelect!(sel, card.series[i].k); } : undefined}
                  />
                ) : null))}
              </div>
              {!!r.mk && <span className="absolute -bottom-1 -top-1 -ml-px w-0.5 bg-red-600" style={{ left: `${(r.mk / max) * 100}%` }} />}
            </div>
            <b className="whitespace-nowrap text-right text-[13px] font-bold tabular-nums text-c10-title">{fmt(t)}</b>
          </div>
        );
      })}
    </div>
  );
};

// ───── Barras verticales (una o varias por columna, cada una apilada) ─────
const VBars = ({ card, act, quick, bind }: { card: VCard; act: string[]; quick: string[]; bind: ReturnType<typeof useTooltip>["bind"] }) => {
  const cols = card.cols.map(k => ({ ...k, bars: k.bars.map(b => b.map(s => ({ ...s, v: visible(s.k, act, quick) ? s.v : 0 }))) }));
  const sum = (b: { v: number }[]) => b.reduce((a, s) => a + s.v, 0);
  const max = niceMax(Math.max(1, ...cols.flatMap(k => k.bars.map(sum))));
  return (
    <div>
      <div className="relative ml-10 flex h-[220px] items-stretch gap-[3px] border-b border-c10-line">
        {[0, 0.5, 1].map(g => (
          <div key={g} className="pointer-events-none absolute inset-x-0 border-t border-c10-sunken" style={{ bottom: `${g * 100}%` }}>
            <span className="absolute -left-10 -top-2 w-[34px] text-right text-[11px] text-c10-meta">{n(Math.round(max * g))}</span>
          </div>
        ))}
        {cols.map((k, i) => (
          <div key={i} {...bind(k.tip)} className="relative flex min-w-0 flex-1 items-end justify-center gap-0.5 rounded-t hover:bg-[rgba(47,128,237,.08)]">
            {k.bars.map((b, j) => (
              <div key={j} className="flex max-w-[18px] flex-1 flex-col-reverse overflow-hidden rounded-t-[3px]" style={{ height: `${(sum(b) / max) * 100}%` }}>
                {b.map((s, z) => <span key={z} className="min-h-0" style={{ flex: `${s.v} 1 0px`, background: s.col }} />)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="ml-10 flex gap-[3px] pt-1.5">
        {cols.map((k, i) => <span key={i} className="min-w-0 flex-1 whitespace-nowrap text-center text-[11px] text-c10-meta">{k.x}</span>)}
      </div>
    </div>
  );
};

// ───── Línea (porcentaje por día o semana) ─────
const Line = ({ card, bind }: { card: LCard; bind: ReturnType<typeof useTooltip>["bind"] }) => {
  const N = card.pts.length, max = niceMax(Math.max(1, ...card.pts.map(p => p.v)));
  const poly = card.pts.map((p, i) => `${(((i + 0.5) / N) * 1000).toFixed(1)},${(200 - (p.v / max) * 200).toFixed(1)}`).join(" ");
  const cols = `repeat(${N}, minmax(0, 1fr))`;
  return (
    <div>
      <div className="relative ml-11 mt-2 h-[200px] border-b border-c10-line">
        {[0, 0.5, 1].map(g => (
          <div key={g} className="pointer-events-none absolute inset-x-0 border-t border-c10-sunken" style={{ bottom: `${g * 100}%` }}>
            <span className="absolute -left-11 -top-2 w-[38px] text-right text-[11px] text-c10-meta">{card.fmt(max * g)}</span>
          </div>
        ))}
        <svg viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
          <polyline points={poly} fill="none" stroke="#DC2626" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: cols }}>
          {card.pts.map((p, i) => (
            <div key={i} {...bind(p.tip)} className="relative h-full hover:bg-[rgba(47,128,237,.08)]">
              <span className="absolute left-1/2 -mb-[4.5px] -ml-[4.5px] h-[9px] w-[9px] rounded-full bg-c10-surface shadow-[inset_0_0_0_2.5px_#DC2626]" style={{ bottom: `${(p.v / max) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="ml-11 mt-1.5 grid" style={{ gridTemplateColumns: cols }}>
        {card.pts.map((p, i) => <span key={i} className="whitespace-nowrap text-center text-[11px] text-c10-meta">{p.x}</span>)}
      </div>
    </div>
  );
};

// ───── Mapa de calor día × hora ─────
const Heat = ({ card, bind }: { card: HeatCard; bind: ReturnType<typeof useTooltip>["bind"] }) => (
  <div className="flex flex-col gap-[3px] overflow-x-auto">
    <div className="grid min-w-[640px] gap-[3px]" style={{ gridTemplateColumns: "64px repeat(24, minmax(0, 1fr))" }}>
      <span />
      {card.hrs.map((h, i) => <span key={i} className="overflow-visible whitespace-nowrap text-[10px] text-c10-meta">{h}</span>)}
    </div>
    {card.rows.map(fr => (
      <div key={fr.l} className="grid min-w-[640px] gap-[3px]" style={{ gridTemplateColumns: "64px repeat(24, minmax(0, 1fr))" }}>
        <span className="self-center whitespace-nowrap pr-1.5 text-right text-[13px] font-semibold text-c10-title">{fr.l}</span>
        {fr.cells.map((x, i) => (
          <div key={i} {...bind(x.tip)} className={`relative flex h-[26px] items-center justify-center rounded text-[11px] font-bold hover:shadow-[inset_0_0_0_2px_#192A4E] ${x.v ? "" : "bg-c10-sunken"}`} style={x.v ? { background: x.bg, color: x.fg } : undefined}>
            {x.v || ""}
            {x.dot && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-red-600 shadow-[0_0_0_1px_#fff]" />}
          </div>
        ))}
      </div>
    ))}
  </div>
);

// onSelect (opcional): hace clicables las filas de barras horizontales que traen `sel`.
// Sin él la gráfica se comporta igual que siempre.
export const ChartCard = ({ card, act, quick, onSelect }: { card: Card; act: string[]; quick: string[]; onSelect?: OnSelect }) => {
  const { bind, node } = useTooltip();
  const legend = card.kind === "heat" ? card.legend : null;
  const nota = card.kind === "h" ? card.nota : "";
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-c10-line-card bg-c10-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,.06),0_4px_10px_rgba(15,23,42,.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-[1_1_360px]">
          <h2 className="m-0 text-base font-semibold leading-tight text-c10-title">{card.title}</h2>
          <p className="m-0 mt-0.5 text-xs text-c10-meta">{card.cap}</p>
        </div>
        {legend && !card.empty && (
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-xs text-c10-secondary">
            <span>Préstamos en esa hora:</span>
            {legend.map(l => (
              <span key={l.t} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <i className={`h-2.5 w-2.5 ${l.round ? "rounded-full" : "rounded-sm"}`} style={{ background: l.col }} />{l.t}
              </span>
            ))}
          </div>
        )}
      </div>
      {card.empty ? (
        <div className="px-3 py-9 text-center text-[13px] text-c10-meta">{card.emptyT ?? "Sin datos en este periodo con estos filtros"}</div>
      ) : card.kind === "h" ? (
        <HBars card={card} act={act} quick={quick} bind={bind} onSelect={onSelect} />
      ) : card.kind === "v" ? (
        <VBars card={card} act={act} quick={quick} bind={bind} />
      ) : card.kind === "l" ? (
        <Line card={card} bind={bind} />
      ) : (
        <Heat card={card} bind={bind} />
      )}
      {nota && <p className="m-0 text-xs text-c10-meta">{nota}</p>}
      {node}
    </section>
  );
};
