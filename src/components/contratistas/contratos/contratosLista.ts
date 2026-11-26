// ME-09 · Reglas de la lista de contratos: contraparte según el lado, recursos,
// búsqueda y filtro de fecha por traslape de la vigencia. El estatus lo calcula
// el back (ME-14); aquí no se recalcula.
import type { Contrato, EmpresaRef, EstatusContrato, Id } from "@/types/contratistas";
import { coincide, rangoFecha, type ValorFecha } from "@/components/contratistas/filtros";
import type { Lado, Modo } from "@/lib/contratistas/contexto";

export const ESTATUS: EstatusContrato[] = ["Activo", "Por vencer", "En documentación", "Vencido", "Pausado", "Cancelado"];

/** La otra empresa del contrato vista desde la empresa activa. */
export const contraparte = (c: Contrato, miEmpresa: Id | undefined): EmpresaRef =>
  c.cliente.id === miEmpresa ? c.contratista : c.cliente;

/**
 * Qué contratos entran según dónde está la lista:
 * Contratistas → donde somos el cliente; Clientes → donde somos el contratista.
 * Mi empresa y el detalle (ya filtrado por relación en el back) muestran todos.
 */
export const delLado = (c: Contrato, modo: Modo, lado: Lado | null, miEmpresa: Id | undefined) =>
  modo !== "lista" || !miEmpresa || (lado === "cli" ? c.contratista.id === miEmpresa : c.cliente.id === miEmpresa);

export const ubicacionesDe = (c: Contrato) => c.ubicaciones.map((u) => u.ubicacion.nombre);
export const numEmpleados = (c: Contrato) => c.empleados.length;
export const numEquipos = (c: Contrato) => c.equipos.reduce((n, e) => n + (e.cantidad || 0), 0);

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Búsqueda de cabecera: razón social, RFC, objeto, número, ubicaciones y folio. */
export const enBusqueda = (q: string, c: Contrato, otro: EmpresaRef) =>
  coincide(q, otro.razon_social, otro.rfc, c.objeto, c.numero_contrato, c.folio, ...ubicacionesDe(c));

/** La vigencia [inicio, fin] se traslapa con el rango del filtro. */
export const enVigencia = (c: Contrato, filtro: ValorFecha) => {
  if (filtro.periodo === "Todos") return true;
  const [desde, hasta] = rangoFecha(filtro);
  return (!hasta || c.inicio.slice(0, 10) <= hasta) && (!desde || c.fin.slice(0, 10) >= desde);
};
