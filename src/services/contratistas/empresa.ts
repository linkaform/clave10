import type {
  EmpleadoContratista,
  EmpleadoInput,
  Empresa,
  EmpresaInput,
  Estatus,
  Id,
  ListParams,
  Pagina,
} from "@/types/contratistas";
import { callContratistas } from "./client";

/** Empresa activa del usuario ("Mi Empresa"); el back la resuelve del JWT. */
export const getMiEmpresa = () => callContratistas<Empresa>("get_mi_empresa");

export const updateMiEmpresa = (empresa: EmpresaInput) =>
  callContratistas<Empresa>("update_mi_empresa", { empresa });

/** Empresa de una contraparte (detalle de cliente/contratista, solo lectura). */
export const getEmpresa = (empresa_id: Id) =>
  callContratistas<Empresa>("get_empresa", { empresa_id });

export interface EmpleadosFiltros extends ListParams {
  /** Vacío = los de la empresa activa. */
  empresa_id?: Id;
  estatus?: Estatus;
  perfil_id?: Id;
}

export const listEmpleados = (filtros: EmpleadosFiltros = {}) =>
  callContratistas<Pagina<EmpleadoContratista>>("list_empleados", { ...filtros });

export const getEmpleado = (empleado_id: Id) =>
  callContratistas<EmpleadoContratista>("get_empleado", { empleado_id });

export const createEmpleado = (empleado: EmpleadoInput) =>
  callContratistas<EmpleadoContratista>("create_empleado", { empleado });

export const updateEmpleado = (empleado_id: Id, empleado: Partial<EmpleadoInput>) =>
  callContratistas<EmpleadoContratista>("update_empleado", { empleado_id, empleado });

export const vetarEmpleado = (empleado_id: Id, motivo: string) =>
  callContratistas<EmpleadoContratista>("vetar_empleado", { empleado_id, motivo });
