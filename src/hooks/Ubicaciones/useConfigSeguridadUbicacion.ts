import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConfigSeguridadUbicacionSdk,
  updateConfigSeguridadUbicacionSdk,
} from "@/lib/ubicaciones-sdk";
import {
  ConfigSeguridadUbicacion,
  ConfigSeguridadUbicacionRow,
  normalizeConfigSeguridad,
} from "@/lib/ubicaciones";
import { errorMsj, requisitoAplicaA } from "@/lib/utils";
import { useMenuStore } from "@/store/useGetMenuStore";

// Query compartida entre la pestaña y el prefetch del panel de la ubicación.
export const configSeguridadUbicacionQuery = (ubicacion: string) => ({
  queryKey: ["configSeguridadUbicacion", ubicacion],
  queryFn: async (): Promise<ConfigSeguridadUbicacion> => {
    const res = await getConfigSeguridadUbicacionSdk(ubicacion);
    const textMsj = errorMsj(res);
    if (textMsj) {
      throw new Error(`Error al obtener las opciones avanzadas de ${ubicacion}: ${textMsj.text}`);
    }
    // null = la ubicación todavía no tiene fila; se muestra vacía y al
    // guardar el back la crea.
    return normalizeConfigSeguridad(res.response?.data as ConfigSeguridadUbicacionRow | null);
  },
});

export const useConfigSeguridadUbicacion = (ubicacion: string) => {
  const queryClient = useQueryClient();
  // Mientras llega la fila fresca se muestra lo que ya trae el menú en
  // localStorage (get_config_accesos -> requisitos). Es parcial y puede estar
  // viejo: solo sirve para no abrir la pestaña vacía; no se edita ni se guarda
  // sobre ello (isPlaceholderData).
  const grupoRequisitos = useMenuStore((state) => state.grupoRequisitos);
  const enCache = grupoRequisitos?.find((requisito) => requisitoAplicaA(requisito.ubicacion, ubicacion));

  const { data, isLoading, isPlaceholderData, error } = useQuery<ConfigSeguridadUbicacion>({
    ...configSeguridadUbicacionQuery(ubicacion),
    enabled: Boolean(ubicacion),
    placeholderData: enCache
      ? normalizeConfigSeguridad(enCache as unknown as ConfigSeguridadUbicacionRow)
      : undefined,
  });

  const handleUpdateConfig = async (cambios: Partial<ConfigSeguridadUbicacion>) => {
    try {
      const result = await updateConfigSeguridadUbicacionSdk(ubicacion, cambios);
      const textMsj = errorMsj(result);
      if (textMsj) {
        toast.error(`Error al guardar las opciones avanzadas: ${textMsj.text}`);
        return false;
      }
      toast.success("Opciones avanzadas guardadas correctamente.");
      await queryClient.invalidateQueries({ queryKey: ["configSeguridadUbicacion", ubicacion] });
      return true;
    } catch (err) {
      console.error("Error al guardar opciones avanzadas:", err);
      toast.error("Error inesperado al guardar las opciones avanzadas.");
      return false;
    }
  };

  return { config: data, isLoading, isPlaceholderData, error, handleUpdateConfig };
};
