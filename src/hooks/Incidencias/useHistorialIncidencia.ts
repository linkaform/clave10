import { getHistorialIncidencia, EventoHistorialIncidencia } from "@/lib/incidencias";
import { useQuery } from "@tanstack/react-query";

// Se invalida con ["getHistorialIncidencia"] después de cada guardado de la incidencia.
export const useHistorialIncidencia = (recordId: string, enabled: boolean) => {
  const { data, isLoading, isFetching } = useQuery<EventoHistorialIncidencia[]>({
    queryKey: ["getHistorialIncidencia", recordId],
    queryFn: () => getHistorialIncidencia(recordId),
    enabled: enabled && !!recordId,
  });

  return { historial: data ?? [], isLoading, isFetching };
};
