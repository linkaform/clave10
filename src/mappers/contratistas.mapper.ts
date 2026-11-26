// Reglas de presentación compartidas por las pantallas de Contratistas.
// Los estatus los calcula el back (specs/contratos/contratos-001); aquí solo
// se traduce cada valor a su tono y etiqueta, en un solo lugar.
import type {
  EstadoCumplimiento,
  EstatusContrato,
  EstatusDocumento,
  EstatusRepse,
  EstatusSesion,
} from "@/types/contratistas";

/** Tono semántico; el UI kit (F0-05) lo convierte en color con tokens c10-*. */
export type Tono = "success" | "warning" | "danger" | "info" | "neutral";

export type Semaforo = "verde" | "ambar" | "rojo";

/** % de cumplimiento: ≥ 90 verde, 51–89 ámbar, ≤ 50 rojo. */
export const semaforo = (pct: number): Semaforo =>
  pct >= 90 ? "verde" : pct > 50 ? "ambar" : "rojo";

export const SEMAFORO_TONO: Record<Semaforo, Tono> = {
  verde: "success",
  ambar: "warning",
  rojo: "danger",
};

export const ESTATUS_CONTRATO_TONO: Record<EstatusContrato, Tono> = {
  Activo: "success",
  "Por vencer": "warning",
  "En documentación": "info",
  Vencido: "danger",
  Pausado: "neutral",
  Cancelado: "neutral",
};

export const ESTATUS_DOCUMENTO_TONO: Record<EstatusDocumento, Tono> = {
  Aceptado: "success",
  "Por revisar": "info",
  Rechazado: "danger",
  Vencido: "danger",
};

export const ESTATUS_REPSE_TONO: Record<EstatusRepse, Tono> = {
  Vigente: "success",
  "Por vencer": "warning",
  Vencido: "danger",
  "Sin REPSE": "neutral",
};

export const ESTATUS_SESION_TONO: Record<EstatusSesion, Tono> = {
  Programada: "info",
  "En curso": "success",
  Finalizada: "neutral",
  Cancelada: "danger",
};

/**
 * Estado de cumplimiento → etiqueta y tono. La etiqueta une los nombres que
 * el diseño usa en distintas pantallas (Pendiente, En revisión, Cumplido…).
 */
export const ESTADO_CUMPLIMIENTO: Record<EstadoCumplimiento, { label: string; tono: Tono }> = {
  "Por transcurrir": { label: "Por transcurrir", tono: "neutral" },
  "En plazo": { label: "Pendiente", tono: "neutral" },
  "Por subir": { label: "Pendiente", tono: "danger" },
  "Por revisar": { label: "En revisión", tono: "info" },
  Cumplido: { label: "Cumplido", tono: "success" },
  Rechazado: { label: "Rechazado", tono: "danger" },
  Vencido: { label: "Vencido", tono: "danger" },
  "En ceros": { label: "En ceros", tono: "success" },
  "No aplica": { label: "No aplica", tono: "neutral" },
};

/** Estados que cuentan como cumplidos y los que no entran al %. */
export const CUMPLE: EstadoCumplimiento[] = ["Cumplido", "En ceros"];
export const NO_APLICABLE: EstadoCumplimiento[] = ["No aplica", "Por transcurrir", "En plazo"];

/** % de cumplimiento de un conjunto de estados (misma regla que el back). */
export const porcentajeCumplimiento = (estados: EstadoCumplimiento[]): number => {
  const aplicables = estados.filter((e) => !NO_APLICABLE.includes(e));
  if (!aplicables.length) return 100;
  const ok = aplicables.filter((e) => CUMPLE.includes(e)).length;
  return Math.round((ok / aplicables.length) * 100);
};

/** Pendientes para insignias: Por subir + Rechazado + Vencido. */
export const contarPendientes = (estados: EstadoCumplimiento[]): number =>
  estados.filter((e) => e === "Por subir" || e === "Rechazado" || e === "Vencido").length;

/** Días de hoy a `fecha` (YYYY-MM-DD); negativo si ya pasó. */
export const diasHasta = (fecha: string, hoy: Date = new Date()): number => {
  const [y, m, d] = fecha.split("-").map(Number);
  const objetivo = Date.UTC(y, m - 1, d);
  const base = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((objetivo - base) / 86_400_000);
};
