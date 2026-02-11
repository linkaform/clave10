import { getTipoArticulo } from "@/lib/articulos-perdidos";
import { errorMsj } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCatalogoArticulos = (tipo: string, isModalOpen: boolean) => {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["getTipoArticulo", tipo],
    enabled: isModalOpen,
    queryFn: async () => {
      const data = await getTipoArticulo(tipo); 
      const textMsj = errorMsj(data);
      
      if (textMsj) {
        toast.error(`Error al obtener catálogo de artículos, Error: ${data.error}`);
        return [];
      } else {
        return data?.response?.data ?? [];
      }
    },
    refetchOnWindowFocus: true,
  });

  return {
    data,
    isLoading,
    error,
  };
};