// ME-12 · Nuevo contrato: estado del formulario, validaciones, lectura de la IA
// y armado del ContratoInput para create_contrato (ME-14).
// Diseño: nuevo-contrato.dc.html, valsNuevo (~3965–4358) y nGuardar.
import { RECURRENCIA_CONTRATO_INICIAL, fechaLocal, personalizadaBack, type RecurrenciaContratoValor } from "@/components/contratistas/vigencia";
import type { AnalisisIA } from "@/types/contratistas/uploader";
import type {
  Archivo, ClaseEquipo, ContratoInput, Id, RecursoContrato, Recurrencia, RelacionFila, Ref, TipoRequerimiento,
} from "@/types/contratistas";

export interface DatosContrato {
  numero_contrato: string;
  objeto: string;
  descripcion: string;
  /** Relación aceptada con el contratista (de ahí salen cliente y contratista). */
  relacion: Id | null;
  /** Texto como lo captura el usuario ("1,840,000.00"). */
  monto: string;
  /** yyyy-mm-dd */
  inicio: string;
  fin: string;
}
export type CampoDato = keyof DatosContrato;

export interface FilaPerfil { key: string; perfil: Id | null; cantidad: string; excluidos: Id[] }
export interface FilaEquipo { key: string; clase: Exclude<ClaseEquipo, "Herramienta"> | null; equipo: Id | null; cantidad: string; excluidos: Id[] }

export interface NuevoContratoEd {
  archivo: Archivo | null;
  datos: DatosContrato;
  /** Campos que llenó la IA (chip "IA"); se quita al editarlos. */
  ia: CampoDato[];
  subcontratacion: boolean;
  servicios: Id[];
  recurrencia: RecurrenciaContratoValor;
  perfiles: FilaPerfil[];
  equipos: FilaEquipo[];
  ubicaciones: Ref[];
}

export const contratoNuevo = (): NuevoContratoEd => ({
  archivo: null,
  datos: { numero_contrato: "", objeto: "", descripcion: "", relacion: null, monto: "", inicio: "", fin: "" },
  ia: [],
  subcontratacion: false,
  servicios: [],
  recurrencia: RECURRENCIA_CONTRATO_INICIAL,
  perfiles: [],
  equipos: [],
  ubicaciones: [],
});

let nFila = 0;
export const filaPerfil = (): FilaPerfil => ({ key: `p${++nFila}`, perfil: null, cantidad: "", excluidos: [] });
export const filaEquipo = (): FilaEquipo => ({ key: `e${++nFila}`, clase: null, equipo: null, cantidad: "", excluidos: [] });

/* ---------- Validación (nGuardar) ---------- */

/** Los siete obligatorios del diseño (el responsable no lo es). */
export const DATOS_REQ: CampoDato[] = ["numero_contrato", "objeto", "descripcion", "relacion", "monto", "inicio", "fin"];

export const montoNumero = (m: string): number | null => {
  const n = Number(m.replace(/[$,\s]/g, ""));
  return m.trim() && Number.isFinite(n) && n >= 0 ? n : null;
};

/** "1840000" → "1,840,000.00" al salir del campo; si no es número, se deja como está. */
export const fmtMontoCaptura = (m: string) => {
  const n = montoNumero(m);
  return n === null ? m : n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function erroresDatos(d: DatosContrato): Partial<Record<CampoDato, string>> {
  const e: Partial<Record<CampoDato, string>> = {};
  for (const k of DATOS_REQ) if (!String(d[k] ?? "").trim()) e[k] = "Campo requerido";
  if (!e.monto && montoNumero(d.monto) === null) e.monto = "Captura un monto válido";
  if (!e.inicio && !e.fin && d.fin < d.inicio) e.fin = "La fecha fin no puede ser anterior al inicio";
  return e;
}

const cantidadOk = (c: string) => /^\d+$/.test(c.trim()) && Number(c) > 0;
export const perfilIncompleto = (f: FilaPerfil) => !f.perfil || !cantidadOk(f.cantidad);
export const equipoIncompleto = (f: FilaEquipo) => !f.clase || !f.equipo || !cantidadOk(f.cantidad);

export const ERROR_RECURSOS = {
  perfiles: "Selecciona el perfil y captura la cantidad en todas las filas.",
  equipos: "Selecciona el tipo, el equipo y captura la cantidad en todas las filas.",
};

/* ---------- Requerimientos de un recurso ---------- */

/** Formato del chip (el diseño agrega Capacitación; el modelo aún no la tiene). */
export const COLOR_FORMATO: Record<TipoRequerimiento, string> = {
  Documento: "bg-blue-50 text-blue-800 ring-blue-200",
  Examen: "bg-violet-50 text-violet-700 ring-violet-200",
  "Inspección": "bg-amber-50 text-amber-700 ring-amber-200",
};

/** "4 de 6 requerimientos seleccionados" de una fila. */
export const reqsActivos = (r: RecursoContrato | undefined, excluidos: Id[]) =>
  (r?.requerimientos ?? []).filter((q) => !excluidos.includes(q.id)).length;

/* ---------- Lectura de la IA (F0-11, extraccion de tipo Contrato) ---------- */

export interface ExtraccionContrato {
  numero_contrato?: string;
  objeto?: string;
  descripcion?: string;
  monto?: number | string;
  inicio?: string;
  fin?: string;
  partes?: { cliente?: { razon_social?: string; rfc?: string }; contratista?: { razon_social?: string; rfc?: string } };
}

const clave = (s?: string) => (s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const fechaIso = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : "");

/**
 * Lo que la IA leyó → datos del contrato. Solo llena campos vacíos; el
 * contratista se elige si su RFC (o razón social) es una relación aceptada.
 */
export function aplicarLectura(ed: NuevoContratoEd, a: AnalisisIA, relaciones: RelacionFila[]): NuevoContratoEd {
  const x = (a.extraccion ?? {}) as ExtraccionContrato;
  const ctr = x.partes?.contratista;
  const rel = relaciones.find(
    (r) => (ctr?.rfc && clave(r.contraparte.rfc) === clave(ctr.rfc)) ||
      (ctr?.razon_social && clave(r.contraparte.razon_social) === clave(ctr.razon_social)),
  );
  const leido: Partial<Record<CampoDato, string>> = {
    numero_contrato: x.numero_contrato,
    objeto: x.objeto,
    descripcion: x.descripcion,
    relacion: rel?.id,
    monto: x.monto !== undefined && x.monto !== "" ? fmtMontoCaptura(String(x.monto)) : undefined,
    inicio: fechaIso(x.inicio ?? (a.campos as { vigencia_inicio?: string }).vigencia_inicio),
    fin: fechaIso(x.fin ?? a.campos.vigencia_fin),
  };
  const datos = { ...ed.datos };
  const ia = new Set(ed.ia);
  for (const k of Object.keys(leido) as CampoDato[]) {
    const v = leido[k];
    if (v && !String(datos[k] ?? "").trim()) {
      (datos as Record<CampoDato, string | null>)[k] = v;
      ia.add(k);
    }
  }
  return { ...ed, datos, ia: [...ia] };
}

/* ---------- Guardar ---------- */

/** Recurrencia del contrato: el editor de F0-14 + horario, o nada si no se restringe. */
export function recurrenciaContratoBack(v: RecurrenciaContratoValor, inicio: string): Recurrencia | undefined {
  if (!v.restringir) return undefined;
  const r = personalizadaBack(v.recurrencia, fechaLocal(inicio) ?? new Date());
  return r && { ...r, hora_desde: v.desde, hora_hasta: v.hasta };
}

export interface Catalogos {
  servicios: RecursoContrato[];
  perfiles: RecursoContrato[];
  equipos: RecursoContrato[];
}

const ref = (lista: RecursoContrato[], id: Id | null): Ref => {
  const r = lista.find((x) => x.id === id);
  return { id: id ?? "", nombre: r?.nombre ?? "" };
};

export function contratoInput(ed: NuevoContratoEd, cat: Catalogos): ContratoInput {
  const d = ed.datos;
  return {
    relacion: d.relacion ?? "",
    numero_contrato: d.numero_contrato.trim() || undefined,
    objeto: d.objeto.trim(),
    descripcion: d.descripcion.trim() || undefined,
    monto: montoNumero(d.monto) ?? undefined,
    inicio: d.inicio,
    fin: d.fin,
    contrato_firmado: ed.archivo ?? undefined,
    permite_subcontratacion: ed.subcontratacion,
    servicios: ed.servicios.map((id) => ref(cat.servicios, id)),
    perfiles: ed.perfiles.map((f) => ({ perfil: ref(cat.perfiles, f.perfil), cantidad: Number(f.cantidad), requerimientos_excluidos: f.excluidos })),
    equipos: ed.equipos.map((f) => ({
      equipo: ref(cat.equipos, f.equipo), clase: f.clase ?? "Equipo", cantidad: Number(f.cantidad), requerimientos_excluidos: f.excluidos,
    })),
    ubicaciones: ed.ubicaciones.map((ubicacion) => ({ ubicacion, estatus: "Activa" })),
    empleados: [],
    recurrencia: recurrenciaContratoBack(ed.recurrencia, d.inicio),
  };
}
