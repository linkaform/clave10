// Las piezas genéricas viven en components/shared (las usan todos los reportes).
// Aquí se reexportan para que asistencias siga importando del mismo lugar.
import { toISO } from "../shared/periodo/period";

export * from "../shared/ui";
export * from "../shared/filtros/MultiCombo";
export * from "../shared/filtros/QuickFilters";
export * from "../shared/filtros/PanelAnim";
export * from "../shared/periodo/MiniCalendar";
export * from "../shared/periodo/PeriodNav";
export * from "../shared/tabla/Pager";
export * from "../shared/tabla/ResizeHandle";
export * from "../shared/tabla/ScrollBox";

// Horas en formato 7.5 h
export const fmtH = (h: number | null | undefined, unit = "") => (h == null ? "---" : `${h.toFixed(1)}${unit}`);

export const todayISO = () => toISO(new Date());
