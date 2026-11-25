// F0-13 · Formatos compartidos del documento: fechas, peso, iniciales y reglas de revisión.
import type { Documento, DocumentoBase } from "@/types/contratistas";

const FECHA = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" });
const FECHA_HORA = new Intl.DateTimeFormat("es-MX", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
});

/** El back manda "AAAA-MM-DD HH:MM:SS" (hora local) o "AAAA-MM-DD". */
const leer = (s: string) => new Date(s.length <= 10 ? `${s}T00:00:00` : s.replace(" ", "T"));

const formatear = (s: string | null | undefined, f: Intl.DateTimeFormat) => {
  if (!s) return "";
  const d = leer(s);
  return Number.isNaN(d.getTime()) ? s : f.format(d).replace(/\./g, "");
};

export const fmtFecha = (s?: string | null) => formatear(s, FECHA);
export const fmtFechaHora = (s?: string | null) => formatear(s, FECHA_HORA);

/** Peso en KB o MB, como en el diseño (sin peso: ""). */
export const fmtPeso = (bytes?: number) => {
  if (!bytes) return "";
  const kb = Math.max(1, Math.round(bytes / 1024));
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
};

/** "PDF", "JPG"… a partir del nombre del archivo. */
export const extension = (nombre: string) => (nombre.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toUpperCase();

export const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "?";

/** Color fijo por autor, para que su avatar no cambie entre comentarios. */
const AVATARES = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-cyan-600", "bg-slate-500"];
export const colorAvatar = (nombre: string) => {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATARES[h % AVATARES.length];
};

/** Versión vigente (la de número mayor). */
export const versionActual = (doc: DocumentoBase) =>
  doc.versiones.reduce<DocumentoBase["versiones"][number] | undefined>((a, v) => (!a || v.numero > a.numero ? v : a), undefined);

/** Quién tiene el documento: el empleado o equipo si lo hay, si no la empresa. */
export const propietario = (doc: DocumentoBase) => doc.dueno.empleado?.nombre ?? doc.dueno.equipo?.nombre ?? doc.dueno.empresa.nombre;

/**
 * Solo un cliente con quien se compartió puede revisar, y solo mientras está Por revisar
 * y él no ha decidido (el back responde 403 a cualquier otro).
 */
export const puedeRevisar = (doc: Documento | null | undefined) =>
  !!doc && doc.estatus === "Por revisar" && doc.mi_decision === "Pendiente";
