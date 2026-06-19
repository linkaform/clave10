import { catalogoGrupoRecorridos } from "@/lib/rondines";
import { errorMsj } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export const useCatalogoGrupos= (isModalOpen:boolean) => {
  const { data: data, isLoading, error, isFetching, refetch } = useQuery<any>({
    queryKey: ["catalogoGruposRecorridos"], 
    enabled:isModalOpen ? true:false,
    queryFn: async () => {
        const response = await catalogoGrupoRecorridos(); 
         const hasError =!response?.success || response?.response?.data?.status_code === 400;
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al crear seguimiento, Error: ${textMsj?.text}`);
      } else {
        return response.response?.data;
      }
    },
  });

  return {
    data,
    isLoading,
    error,
    isFetching,
    refetch,
  };
};
