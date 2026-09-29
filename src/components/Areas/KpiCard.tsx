"use client";

import type { LucideIcon } from "lucide-react";

type KpiTone = "neutral" | "good" | "warn" | "bad";

// Mismo criterio de color en todos los tabs del área:
// - toneProblema: pendientes (abiertas, cancelados, con incidencias) → rojo si hay, verde si 0.
// - toneReciente: problemas en una ventana de días (30/60/120/360) → naranja si hay, verde si 0.
// - toneLogro: algo que se completó (realizados) → verde si hay, gris si 0.
// Los totales y conteos informativos van sin tone (gris).
export const toneProblema = (n: number): KpiTone => (n > 0 ? "bad" : "good");
export const toneReciente = (n: number): KpiTone => (n > 0 ? "warn" : "good");
export const toneLogro = (n: number): KpiTone => (n > 0 ? "good" : "neutral");

const TONE_CLASSES: Record<KpiTone, { card: string; icon: string }> = {
  neutral: { card: "bg-slate-50 border-slate-100 text-slate-700", icon: "bg-slate-200/60 text-slate-500" },
  good: { card: "bg-green-50 border-green-100 text-green-700", icon: "bg-green-100 text-green-600" },
  warn: { card: "bg-amber-50 border-amber-100 text-amber-700", icon: "bg-amber-100 text-amber-600" },
  bad: { card: "bg-red-50 border-red-100 text-red-700", icon: "bg-red-100 text-red-600" },
};

interface KpiCardProps {
  label: string;
  value: string | number;
  tone?: KpiTone;
  icon?: LucideIcon;
}

export function KpiCard({ label, value, tone = "neutral", icon: Icon }: KpiCardProps) {
  const classes = TONE_CLASSES[tone];

  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${classes.card}`}>
      {Icon && (
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${classes.icon}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      )}
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-none tabular-nums">{value}</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-70 whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
}
