export const KPI_WINDOWS = [30, 60, 120, 360] as const;
export type KpiWindow = (typeof KPI_WINDOWS)[number];
export type KpiWindowCounts = Record<KpiWindow, number>;

// weight=1 cuenta ocurrencias; pasar un weight distinto (ej. cantidad de
// incidencias del check) permite sumar en vez de solo contar.
export const countWithinWindows = (entries: { date: Date | null; weight?: number }[]): KpiWindowCounts => {
  const now = new Date();
  const counts: KpiWindowCounts = { 30: 0, 60: 0, 120: 0, 360: 0 };

  for (const { date, weight = 1 } of entries) {
    if (!date) continue;
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) continue;
    for (const dias of KPI_WINDOWS) {
      if (diffMs <= dias * 24 * 60 * 60 * 1000) {
        counts[dias] += weight;
      }
    }
  }

  return counts;
};

export const parseLooseDate = (value: string) => {
  if (!value) return null;
  const date = new Date(value.replace(" ", "T"));
  return isNaN(date.getTime()) ? null : date;
};

export type DateRangePreset =
  | "todos"
  | "hoy"
  | "ayer"
  | "esta_semana"
  | "semana_pasada"
  | "ultimos_15_dias"
  | "este_mes"
  | "mes_anterior";

export const DATE_RANGE_PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "hoy", label: "Hoy" },
  { key: "ayer", label: "Ayer" },
  { key: "esta_semana", label: "Esta semana" },
  { key: "semana_pasada", label: "Semana pasada" },
  { key: "ultimos_15_dias", label: "Últimos 15 días" },
  { key: "este_mes", label: "Este mes" },
  { key: "mes_anterior", label: "Mes anterior" },
];

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Lunes=0..domingo=6, sin importar que getDay() empiece en domingo.
const mondayOffset = (date: Date) => (date.getDay() + 6) % 7;

export const resolveDateRangePreset = (preset: DateRangePreset): [Date, Date] | null => {
  const now = new Date();

  switch (preset) {
    case "hoy":
      return [startOfDay(now), endOfDay(now)];
    case "ayer": {
      const ayer = new Date(now);
      ayer.setDate(now.getDate() - 1);
      return [startOfDay(ayer), endOfDay(ayer)];
    }
    case "esta_semana": {
      const lunes = new Date(now);
      lunes.setDate(now.getDate() - mondayOffset(now));
      return [startOfDay(lunes), endOfDay(now)];
    }
    case "semana_pasada": {
      const lunesPasado = new Date(now);
      lunesPasado.setDate(now.getDate() - mondayOffset(now) - 7);
      const domingoPasado = new Date(lunesPasado);
      domingoPasado.setDate(lunesPasado.getDate() + 6);
      return [startOfDay(lunesPasado), endOfDay(domingoPasado)];
    }
    case "ultimos_15_dias": {
      const hace15 = new Date(now);
      hace15.setDate(now.getDate() - 15);
      return [startOfDay(hace15), endOfDay(now)];
    }
    case "este_mes": {
      const inicio = new Date(now.getFullYear(), now.getMonth(), 1);
      return [startOfDay(inicio), endOfDay(now)];
    }
    case "mes_anterior": {
      const inicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const fin = new Date(now.getFullYear(), now.getMonth(), 0);
      return [startOfDay(inicio), endOfDay(fin)];
    }
    case "todos":
    default:
      return null;
  }
};
