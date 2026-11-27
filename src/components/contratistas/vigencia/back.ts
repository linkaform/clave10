// F0-14 · Recurrencia del editor (Recurrencia de ./textos) → la del back
// (types/contratistas/comun.ts). La comparten Sesiones (CF-03) y Nuevo contrato (ME-12).
import type { Recurrencia as RecurrenciaBack } from "@/types/contratistas/comun";
import { ordinalDe, type Recurrencia, type Unidad } from "./textos";

// Front: índices de DIAS (0 = domingo). Back: 0 = lunes.
export const aBack = (d: number) => (d + 6) % 7;
export const aFront = (d: number) => (d + 1) % 7;
export const UNIDAD_BACK: Record<Unidad, NonNullable<RecurrenciaBack["unidad"]>> = {
  "día(s)": "día", "semana(s)": "semana", "mes(es)": "mes", "año(s)": "año",
};
export const UNIDAD_FRONT = Object.fromEntries(Object.entries(UNIDAD_BACK).map(([f, b]) => [b, f])) as Record<string, Unidad>;
export const TODOS_MESES = Array.from({ length: 12 }, (_, i) => i + 1);

/** Mensual según la fecha: el mismo día, o su {ordinal} {día} (5 = último). */
export const mensualBack = (ref: Date, modo: "dia" | "ordinal", meses: number[]): RecurrenciaBack =>
  modo === "dia"
    ? { tipo: "Mensual", mensual_modo: "dia", mensual_dia: ref.getDate(), meses }
    : { tipo: "Mensual", mensual_modo: "ordinal", mensual_ordinal: ordinalDe(ref) + 1, mensual_dia_semana: aBack(ref.getDay()), meses };

/** Recurrencia personalizada del editor → back. `ref` es la fecha de inicio (día del mes, mes de arranque). */
export function personalizadaBack(r: Recurrencia, ref: Date): RecurrenciaBack | undefined {
  switch (r.tipo) {
    case "Por día":
      return r.dias.length === 7
        ? { tipo: "Por día", ...(r.porHoras ? { cada_horas: r.cadaHoras } : {}) }
        : { tipo: "Semanal", dias_semana: r.dias.map(aBack).sort(), ...(r.porHoras ? { cada_horas: r.cadaHoras } : {}) };
    case "Semanal":
      return { tipo: "Semanal", dias_semana: [aBack(ref.getDay())], semanas_mes: r.semanas.map((s) => s + 1).sort() };
    case "Mensual": {
      // El back no guarda "cada N meses": se traduce a los meses que tocan desde el de inicio.
      const meses = r.modoMeses === "sel"
        ? r.meses.map((m) => m + 1).sort((a, b) => a - b)
        : TODOS_MESES.filter((m) => ((m - 1 - ref.getMonth() + 12) % 12) % Math.max(1, r.cadaMeses) === 0);
      return mensualBack(ref, r.diaMes, meses);
    }
    case "Anual": return { tipo: "Configurable", cada_n: 1, unidad: "año" };
    case "Configurable": return { tipo: "Configurable", cada_n: r.cadaN, unidad: r.unidad ? UNIDAD_BACK[r.unidad] : "día" };
    default: return undefined;
  }
}
