// ME-06 · Reglas de la lista de documentos: estatus calculado, datos derivados y
// el DocumentoInput que se arma con lo que regresa el uploader (F0-10).
import type { AnalisisIA } from "@/types/contratistas/uploader";
import type { Documento, DocumentoInput, EmpresaRef, EstatusDocumento, Id } from "@/types/contratistas";
import { versionActual } from "@/components/contratistas/documento";

export const ESTATUS: EstatusDocumento[] = ["Aceptado", "Por revisar", "Rechazado", "Vencido"];
export const SIN_CONTRATO = "Sin contrato";
export const TIPO_DUENO: Record<string, string> = { Empresa: "Empresa", Persona: "Empleado", Equipo: "Equipo" };

const hoy = () => new Date().toISOString().slice(0, 10);

/** Vencido se calcula: Aceptado con la vigencia ya pasada. */
export const estatusDe = (d: Documento): EstatusDocumento =>
  d.estatus === "Aceptado" && d.vigencia_fin && d.vigencia_fin.slice(0, 10) < hoy() ? "Vencido" : d.estatus;

/** Fecha de la primera versión (cuando se cargó el documento). */
export const fechaCarga = (d: Documento) =>
  d.versiones.reduce<string | undefined>((a, v) => (!a || v.fecha < a ? v.fecha : a), undefined);

export const subidoPor = (d: Documento) => versionActual(d)?.subido_por ?? "";

export const contratosDe = (d: Documento) => (d.contratos.length ? d.contratos.map((c) => c.nombre) : [SIN_CONTRATO]);

/** "Constancia de situación fiscal · Fiscal" → "Fiscal". */
const categoriaIA = (a: AnalisisIA | null) => a?.tipo?.split("·")[1]?.trim() || undefined;

/**
 * Lo que se manda a upload_documento. Sin `compartido_con`: el back lo comparte con
 * todos los clientes activos. El propietario es la empresa o uno de sus empleados.
 */
export function documentoInput(
  empresa: EmpresaRef,
  r: {
    archivo: DocumentoInput["archivo"];
    nombre: string;
    requerimiento_id: Id | null;
    propietario_id: Id | null;
    analisis: AnalisisIA | null;
    reemplaza_id?: Id;
  },
  extra: Pick<DocumentoInput, "origen" | "contratos"> = {},
): DocumentoInput {
  const empleado = r.propietario_id && r.propietario_id !== empresa.id ? r.propietario_id : undefined;
  return {
    nombre: r.nombre,
    categoria: categoriaIA(r.analisis),
    requerimiento_id: r.requerimiento_id,
    dueno: empleado ? { tipo: "Persona", empresa_id: empresa.id, empleado_id: empleado } : { tipo: "Empresa", empresa_id: empresa.id },
    vigencia_fin: r.analisis?.campos.vigencia_fin || undefined,
    archivo: r.archivo,
    reemplaza_id: r.reemplaza_id,
    lectura_ia: r.analisis ? { ...r.analisis } : undefined,
    ...extra,
  };
}
