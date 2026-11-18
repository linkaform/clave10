"use client";

import React, { useEffect } from "react";
import { Check } from "lucide-react";

// Piezas base de los reportes (spec de Clave 10: Inicio.dc.html)

const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export const matches = (text: string, q: string) => !q.trim() || norm(text).includes(norm(q.trim()));

export const initials = (nombre: string) =>
  nombre.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

const AVATAR_BG = ["bg-slate-800", "bg-button-primary", "bg-cyan-600", "bg-violet-600", "bg-pink-600", "bg-orange-600"];
const avatarBg = (n: string) => {
  let h = 7;
  for (const ch of n || "") h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return AVATAR_BG[h % AVATAR_BG.length];
};

export const Avatar = ({ name, size = 32 }: { name: string; size?: number }) => (
  <span
    aria-hidden="true"
    className={`inline-flex flex-none items-center justify-center rounded-full text-[11px] font-semibold text-white ${name ? avatarBg(name) : "bg-slate-300"}`}
    style={{ width: size, height: size }}
  >
    {name ? initials(name) : "?"}
  </span>
);

export const KpiChip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded-full bg-c10-blue-light px-[9px] text-[11px] font-semibold tabular-nums text-button-primary-hover">
    {children}
  </span>
);

export const Empty = ({ children = "No se encontraron registros" }: { children?: React.ReactNode }) => (
  <div className="p-8 text-center text-c10-meta">{children}</div>
);

// Cierra al hacer clic fuera
export const useOutside = (ref: React.RefObject<HTMLElement>, open: boolean, close: () => void) => {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, open, close]);
};

// Grupo unido de tabs (40px)
export function SegTabs<T extends string>({ value, options, onChange, label, variant = "fill" }: {
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (v: T) => void;
  label: string;
  variant?: "fill" | "outline";
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex h-10 overflow-hidden rounded-lg border border-c10-line bg-c10-surface">
      {options.map(o => {
        const on = o.value === value;
        const cls = on
          ? variant === "fill"
            ? "bg-button-primary font-semibold text-white"
            : "font-semibold text-button-primary shadow-[inset_0_0_0_1px_var(--button-primary)]"
          : "font-medium text-c10-label hover:bg-c10-sunken";
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`h-full border-l border-c10-line px-4 text-sm transition-colors first:rounded-l-[7px] first:border-l-0 last:rounded-r-[7px] disabled:cursor-not-allowed disabled:opacity-40 ${cls}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Checkbox 20×20 radio 5
export const Checkbox = ({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: () => void; label: string }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={indeterminate ? "mixed" : checked}
    aria-label={label}
    title={label}
    onClick={e => { e.stopPropagation(); onChange(); }}
    className={`inline-flex h-5 w-5 flex-none items-center justify-center rounded-[5px] border-[1.5px] ${checked || indeterminate ? "border-button-primary bg-button-primary text-white" : "border-c10-line-strong bg-c10-surface"}`}
  >
    {indeterminate ? <span className="h-0.5 w-2.5 rounded bg-white" /> : checked ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : null}
  </button>
);
