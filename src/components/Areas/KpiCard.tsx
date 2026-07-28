"use client";

type KpiTone = "neutral" | "good" | "warn" | "bad";

const TONE_CLASSES: Record<KpiTone, string> = {
  neutral: "bg-slate-50 border-slate-100 text-slate-700",
  good: "bg-green-50 border-green-100 text-green-700",
  warn: "bg-amber-50 border-amber-100 text-amber-700",
  bad: "bg-red-50 border-red-100 text-red-700",
};

interface KpiCardProps {
  label: string;
  value: string | number;
  tone?: KpiTone;
}

export function KpiCard({ label, value, tone = "neutral" }: KpiCardProps) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl border px-4 py-3 min-w-[110px] ${TONE_CLASSES[tone]}`}>
      <span className="text-2xl font-bold leading-none">{value}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
    </div>
  );
}
