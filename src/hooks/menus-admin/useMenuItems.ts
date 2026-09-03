import {
  MenuItemAdmin,
  deleteMenuItem,
  listMenuItems,
  replaceMenuCatalog,
  saveMenuItemsBatch,
} from "@/services/menus-admin";
import { errorMsj } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useMenuItems = () => {
  const queryClient = useQueryClient();

  const {
    data: menuItems,
    isLoading: isLoadingMenuItems,
    error: errorMenuItems,
  } = useQuery<MenuItemAdmin[]>({
    queryKey: ["menuItemsAdmin"],
    queryFn: async () => {
      const data = await listMenuItems();
      if (!data?.success) {
        throw new Error("Error al obtener el catálogo de menús");
      }
      return Array.isArray(data.response?.data) ? data.response?.data : [];
    },
  });

  const saveBoardMutation = useMutation({
    mutationFn: async ({
      rows,
      deletedIds,
    }: {
      rows: MenuItemAdmin[];
      deletedIds: string[];
    }) => {
      if (deletedIds.length) {
        await Promise.all(deletedIds.map((id) => deleteMenuItem(id)));
      }
      if (rows.length) {
        const response = await saveMenuItemsBatch(rows);
        const statusCode = response?.response?.data?.status_code;
        if (statusCode === 400 || statusCode === 401) {
          const textMsj = errorMsj(response.response?.data);
          throw new Error(textMsj?.text || "Error al guardar los cambios del catálogo");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItemsAdmin"] });
      toast.success("Cambios guardados correctamente.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Hubo un error al guardar los cambios.");
    },
  });

  const replaceCatalogMutation = useMutation({
    mutationFn: async (items: MenuItemAdmin[]) => {
      const response = await replaceMenuCatalog(items);
      const statusCode = response?.response?.data?.status_code;
      if (statusCode === 400 || statusCode === 401) {
        const textMsj = errorMsj(response.response?.data);
        throw new Error(textMsj?.text || "Error al importar el catálogo");
      }
      return response?.response?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItemsAdmin"] });
      toast.success("Catálogo importado correctamente.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Hubo un error al importar el catálogo.");
    },
  });

  return {
    menuItems: menuItems ?? [],
    isLoadingMenuItems,
    errorMenuItems,
    saveBoardMutation,
    replaceCatalogMutation,
  };
};
