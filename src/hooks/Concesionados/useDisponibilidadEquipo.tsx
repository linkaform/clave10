import { useQuery } from "@tanstack/react-query";
import { revisarDisponibilidadArtConcesionado, ConcesionAbierta } from "@/lib/articulos-concesionados";

export interface DisponibilidadEquipo {
  disponible: boolean;
  concesionesAbiertas: ConcesionAbierta[];
}

export const useDisponibilidadEquipo = (location: string, nombreEquipo: string) => {
  const { data, isFetching, refetch } = useQuery<DisponibilidadEquipo>({
    queryKey: ["revisarDisponibilidadArtConcesionado", location, nombreEquipo],
    queryFn: async () => {
      const data = await revisarDisponibilidadArtConcesionado(location, nombreEquipo);
      const concesionesAbiertas = data.response?.data ?? [];
      return { disponible: concesionesAbiertas.length === 0, concesionesAbiertas };
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
