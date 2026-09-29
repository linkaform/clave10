import { useQuery } from "@tanstack/react-query";
import { DireccionContacto, getCatalogDireccionesSdk } from "@/lib/areas-sdk";

// Direcciones del catálogo "contacto" para el selector de dirección de las áreas.
export const useCatalogDirecciones = () => {
  const { data, isLoading } = useQuery<DireccionContacto[]>({
    queryKey: ["catalogDirecciones"],
    queryFn: async () => {
      const result = await getCatalogDireccionesSdk();
      return result?.response?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return { direcciones: data ?? [], isLoadingDirecciones: isLoading };
};
