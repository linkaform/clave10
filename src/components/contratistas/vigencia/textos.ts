// F0-14 · Textos y reglas del selector de vigencia / recurrencia (sin React): catálogos,
// valores iniciales, resúmenes y validaciones de las tres variantes.
// Diseño: plataforma.dc.html (Requerimientos rqVMods/rqGFs ~7223, Sesiones ssnRep ~7567)
// y nuevo-contrato.dc.html (nRc ~4098, resumen ~4325).

// ---------- Catálogos ----------

/** Índice = Date.getDay(): 0 domingo … 6 sábado. */
export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;
/** Requerimientos muestra la semana de lunes a domingo; Sesiones y Contrato, de domingo a sábado. */
export const SEMANA_LUNES = [1, 2, 3, 4, 5, 6, 0];
export const SEMANA_DOMINGO = [0, 1, 2, 3, 4, 5, 6];
export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;
export const SEMANAS_MES = [
  "Primera semana del mes", "Segunda semana del mes", "Tercera semana del mes", "Cuarta semana del mes", "Quinta semana del mes",
] as const;
/** El último (4) es "Último", no "Quinto". */
export const ORDINALES = ["Primer", "Segundo", "Tercer", "Cuarto", "Último"] as const;

export const UNIDADES = ["día(s)", "semana(s)", "mes(es)", "año(s)"] as const;
export type Unidad = (typeof UNIDADES)[number];
const NOMBRE_UNIDAD: Record<Unidad, [string, string]> = {
  "día(s)": ["día", "días"],
  "semana(s)": ["semana", "semanas"],
  "mes(es)": ["mes", "meses"],
  "año(s)": ["año", "años"],
};

// ---------- Ayudas de texto ----------

const plural = (n: number, s: string, p: string) => (n === 1 ? s : p);
/** "1 día", "3 semanas". */
export const cuanto = (n: number, u: Unidad) => `${n} ${plural(n, ...NOMBRE_UNIDAD[u])}`;
/** "lunes, miércoles y viernes". */
export const enumerar = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);
const abrev = (s: string) => s.slice(0, 3);
const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
/** Ordena índices según el orden de la semana que se muestre. */
const ordenar = (ids: number[], orden: number[]) => orden.filter((i) => ids.includes(i));
const todos = (n: number) => Array.from({ length: n }, (_, i) => i);

/** "yyyy-mm-dd" → Date local (sin brincar de día por la zona horaria). Inválida → null. */
export function fechaLocal(iso: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return Number.isNaN(d.getTime()) ? null : d;
}
export const isoLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** "2026-12-31" → "31/12/2026". */
export const fechaCorta = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
/** Suma meses sin desbordar (31 ene + 1 mes = 28/29 feb). */
export function sumarMeses(iso: string, n: number) {
  const d = fechaLocal(iso);
  if (!d) return "";
  const fin = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return isoLocal(new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), fin)));
}

/**
 * Qué {ordinal} {día} del mes es la fecha: 0 primer … 3 cuarto, 4 último. "Último" solo
 * si es la última vez que cae ese día en el mes y ya va en la cuarta semana o después.
 */
export function ordinalDe(d: Date) {
  const nth = Math.floor((d.getDate() - 1) / 7);
  const ultimo = d.getDate() + 7 > new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return ultimo && nth >= 3 ? 4 : Math.min(nth, 3);
}
/** "tercer lunes". */
const ordinalTexto = (d: Date) => `${ORDINALES[ordinalDe(d)].toLowerCase()} ${DIAS[d.getDay()].toLowerCase()}`;

// ---------- Recurrencia personalizada (Sesiones y Contrato) ----------

export const TIPOS_RECURRENCIA = ["Por día", "Semanal", "Mensual", "Anual", "Configurable"] as const;
export type TipoRecurrencia = (typeof TIPOS_RECURRENCIA)[number];

export interface Recurrencia {
  tipo: TipoRecurrencia | null;
  /** Por día: índices de DIAS. */
  dias: number[];
  porHoras: boolean;
  cadaHoras: number;
  /** Semanal: 0 primera … 4 quinta semana del mes. */
  semanas: number[];
  /** Mensual: el mismo número de día de la fecha de referencia, o su {ordinal} {día}. */
  diaMes: "dia" | "ordinal";
  modoMeses: "cada" | "sel";
  cadaMeses: number;
  /** Mensual "Seleccionar meses": 0 enero … 11 diciembre. */
  meses: number[];
  /** Configurable: "Repetir cada N unidad". */
  cadaN: number;
  unidad: Unidad | null;
}

/** Sesión "Personalizado": arranca en Por día, sin días; la unidad de Configurable es obligatoria. */
export const RECURRENCIA_SESION: Recurrencia = {
  tipo: "Por día", dias: [], porHoras: false, cadaHoras: 1, semanas: [], diaMes: "dia",
  modoMeses: "cada", cadaMeses: 1, meses: [], cadaN: 1, unidad: null,
};
/** Contrato: sin tipo; lunes a viernes, todas las semanas y meses, cada 1 semana. */
export const RECURRENCIA_CONTRATO: Recurrencia = {
  tipo: null, dias: [1, 2, 3, 4, 5], porHoras: false, cadaHoras: 1, semanas: todos(5), diaMes: "dia",
  modoMeses: "cada", cadaMeses: 1, meses: todos(12), cadaN: 1, unidad: "semana(s)",
};

/** Opciones de "Se repite" (mensual), según la fecha de referencia. */
export function opcionesDiaMes(ref: Date) {
  return [
    { valor: "dia" as const, etiqueta: `Mensualmente el día ${ref.getDate()}` },
    { valor: "ordinal" as const, etiqueta: `Mensualmente el ${ordinalTexto(ref)} del mes` },
  ];
}

export type ErroresRecurrencia = Partial<Record<"tipo" | "dias" | "semanas" | "meses" | "unidad", string>>;

export function erroresRecurrencia(r: Recurrencia): ErroresRecurrencia {
  if (!r.tipo) return { tipo: "Selecciona una opción" };
  if (r.tipo === "Por día" && !r.dias.length) return { dias: "Selecciona al menos un día" };
  if (r.tipo === "Semanal" && !r.semanas.length) return { semanas: "Selecciona al menos una semana" };
  if (r.tipo === "Mensual" && r.modoMeses === "sel" && !r.meses.length) return { meses: "Selecciona al menos un mes" };
  if (r.tipo === "Configurable" && !r.unidad) return { unidad: "Selecciona una opción" };
  return {};
}

/**
 * "Por día · Lun, Mié · cada 2 h", "Semanal · semana 1, 3", "Mensual · día 15 · cada 2 meses",
 * "Mensual · tercer lunes · Ene, Jul", "Anual", "Cada 2 semanas".
 */
export function textoRecurrencia(r: Recurrencia, ref: Date): string {
  switch (r.tipo) {
    case "Por día": {
      const dias = r.dias.length === 7 ? "Todos los días" : `Por día · ${ordenar(r.dias, SEMANA_DOMINGO).map((i) => abrev(DIAS[i])).join(", ")}`;
      return dias + (r.porHoras ? ` · cada ${r.cadaHoras} h` : "");
    }
    case "Semanal":
      return r.semanas.length === 5
        ? "Semanal · todas las semanas"
        : `Semanal · ${plural(r.semanas.length, "semana", "semanas")} ${[...r.semanas].sort().map((s) => s + 1).join(", ")}`;
    case "Mensual": {
      const cuando = r.diaMes === "dia" ? `día ${ref.getDate()}` : ordinalTexto(ref);
      const meses =
        r.modoMeses === "sel"
          ? r.meses.length === 12 ? " · todos los meses" : ` · ${[...r.meses].sort((a, b) => a - b).map((m) => abrev(MESES[m])).join(", ")}`
          : r.cadaMeses > 1 ? ` · cada ${r.cadaMeses} meses` : "";
      return `Mensual · ${cuando}${meses}`;
    }
    case "Anual":
      return `Anual · el ${ref.getDate()} de ${MESES[ref.getMonth()].toLowerCase()}`;
    case "Configurable":
      if (!r.unidad) return "Configurable";
      return r.cadaN === 1 ? `Cada ${NOMBRE_UNIDAD[r.unidad][0]}` : `Cada ${cuanto(r.cadaN, r.unidad)}`;
    default:
      return "";
  }
}

// ---------- Sesiones ----------

export type Repeticion = "no" | "dia" | "semana" | "mes-dia" | "mes-ordinal" | "anio" | "laborables" | "personalizado";

export interface HorarioSesion {
  fecha: string;
  fechaFin: string;
  inicio: string;
  fin: string;
  todoElDia: boolean;
}

export interface TerminoSesion {
  modo: "nunca" | "fecha" | "repeticiones";
  /** yyyy-mm-dd, posterior a la sesión. */
  fecha: string;
  repeticiones: number;
}

export interface RecurrenciaSesionValor {
  repeticion: Repeticion;
  /** Solo cuenta con "personalizado". */
  personalizada: Recurrencia;
  termina: TerminoSesion;
}

export const RECURRENCIA_SESION_INICIAL: RecurrenciaSesionValor = {
  repeticion: "no",
  personalizada: RECURRENCIA_SESION,
  termina: { modo: "nunca", fecha: "", repeticiones: 10 },
};

/** Opciones del selector, calculadas con la fecha de la sesión. */
export function opcionesRepeticion(fecha: string): { valor: Repeticion; etiqueta: string }[] {
  const d = fechaLocal(fecha) ?? new Date();
  const dia = DIAS[d.getDay()].toLowerCase();
  return [
    { valor: "no", etiqueta: "No se repite" },
    { valor: "dia", etiqueta: "Cada día" },
    { valor: "semana", etiqueta: `Cada semana el ${dia}` },
    { valor: "mes-dia", etiqueta: `Cada mes el día ${d.getDate()}` },
    { valor: "mes-ordinal", etiqueta: `Cada mes el ${ordinalTexto(d)}` },
    { valor: "anio", etiqueta: `Cada año el ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}` },
    { valor: "laborables", etiqueta: "Todos los días laborables (de lunes a viernes)" },
    { valor: "personalizado", etiqueta: "Personalizado" },
  ];
}

export function errorHorario(h: HorarioSesion): string | null {
  if (!h.fecha) return "Selecciona la fecha de inicio";
  if (!h.todoElDia && (!h.inicio || !h.fin)) return "Completa la fecha y el horario";
  if (h.fechaFin && h.fechaFin < h.fecha) return "La fecha de fin debe ser igual o posterior al inicio";
  if (!h.todoElDia && (!h.fechaFin || h.fechaFin === h.fecha) && h.fin <= h.inicio) return "La hora de fin debe ser posterior al inicio";
  return null;
}

/** "1 h 30 min", "45 min", "3 días". Vacío si el horario no es válido. */
export function duracionSesion(h: HorarioSesion): string {
  if (errorHorario(h)) return "";
  const a = fechaLocal(h.fecha)!;
  const b = fechaLocal(h.fechaFin || h.fecha)!;
  const dias = Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
  if (h.todoElDia || dias > 1) return cuanto(dias, "día(s)");
  const min = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);
  const m = min(h.fin) - min(h.inicio);
  return [Math.floor(m / 60) && `${Math.floor(m / 60)} h`, m % 60 && `${m % 60} min`].filter(Boolean).join(" ");
}

export function errorTermino(t: TerminoSesion, fechaSesion: string): string | null {
  if (t.modo === "fecha") {
    if (!t.fecha) return "Selecciona la fecha de término";
    if (t.fecha <= fechaSesion) return "Debe ser posterior a la fecha de la sesión";
  }
  if (t.modo === "repeticiones" && !(t.repeticiones > 0)) return "Indica el número de repeticiones";
  return null;
}

export interface ErroresSesion {
  horario?: string;
  recurrencia: ErroresRecurrencia;
  termina?: string;
}

/** Todo lo que impide guardar la sesión. `hayErrores` para el botón Guardar. */
export function erroresSesion(h: HorarioSesion, v: RecurrenciaSesionValor): ErroresSesion & { hayErrores: boolean } {
  const custom = v.repeticion === "personalizado";
  const e: ErroresSesion = {
    horario: errorHorario(h) ?? undefined,
    recurrencia: custom ? erroresRecurrencia(v.personalizada) : {},
    termina: (custom && errorTermino(v.termina, h.fecha)) || undefined,
  };
  return { ...e, hayErrores: !!(e.horario || e.termina || Object.keys(e.recurrencia).length) };
}

/** "No se repite", "Cada semana el lunes", "Por día · Lun, Mié · hasta el 31/12/2026". */
export function textoRecurrenciaSesion(v: RecurrenciaSesionValor, fecha: string): string {
  if (v.repeticion !== "personalizado") return opcionesRepeticion(fecha).find((o) => o.valor === v.repeticion)!.etiqueta;
  const t = v.termina;
  const fin =
    t.modo === "fecha" && t.fecha
      ? ` · hasta el ${fechaCorta(t.fecha)}`
      : t.modo === "repeticiones"
        ? ` · ${t.repeticiones} ${plural(t.repeticiones, "repetición", "repeticiones")}`
        : " · sin fin";
  return textoRecurrencia(v.personalizada, fechaLocal(fecha) ?? new Date()) + fin;
}

// ---------- Contrato ----------

export interface RecurrenciaContratoValor {
  /** "Restringir días y horarios de trabajo". */
  restringir: boolean;
  recurrencia: Recurrencia;
  desde: string;
  hasta: string;
}

export const RECURRENCIA_CONTRATO_INICIAL: RecurrenciaContratoValor = {
  restringir: false, recurrencia: RECURRENCIA_CONTRATO, desde: "07:00", hasta: "16:00",
};

export type ErroresContrato = ErroresRecurrencia & { horario?: string };

export function erroresContrato(v: RecurrenciaContratoValor): ErroresContrato {
  if (!v.restringir) return {};
  const e: ErroresContrato = { ...erroresRecurrencia(v.recurrencia) };
  if (!v.desde || !v.hasta) e.horario = "Indica el horario de trabajo";
  else if (v.hasta <= v.desde) e.horario = "La hora de fin debe ser posterior al inicio";
  return e;
}

/** Para el resumen de confirmación: "Por día · Lun, Mar, Mié, Jue, Vie · 07:00 a 16:00". */
export function resumenContrato(v: RecurrenciaContratoValor, inicio: string): string {
  if (!v.restringir) return "Sin restricción de días u horarios";
  const t = textoRecurrencia(v.recurrencia, fechaLocal(inicio) ?? new Date()) || "Sin tipo";
  return `${t} · ${v.desde || "—"} a ${v.hasta || "—"}`;
}

// ---------- Requerimientos ----------

export type TipoRequerimiento = "Documento" | "Inspección" | "Examen";
export const PERIODICIDADES = ["Mensual", "Bimestral", "Trimestral", "Cuatrimestral", "Semestral", "Anual"] as const;
export type Periodicidad = (typeof PERIODICIDADES)[number];
export const FRECUENCIAS = ["Diaria", "Semanal", "Mensual", "Anual"] as const;
export type Frecuencia = (typeof FRECUENCIAS)[number];

export interface VigenciaRequerimiento {
  /** Interruptor "Vigencia". Apagado: el documento no vence; inspección y examen se aplican una vez. */
  activa: boolean;
  // Documento
  modo: "vigencia" | "periodico";
  /** "Vigente por N unidad" (documento) y "Aprobado es válido por" (examen). */
  vigencia: { n: number; unidad: Unidad };
  periodicidad: Periodicidad | null;
  /** Periodicidad mensual: todos los meses o solo algunos. */
  modoMeses: "todos" | "sel";
  /** Meses del periódico mensual y de la frecuencia anual. */
  meses: number[];
  /** Plazo de entrega: día del mes siguiente al periodo. */
  plazo: number;
  // Inspección y examen
  frecuencia: Frecuencia;
  dias: number[];
  diaMes: "dia" | "semana";
  dia: number;
  ordinal: number;
  diaSemana: number;
  porHoras: boolean;
  cadaHoras: number;
  hora: string;
  /** Días (o horas si es diaria) después de la hora de aplicación. */
  tolerancia: number;
  toleranciaHoras: number;
  /** Examen: "Vigencia del resultado". */
  resultado: boolean;
  vigenciaResultado: { n: number; unidad: Unidad };
}

export const VIGENCIA_REQUERIMIENTO_INICIAL: VigenciaRequerimiento = {
  activa: false,
  modo: "vigencia", vigencia: { n: 1, unidad: "año(s)" }, periodicidad: null, modoMeses: "todos", meses: [], plazo: 17,
  frecuencia: "Mensual", dias: [1], diaMes: "dia", dia: 1, ordinal: 0, diaSemana: 1, porHoras: false, cadaHoras: 1,
  hora: "08:00", tolerancia: 1, toleranciaHoras: 2, resultado: false, vigenciaResultado: { n: 1, unidad: "año(s)" },
};

/** Texto de ayuda junto al interruptor. */
export function ayudaVigencia(tipo: TipoRequerimiento, v: VigenciaRequerimiento): string {
  if (tipo === "Inspección") return v.activa ? "Define cuándo se debe aplicar la inspección." : "Se aplica una sola vez";
  if (tipo === "Examen") return v.activa ? "Define cuándo se aplica y cuánto dura el resultado aprobado." : "Se aplica una sola vez y no vence";
  if (!v.activa) return "Sin vencimiento";
  return v.modo === "periodico"
    ? "Se entrega en cada periodo, p. ej. CFDI de nómina, DIOT o SISUB."
    : "Se entrega una vez y se renueva al vencer, p. ej. Registro REPSE o póliza.";
}

export const ayudaVigenteDoc = (v: VigenciaRequerimiento) =>
  `Se entrega una vez y vence ${cuanto(v.vigencia.n, v.vigencia.unidad)} después de su emisión; al vencer se pide de nuevo.`;
export const ayudaPlazo = (v: VigenciaRequerimiento) =>
  `Se pide en cada periodo; si no se sube a más tardar el día ${v.plazo} del mes siguiente, se marca como vencido.`;

/** Falta algo para describir la programación (inspección y examen). */
const programacionIncompleta = (v: VigenciaRequerimiento) =>
  (v.frecuencia === "Semanal" && !v.dias.length) || (v.frecuencia === "Anual" && !v.meses.length);

/** "Día 1 de cada mes a las 08:00", "Cada lunes y jueves a las 07:30", "Diaria · cada 4 h desde las 06:00". */
export function textoProgramacion(v: VigenciaRequerimiento): string {
  let base: string;
  switch (v.frecuencia) {
    case "Diaria":
      base = "Diaria" + (v.porHoras ? ` · cada ${v.cadaHoras} h` : "");
      break;
    case "Semanal":
      base = v.dias.length === 7 ? "Todos los días" : `Cada ${enumerar(ordenar(v.dias, SEMANA_LUNES).map((i) => DIAS[i].toLowerCase()))}`;
      break;
    case "Mensual":
      base = v.diaMes === "dia" ? `Día ${v.dia} de cada mes` : `${ORDINALES[v.ordinal]} ${DIAS[v.diaSemana].toLowerCase()} de cada mes`;
      break;
    case "Anual": {
      const m = [...v.meses].sort((a, b) => a - b);
      base = "Anual" + (m.length && m.length < 12 ? ` · ${m.map((i) => abrev(MESES[i])).join(", ")}` : "");
    }
  }
  return v.hora ? `${base}${v.frecuencia === "Diaria" && v.porHoras ? " desde las " : " a las "}${v.hora}` : base;
}

/** Resumen azul: "Se aplicará: día 1 de cada mes a las 08:00, con tolerancia de 1 día." */
export function resumenProgramacion(tipo: TipoRequerimiento, v: VigenciaRequerimiento): string {
  if (programacionIncompleta(v)) return "Completa la programación para ver el resumen.";
  const tol = v.frecuencia === "Diaria" ? `${v.toleranciaHoras} ${plural(v.toleranciaHoras, "hora", "horas")}` : cuanto(v.tolerancia, "día(s)");
  const res =
    tipo === "Examen" && v.resultado ? `; el resultado aprobado es válido por ${cuanto(v.vigenciaResultado.n, v.vigenciaResultado.unidad)}` : "";
  return `Se aplicará: ${minuscula(textoProgramacion(v))}, con tolerancia de ${tol}${res}.`;
}

/** Para la columna "Vigencia" de la lista de requerimientos. */
export function textoVigenciaRequerimiento(tipo: TipoRequerimiento, v: VigenciaRequerimiento): string {
  if (!v.activa) return "Única";
  if (tipo === "Documento") {
    if (v.modo === "periodico") return v.periodicidad ?? "Periódico";
    const { n, unidad } = v.vigencia;
    return n === 1 && unidad === "año(s)" ? "Anual" : `Vigencia de ${cuanto(n, unidad)}`;
  }
  const res = tipo === "Examen" && v.resultado ? ` · Válido por ${cuanto(v.vigenciaResultado.n, v.vigenciaResultado.unidad)}` : "";
  return textoProgramacion(v) + res;
}

export type ErroresVigencia = Partial<Record<"periodicidad" | "meses" | "dias", string>>;

export function erroresVigencia(tipo: TipoRequerimiento, v: VigenciaRequerimiento): ErroresVigencia {
  if (!v.activa) return {};
  if (tipo === "Documento") {
    if (v.modo !== "periodico") return {};
    if (!v.periodicidad) return { periodicidad: "Selecciona la periodicidad" };
    if (v.periodicidad === "Mensual" && v.modoMeses === "sel" && !v.meses.length) return { meses: "Selecciona al menos un mes" };
    return {};
  }
  if (v.frecuencia === "Semanal" && !v.dias.length) return { dias: "Selecciona al menos un día" };
  if (v.frecuencia === "Anual" && !v.meses.length) return { meses: "Selecciona al menos un mes" };
  return {};
}
