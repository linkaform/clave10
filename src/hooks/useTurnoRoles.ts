import { useCatalogoRoles } from "@/hooks/useGetRoles";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";

// Fallback estático: se usa únicamente si tanto el localStorage (roles del
// usuario, ver useAreasLocationStore) como el catálogo real (useCatalogoRoles)
// vienen vacíos, para no dejar el selector sin opciones utilizables.
const ROLES_FALLBACK = [
  { value: "gerente", label: "Gerente" },
  { value: "guardia_de_caseta_acceso", label: "Guardia de CasetaAcceso" },
  { value: "jefe_de_seguridad", label: "Jefe de Seguridad" },
  { value: "mantenimiento_electrico", label: "Mantenimiento Eléctrico" },
  { value: "monitorista", label: "Monitorista" },
  { value: "supervisor_de_mantenimiento", label: "Supervisor de Mantenimiento" },
  { value: "supervisor_de_seguridad", label: "Supervisor de Seguridad" },
  { value: "auditor_calidad", label: "Auditor Calidad" },
  { value: "guardia_de_acceso", label: "Guardia de Acceso" },
  { value: "guardia_de_patio", label: "Guardia de Patio" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "mantenimiento_mecanico", label: "Mantenimiento Mecánico" },
  { value: "rondinero", label: "Rondinero" },
  { value: "guardia", label: "Guardia" },
  { value: "guardia_de_inspeccion", label: "Guardia de Inspeccion" },
  { value: "jefe_de_turno", label: "Jefe de Turno" },
  { value: "mantenimiento_general", label: "Mantenimiento General" },
  { value: "produccion", label: "Produccion" },
  { value: "supervisor_de_produccion", label: "Supervisor de Producción" },
  { value: "supervisor_ehs", label: "Supervisor EHS" },
];

// El fallback estático es genérico para todas las cuentas y no está atado a
// ningún permiso real, así que nunca debe ofrecer roles de administración
// como opción por default. Esto NO aplica a los roles reales del usuario
// (localStorage o catálogo), que sí reflejan lo que un admin capturó a propósito.
const esRolAdministrativo = (valor: string) => /admin/i.test(valor);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const excluirRolesAdministrativos = (roles: any[]) =>
  roles.filter((rol) => {
    const texto =
      typeof rol === "string"
        ? rol
        : `${rol?.value ?? ""} ${rol?.label ?? rol?.nombre ?? ""}`;
    return !esRolAdministrativo(texto);
  });

/**
 * Roles disponibles para iniciar/cerrar turno.
 * Prioridad: roles del usuario en localStorage (useAreasLocationStore, viene
 * de catalogos_pase_location) > catálogo de turnos (useCatalogoRoles) > fallback estático.
 */
export const useTurnoRoles = (open: boolean, accountId: number | null) => {
  const { roles: rolesStorage } = useAreasLocationStore();
  const tieneRolesStorage = rolesStorage.length > 0;

  const { data: dataRoles, isLoading: loadingCatalogo } = useCatalogoRoles(
    open && !tieneRolesStorage,
    accountId,
  );

  const rolesDisponibles = tieneRolesStorage
    ? rolesStorage
    : dataRoles && dataRoles.length > 0
      ? dataRoles
      : excluirRolesAdministrativos(ROLES_FALLBACK);

  return {
    rolesDisponibles,
    isLoading: tieneRolesStorage ? false : loadingCatalogo,
  };
};
