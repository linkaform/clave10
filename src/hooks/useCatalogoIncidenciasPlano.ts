import { useQuery } from "@tanstack/react-query";
import { getCatIncidenciasPlano, TipoIncidenciaCatalogo } from "@/lib/incidencias";

// Catálogo de tipos de incidencia completo (cambia poco: se guarda 10 min).
export const useCatalogoIncidenciasPlano = (enabled: boolean) => {
  const { data, isLoading } = useQuery<TipoIncidenciaCatalogo[]>({
    queryKey: ["catIncidenciasPlano"],
    queryFn: getCatIncidenciasPlano,
    enabled,
    staleTime: 10 * 60 * 1000,
  });
  return { tiposIncidencia: data ?? [], isLoadingTipos: isLoading };
};
