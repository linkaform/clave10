import { useQuery } from "@tanstack/react-query";
import { getIncidenciasPermisos } from "@/lib/incidencias";

// Permiso de borrar del usuario sobre la forma de incidencias (dueño de la cuenta
// o forma compartida con "Borrar registros"). Mientras carga o si falla, no se
// muestra Eliminar; el back vuelve a validar al borrar.
export const useIncidenciasPermisos = () => {
  const { data } = useQuery({
    queryKey: ["getIncidenciasPermisos"],
    queryFn: async () => {
      const response = await getIncidenciasPermisos();
      return response?.response?.data ?? {};
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  return { canDelete: data?.can_delete === true };
};
