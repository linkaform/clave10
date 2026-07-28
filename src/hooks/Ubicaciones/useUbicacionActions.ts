import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  createUbicacionSdk,
  updateUbicacionSdk,
  UbicacionFormData,
} from "@/lib/ubicaciones-sdk";
import { errorMsj } from "@/lib/utils";

export const useUbicacionActions = () => {
  const queryClient = useQueryClient();

  const handleCreateUbicacion = async (data: UbicacionFormData) => {
    try {
      const result = await createUbicacionSdk(data);
      const textMsj = errorMsj(result);
      if (textMsj) {
        toast.error(`Error al crear la ubicación: ${textMsj.text}`);
        return false;
      }
      toast.success("Ubicación creada correctamente.");
      queryClient.invalidateQueries({ queryKey: ["ubicacionesCatalog"] });
      return true;
    } catch (err) {
      console.error("Error al crear ubicación:", err);
      toast.error("Error inesperado al crear la ubicación.");
      return false;
    }
  };

  const handleUpdateUbicacion = async (recordId: string, data: UbicacionFormData) => {
    if (!recordId) {
      toast.error("Esta ubicación no tiene un registro válido.");
      return false;
    }
    try {
      const result = await updateUbicacionSdk(recordId, data);
      const textMsj = errorMsj(result);
      if (textMsj) {
        toast.error(`Error al actualizar la ubicación: ${textMsj.text}`);
        return false;
      }
      toast.success("Ubicación actualizada correctamente.");
      queryClient.invalidateQueries({ queryKey: ["ubicacionesCatalog"] });
      queryClient.invalidateQueries({ queryKey: ["getUbicacionById", recordId] });
      return true;
    } catch (err) {
      console.error("Error al actualizar ubicación:", err);
      toast.error("Error inesperado al actualizar la ubicación.");
      return false;
    }
  };

  return { handleCreateUbicacion, handleUpdateUbicacion };
};
