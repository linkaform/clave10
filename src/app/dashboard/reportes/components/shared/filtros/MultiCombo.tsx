"use client";

import React, { useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { matches, useOutside } from "../ui";

// Selección múltiple con búsqueda (filtros del panel lateral)
export const MultiCombo = ({ label, placeholder, options, value, onChange }: {
  label: string;
  placeholder: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, open, () => setOpen(false));
  const list = options.filter(o => matches(o, q));
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);

  return (
    <div ref={ref} className="relative flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-c10-title">{label}</span>
      <label className={`flex h-10 items-center gap-2 rounded-lg border bg-c10-surface px-3 transition-colors ${open ? "border-button-primary shadow-[0_0_0_3px_rgba(59,130,246,.15)]" : "border-c10-line"}`}>
        <Search size={16} className="flex-none text-c10-faint" aria-hidden="true" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => e.key === "Escape" && setOpen(false)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 border-none bg-transparent text-sm text-c10-title outline-none placeholder:text-c10-faint"
        />
        <ChevronDown size={16} aria-hidden="true" className={`flex-none transition-transform duration-200 ${open ? "rotate-180 text-button-primary" : "text-c10-faint"}`} />
      </label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(v => (
            <span key={v} className="inline-flex h-[26px] max-w-full items-center gap-1 rounded-full bg-c10-blue-subtle pl-2.5 pr-1 text-xs font-semibold text-button-primary-hover">
              <span className="truncate">{v}</span>
              <button type="button" aria-label={`Quitar ${v}`} onClick={() => toggle(v)} className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-c10-blue-light">
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div role="listbox" aria-multiselectable="true" className="absolute left-0 right-0 top-[66px] z-30 max-h-64 animate-[c10-menu-in_200ms_ease-in-out] overflow-auto rounded-xl bg-c10-surface p-1 shadow-[0_0_0_1px_var(--c10-line),0_12px_28px_rgba(15,23,42,.12)]">
          {list.length ? list.map(o => {
            const on = value.includes(o);
            return (
              <button
                key={o}
                type="button"
                role="option"
                aria-selected={on}
                onMouseDown={e => e.preventDefault()}
                onClick={() => toggle(o)}
                className={`flex min-h-[34px] w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left text-sm ${on ? "bg-c10-blue-subtle font-semibold text-button-primary" : "text-c10-title hover:bg-c10-sunken"}`}
              >
                <span className="truncate">{o}</span>
                {on && <Check size={16} aria-hidden="true" className="flex-none" />}
              </button>
            );
          }) : <div className="px-2.5 py-2 text-sm text-c10-meta">No se encontraron opciones</div>}
        </div>
      )}
    </div>
  );
};
