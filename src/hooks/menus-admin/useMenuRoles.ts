import {
  MenuRol,
  listMenuRoles,
  saveRolMenuItems,
} from "@/services/menus-admin";
import { errorMsj } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const QUERY_KEY = ["menuAdminRoles"];

/**
 * Roles con sus menús y usuarios (2611-1649). Guardar un rol solo cambia el
 * rol; pasarlo a los usuarios es aparte (Reaplicar).
 */
export const useMenuRoles = (enabled = true) => {
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error } = useQuery<MenuRol[]>({
    queryKey: QUERY_KEY,
    enabled,
    refetchOnWindowFocus: false,
    // El error típico es "falta instalar la forma": reintentar solo retrasa el aviso.
    retry: false,
    queryFn: async () => {
      const res = await listMenuRoles();
      const payload = res?.response?.data as
        MenuRol[] | { error?: string } | undefined;
      if (!res?.success) throw new Error("Error al obtener los roles");
      if (payload && !Array.isArray(payload) && payload.error)
        throw new Error(payload.error);
      return Array.isArray(payload) ? payload : [];
    },
  });

  const saveRolMutation = useMutation({
    mutationFn: async ({ rol, keys }: { rol: string; keys: string[] }) => {
      const res = await saveRolMenuItems(rol, keys);
      const body = res?.response?.data;
      const statusCode = body?.status_code;
      if (!res?.success || body?.error || (statusCode && statusCode >= 400)) {
        throw new Error(
          body?.error || errorMsj(body)?.text || "No se pudo guardar el rol",
        );
      }
    },
    onSuccess: (_, { rol }) => toast.success(`Menús del rol ${rol} guardados.`),
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return { roles: data ?? [], isLoading, isFetching, error, saveRolMutation };
};
