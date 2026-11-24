// F0-05 · Colores por tono semántico (Tono viene de contratistas.mapper, F0-08).
// Clases normales de Tailwind: la paleta está remapeada y se invierte sola en
// modo oscuro (docs/modo-oscuro.md). Spec: contratistas_ui_spec.md §3.6.
import type { Tono } from "@/mappers/contratistas.mapper";

export type { Tono };

/** Fondo y texto del chip, y color de la bolita. */
export const TONO: Record<Tono, { chip: string; punto: string }> = {
  success: { chip: "bg-green-100 text-green-700", punto: "bg-green-600" },
  warning: { chip: "bg-amber-100 text-amber-700", punto: "bg-amber-500" },
  danger: { chip: "bg-red-100 text-red-700", punto: "bg-red-600" },
  info: { chip: "bg-c10-blue-light text-blue-700", punto: "bg-blue-500" },
  neutral: { chip: "bg-c10-sunken text-c10-secondary", punto: "bg-slate-400" },
};

export type Prioridad = "Alta" | "Media" | "Baja";

export const PRIORIDAD_TONO: Record<Prioridad, Tono> = {
  Alta: "danger",
  Media: "warning",
  Baja: "neutral",
};
