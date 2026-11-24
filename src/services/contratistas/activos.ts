// Activos de Mi Empresa y mantenimientos (ME-08).
import type {
  Activo,
  ActivoInput,
  ActivosFiltros,
  AnalisisFotoActivo,
  Archivo,
  ConcesionActivo,
  EstatusMantenimiento,
  Id,
  Mantenimiento,
  MantenimientoInput,
  OpcionesActivo,
  Pagina,
} from "@/types/contratistas";
import { CONTRATISTAS_SCRIPTS, callContratistas } from "./client";

const SCRIPT = CONTRATISTAS_SCRIPTS.activos;

/** Áreas por ubicación y cascada de vehículos para el formulario. */
export const getOpcionesActivo = () => callContratistas<OpcionesActivo>("get_opciones_activo", {}, SCRIPT);

export const listActivos = (filtros: ActivosFiltros = {}) =>
  callContratistas<Pagina<Activo>>("list_activos", { ...filtros }, SCRIPT);

export const getActivo = (activo_id: Id) => callContratistas<Activo>("get_activo", { activo_id }, SCRIPT);

export const createActivo = (activo: ActivoInput) => callContratistas<Activo>("create_activo", { activo }, SCRIPT);

/** Al editar, "Asignado a" es obligatorio (salvo activo Inactivo). */
export const updateActivo = (activo_id: Id, cambios: Partial<ActivoInput>) =>
  callContratistas<Activo>("update_activo", { activo_id, cambios }, SCRIPT);

/** Inactivo = fuera de operación: queda No disponible y no se asigna. */
export const changeEstadoActivo = (activo_id: Id, estado: "Activo" | "Inactivo") =>
  callContratistas<Activo>("change_estado_activo", { activo_id, estado }, SCRIPT);

/** Solo sin concesiones ni mantenimientos abiertos (si no, 409). */
export const deleteActivo = (activo_id: Id) =>
  callContratistas<{ eliminado: Id; folio: string }>("delete_activo", { activo_id }, SCRIPT);

export const listConcesionesActivo = (activo_id: Id) =>
  callContratistas<ConcesionActivo[]>("list_concesiones_activo", { activo_id }, SCRIPT);

/** Foto JPG o PNG (≤ 10 MB) ya subida: identifica nombre, tipo, marca y modelo. */
export const analizarFotoActivo = (archivo: Archivo) =>
  callContratistas<AnalisisFotoActivo>("analizar_foto_activo", { archivo }, SCRIPT);

export const listMantenimientos = (activo_id: Id) =>
  callContratistas<Mantenimiento[]>("list_mantenimientos", { activo_id }, SCRIPT);

/** Sin id = alta (activo_id, asignado_id, prioridad y fecha_limite obligatorios). */
export const saveMantenimiento = (mantenimiento: MantenimientoInput, mantenimiento_id?: Id) =>
  callContratistas<Mantenimiento>("save_mantenimiento", { mantenimiento, mantenimiento_id }, SCRIPT);

/** Agrega un renglón al historial; Cerrada actualiza el último mantenimiento del activo. */
export const changeStatusMantenimiento = (
  mantenimiento_id: Id,
  estatus: EstatusMantenimiento,
  comentario = "",
  evidencias: Archivo[] = [],
) =>
  callContratistas<Mantenimiento>(
    "change_status_mantenimiento",
    { mantenimiento_id, estatus, comentario, evidencias },
    SCRIPT,
  );

export const deleteMantenimiento = (mantenimiento_id: Id) =>
  callContratistas<{ eliminado: Id }>("delete_mantenimiento", { mantenimiento_id }, SCRIPT);
