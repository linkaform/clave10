import { useQuery } from "@tanstack/react-query";
import { checkDisponibilidadEquipo, DisponibilidadEquipo } from "@/lib/articulos-concesionados";

export const useDisponibilidadEquipo = (location: string, nombreEquipo: string) => {
  const { data, isFetching, refetch } = useQuery<DisponibilidadEquipo>({
    queryKey: ["checkDisponibilidadEquipo", location, nombreEquipo],
    queryFn: async () => {
      const data = await checkDisponibilidadEquipo(location, nombreEquipo);
      return data.response?.data ?? { disponible: true };
    },
    enabled: false,
    staleTime: 0,
  });

  return {
    disponibilidad: data,
    isCheckingDisponibilidad: isFetching,
    checkDisponibilidad: refetch,
  };
};
