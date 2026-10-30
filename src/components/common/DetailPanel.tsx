"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Piezas compartidas por los paneles laterales de detalle (usuarios, rondines...).

export function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800 break-words">{value || "—"}</dd>
    </div>
  );
}

export function DetailSection({
  title,
  children,
  className,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-md border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      {children}
    </section>
  );
}

interface HeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Ids copiables (CopyableId) bajo el subtitulo. */
  ids?: React.ReactNode;
  /** Badges de estado, alineados a la derecha (dejan lugar a los botones del sheet). */
  badges?: React.ReactNode;
  actions?: React.ReactNode;
}

export function DetailPanelHeader({ title, subtitle, ids, badges, actions }: HeaderProps) {
  return (
    <div className="p-5 border-b bg-white space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          {ids}
        </div>
        {badges && <div className="flex items-center gap-2 pr-20 flex-wrap justify-end">{badges}</div>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function ChipList({ values }: { values: string[] }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {values.map((v, i) => (
        <Badge key={i} variant="outline" className="bg-slate-100 text-slate-600 border-0 rounded-md font-normal shadow-none">
          {v}
        </Badge>
      ))}
    </span>
  );
}

interface TabsProps<K extends string> {
  tabs: readonly { key: K; label: string; count?: number }[];
  value: K;
  onChange: (key: K) => void;
}

export function DetailTabs<K extends string>({ tabs, value, onChange }: TabsProps<K>) {
  return (
    <div className="flex border-b border-slate-200">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cn(
            "px-4 pb-2 pt-1 text-sm font-medium border-b-2 transition-colors",
            value === tab.key
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700",
          )}
        >
          {tab.label}
          {!!tab.count && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
