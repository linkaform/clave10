import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { updateFullAreaSdk, UpdateFullAreaData } from "@/lib/areas-sdk";
import { errorMsj } from "@/lib/utils";

export const useUpdateArea = () => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateArea = async (data: UpdateFullAreaData) => {
    setIsUpdating(true);
    try {
      const result = await updateFullAreaSdk(data);
      const textMsj = errorMsj(result);
      if (textMsj) {
        toast.error(`Error al editar el área: ${textMsj.text}`);
        return false;
      }
      toast.success("Área actualizada correctamente.");
      // Igual que al crear: se descartan las páginas del catálogo en caché y
      // se vuelve a pedir el detalle del área editada.
      queryClient.removeQueries({ queryKey: ["areasCatalog"], type: "inactive" });
      queryClient.invalidateQueries({ queryKey: ["areasCatalog"] });
      queryClient.invalidateQueries({ queryKey: ["getAreaById", data.record_id] });
      return true;
    } catch (err) {
      console.error("Error al editar área:", err);
      toast.error("Error inesperado al editar el área.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return { handleUpdateArea, isUpdating };
};
