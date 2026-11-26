// CF-03 · Sesiones: constantes del diseño y conversiones entre lo que edita la
// pantalla y lo que guarda el back (configuracion_sdk.py, CF-03-B).
// Diseño: plataforma.dc.html, ssnVals (~7336–7639): TC, IMP, MT, MI y colores de estatus.
import type { Archivo, Recurrencia as RecurrenciaBack } from "@/types/contratistas/comun";
import type { EstatusSesion, Sesion, SesionInput, TipoSesion } from "@/types/contratistas";
import {
  DIAS, MESES, RECURRENCIA_SESION, RECURRENCIA_SESION_INICIAL, fechaLocal, isoLocal, ordinalDe,
  type HorarioSesion, type Recurrencia, type RecurrenciaSesionValor, type Unidad,
} from "@/components/contratistas/vigencia";

export const CLAVE_SESIONES = ["contratistas", "sesiones"];

/** Abrir el editor: con `sesion` edita; sin ella, programa una nueva (con fecha y hora si vienen del calendario). */
export type AbrirEditor = (sesion?: Sesion, inicial?: SesionEd) => void;

export const TIPOS_SESION: TipoSesion[] = ["Curso", "Capacitación", "Plática", "Inducción"];
export const MODALIDADES: Sesion["modalidad"][] = ["Presencial", "Virtual", "Híbrida"];
export const ESTATUS_SESION: EstatusSesion[] = ["En curso", "Programada", "Finalizada", "Cancelada"];

/** Fondo y texto de cada tipo (TC del diseño). Clases de Tailwind: se remapean en modo oscuro. */
export const COLOR_TIPO: Record<TipoSesion, { chip: string; punto: string; evento: string }> = {
  Curso: { chip: "bg-blue-100 text-blue-700", punto: "bg-blue-500", evento: "bg-blue-100 text-blue-800 border-blue-500" },
  Capacitación: { chip: "bg-purple-100 text-purple-700", punto: "bg-purple-500", evento: "bg-purple-100 text-purple-800 border-purple-500" },
  Plática: { chip: "bg-green-100 text-green-700", punto: "bg-green-500", evento: "bg-green-100 text-green-800 border-green-500" },
  Inducción: { chip: "bg-orange-100 text-orange-800", punto: "bg-orange-500", evento: "bg-orange-100 text-orange-900 border-orange-500" },
};

/** Etiqueta y placeholder de quien imparte (IMP del diseño). */
export const INSTRUCTOR: Record<TipoSesion, [string, string]> = {
  Curso: ["Docente", "Nombre del docente"],
  Capacitación: ["Instructor", "Nombre del instructor"],
  Plática: ["Ponente", "Nombre del ponente"],
  Inducción: ["Facilitador", "Nombre del facilitador"],
};

/** Temario solo en Curso; recursos en el resto; exámenes y otorgados en todos menos Plática. */
export const conTemario = (t: TipoSesion | null) => t === "Curso";
export const conRecursos = (t: TipoSesion | null) => !!t && t !== "Curso";
export const conExamenes = (t: TipoSesion | null) => !!t && t !== "Plática";

export type TipoMaterial = Sesion["temario"][number]["material_tipo"];
export type OrigenMaterial = Sesion["temario"][number]["material_origen"];
export const TIPOS_MATERIAL: TipoMaterial[] = ["Video", "Lectura", "Presentación", "Cuestionario", "Clase en vivo"];

/** Orígenes permitidos y placeholder del nombre por tipo de material (MT del diseño). */
export const MATERIAL: Record<TipoMaterial, { origenes: OrigenMaterial[]; ph: string; color: string }> = {
  Video: { origenes: ["Archivo", "Enlace"], ph: "Ej. Introducción al tema", color: "bg-violet-100 text-violet-600" },
  Lectura: { origenes: ["Archivo", "Enlace"], ph: "Ej. Manual de procedimientos", color: "bg-blue-100 text-blue-600" },
  Presentación: { origenes: ["Archivo", "Enlace"], ph: "Ej. Diapositivas del módulo", color: "bg-orange-100 text-orange-700" },
  Cuestionario: { origenes: ["Enlace"], ph: "Ej. Evaluación de la lección", color: "bg-green-100 text-green-600" },
  "Clase en vivo": { origenes: ["Enlace"], ph: "Ej. Sesión de dudas", color: "bg-red-100 text-red-600" },
};

/** Solo http(s): un enlace guardado nunca abre javascript: ni otros esquemas. */
export function urlSegura(u?: string | null): string | undefined {
  try {
    const x = new URL(u ?? "");
    return x.protocol === "http:" || x.protocol === "https:" ? x.href : undefined;
  } catch {
    return undefined;
  }
}

/* ---------- Fechas ---------- */

const DIA_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "Lun 24 nov 2026". */
export const fechaLarga = (iso: string) => {
  const d = fechaLocal(iso);
  return d ? `${DIA_CORTO[d.getDay()]} ${d.getDate()} ${MES_CORTO[d.getMonth()]} ${d.getFullYear()}` : "---";
};

/** "24 nov – 26 nov 2026" o "Lun 24 nov 2026". */
export const rangoFechas = (s: Pick<Sesion, "fecha_inicio" | "fecha_fin">) => {
  if (!s.fecha_fin || s.fecha_fin === s.fecha_inicio) return fechaLarga(s.fecha_inicio);
  const a = fechaLocal(s.fecha_inicio)!;
  const b = fechaLocal(s.fecha_fin)!;
  return `${a.getDate()} ${MES_CORTO[a.getMonth()]} – ${b.getDate()} ${MES_CORTO[b.getMonth()]} ${b.getFullYear()}`;
};

export const horario = (s: Pick<Sesion, "hora_inicio" | "hora_fin">) =>
  s.hora_inicio && s.hora_fin ? `${s.hora_inicio} – ${s.hora_fin}` : "Todo el día";

export const horarioDe = (s: Sesion): HorarioSesion => ({
  fecha: s.fecha_inicio,
  fechaFin: s.fecha_fin,
  inicio: s.hora_inicio ?? "09:00",
  fin: s.hora_fin ?? "10:00",
  todoElDia: !s.hora_inicio,
});

export const diasEntre = (a: string, b: string) =>
  Math.round((fechaLocal(b)!.getTime() - fechaLocal(a)!.getTime()) / 86_400_000);

export const sumarDias = (iso: string, n: number) => {
  const d = fechaLocal(iso)!;
  d.setDate(d.getDate() + n);
  return isoLocal(d);
};

/* ---------- Recurrencia: editor (F0-14) ↔ back ---------- */

// Front: índices de DIAS (0 = domingo). Back: 0 = lunes.
const aBack = (d: number) => (d + 6) % 7;
const aFront = (d: number) => (d + 1) % 7;
const UNIDAD_BACK: Record<Unidad, NonNullable<RecurrenciaBack["unidad"]>> = {
  "día(s)": "día", "semana(s)": "semana", "mes(es)": "mes", "año(s)": "año",
};
const UNIDAD_FRONT = Object.fromEntries(Object.entries(UNIDAD_BACK).map(([f, b]) => [b, f])) as Record<string, Unidad>;
const TODOS_MESES = Array.from({ length: 12 }, (_, i) => i + 1);

type RecBack = NonNullable<Sesion["recurrencia"]>;

/** Mensual según la fecha: el mismo día, o su {ordinal} {día} (5 = último). */
const mensual = (ref: Date, modo: "dia" | "ordinal", meses: number[]): RecBack =>
  modo === "dia"
    ? { tipo: "Mensual", mensual_modo: "dia", mensual_dia: ref.getDate(), meses }
    : { tipo: "Mensual", mensual_modo: "ordinal", mensual_ordinal: ordinalDe(ref) + 1, mensual_dia_semana: aBack(ref.getDay()), meses };

/** Lo que el editor de F0-14 elige → recurrencia del back (sin repetir_hasta). */
function recurrenciaBack(v: RecurrenciaSesionValor, fecha: string): RecBack | undefined {
  const ref = fechaLocal(fecha) ?? new Date();
  switch (v.repeticion) {
    case "no": return undefined;
    case "dia": return { tipo: "Por día" };
    case "semana": return { tipo: "Semanal", dias_semana: [aBack(ref.getDay())] };
    case "laborables": return { tipo: "Semanal", dias_semana: [0, 1, 2, 3, 4] };
    case "mes-dia": return mensual(ref, "dia", TODOS_MESES);
    case "mes-ordinal": return mensual(ref, "ordinal", TODOS_MESES);
    case "anio": return { tipo: "Configurable", cada_n: 1, unidad: "año" };
  }
  const r = v.personalizada;
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
      return mensual(ref, r.diaMes, meses);
    }
    case "Anual": return { tipo: "Configurable", cada_n: 1, unidad: "año" };
    case "Configurable": return { tipo: "Configurable", cada_n: r.cadaN, unidad: r.unidad ? UNIDAD_BACK[r.unidad] : "día" };
    default: return undefined;
  }
}

/** Recurrencia del back → valor del editor (para editar una sesión guardada). */
export function recurrenciaEditor(s: Sesion): RecurrenciaSesionValor {
  const r = s.recurrencia;
  if (!r) return RECURRENCIA_SESION_INICIAL;
  const ref = fechaLocal(s.fecha_inicio) ?? new Date();
  const termina = r.repetir_hasta
    ? { modo: "fecha" as const, fecha: r.repetir_hasta, repeticiones: 10 }
    : RECURRENCIA_SESION_INICIAL.termina;
  const dias = (r.dias_semana ?? []).map(aFront);
  const todosMeses = !r.meses?.length || r.meses.length === 12;
  const dow = ref.getDay();

  // Opciones rápidas solo si no tienen fin (el selector rápido no pregunta cuándo termina).
  if (!r.repetir_hasta) {
    if (r.tipo === "Por día" && !r.cada_horas) return { ...RECURRENCIA_SESION_INICIAL, repeticion: "dia" };
    if (r.tipo === "Semanal" && !r.semanas_mes?.length && !r.cada_horas) {
      if (dias.length === 1 && dias[0] === dow) return { ...RECURRENCIA_SESION_INICIAL, repeticion: "semana" };
      if (dias.join() === "1,2,3,4,5") return { ...RECURRENCIA_SESION_INICIAL, repeticion: "laborables" };
    }
    if (r.tipo === "Mensual" && todosMeses) {
      if (r.mensual_modo === "dia" && r.mensual_dia === ref.getDate()) return { ...RECURRENCIA_SESION_INICIAL, repeticion: "mes-dia" };
      if (r.mensual_modo === "ordinal") return { ...RECURRENCIA_SESION_INICIAL, repeticion: "mes-ordinal" };
    }
    if (r.tipo === "Configurable" && r.unidad === "año" && r.cada_n === 1) return { ...RECURRENCIA_SESION_INICIAL, repeticion: "anio" };
  }

  const p: Recurrencia = { ...RECURRENCIA_SESION, porHoras: !!r.cada_horas, cadaHoras: r.cada_horas ?? 1 };
  if (r.tipo === "Por día") Object.assign(p, { tipo: "Por día", dias: [0, 1, 2, 3, 4, 5, 6] });
  else if (r.tipo === "Semanal" && r.semanas_mes?.length) Object.assign(p, { tipo: "Semanal", semanas: r.semanas_mes.map((x) => x - 1) });
  else if (r.tipo === "Semanal") Object.assign(p, { tipo: "Por día", dias });
  else if (r.tipo === "Mensual") Object.assign(p, {
    tipo: "Mensual", diaMes: r.mensual_modo ?? "dia", modoMeses: todosMeses ? "cada" : "sel", cadaMeses: 1,
    meses: (r.meses ?? []).map((m) => m - 1),
  });
  else if (r.unidad === "año" && r.cada_n === 1) Object.assign(p, { tipo: "Anual" });
  else Object.assign(p, { tipo: "Configurable", cadaN: r.cada_n ?? 1, unidad: UNIDAD_FRONT[r.unidad ?? "día"] });
  return { repeticion: "personalizado", personalizada: p, termina };
}

/* ---------- Ocurrencias (calendario) ---------- */

type ConRecurrencia = Pick<Sesion, "fecha_inicio" | "fecha_fin" | "recurrencia">;

/** ¿Arranca una repetición de la sesión en esta fecha? (sin contar el fin). */
function tocaEn(s: ConRecurrencia, d: Date): boolean {
  const r = s.recurrencia;
  const ini = fechaLocal(s.fecha_inicio)!;
  if (!r) return d.getTime() === ini.getTime();
  const dif = Math.round((d.getTime() - ini.getTime()) / 86_400_000);
  if (dif < 0) return false;
  const mesOk = !r.meses?.length || r.meses.includes(d.getMonth() + 1);
  switch (r.tipo) {
    case "Por día":
      return true;
    case "Semanal": {
      const diaOk = !r.dias_semana?.length || r.dias_semana.includes(aBack(d.getDay()));
      const semanaOk = !r.semanas_mes?.length || r.semanas_mes.includes(Math.floor((d.getDate() - 1) / 7) + 1);
      return diaOk && semanaOk;
    }
    case "Mensual":
      if (!mesOk) return false;
      if (r.mensual_modo === "ordinal") {
        return aBack(d.getDay()) === r.mensual_dia_semana && ordinalDe(d) + 1 === r.mensual_ordinal;
      }
      return d.getDate() === (r.mensual_dia ?? ini.getDate());
    case "Configurable": {
      const n = Math.max(1, r.cada_n ?? 1);
      if (r.unidad === "semana") return dif % (7 * n) === 0;
      if (r.unidad === "mes" || r.unidad === "año") {
        const meses = (d.getFullYear() - ini.getFullYear()) * 12 + d.getMonth() - ini.getMonth();
        return d.getDate() === ini.getDate() && meses % (r.unidad === "año" ? 12 * n : n) === 0;
      }
      return dif % n === 0;
    }
  }
  return false;
}

/**
 * Fechas de inicio de cada repetición dentro de [desde, hasta]. La primera es
 * siempre fecha_inicio; sin fin ("Nunca") se corta en `hasta`.
 */
export function ocurrencias(s: ConRecurrencia, desde: string, hasta: string, tope = 400): string[] {
  const fin = s.recurrencia ? s.recurrencia.repetir_hasta ?? hasta : s.fecha_inicio;
  const out: string[] = [];
  const largo = diasEntre(s.fecha_inicio, s.fecha_fin || s.fecha_inicio);
  // Una repetición de varios días puede empezar antes de `desde` y seguir dentro.
  const d = fechaLocal([s.fecha_inicio, sumarDias(desde, -largo)].sort()[1])!;
  const limite = fechaLocal([fin, hasta].sort()[0])!;
  for (; d <= limite && out.length < tope; d.setDate(d.getDate() + 1)) {
    if (tocaEn(s, d) || (isoLocal(d) === s.fecha_inicio)) out.push(isoLocal(d));
  }
  return out;
}

/** Fecha de inicio de la repetición N (Termina "Después de N"), para guardarla como repetir_hasta. */
export function fechaRepeticion(s: ConRecurrencia, n: number): string | undefined {
  const lejos = sumarDias(s.fecha_inicio, 366 * 10);
  return ocurrencias({ ...s, recurrencia: s.recurrencia && { ...s.recurrencia, repetir_hasta: undefined } }, s.fecha_inicio, lejos, n)[n - 1];
}

/* ---------- Temario: secciones → lecciones → materiales ↔ filas planas ---------- */

export interface MaterialEd {
  key: string;
  tipo: TipoMaterial;
  origen: OrigenMaterial;
  /** Nombre visible (solo en recursos; en el temario se toma del archivo o el enlace). */
  nombre: string;
  archivo?: Archivo;
  enlace: string;
}
export interface LeccionEd {
  key: string;
  titulo: string;
  minutos: string;
  materiales: MaterialEd[];
}
export interface SeccionEd {
  key: string;
  titulo: string;
  lecciones: LeccionEd[];
}

let n = 0;
export const clave = () => `k${++n}`;

export const materialVacio = (tipo: TipoMaterial = "Video"): MaterialEd => ({
  key: clave(), tipo, origen: MATERIAL[tipo].origenes[0], nombre: "", enlace: "",
});
export const leccionVacia = (): LeccionEd => ({ key: clave(), titulo: "", minutos: "", materiales: [] });
export const seccionVacia = (): SeccionEd => ({ key: clave(), titulo: "", lecciones: [leccionVacia()] });

const materialDe = (tipo: TipoMaterial, origen: OrigenMaterial, m: Archivo | string | undefined, nombre = ""): MaterialEd => ({
  key: clave(), tipo, origen, nombre,
  archivo: typeof m === "object" ? m : undefined,
  enlace: typeof m === "string" ? m : "",
});

/** Filas del back (una por material) → secciones con lecciones. Una lección sin material es una fila sin material. */
export function temarioEditor(filas: Sesion["temario"]): SeccionEd[] {
  const secciones: SeccionEd[] = [];
  for (const f of filas) {
    let s = secciones.find((x) => x.titulo === f.tema);
    if (!s) secciones.push((s = { key: clave(), titulo: f.tema, lecciones: [] }));
    let l = s.lecciones.find((x) => x.titulo === f.leccion);
    if (!l) s.lecciones.push((l = { key: clave(), titulo: f.leccion, minutos: f.minutos != null ? String(f.minutos) : "", materiales: [] }));
    if (f.material) l.materiales.push(materialDe(f.material_tipo, f.material_origen, f.material));
  }
  return secciones;
}

export const valorMaterial = (m: MaterialEd) => (m.origen === "Archivo" ? m.archivo : m.enlace.trim() || undefined);
export const nombreMaterial = (m: { material?: Archivo | string; nombre?: string }) =>
  m.nombre || (typeof m.material === "object" ? m.material.name : m.material) || "Sin archivo";

/** Secciones → filas planas del back. */
export function temarioBack(secciones: SeccionEd[]): Sesion["temario"] {
  return secciones.flatMap((s) =>
    s.lecciones.flatMap((l): Sesion["temario"] => {
      const base = { tema: s.titulo.trim(), leccion: l.titulo.trim(), minutos: l.minutos === "" ? undefined : Number(l.minutos) };
      const mats = l.materiales.filter(valorMaterial);
      if (!mats.length) return [{ ...base, material_tipo: "Lectura", material_origen: "Enlace" }];
      return mats.map((m) => ({ ...base, material_tipo: m.tipo, material_origen: m.origen, material: valorMaterial(m) }));
    }),
  );
}

export const recursosEditor = (rs: Sesion["recursos"]): MaterialEd[] =>
  rs.map((r) => materialDe(r.material_tipo, r.material_origen, r.material, r.nombre));

export const recursosBack = (ms: MaterialEd[]): Sesion["recursos"] =>
  ms.filter(valorMaterial).map((m) => ({
    nombre: m.nombre.trim() || nombreMaterial({ material: valorMaterial(m) }),
    material_tipo: m.tipo, material_origen: m.origen, material: valorMaterial(m),
  }));

/** Minutos totales y número de lecciones del temario guardado. */
export function resumenTemario(filas: Sesion["temario"]) {
  const secciones = temarioEditor(filas);
  const lecciones = secciones.flatMap((s) => s.lecciones);
  const min = lecciones.reduce((t, l) => t + (Number(l.minutos) || 0), 0);
  return { secciones: secciones.length, lecciones: lecciones.length, minutos: min };
}

/* ---------- Editor completo ---------- */

export interface SesionEd {
  nombre: string;
  descripcion: string;
  tipo: TipoSesion | null;
  instructor: string;
  horario: HorarioSesion;
  recurrencia: RecurrenciaSesionValor;
  lugar: string;
  areas: { id: string; nombre: string }[];
  enlace: string;
  cupo: string;
  temario: SeccionEd[];
  recursos: MaterialEd[];
  examenes: string[];
  otorgados: string[];
}

export function sesionNueva(fecha: string, inicio = "09:00", fin = "10:00"): SesionEd {
  return {
    nombre: "", descripcion: "", tipo: null, instructor: "",
    horario: { fecha, fechaFin: fecha, inicio, fin, todoElDia: false },
    recurrencia: RECURRENCIA_SESION_INICIAL,
    lugar: "", areas: [], enlace: "", cupo: "",
    temario: [], recursos: [], examenes: [], otorgados: [],
  };
}

export const sesionEditor = (s: Sesion): SesionEd => ({
  nombre: s.nombre,
  descripcion: s.descripcion ?? "",
  tipo: s.tipo,
  instructor: s.instructor ?? "",
  horario: horarioDe(s),
  recurrencia: recurrenciaEditor(s),
  lugar: s.lugar ?? "",
  areas: s.areas ?? [],
  enlace: s.enlace ?? "",
  cupo: s.cupo ? String(s.cupo) : "",
  temario: temarioEditor(s.temario),
  recursos: recursosEditor(s.recursos),
  examenes: s.examenes.map((r) => r.id),
  otorgados: s.otorgados.map((r) => r.id),
});

export type ErroresEditor = Partial<Record<"nombre" | "tipo" | "lugar" | "temario", string>>;

export function erroresEditor(e: SesionEd): ErroresEditor {
  const out: ErroresEditor = {};
  if (!e.nombre.trim()) out.nombre = "Escribe el nombre de la sesión";
  if (!e.tipo) out.tipo = "Selecciona el tipo de sesión";
  if (!e.lugar.trim() && !e.enlace.trim()) out.lugar = "Agrega un lugar, un enlace o ambos";
  if (conTemario(e.tipo)) {
    const ok = e.temario.length && e.temario.every((s) => s.titulo.trim() && s.lecciones.length && s.lecciones.every((l) => l.titulo.trim()));
    if (!ok) out.temario = "Agrega al menos una sección con una lección y completa sus nombres";
  }
  return out;
}

/** Lo que se manda a save_sesion. */
export function sesionInput(e: SesionEd): SesionInput {
  const h = e.horario;
  const fechaFin = h.fechaFin && h.fechaFin >= h.fecha ? h.fechaFin : h.fecha;
  const base = { fecha_inicio: h.fecha, fecha_fin: fechaFin };
  let recurrencia = recurrenciaBack(e.recurrencia, h.fecha);
  if (recurrencia && e.recurrencia.repeticion === "personalizado") {
    const t = e.recurrencia.termina;
    if (t.modo === "fecha") recurrencia = { ...recurrencia, repetir_hasta: t.fecha };
    if (t.modo === "repeticiones") recurrencia = { ...recurrencia, repetir_hasta: fechaRepeticion({ ...base, recurrencia }, t.repeticiones) };
  }
  const tipo = e.tipo!;
  return {
    nombre: e.nombre.trim(),
    descripcion: e.descripcion.trim() || undefined,
    tipo,
    instructor: e.instructor.trim() || undefined,
    ...base,
    hora_inicio: h.todoElDia ? undefined : h.inicio,
    hora_fin: h.todoElDia ? undefined : h.fin,
    recurrencia,
    lugar: e.lugar.trim() || undefined,
    enlace: e.enlace.trim() || undefined,
    areas: e.lugar.trim() ? e.areas : [],
    cupo: Number(e.cupo) > 0 ? Number(e.cupo) : undefined,
    temario: conTemario(tipo) ? temarioBack(e.temario) : [],
    recursos: conRecursos(tipo) ? recursosBack(e.recursos) : [],
    examenes: conExamenes(tipo) ? e.examenes : [],
    otorgados: conExamenes(tipo) ? e.otorgados : [],
  };
}

/** "Lun, Mié" para mostrar la recurrencia guardada en el detalle. */
export const diasTexto = (dias: number[]) => dias.map((d) => DIAS[aFront(d)].slice(0, 3)).join(", ");
export const mesesTexto = (ms: number[]) => ms.map((m) => MESES[m - 1].slice(0, 3)).join(", ");
