// ME-10 · Reglas de la pestaña Generales del contrato: días de vigencia, dirección,
// recursos agrupados, empleados por ubicación y textos del historial. El estatus
// del contrato y el del REPSE los calcula el back (ME-14 / ME-01); aquí no se recalculan.
import type {
  ClaseEquipo, Contrato, CumplimientoFila, Domicilio, EstadoCumplimiento, EstatusContrato,
  EstatusRepse, EstatusUbicacionContrato, EventoContratoTipo, Id,
} from "@/types/contratistas";
import type { Tono } from "@/mappers/contratistas.mapper";
import { plural } from "./contratosLista";

/** Días de hoy al fin (negativo = vencido), en fechas locales sin hora. */
export const diasAlFin = (fin: string, hoy = new Date()) => {
  const [a, m, d] = fin.slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return null;
  const h = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((Date.UTC(a, m - 1, d) - h) / 864e5);
};

/** Chip de vigencia: "Restan N días" (ámbar ≤ 30) o "Venció hace N días" (rojo). */
export const chipVigencia = (dias: number): { texto: string; tono: "acento" | "warning" | "danger" } =>
  dias < 0
    ? { texto: `Venció hace ${plural(-dias, "día", "días")}`, tono: "danger" }
    : { texto: `Restan ${plural(dias, "día", "días")}`, tono: dias <= 30 ? "warning" : "acento" };

export const fmtMonto = (n?: number) =>
  n === undefined || n === null ? "---" : n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

/** "Av. Las Américas 1500 Int. 3, Col. Mitras, C.P. 66450, San Nicolás, Nuevo León". */
export const fmtDomicilio = (d?: Domicilio | null) => {
  if (!d) return "";
  const calle = [d.tipo_vialidad, d.vialidad, d.num_exterior].filter(Boolean).join(" ");
  return [
    calle + (d.num_interior ? ` Int. ${d.num_interior}` : ""),
    d.colonia && `Col. ${d.colonia}`,
    d.cp && `C.P. ${d.cp}`,
    d.localidad && d.localidad !== d.municipio ? d.localidad : "",
    d.municipio,
    d.estado,
  ]
    .filter((x) => x && String(x).trim())
    .join(", ");
};

export const ESTATUS_REPSE: Record<EstatusRepse, { texto: string; tono: Tono }> = {
  Vigente: { texto: "REPSE vigente", tono: "success" },
  "Por vencer": { texto: "REPSE por vencer", tono: "warning" },
  Vencido: { texto: "REPSE vencido", tono: "danger" },
  "Sin REPSE": { texto: "Sin REPSE", tono: "neutral" },
};

export const ESTATUS_UBICACION_TONO: Record<EstatusUbicacionContrato, Tono> = {
  Activa: "success",
  "En apertura": "warning",
  Inactiva: "neutral",
};

/** Punto junto al título: color y tooltip ("Contrato pausado"). */
export const PUNTO_ESTATUS: Record<EstatusContrato, { punto: string; anillo: string }> = {
  Activo: { punto: "bg-green-600", anillo: "ring-4 ring-green-100" },
  "Por vencer": { punto: "bg-amber-500", anillo: "ring-4 ring-amber-100" },
  "En documentación": { punto: "bg-blue-500", anillo: "ring-4 ring-blue-100" },
  Vencido: { punto: "bg-red-600", anillo: "ring-4 ring-red-100" },
  Pausado: { punto: "bg-slate-400", anillo: "ring-4 ring-slate-100" },
  Cancelado: { punto: "bg-red-600", anillo: "ring-4 ring-red-100" },
};
export const tituloEstatus = (e: EstatusContrato) => `Contrato ${e.toLowerCase()}`;

/* ---------- Recursos ---------- */

export interface TarjetaRecurso {
  clave: "perfiles" | "servicios" | ClaseEquipo;
  titulo: string;
  subtitulo: string;
  /** Suma de cantidades (o renglones en Servicios). */
  total: number;
  items: { nombre: string; cantidad?: number }[];
}

const CLASES: { clase: ClaseEquipo; titulo: string }[] = [
  { clase: "Vehículo", titulo: "Vehículos" },
  { clase: "Equipo", titulo: "Equipos" },
  { clase: "Herramienta", titulo: "Herramientas" },
];

/** Perfiles y Servicios siempre; Vehículos, Equipos y Herramientas solo si el contrato los trae. */
export const tarjetasRecursos = (c: Contrato): TarjetaRecurso[] => {
  const suma = (xs: { cantidad?: number }[]) => xs.reduce((n, x) => n + (x.cantidad || 0), 0);
  const perfiles = c.perfiles.map((p) => ({ nombre: p.perfil.nombre, cantidad: p.cantidad }));
  const out: TarjetaRecurso[] = [
    { clave: "perfiles", titulo: "Perfiles", subtitulo: "Personal requerido", total: suma(perfiles), items: perfiles },
    {
      clave: "servicios", titulo: "Servicios", subtitulo: "Incluidos en el contrato", total: c.servicios.length,
      items: c.servicios.map((s) => ({ nombre: s.nombre })),
    },
  ];
  for (const { clase, titulo } of CLASES) {
    const items = c.equipos.filter((e) => (e.clase || "Equipo") === clase).map((e) => ({ nombre: e.equipo.nombre, cantidad: e.cantidad }));
    if (items.length) out.push({ clave: clase, titulo, subtitulo: "Equipos", total: suma(items), items });
  }
  return out;
};

/* ---------- Ubicaciones ---------- */

/** Estados que dejan el expediente de un empleado con pendientes. */
const PENDIENTE: EstadoCumplimiento[] = ["Por subir", "Por revisar", "Rechazado", "Vencido"];

/** Empleados (id) con algún requerimiento pendiente en este contrato. */
export const empleadosConPendientes = (filas: CumplimientoFila[]) =>
  new Set(filas.filter((f) => f.sujeto.empleado && PENDIENTE.includes(f.estado)).map((f) => f.sujeto.empleado!.id));

export interface UbicacionResumen {
  id: Id;
  nombre: string;
  estatus: EstatusUbicacionContrato;
  empleados: string[];
  /** null = no se pudo leer el cumplimiento; no se pinta el subtexto de expedientes. */
  pendientes: number | null;
}

/**
 * Empleados por ubicación. Como en el diseño, el que no trae ubicación cuenta en la
 * primera. `pendientes` null si no hay cumplimiento cargado.
 */
export const resumenUbicaciones = (c: Contrato, conPendientes: Set<Id> | null): UbicacionResumen[] => {
  const por = new Map<Id, Contrato["empleados"]>(c.ubicaciones.map((u) => [u.ubicacion.id, []]));
  const primera = c.ubicaciones[0]?.ubicacion.id;
  for (const e of c.empleados) {
    const k = e.ubicacion && por.has(e.ubicacion.id) ? e.ubicacion.id : primera;
    if (k !== undefined) por.get(k)!.push(e);
  }
  return c.ubicaciones.map((u) => {
    const lista = por.get(u.ubicacion.id) ?? [];
    return {
      id: u.ubicacion.id,
      nombre: u.ubicacion.nombre,
      estatus: u.estatus,
      empleados: lista.map((e) => e.empleado.nombre),
      pendientes: conPendientes ? lista.filter((e) => conPendientes.has(e.empleado.id)).length : null,
    };
  });
};

/** "Por asignar" / "Expedientes completos" / "N con pendientes". */
export const subtextoUbicacion = (u: UbicacionResumen) => {
  if (!u.empleados.length) return "Por asignar";
  if (u.pendientes === null) return "";
  return u.pendientes ? `${u.pendientes} con pendientes` : "Expedientes completos";
};

/* ---------- Historial ---------- */

export const TITULO_EVENTO: Record<EventoContratoTipo, string> = {
  Creación: "Se creó el contrato",
  Ubicaciones: "Se modificaron las ubicaciones",
  Perfiles: "Se modificaron los perfiles",
  Equipos: "Se modificaron los equipos",
  Servicios: "Se modificaron los servicios",
  Empleados: "Se modificaron los empleados",
  Monto: "Se modificó el monto",
  Vigencia: "Se modificó la vigencia",
  Estatus: "Se actualizó el estatus",
  Pausa: "Se pausó el contrato",
  Reanudación: "Se reanudó el contrato",
  Cancelación: "Se canceló el contrato",
  Modificatorio: "Convenio modificatorio",
};
