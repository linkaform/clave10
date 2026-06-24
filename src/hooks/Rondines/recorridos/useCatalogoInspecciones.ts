import { catalogoInspeccionesRecorridos } from "@/lib/rondines";
import { errorMsj } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export const useCatalogoInspeccionesRecorridos = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalogoInspeccionesRecorridos"],
    queryFn: async () => {
      const response = await catalogoInspeccionesRecorridos();
      const hasError = (!response?.success) || (response?.response?.data?.status_code === 400);
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al obtener catálogo de inspecciones, Error: ${textMsj?.text}`);
      }
      return response.response?.data ?? [];
    },
  });

  return {
    data,
    isLoading,
    isError,
  };
};