import {
  MenuUser,
  getUserMenuItems,
  listMenuUsers,
  saveUserMenuItems,
} from "@/services/menus-admin";
import { errorMsj } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
