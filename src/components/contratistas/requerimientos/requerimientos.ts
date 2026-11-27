// CF-01 · Requerimientos: constantes del diseño y conversiones entre lo que edita el
// asistente y lo que guarda el back (configuracion_sdk.py → contratistas_requerimientos.py,
// CF-01-B). Diseño: plataforma.dc.html, rqVals (~7154–7320) y RQ_* (~4789–4817).
import type { Archivo, Recurrencia as RecurrenciaBack } from "@/types/contratistas/comun";
import type { Ambito, Plataforma, Requerimiento, RequerimientoInput, TipoRequerimiento } from "@/types/contratistas";
// De ./textos y no del index: ahí el componente <VigenciaRequerimiento> tapa al tipo.
import {
  PERIODICIDADES, VIGENCIA_REQUERIMIENTO_INICIAL, erroresVigencia, textoVigenciaRequerimiento,
  type Periodicidad, type Unidad, type VigenciaRequerimiento,
} from "@/components/contratistas/vigencia/textos";

/** Prefijo de todas las consultas de requerimientos (las usan también ME-06, CF-03 y F0-15). */
export const CLAVE_REQUERIMIENTOS = ["contratistas", "requerimientos"];
export const CLAVE_LISTA = [...CLAVE_REQUERIMIENTOS, "config"];

/** Abrir el asistente: con requerimiento edita; sin él, da de alta. */
export type AbrirEditorReq = (r?: Requerimiento) => void;

export const TIPOS_REQ: TipoRequerimiento[] = ["Documento", "Examen", "Inspección"];
export const AMBITOS_REQ: Ambito[] = ["Persona", "Empresa", "Equipo"];

export const PLATAFORMAS: Plataforma[] = [
  "Sin plataforma", "SAT", "IMSS", "INFONAVIT", "STPS", "Registro Público de Comercio", "INE", "Otra",
];

/** Sitio oficial de cada plataforma (RQ_PURL). */
const URL_PLATAFORMA: Partial<Record<Plataforma, string>> = {
  SAT: "https://www.sat.gob.mx",
  IMSS: "https://www.imss.gob.mx",
  INFONAVIT: "https://empresarios.infonavit.org.mx",
  STPS: "https://www.gob.mx/stps",
  "Registro Público de Comercio": "https://rpc.economia.gob.mx",
  INE: "https://www.ine.mx",
};

/** Trámites conocidos: el enlace va directo al trámite y no a la portada (RQ_NURL). */
const URL_POR_NOMBRE: [RegExp, string][] = [
  [/REPSE/i, "https://repse.stps.gob.mx/"],
  [/SIPARE/i, "https://sipare.imss.gob.mx/"],
  [/ICSOE/i, "https://s-icsoe.imss.gob.mx/"],
  [/SISUB|INFONAVIT/i, "https://empresarios.infonavit.org.mx/"],
  [/Opinión de cumplimiento SAT/i, "https://www.sat.gob.mx/consultas/20777/consulta-tu-opinion-de-cumplimiento-de-obligaciones-fiscales"],
  [/Opinión de cumplimiento IMSS/i, "https://buzon.imss.gob.mx/"],
  [/Constancia de situación fiscal/i, "https://www.sat.gob.mx/aplicacion/53027/genera-tu-constancia-de-situacion-fiscal"],
];

export const urlSugerida = (nombre: string, plataforma: Plataforma) =>
  plataforma === "Sin plataforma" ? "" : URL_POR_NOMBRE.find(([re]) => re.test(nombre))?.[1] ?? URL_PLATAFORMA[plataforma] ?? "";

/** Catálogo de inspecciones agrupado por categoría (RQ_INC). */
export const INSPECCIONES: [string, string[]][] = [
  ["Vehículos y maquinaria pesada", ["Camioneta", "Grúa", "Retroexcavadora", "Maquinaria pesada", "Plataforma de elevación"]],
  ["Corte y soldadura", ["Equipo de oxicorte", "Equipo de argón", "Máquina de soldar", "Máquina generador-soldadora", "Rectificador", "Esmeril", "Cortadora de banco", "Extintor", "Equipo de protección personal (EPP)"]],
  ["Trabajos eléctricos", ["Zapato dieléctrico", "Chaleco dieléctrico", "Extensión eléctrica", "Generador eléctrico o a gasolina", "Pistola de impacto eléctrica"]],
  ["Trabajos en altura e izaje", ["Andamios", "Escaleras", "Eslingas", "Polipasto de cadena", "Plataforma de elevación", "Equipo de protección personal (EPP)"]],
  ["Herramienta y maquinaria menor", ["Maquinaria menor", "Pistola neumática", "Compresor de aire"]],
];

/** El back guarda solo el nombre de la inspección; la categoría se deduce del catálogo. */
export const categoriaInspeccion = (nombre?: string | null) =>
  INSPECCIONES.find(([, items]) => items.includes(nombre ?? ""))?.[0] ?? null;

/** Criterios de revisión con que arranca un requerimiento nuevo (rqDefCrit). */
export const CRITERIOS_DEFECTO: Record<TipoRequerimiento, string[]> = {
  Documento: ["El documento es legible y está completo", "Los datos coinciden con el titular", "Está vigente a la fecha de carga"],
  Examen: ["Lo emite un médico o laboratorio autorizado", "El resultado es apto o negativo", "Tiene fecha y firma del responsable"],
  "Inspección": ["Incluye evidencia fotográfica de cada punto", "Los puntos críticos están aprobados", "Tiene firma de quien inspeccionó"],
};

export const AYUDA_AMBITO: Record<Ambito, string> = {
  Empresa: "Aplica para empresas contratistas, clientes o contratos.",
  Equipo: "Aplica para vehículos y maquinaria.",
  Persona: "Aplica para empleados.",
};

/** A quién detiene un requerimiento limitante (rqELimTxt). */
export const SUJETO_LIMITANTE: Record<Ambito, string> = {
  Empresa: "la empresa o el contrato",
  Equipo: "el vehículo o la maquinaria",
  Persona: "el empleado",
};

/** Sub-pestaña de sujetos en Aplicación y su sustantivo. */
export const SUJETOS_AMBITO: Record<Ambito, { pestana: string; singular: string; plural: string }> = {
  Empresa: { pestana: "Contratistas", singular: "contratista", plural: "contratistas" },
  Persona: { pestana: "Personas", singular: "persona", plural: "personas" },
  Equipo: { pestana: "Equipos", singular: "equipo", plural: "equipos" },
};

/* ---------- Estado del asistente ---------- */

export type UnidadAviso = "días" | "semanas" | "meses";
export const UNIDADES_AVISO: UnidadAviso[] = ["días", "semanas", "meses"];

export interface AvisoEd {
  activo: boolean;
  n: number;
  unidad: UnidadAviso;
  /** Después del primer aviso, recordar hasta que se renueve (o se aplique). */
  repetir: boolean;
}

export interface CriterioEd {
  key: string;
  texto: string;
}

export interface RequerimientoEd {
  nombre: string;
  descripcion: string;
  tipo: TipoRequerimiento;
  ambito: Ambito | null;
  plataforma: Plataforma;
  /** null = usar la sugerida (urlSugerida) mientras no se escriba otra. */
  plataformaUrl: string | null;
  /** Nombre de la inspección del catálogo. */
  inspeccion: string;
  examen: {
    modalidad: "fisico" | "digital" | null;
    intentos: number;
    aleatoria: boolean;
    preguntas_aleatorias: boolean;
    respuestas_aleatorias: boolean;
    /** No está en el diseño; se conserva lo que traiga el back. */
    calificacion_minima: number;
  };
  vigencia: VigenciaRequerimiento;
  aviso: AvisoEd;
  requiere_acuse: boolean;
  limitante: boolean;
  criterios: CriterioEd[];
  documento_ejemplo: Archivo | null;
  /** Ya se eligió el tipo a mano (o se está editando): la IA no lo cambia. */
  tipoManual?: boolean;
  /** Campos que llenó la IA (marca "IA" hasta que se editan a mano). */
  ia: Partial<Record<"nombre" | "tipo" | "descripcion", boolean>>;
  // Se conservan tal cual al editar (para editar se manda el requerimiento completo).
  /** Lo que el asistente no muestra: meses de vencimiento de un periodo no mensual (ICSOE)
   *  y la vigencia que traiga un examen o inspección. */
  conservar?: Pick<Requerimiento, "periodicidad" | "meses_periodo" | "vigencia">;
  codigo?: string | null;
  estatus: Requerimiento["estatus"];
}

let llave = 0;
export const criterio = (texto: string): CriterioEd => ({ key: `c${++llave}`, texto });

export const AVISO_INICIAL: AvisoEd = { activo: false, n: 5, unidad: "días", repetir: true };

export function requerimientoNuevo(): RequerimientoEd {
  return {
    nombre: "", descripcion: "", tipo: "Documento", ambito: null, plataforma: "Sin plataforma", plataformaUrl: null,
    inspeccion: "",
    examen: { modalidad: null, intentos: 3, aleatoria: true, preguntas_aleatorias: true, respuestas_aleatorias: true, calificacion_minima: 80 },
    vigencia: VIGENCIA_REQUERIMIENTO_INICIAL, aviso: AVISO_INICIAL, requiere_acuse: false, limitante: false,
    criterios: CRITERIOS_DEFECTO.Documento.map(criterio), documento_ejemplo: null, ia: {}, estatus: "Activo",
  };
}

export function requerimientoEditor(r: Requerimiento): RequerimientoEd {
  const ex = r.examen;
  return {
    nombre: r.nombre, descripcion: r.descripcion ?? "", tipo: r.tipo, tipoManual: true, ambito: r.ambito,
    plataforma: r.plataforma ?? "Sin plataforma", plataformaUrl: r.plataforma_url ?? null,
    inspeccion: r.inspeccion ?? "",
    examen: {
      modalidad: ex?.modalidad ?? null, intentos: ex?.intentos ?? 3,
      aleatoria: !!(ex?.preguntas_aleatorias || ex?.respuestas_aleatorias),
      preguntas_aleatorias: ex ? ex.preguntas_aleatorias : true, respuestas_aleatorias: ex ? ex.respuestas_aleatorias : true,
      calificacion_minima: ex?.calificacion_minima ?? 80,
    },
    vigencia: vigenciaDe(r),
    aviso: r.aviso ? { activo: true, n: r.aviso.n, unidad: unidadAviso(r.aviso.unidad), repetir: r.aviso.repetir } : AVISO_INICIAL,
    requiere_acuse: r.requiere_acuse, limitante: r.limitante,
    criterios: (r.criterios ?? []).map(criterio), documento_ejemplo: r.documento_ejemplo ?? null, ia: {},
    conservar: { periodicidad: r.periodicidad, meses_periodo: r.meses_periodo, vigencia: r.vigencia },
    codigo: r.codigo, estatus: r.estatus,
  };
}

const unidadAviso = (u: string): UnidadAviso => (UNIDADES_AVISO.includes(u as UnidadAviso) ? (u as UnidadAviso) : "días");

/* ---------- Vigencia: back ↔ selector de F0-14 ---------- */

// El selector cuenta los días con 0 = domingo y los meses desde 0 = enero; el back,
// los días con 0 = lunes y los meses desde 1 = enero.
const aBack = (d: number) => (d + 6) % 7;
const aFront = (d: number) => (d + 1) % 7;
const mesesABack = (m: number[]) => [...m].sort((a, b) => a - b).map((x) => x + 1);
const mesesAFront = (m?: number[] | null) => (m ?? []).filter((x) => x >= 1 && x <= 12).map((x) => x - 1);

const UNIDAD_DE_BACK: Record<string, Unidad> = { "días": "día(s)", meses: "mes(es)", "años": "año(s)" };
/** El back no tiene semanas en la vigencia: se guardan como días. */
function unidadABack({ n, unidad }: { n: number; unidad: Unidad }): { n: number; unidad: "días" | "meses" | "años" } {
  if (unidad === "semana(s)") return { n: n * 7, unidad: "días" };
  return { n, unidad: unidad === "día(s)" ? "días" : unidad === "mes(es)" ? "meses" : "años" };
}
const unidadDeBack = (v: { n: number; unidad: string }) => ({ n: v.n, unidad: UNIDAD_DE_BACK[v.unidad] ?? "año(s)" });

const minutos = (h?: string) => {
  const [hh, mm] = (h ?? "").split(":").map(Number);
  return Number.isFinite(hh) ? hh * 60 + (mm || 0) : null;
};
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function vigenciaDe(r: Requerimiento): VigenciaRequerimiento {
  const v = { ...VIGENCIA_REQUERIMIENTO_INICIAL };
  if (r.tipo === "Documento") {
    if (r.vigencia_modo === "periodo") {
      const p = r.periodicidad;
      if (!p || p === "Única") return v;
      // Lo que el selector no tiene como periodo se edita como vigencia (rcFrom del diseño).
      if (p === "Cada 3 años" || p === "Cada 10 años") return { ...v, activa: true, modo: "vigencia", vigencia: { n: p === "Cada 3 años" ? 3 : 10, unidad: "año(s)" } };
      const meses = p === "Mensual" ? mesesAFront(r.meses_periodo) : [];
      return {
        ...v, activa: true, modo: "periodico", periodicidad: PERIODICIDADES.includes(p as Periodicidad) ? (p as Periodicidad) : null,
        modoMeses: p === "Mensual" && meses.length && meses.length < 12 ? "sel" : "todos", meses, plazo: r.dia_limite ?? 17,
      };
    }
    return r.vigencia ? { ...v, activa: true, modo: "vigencia", vigencia: unidadDeBack(r.vigencia) } : v;
  }
  const rc = r.recurrencia;
  const res = r.tipo === "Examen" && r.examen?.vigencia_resultado;
  if (res) Object.assign(v, { resultado: true, vigenciaResultado: unidadDeBack(res) });
  if (!rc) return { ...v, activa: !!res };
  v.activa = true;
  v.hora = rc.hora_desde ?? v.hora;
  v.tolerancia = r.tolerancia_dias || v.tolerancia;
  switch (rc.tipo) {
    case "Por día": {
      const desde = minutos(rc.hora_desde), hasta = minutos(rc.hora_hasta);
      const horas = desde !== null && hasta !== null && hasta > desde ? Math.round((hasta - desde) / 60) : null;
      return { ...v, frecuencia: "Diaria", porHoras: !!rc.cada_horas, cadaHoras: rc.cada_horas ?? 1, toleranciaHoras: horas || v.toleranciaHoras };
    }
    case "Semanal":
      return { ...v, frecuencia: "Semanal", dias: (rc.dias_semana ?? []).map(aFront) };
    case "Mensual":
      return rc.mensual_modo === "ordinal"
        ? { ...v, frecuencia: "Mensual", diaMes: "semana", ordinal: Math.max(0, (rc.mensual_ordinal ?? 1) - 1), diaSemana: aFront(rc.mensual_dia_semana ?? 0) }
        : { ...v, frecuencia: "Mensual", diaMes: "dia", dia: rc.mensual_dia ?? 1 };
    default:
      // "Configurable" cada 1 año = Anual del selector
      return { ...v, frecuencia: "Anual", meses: mesesAFront(rc.meses) };
  }
}

function recurrenciaABack(v: VigenciaRequerimiento): RecurrenciaBack {
  const base = { hora_desde: v.hora };
  switch (v.frecuencia) {
    case "Diaria": {
      const desde = minutos(v.hora) ?? 0;
      return {
        tipo: "Por día", ...base, ...(v.porHoras ? { cada_horas: v.cadaHoras } : {}),
        // La tolerancia en horas es la ventana de aplicación: de hora_desde a hora_hasta.
        hora_hasta: hhmm(Math.min(23 * 60 + 59, desde + v.toleranciaHoras * 60)),
      };
    }
    case "Semanal":
      return { tipo: "Semanal", ...base, dias_semana: v.dias.map(aBack).sort((a, b) => a - b) };
    case "Mensual":
      return v.diaMes === "dia"
        ? { tipo: "Mensual", ...base, mensual_modo: "dia", mensual_dia: v.dia }
        : { tipo: "Mensual", ...base, mensual_modo: "ordinal", mensual_ordinal: v.ordinal + 1, mensual_dia_semana: aBack(v.diaSemana) };
    default:
      return { tipo: "Configurable", ...base, cada_n: 1, unidad: "año", meses: mesesABack(v.meses) };
  }
}

/** ¿Tiene vigencia o se repite? Sin esto no hay avisos (rqENtDis*). */
export const conVigencia = (e: Pick<RequerimientoEd, "vigencia">) => e.vigencia.activa;

/* ---------- Guardar ---------- */

export function requerimientoInput(e: RequerimientoEd): RequerimientoInput {
  const v = e.vigencia;
  const doc = e.tipo === "Documento";
  const c = e.conservar;
  // Mensual: los meses elegidos. Otro periodo: los meses de vencimiento que ya traía, si no cambió.
  const meses =
    v.periodicidad === "Mensual"
      ? v.modoMeses === "sel" ? mesesABack(v.meses) : undefined
      : v.periodicidad === c?.periodicidad ? c?.meses_periodo ?? undefined : undefined;
  const vig: Pick<RequerimientoInput, "vigencia_modo" | "vigencia" | "periodicidad" | "meses_periodo" | "dia_limite"> =
    doc && v.activa && v.modo === "periodico"
      ? { vigencia_modo: "periodo", vigencia: null, periodicidad: v.periodicidad ?? undefined, dia_limite: v.plazo, meses_periodo: meses }
      : { vigencia_modo: "vigencia", vigencia: doc ? (v.activa ? unidadABack(v.vigencia) : null) : c?.vigencia ?? null };
  const prog = !doc && v.activa;
  const plataformaUrl = e.plataforma === "Sin plataforma" ? "" : (e.plataformaUrl ?? urlSugerida(e.nombre, e.plataforma)).trim();
  return {
    nombre: e.nombre.trim(),
    descripcion: e.descripcion.trim() || undefined,
    tipo: e.tipo,
    ambito: e.ambito!,
    plataforma: e.plataforma,
    plataforma_url: plataformaUrl || undefined,
    ...vig,
    recurrencia: prog ? recurrenciaABack(v) : undefined,
    tolerancia_dias: prog && v.frecuencia !== "Diaria" ? v.tolerancia : undefined,
    aviso: v.activa && e.aviso.activo ? { n: e.aviso.n, unidad: e.aviso.unidad, repetir: e.aviso.repetir } : null,
    requiere_acuse: doc && e.requiere_acuse,
    limitante: e.limitante,
    criterios: e.criterios.map((c) => c.texto.trim()).filter(Boolean),
    documento_ejemplo: e.documento_ejemplo ?? undefined,
    examen:
      e.tipo === "Examen"
        ? {
            modalidad: e.examen.modalidad ?? "fisico",
            intentos: e.examen.intentos,
            calificacion_minima: e.examen.calificacion_minima,
            preguntas_aleatorias: e.examen.modalidad === "digital" && e.examen.aleatoria && e.examen.preguntas_aleatorias,
            respuestas_aleatorias: e.examen.modalidad === "digital" && e.examen.aleatoria && e.examen.respuestas_aleatorias,
            ...(v.activa && v.resultado ? { vigencia_resultado: unidadABack(v.vigenciaResultado) } : {}),
          }
        : undefined,
    inspeccion: e.tipo === "Inspección" ? e.inspeccion : undefined,
    estatus: e.estatus,
    codigo: e.codigo,
  };
}

/** Lo que manda "Eliminar": el requerimiento entero con estatus Inactivo. */
export function requerimientoInactivo(r: Requerimiento): RequerimientoInput {
  const resto: Partial<Requerimiento> = { ...r };
  delete resto.id;
  return { ...(resto as RequerimientoInput), estatus: "Inactivo" };
}

/* ---------- Validación ---------- */

export type ErroresPaso1 = Partial<Record<"nombre" | "ambito" | "inspeccion" | "modalidad", string>>;

export function erroresPaso1(e: RequerimientoEd): ErroresPaso1 {
  const x: ErroresPaso1 = {};
  if (!e.nombre.trim()) x.nombre = "Escribe el nombre del requerimiento";
  if (!e.ambito) x.ambito = "Selecciona el ámbito";
  if (e.tipo === "Inspección" && !e.inspeccion) x.inspeccion = "Selecciona la inspección";
  if (e.tipo === "Examen" && !e.examen.modalidad) x.modalidad = "Selecciona el tipo de examen";
  return x;
}

export const erroresPaso2 = (e: RequerimientoEd) => erroresVigencia(e.tipo, e.vigencia);

/* ---------- Textos ---------- */

/** Columna Vigencia de la lista y renglón del detalle. */
export const textoVigencia = (r: Requerimiento) => textoVigenciaRequerimiento(r.tipo, vigenciaDe(r));

/** Avisos al aplicar (inspección y examen sin vigencia del resultado) o al vencer. */
export function avisoDeAplicacion(tipo: TipoRequerimiento, v: VigenciaRequerimiento) {
  return tipo !== "Documento" && !(tipo === "Examen" && v.resultado);
}

const SINGULAR: Record<string, string> = { "días": "día", semanas: "semana", meses: "mes" };
const cuantosAviso = (n: number, u: string) => `${n} ${n === 1 ? SINGULAR[u] ?? u : u}`;

/** "5 días antes · hasta que se renueve" (detalle) o "Sin vencimiento". */
export function textoAviso(r: Requerimiento): string | null {
  if (!vigenciaDe(r).activa) return "Sin vencimiento";
  if (!r.aviso) return null;
  return `${cuantosAviso(r.aviso.n, r.aviso.unidad)} antes${r.aviso.repetir ? " · se repite" : ""}`;
}

export function resumenAviso(tipo: TipoRequerimiento, v: VigenciaRequerimiento, a: AvisoEd) {
  const ap = avisoDeAplicacion(tipo, v);
  return (
    `Primer aviso ${cuantosAviso(a.n, a.unidad)} ${ap ? "antes de cada aplicación" : "antes del vencimiento"}` +
    (a.repetir ? `; después, cada día hasta que ${ap ? "se aplique" : "se renueve"}.` : ".")
  );
}

/* ---------- Filtros de la lista ---------- */

export const FILTROS_REQ = {
  tipo: { titulo: "Tipo", opciones: TIPOS_REQ as string[], de: (r: Requerimiento) => r.tipo as string },
  ambito: { titulo: "Ámbito", opciones: AMBITOS_REQ as string[], de: (r: Requerimiento) => r.ambito as string },
  vigencia: { titulo: "Vigencia", opciones: ["Con vigencia", "Sin vencimiento"], de: (r: Requerimiento) => (vigenciaDe(r).activa ? "Con vigencia" : "Sin vencimiento") },
  avisos: { titulo: "Avisos de vencimiento", opciones: ["Con avisos", "Sin avisos"], de: (r: Requerimiento) => (r.aviso && vigenciaDe(r).activa ? "Con avisos" : "Sin avisos") },
  acuse: { titulo: "Requiere acuse", opciones: ["Sí", "No"], de: (r: Requerimiento) => (r.requiere_acuse ? "Sí" : "No") },
  limitante: { titulo: "Limitante", opciones: ["Sí", "No"], de: (r: Requerimiento) => (r.limitante ? "Sí" : "No") },
} as const;

export type ClaveFiltroReq = keyof typeof FILTROS_REQ;
export const CLAVES_FILTRO = Object.keys(FILTROS_REQ) as ClaveFiltroReq[];

/** El back pagina de a 200 como máximo: se traen todas las páginas para filtrar y contar aquí. */
export async function todasLasPaginas<T>(pedir: (offset: number, limit: number) => Promise<{ items: T[]; total: number }>) {
  const limit = 200;
  const primera = await pedir(0, limit);
  const items = [...primera.items];
  while (items.length < primera.total) {
    const p = await pedir(items.length, limit);
    if (!p.items.length) break;
    items.push(...p.items);
  }
  return items;
}
