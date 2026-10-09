"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";

// Buscador avanzado por "facets": cada filtro es un chip Campo: valor(es).
// AND entre chips, OR entre los valores de un mismo chip. Los campos los
// define el back de cada vista (opción get_search_fields del script), así
// que el componente no sabe nada de Concesionados, Paquetería, etc.

export interface SearchFieldOptionConfig {
  value: string;
  label: string;
  color?: string;
}

export interface SearchFieldConfig {
  key: string;
  label: string;
  type: "text" | "enum";
  options?: SearchFieldOptionConfig[];
}

export interface SearchFacet {
  key: string;
  values: string[];
  /** true = igualdad contra el valor (opciones de un enum); false = contiene. */
  exact?: boolean;
}

export interface SearchCandidate {
  key: string;
  value: string;
  exact: boolean;
}

interface FacetSearchProps {
  fields: SearchFieldConfig[];
  facets: SearchFacet[];
  onChange: (facets: SearchFacet[]) => void;
  /** Conteo por fila del menú; si no se pasa, el menú no muestra números. */
  fetchCounts?: (facets: SearchFacet[], candidates: SearchCandidate[]) => Promise<number[]>;
  placeholder?: string;
  /** Máximo de chips visibles antes de agruparlos en "+N filtros". */
  maxChips?: number;
  className?: string;
}

interface MenuRow {
  type: "field" | "option";
  field: SearchFieldConfig;
  value: string;
  label: string;
  exact: boolean;
  expandable: boolean;
  expanded: boolean;
  color?: string;
}

const norm = (s: string) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const rowKey = (r: { key: string; exact: boolean; value: string }) => `${r.key}|${r.exact}|${r.value}`;

const COUNT_DEBOUNCE_MS = 250;
const INPUT_MIN_W = 80;
const OVERFLOW_W = 92;
const CHIP_PART_MAX = 96;
const GAP = 6;

export const FacetSearch: React.FC<FacetSearchProps> = ({
  fields,
  facets,
  onChange,
  fetchCounts,
  placeholder = "Buscar...",
  maxChips = 4,
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [chipsWidth, setChipsWidth] = useState(600);

  const wrapRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const countsReq = useRef(0);
  const canvasCtx = useRef<CanvasRenderingContext2D | null>(null);

  const fieldsByKey = useMemo(() => Object.fromEntries(fields.map((f) => [f.key, f])), [fields]);

  // ---- Filas del menú -----------------------------------------------------
  // `all` incluye las opciones de enums colapsados (para pedir sus conteos).
  const buildRows = useCallback(
    (q: string, all: boolean): MenuRow[] => {
      const text = q.trim();
      if (!text) return [];
      const rows: MenuRow[] = [];
      fields.forEach((field) => {
        const isEnum = field.type === "enum" && !!field.options?.length;
        const matches = isEnum
          ? field.options!.filter((o) => norm(o.label).includes(norm(text)) || norm(o.value).includes(norm(text)))
          : [];
        // Un enum solo aparece si el texto coincide con alguna de sus opciones.
        if (isEnum && matches.length === 0) return;
        const isExpanded = expanded[field.key] ?? isEnum;
        rows.push({
          type: "field", field, value: text, label: field.label, exact: false,
          expandable: isEnum, expanded: isExpanded,
        });
        if (isEnum && (isExpanded || all)) {
          matches.forEach((o) =>
            rows.push({
              type: "option", field, value: o.value, label: o.label, exact: true,
              expandable: false, expanded: false, color: o.color,
            }),
          );
        }
      });
      return rows;
    },
    [fields, expanded],
  );

  const rows = useMemo(() => buildRows(query, false), [buildRows, query]);

  // ---- Conteos ------------------------------------------------------------
  useEffect(() => {
    const req = ++countsReq.current;
    const candidateRows = buildRows(query, true);
    if (!fetchCounts || !candidateRows.length) {
      setCountsLoading(false);
      return;
    }
    setCountsLoading(true);
    setCounts({});
    const timer = setTimeout(async () => {
      const candidates = candidateRows.map((r) => ({ key: r.field.key, value: r.value, exact: r.exact }));
      try {
        const result = await fetchCounts(facets, candidates);
        if (req !== countsReq.current) return;
        const next: Record<string, number> = {};
        candidates.forEach((c, i) => {
          if (typeof result?.[i] === "number") next[rowKey(c)] = result[i];
        });
        setCounts(next);
      } catch {
        if (req === countsReq.current) setCounts({});
      } finally {
        if (req === countsReq.current) setCountsLoading(false);
      }
    }, COUNT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // `expanded` no cambia los candidatos (se piden todos), por eso no va aquí.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, facets, fetchCounts, fields]);

  // ---- Cerrar al hacer click fuera / medir ancho de los chips -------------
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setOverflowOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useLayoutEffect(() => {
    if (!chipsRef.current) return;
    const ro = new ResizeObserver(([entry]) => setChipsWidth(Math.round(entry.contentRect.width)));
    ro.observe(chipsRef.current);
    return () => ro.disconnect();
  }, []);

  // ---- Chips --------------------------------------------------------------
  const valuesText = useCallback(
    (f: SearchFacet) => {
      const field = fieldsByKey[f.key];
      return f.values
        .map((v) => (f.exact ? field?.options?.find((o) => o.value === v)?.label ?? v : v))
        .join(" o ");
    },
    [fieldsByKey],
  );

  const chips = useMemo(
    () => facets.map((f) => ({ facet: f, label: fieldsByKey[f.key]?.label ?? f.key, text: valuesText(f) })),
    [facets, fieldsByKey, valuesText],
  );

  // Mide cada chip con canvas y deja visibles los que quepan junto al input
  // y al botón "+N filtros".
  const visibleCount = useMemo(() => {
    if (typeof document === "undefined") return Math.min(maxChips, chips.length);
    const ctx = canvasCtx.current ?? (canvasCtx.current = document.createElement("canvas").getContext("2d"));
    const family = inputRef.current ? getComputedStyle(inputRef.current).fontFamily : "Arial";
    const measure = (t: string, font: string) => {
      if (!ctx) return t.length * 7;
      ctx.font = `${font} ${family}`;
      return ctx.measureText(t).width;
    };
    const widths = chips.map(
      (c) =>
        Math.min(CHIP_PART_MAX, measure(c.label, "700 12px") + 16) +
        Math.min(CHIP_PART_MAX, measure(c.text, "13px") + 12) + 24 + 2,
    );
    const cap = Math.min(maxChips, chips.length);
    const avail = chipsWidth - INPUT_MIN_W;
    let used = 0;
    let max = 0;
    for (let i = 0; i < cap; i++) {
      const next = used + widths[i] + GAP;
      const reserve = i + 1 < chips.length ? OVERFLOW_W + GAP : 0;
      if (next + reserve > avail) break;
      used = next;
      max = i + 1;
    }
    return max;
  }, [chips, chipsWidth, maxChips]);

  const hiddenCount = chips.length - visibleCount;
  const showOverflow = overflowOpen && hiddenCount > 0;

  // ---- Acciones -----------------------------------------------------------
  const resetQuery = () => {
    setQuery("");
    setOpen(false);
    setActive(0);
    setExpanded({});
  };

  const addFacet = (row: MenuRow) => {
    const next = facets.map((f) => ({ ...f, values: [...f.values] }));
    const existing = next.find((f) => f.key === row.field.key && !!f.exact === row.exact);
    if (existing) {
      if (!existing.values.includes(row.value)) existing.values.push(row.value);
    } else {
      next.push({ key: row.field.key, values: [row.value], exact: row.exact });
    }
    onChange(next);
    resetQuery();
    inputRef.current?.focus();
  };

  const removeFacet = (index: number) => {
    const next = facets.filter((_, i) => i !== index);
    onChange(next);
    if (next.length <= visibleCount) setOverflowOpen(false);
  };

  const clearAll = () => {
    onChange([]);
    resetQuery();
    setOverflowOpen(false);
  };

  const toggleExpanded = (key: string, current: boolean) =>
    setExpanded((s) => ({ ...s, [key]: !current }));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const row = rows[active];
    if (e.key === "ArrowDown" && rows.length) {
      e.preventDefault();
      setOpen(true);
      setActive((active + 1) % rows.length);
    } else if (e.key === "ArrowUp" && rows.length) {
      e.preventDefault();
      setOpen(true);
      setActive((active - 1 + rows.length) % rows.length);
    } else if (e.key === "Enter" && row && open) {
      e.preventDefault();
      addFacet(row);
    } else if (e.key === "ArrowRight" && row?.type === "field" && row.expandable && !row.expanded) {
      e.preventDefault();
      toggleExpanded(row.field.key, false);
    } else if (e.key === "ArrowLeft" && row?.type === "option") {
      e.preventDefault();
      const parent = rows.findIndex((r) => r.type === "field" && r.field.key === row.field.key);
      setExpanded((s) => ({ ...s, [row.field.key]: false }));
      setActive(Math.max(parent, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
      setOverflowOpen(false);
    } else if (e.key === "Backspace" && query === "" && facets.length) {
      onChange(facets.slice(0, -1));
    }
  };

  const countText = (n: number) =>
    n === 0 ? "Sin resultados" : `${n.toLocaleString("en-US")} ${n === 1 ? "registro" : "registros"}`;

  const showMenu = open && rows.length > 0;
  const hasContent = facets.length > 0 || query.length > 0;

  return (
    <div ref={wrapRef} className={`relative flex-1 min-w-[260px] max-w-[820px] ${className}`}>
      <div
        onMouseDown={(e) => {
          if (e.target !== inputRef.current) {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
        className={`flex items-center gap-1.5 min-h-10 py-[5px] pl-3 pr-2 border rounded-lg bg-white cursor-text overflow-hidden transition-[border-color,box-shadow] duration-150 ${
          focused ? "border-[#2F80ED] shadow-[0_0_0_3px_rgba(47,128,237,.15)]" : "border-slate-200"
        }`}>
        <Search size={16} className="flex-none text-slate-500" />
        <div ref={chipsRef} className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          {chips.slice(0, visibleCount).map((c, i) => (
            <div key={`${c.facet.key}|${c.facet.exact}`} className="flex flex-none items-stretch h-7 border border-blue-200 rounded-md overflow-hidden text-[13px]">
              <span title={c.label} className="block max-w-[96px] leading-[26px] px-2 bg-blue-100 text-[#1E6FDB] font-bold text-xs truncate">
                {c.label}
              </span>
              <span title={c.text} className="block max-w-[96px] leading-[26px] pl-2 pr-1 bg-blue-50 text-slate-900 truncate">
                {c.text}
              </span>
              <button
                type="button"
                title="Quitar filtro"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFacet(i);
                }}
                className="flex flex-none items-center justify-center w-6 bg-blue-50 text-slate-500 hover:text-red-600 hover:bg-blue-100">
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              title="Ver todos los filtros"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOverflowOpen((v) => !v);
                setOpen(false);
              }}
              className={`flex flex-none items-center gap-1 h-7 pl-2.5 pr-2 border rounded-md text-xs font-bold text-[#1E6FDB] whitespace-nowrap transition-colors hover:bg-blue-100 ${
                showOverflow ? "border-[#2F80ED] bg-blue-100" : "border-blue-200 bg-blue-50"
              }`}>
              +{hiddenCount} {hiddenCount === 1 ? "filtro" : "filtros"}
              <ChevronDown size={14} className={`transition-transform duration-150 ${showOverflow ? "rotate-180" : ""}`} />
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setOverflowOpen(false);
              setActive(0);
              setExpanded({});
            }}
            onKeyDown={onKeyDown}
            onFocus={() => {
              setFocused(true);
              setOpen(true);
            }}
            onBlur={() => setFocused(false)}
            placeholder={facets.length ? "" : placeholder}
            className="flex-1 basis-20 min-w-[80px] h-7 border-0 outline-none bg-transparent px-0.5 text-sm text-neutral-900 placeholder:text-slate-400"
          />
        </div>
        {hasContent && (
          <button
            type="button"
            title="Limpiar búsqueda"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              clearAll();
            }}
            className="flex flex-none items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600">
            <X size={16} />
          </button>
        )}
      </div>

      {showOverflow && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-[min(360px,100%)] z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3.5 py-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900">Filtros aplicados</span>
            <span className="px-2 py-px rounded-full bg-[#2F80ED] text-white text-xs font-bold tabular-nums">{chips.length}</span>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                clearAll();
              }}
              className="ml-auto text-sm text-[#2F80ED] hover:text-[#1E6FDB] hover:underline">
              Limpiar
            </button>
          </div>
          <div className="flex flex-col p-1.5 max-h-[280px] overflow-y-auto">
            {chips.map((c, i) => (
              <div key={`${c.facet.key}|${c.facet.exact}`} className="flex items-center gap-2.5 min-h-11 px-2 py-1.5 rounded-lg hover:bg-slate-100">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-xs font-bold text-[#1E6FDB]">{c.label}</span>
                  <span className="text-sm text-slate-900 break-words">{c.text}</span>
                </div>
                <button
                  type="button"
                  title="Quitar filtro"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFacet(i);
                  }}
                  className="flex flex-none items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600">
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showMenu && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-1.5">
            {rows.map((r, i) => {
              const n = counts[rowKey({ key: r.field.key, exact: r.exact, value: r.value })];
              const loading = !!fetchCounts && countsLoading;
              return (
                <div
                  key={`${r.type}|${r.field.key}|${r.value}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addFacet(r);
                  }}
                  onMouseEnter={() => active !== i && setActive(i)}
                  className={`flex items-center gap-2 h-9 pr-2 rounded-lg cursor-pointer text-sm text-neutral-900 ${
                    r.type === "option" ? "pl-9" : "pl-2"
                  } ${i === active ? "bg-blue-50" : ""}`}>
                  {r.type === "field" ? (
                    <>
                      {r.expandable ? (
                        <button
                          type="button"
                          title={r.expanded ? "Ocultar opciones" : "Ver opciones"}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpanded(r.field.key, r.expanded);
                          }}
                          className={`flex flex-none items-center justify-center w-5 h-5 rounded text-slate-600 hover:bg-blue-100 hover:text-[#2F80ED] transition-transform duration-150 ${
                            r.expanded ? "rotate-90" : ""
                          }`}>
                          <ChevronRight size={14} />
                        </button>
                      ) : (
                        <span className="w-5 flex-none" />
                      )}
                      <span className="flex-1 min-w-0 truncate text-slate-600">
                        Buscar <span className="font-bold text-slate-900">{query.trim()}</span> en{" "}
                        <span className="font-semibold text-[#1E6FDB]">{r.label}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: r.color ?? "#94A3B8" }} />
                      <span className="flex-1 min-w-0 truncate">{r.label}</span>
                    </>
                  )}
                  {fetchCounts &&
                    (loading || n === undefined ? (loading && (
                      <span
                        className="block h-2.5 rounded-full bg-slate-200 animate-pulse flex-none"
                        style={{ width: ["64px", "84px", "56px", "76px"][i % 4] }}
                      />
                    )) : (
                      <span className={`text-xs tabular-nums whitespace-nowrap ${n === 0 ? "text-slate-400" : "text-slate-500"}`}>
                        {countText(n)}
                      </span>
                    ))}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 px-3.5 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            <span className="whitespace-nowrap"><b className="text-slate-600">↑ ↓</b> Navegar</span>
            <span className="whitespace-nowrap"><b className="text-slate-600">Enter</b> Aplicar</span>
            <span className="whitespace-nowrap"><b className="text-slate-600">→</b> Ver opciones</span>
            <span className="whitespace-nowrap"><b className="text-slate-600">Esc</b> Cerrar</span>
          </div>
        </div>
      )}
    </div>
  );
};
