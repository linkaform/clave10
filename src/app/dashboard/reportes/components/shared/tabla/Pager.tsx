"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Paginación estilo Bitácoras: Mostrar 10/25/50 · rango · páginas
export const usePaged = <T,>(rows: T[], resetKey: unknown) => {
  const [size, setSize] = useState(25);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [resetKey, size]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const cur = Math.min(page, pages);
  const slice = useMemo(() => rows.slice((cur - 1) * size, cur * size), [rows, cur, size]);
  return { slice, size, setSize, page: cur, setPage, pages, total: rows.length };
};

export const Pager = ({ size, setSize, page, setPage, pages, total, sizes = [25, 50, 100, 250] }: {
  size: number; setSize: (n: number) => void; page: number; setPage: (n: number) => void; pages: number; total: number; sizes?: number[];
}) => {
  if (!total) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const btn = "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm tabular-nums";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-c10-line px-3 py-3 text-sm text-c10-secondary">
      <label className="flex items-center gap-2">
        Mostrar
        <select value={size} onChange={e => setSize(Number(e.target.value))} className="h-8 rounded-lg border border-c10-line bg-c10-surface px-2 text-c10-title">
          {sizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="tabular-nums">{from} - {to} de {total} registros</span>
      </label>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Página anterior" disabled={page === 1} onClick={() => setPage(page - 1)} className={`${btn} text-c10-secondary hover:bg-c10-sunken disabled:opacity-40`}><ChevronLeft size={16} /></button>
          {nums.map((n, i) => (
            <React.Fragment key={n}>
              {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-c10-faint">…</span>}
              <button type="button" aria-current={n === page} onClick={() => setPage(n)} className={`${btn} !rounded-full font-semibold ${n === page ? "bg-button-primary text-white" : "text-c10-label hover:bg-c10-sunken"}`}>{n}</button>
            </React.Fragment>
          ))}
          <button type="button" aria-label="Página siguiente" disabled={page === pages} onClick={() => setPage(page + 1)} className={`${btn} text-c10-secondary hover:bg-c10-sunken disabled:opacity-40`}><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
};

// Clases comunes de tabla
export const T = {
  box: "overflow-x-auto",
  th: "sticky top-0 whitespace-nowrap bg-c10-blue-light px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[.05em] text-c10-secondary",
  td: "whitespace-nowrap border-t border-c10-line px-3 py-2.5 text-sm",
  num: "text-right tabular-nums",
};
