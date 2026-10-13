import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContactoSdk,
  createUbicacionSdk,
  updateUbicacionSdk,
  UbicacionFormData,
  UbicacionUpdateData,
} from "@/lib/ubicaciones-sdk";
import { errorMsj } from "@/lib/utils";

export const useUbicacionActions = () => {
  const queryClient = useQueryClient();

  // Regresa el record_id de la ubicación creada (para abrir su panel), o
  // false si no se creó.
  const handleCreateUbicacion = async (data: UbicacionFormData): Promise<{ recordId: string } | false> => {
    try {
      const result = await createUbicacionSdk(data);
      const textMsj = errorMsj(result);
      if (textMsj) {
        toast.error(`Error al crear la ubicación: ${textMsj.text}`);
        return false;
      }
      // create_new_ubicacion regresa None si ya existe una con ese nombre.
      const created = result?.response?.data;
      if (!created) {
        toast.error("Ya existe una ubicación con ese nombre.");
        return false;
      }
      toast.success("Ubicación creada correctamente.");
      queryClient.invalidateQueries({ queryKey: ["ubicacionesCatalog"] });
      return { recordId: created.json?.id ?? created.id ?? "" };
    } catch (err) {
      console.error("Error al crear ubicación:", err);
      toast.error("Error inesperado al crear la ubicación.");
      return false;
    }
  };

  const handleUpdateUbicacion = async (recordId: string, data: UbicacionUpdateData) => {
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

  // Regresa el nombre del contacto creado (para preseleccionarlo), o false.
  const handleCreateContacto = async (data: UbicacionFormData): Promise<string | false> => {
    try {
      const result = await createContactoSdk(data);
      const textMsj = errorMsj(result);
      if (textMsj) {
        toast.error(`Error al crear el contacto: ${textMsj.text}`);
        return false;
      }
      toast.success("Contacto creado correctamente.");
      // El selector de dirección (useCatalogDirecciones) vuelve a pedir el catálogo.
      await queryClient.invalidateQueries({ queryKey: ["catalogDirecciones"] });
      return result?.response?.data?.nombre_direccion ?? data.nombre ?? "";
    } catch (err) {
      console.error("Error al crear contacto:", err);
      toast.error("Error inesperado al crear el contacto.");
      return false;
    }
  };

  return { handleCreateUbicacion, handleUpdateUbicacion, handleCreateContacto };
};
