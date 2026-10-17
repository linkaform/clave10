import { useQuery } from "@tanstack/react-query";
import { getCatIncidenciasPlano, TipoIncidenciaCatalogo } from "@/lib/incidencias";

export const useCatalogoIncidenciasPlano = (enabled: boolean) => {
  const { data, isLoading } = useQuery<TipoIncidenciaCatalogo[]>({
    queryKey: ["catIncidenciasPlano"],
    queryFn: getCatIncidenciasPlano,
    enabled,
    staleTime: 10 * 60 * 1000,
  });
  return { tiposIncidencia: data ?? [], isLoadingTipos: isLoading };
};
