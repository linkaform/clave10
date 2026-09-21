import {
  MenuUser,
  MigrateLegacyMenusResult,
  ResyncPermissionsResult,
  getUserMenuItems,
  listMenuUsers,
  listUsersMissingMenuConfig,
  listUsersOnlyInLegacyAccesos,
  migrateLegacyMenus,
  resyncAllPermissions,
  saveUserMenuItems,
} from "@/services/menus-admin";
import { errorMsj } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const useMenuUsers = () => {
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: errorUsers,
  } = useQuery<MenuUser[]>({
    queryKey: ["menuAdminUsers"],
    queryFn: async () => {
      const data = await listMenuUsers();
      if (!data?.success) {
        throw new Error("Error al obtener los usuarios");
      }
      return Array.isArray(data.response?.data) ? data.response?.data : [];
    },
  });

  return { users: users ?? [], isLoadingUsers, errorUsers };
};

export const useUserMenuAssignment = (userIds: number[]) => {
  const queryClient = useQueryClient();
  const sortedIds = [...userIds].sort((a, b) => a - b);
  const queryKey = ["userMenuAssignment", sortedIds.join(",")];

  const {
    data: assignedKeys,
    isLoading: isLoadingAssignedKeys,
    error: errorAssignedKeys,
  } = useQuery<string[]>({
    queryKey,
    enabled: sortedIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(sortedIds.map((id) => getUserMenuItems(id)));
      const keySet = new Set<string>();
      for (const data of results) {
        if (!data?.success) {
          throw new Error("Error al obtener los menús asignados");
        }
        for (const key of data.response?.data?.item_keys ?? []) {
          keySet.add(key);
        }
      }
      return Array.from(keySet);
    },
  });

  const saveAssignmentMutation = useMutation({
    mutationFn: async (itemKeys: string[]) => {
      if (!sortedIds.length) throw new Error("Selecciona al menos un usuario primero");
      const responses = await Promise.all(
        sortedIds.map((id) => saveUserMenuItems(id, itemKeys)),
      );
      for (const response of responses) {
        const statusCode = response?.response?.data?.status_code;
        if (statusCode && statusCode >= 400) {
          const textMsj = errorMsj(response.response?.data);
          throw new Error(textMsj?.text || "Error al guardar la asignación");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Asignación de menús guardada correctamente.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Hubo un error al guardar la asignación.");
    },
  });

  return {
    assignedKeys: assignedKeys ?? [],
    isLoadingAssignedKeys,
    errorAssignedKeys,
    saveAssignmentMutation,
  };
};

export const useResyncAllPermissions = () => {
  // mutation.isPending no sirve para animar el boton: el mutationFn no
  // espera la respuesta real (fire-and-forget, ver abajo) asi que se pone
  // en false casi de inmediato aunque la corrida siga minutos en el
  // backend. isRunning se mantiene en true hasta que la promesa de fondo
  // de verdad resuelve (llegue respuesta o truene por timeout).
  const [isRunning, setIsRunning] = useState(false);

  const resyncMutation = useMutation({
    mutationFn: async () => {
      // No se espera la respuesta: en cuentas con muchos usuarios la corrida
      // completa puede tardar varios minutos y el proxy/gateway corta la
      // conexión antes de que llegue la respuesta (se ve como error de CORS
      // en consola aunque el backend siga corriendo y sí termine). Se dispara
      // la petición y se sigue en segundo plano; si sí llega la respuesta a
      // tiempo, se muestra el resultado real -- si no, se queda solo el aviso.
      setIsRunning(true);
      resyncAllPermissions()
        .then((response) => {
          if (!response?.success) {
            console.warn("resync_all_permissions: respuesta sin exito", response);
            return;
          }
          const data = response.response?.data as ResyncPermissionsResult | undefined;
          const skippedCount = data?.skipped?.length ?? 0;
          const skippedMsj = skippedCount
            ? ` (${skippedCount} omitido${skippedCount === 1 ? "" : "s"}, ver consola)`
            : "";
          if (skippedCount) {
            console.warn("resync_all_permissions: registros omitidos", data?.skipped);
          }
          toast.success(
            `Permisos resincronizados: ${data?.updated ?? 0} de ${data?.total ?? 0} usuarios${skippedMsj}.`,
          );
        })
        .catch((err: Error) => {
          console.warn(
            "resync_all_permissions: no se pudo confirmar el resultado (probable timeout de gateway en cuentas con muchos usuarios, el backend puede haber terminado igual)",
            err,
          );
        })
        .finally(() => setIsRunning(false));
    },
    onSuccess: () => {
      toast.message("Resincronizando permisos en segundo plano...", {
        description:
          "Puede tardar varios minutos según la cantidad de usuarios. Los cambios se reflejan solos, sin necesidad de dejar esta pantalla abierta.",
      });
    },
  });

  return { resyncMutation, isRunning };
};

export const useMigrateLegacyMenus = () => {
  const queryClient = useQueryClient();
  // Igual que en useResyncAllPermissions: mutation.isPending no dura lo
  // que tarda la migracion real (fire-and-forget), asi que se rastrea por
  // separado para poder animar el boton mientras de verdad sigue corriendo.
  const [isRunning, setIsRunning] = useState(false);

  const migrateMutation = useMutation({
    mutationFn: async (userIds: number[]) => {
      // Mismo patron fire-and-forget que resync_all_permissions: no se
      // espera la respuesta por si el lote es grande y choca con el
      // timeout del gateway. Al terminar (llegue o no la respuesta) se
      // refresca el diagnostico para reflejar el estado real.
      setIsRunning(true);
      migrateLegacyMenus(userIds, false)
        .then((response) => {
          if (!response?.success) {
            console.warn("migrate_legacy_menus: respuesta sin exito", response);
            return;
          }
          const data = response.response?.data as MigrateLegacyMenusResult[] | undefined;
          const results = data ?? [];
          const failed = results.filter(
            (r) => r.action === "error" || (r.status_code && r.status_code >= 400),
          );
          const okCount = results.length - failed.length;
          if (failed.length) {
            console.warn("migrate_legacy_menus: usuarios con error", failed);
          }
          toast.success(
            `Migración completada: ${okCount} de ${results.length} usuarios${
              failed.length ? ` (${failed.length} con error, ver consola)` : ""
            }.`,
          );
        })
        .catch((err: Error) => {
          console.warn(
            "migrate_legacy_menus: no se pudo confirmar el resultado (probable timeout de gateway, el backend puede haber terminado igual)",
            err,
          );
        })
        .finally(() => {
          setIsRunning(false);
          queryClient.invalidateQueries({ queryKey: ["menuAdminUsersOnlyLegacyAccesos"] });
          queryClient.invalidateQueries({ queryKey: ["menuAdminUsersMissingConfig"] });
        });
    },
    onSuccess: () => {
      toast.message("Migrando usuarios legacy en segundo plano...", {
        description:
          "Puede tardar según la cantidad de usuarios. La lista se actualiza sola al terminar.",
      });
    },
  });

  return { migrateMutation, isRunning };
};

export const useMenuConfigDiagnostics = () => {
  const {
    data: missingConfig,
    isLoading: isLoadingMissingConfig,
    isFetching: isFetchingMissingConfig,
    error: errorMissingConfig,
    refetch: refetchMissingConfig,
  } = useQuery<MenuUser[]>({
    queryKey: ["menuAdminUsersMissingConfig"],
    queryFn: async () => {
      const data = await listUsersMissingMenuConfig();
      if (!data?.success) {
        throw new Error("Error al obtener los usuarios sin configuración");
      }
      return Array.isArray(data.response?.data) ? data.response?.data : [];
    },
  });

  const {
    data: onlyLegacy,
    isLoading: isLoadingOnlyLegacy,
    isFetching: isFetchingOnlyLegacy,
    error: errorOnlyLegacy,
    refetch: refetchOnlyLegacy,
  } = useQuery<MenuUser[]>({
    queryKey: ["menuAdminUsersOnlyLegacyAccesos"],
    queryFn: async () => {
      const data = await listUsersOnlyInLegacyAccesos();
      if (!data?.success) {
        throw new Error("Error al obtener los usuarios solo en Configuración Accesos");
      }
      return Array.isArray(data.response?.data) ? data.response?.data : [];
    },
  });

  return {
    missingConfig: missingConfig ?? [],
    isLoadingMissingConfig,
    isFetchingMissingConfig,
    errorMissingConfig,
    refetchMissingConfig,
    onlyLegacy: onlyLegacy ?? [],
    isLoadingOnlyLegacy,
    isFetchingOnlyLegacy,
    errorOnlyLegacy,
    refetchOnlyLegacy,
  };
};
