import type {
  AnalisisDocumentosEmpleado,
  Archivo,
  DocumentoEmpleadoRenglon,
  EmpleadoContratista,
  EmpleadoInput,
  Empresa,
  EmpresaInput,
  Estatus,
  EstatusDocumentoEmpleado,
  Id,
  ListParams,
  OrigenDocumentoEmpleado,
  Pagina,
  PreferenciasEmpleado,
  QrEmpleado,
  ResultadoCargaEmpleados,
  ValidacionCargaEmpleados,
} from "@/types/contratistas";
import { CONTRATISTAS_SCRIPTS, callContratistas } from "./client";

/** Empresa activa del usuario ("Mi Empresa"); el back la resuelve del JWT. */
export const getMiEmpresa = () => callContratistas<Empresa>("get_mi_empresa");

export const updateMiEmpresa = (empresa: EmpresaInput) =>
  callContratistas<Empresa>("update_mi_empresa", { empresa });

/** Empresa de una contraparte (detalle de cliente/contratista, solo lectura). */
export const getEmpresa = (empresa_id: Id) =>
  callContratistas<Empresa>("get_empresa", { empresa_id });

export interface EmpleadosFiltros extends ListParams {
  /** Vacío = los de la empresa activa. Otra empresa solo con relación (solo lectura). */
  empresa_id?: Id;
  estatus?: Estatus;
  /** Con o sin usuario de la app. */
  usuario?: "con" | "sin";
  cumplimiento?: "Completo" | "Incompleto";
  perfil_id?: Id;
  /** id de contrato, o "libre" = sin contratos. */
  contrato_id?: Id | "libre";
}

const EMP = CONTRATISTAS_SCRIPTS.empleados;

export const listEmpleados = (filtros: EmpleadosFiltros = {}) =>
  callContratistas<Pagina<EmpleadoContratista> & { editable: boolean }>("list_empleados", { ...filtros }, EMP);

export const getEmpleado = (empleado_id: Id) =>
  callContratistas<EmpleadoContratista>("get_empleado", { empleado_id }, EMP);

export const createEmpleado = (empleado: EmpleadoInput) =>
  callContratistas<EmpleadoContratista>("create_empleado", { empleado }, EMP);

/** Solo las llaves que cambian. */
export const updateEmpleado = (empleado_id: Id, empleado: Partial<EmpleadoInput>) =>
  callContratistas<EmpleadoContratista>("update_empleado", { empleado_id, empleado }, EMP);

/** "Eliminar" en la UI = Inactivo (no se borra). */
export const changeStatusEmpleado = (empleado_id: Id, estatus: Estatus) =>
  callContratistas<EmpleadoContratista>("change_status_empleado", { empleado_id, estatus }, EMP);

/** Paso 1 del alta manual: lee INE, CURP, comprobante, CSF y CV (máx. 6). */
export const analizarDocumentosEmpleado = (archivos: Archivo[]) =>
  callContratistas<AnalisisDocumentosEmpleado>("analizar_documentos_empleado", { archivos }, EMP);

/** Carga masiva (.xlsx o .csv con Nombre completo, CURP, RFC, NSS, Puesto). */
export const validarCargaEmpleados = (archivo: Archivo) =>
  callContratistas<ValidacionCargaEmpleados>("validar_carga_empleados", { archivo }, EMP);

export const cargarEmpleados = (archivo: Archivo) =>
  callContratistas<ResultadoCargaEmpleados>("cargar_empleados", { archivo }, EMP);

/* ---- Detalle del empleado (ME-04) ---- */

export interface DocumentosEmpleadoFiltros extends ListParams {
  estatus?: EstatusDocumentoEmpleado | EstatusDocumentoEmpleado[];
  origen?: OrigenDocumentoEmpleado["tipo"];
}

/** Pestaña Documentos, ordenada por urgencia. `pendientes` = contador rojo del tab. */
export const listDocumentosEmpleado = (empleado_id: Id, filtros: DocumentosEmpleadoFiltros = {}) =>
  callContratistas<
    Pagina<DocumentoEmpleadoRenglon> & { conteo: Record<EstatusDocumentoEmpleado, number>; pendientes: number }
  >("list_documentos_empleado", { empleado_id, ...filtros }, EMP);

export const getQrEmpleado = (empleado_id: Id) =>
  callContratistas<QrEmpleado>("get_qr_empleado", { empleado_id }, EMP);

/** Motivo obligatorio; también apaga "Disponible para contratos". */
export const vetarEmpleado = (empleado_id: Id, motivo: string) =>
  callContratistas<EmpleadoContratista>("vetar_empleado", { empleado_id, motivo }, EMP);

export const levantarVetoEmpleado = (empleado_id: Id) =>
  callContratistas<EmpleadoContratista>("levantar_veto_empleado", { empleado_id }, EMP);

/** Solo las llaves que cambian. */
export const updatePreferenciasEmpleado = (empleado_id: Id, preferencias: Partial<PreferenciasEmpleado>) =>
  callContratistas<EmpleadoContratista>("update_preferencias_empleado", { empleado_id, preferencias }, EMP);

/** Manda al correo del usuario la liga para poner contraseña nueva. */
export const restaurarPasswordEmpleado = (empleado_id: Id) =>
  callContratistas<{ enviado: boolean; email: string }>("restaurar_password_empleado", { empleado_id }, EMP);
