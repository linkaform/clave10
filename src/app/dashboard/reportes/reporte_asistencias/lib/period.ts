export type PeriodView = "dia" | "semana" | "quincena" | "mes";

export const PERIOD_VIEWS: { value: PeriodView; label: string }[] = [
  { value: "dia", label: "Día" },
  { value: "semana", label: "Semana" },
  { value: "quincena", label: "Quincena" },
  { value: "mes", label: "Mes" },
];

export const DIAS_CORTOS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fromISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const sameDay = (a: Date, b: Date) => toISO(a) === toISO(b);

// Semana de lunes a domingo
export const weekStart = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

// Quincena: 1–15 y 16–fin de mes
export const quincenaRange = (d: Date): [Date, Date, 1 | 2] => {
  const y = d.getFullYear(), m = d.getMonth();
  return d.getDate() <= 15
    ? [new Date(y, m, 1), new Date(y, m, 15), 1]
    : [new Date(y, m, 16), new Date(y, m + 1, 0), 2];
};

export const periodRange = (view: PeriodView, d: Date): [Date, Date] => {
  if (view === "dia") return [d, d];
  if (view === "semana") {
    const a = weekStart(d);
    return [a, addDays(a, 6)];
  }
  if (view === "quincena") {
    const [a, b] = quincenaRange(d);
    return [a, b];
  }
  return [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth() + 1, 0)];
};

export const periodDays = (view: PeriodView, d: Date) => {
  const [a, b] = periodRange(view, d);
  const days: Date[] = [];
  for (let x = new Date(a); x <= b; x = addDays(x, 1)) days.push(new Date(x));
  return days;
};

export const shiftPeriod = (view: PeriodView, d: Date, dir: 1 | -1) => {
  if (view === "dia") return addDays(d, dir);
  if (view === "semana") return addDays(d, 7 * dir);
  if (view === "quincena") {
    const [a, b] = quincenaRange(d);
    return dir === 1 ? addDays(b, 1) : addDays(a, -1);
  }
  return new Date(d.getFullYear(), d.getMonth() + dir, 1);
};

export const isCurrentPeriod = (view: PeriodView, d: Date, today = new Date()) => {
  const [a] = periodRange(view, d);
  const [t] = periodRange(view, today);
  return sameDay(a, t);
};

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const periodLabel = (view: PeriodView, d: Date) => {
  const [a, b] = periodRange(view, d);
  if (view === "dia") return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  if (view === "semana") {
    const mismoMes = a.getMonth() === b.getMonth();
    return mismoMes
      ? `${a.getDate()} al ${b.getDate()} de ${MESES[b.getMonth()]} ${b.getFullYear()}`
      : `${a.getDate()} de ${MESES[a.getMonth()]} al ${b.getDate()} de ${MESES[b.getMonth()]} ${b.getFullYear()}`;
  }
  if (view === "quincena") {
    const [, , n] = quincenaRange(d);
    return `${n === 1 ? "1ª" : "2ª"} quincena · ${a.getDate()} al ${b.getDate()} de ${MESES[a.getMonth()]} ${a.getFullYear()}`;
  }
  return `${cap(MESES[d.getMonth()])} ${d.getFullYear()}`;
};
