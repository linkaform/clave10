import { getCatalogoEstados } from "@/lib/get-catalogos-estado";
import { errorMsj } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export const useCatalogoEstados = (account_id:number, isModalOpen:boolean) => {
  const { data: data, isLoading, error, isFetching, refetch } = useQuery<any>({
    queryKey: ["getCatalogoEstados"], 
    enabled: isModalOpen,
    queryFn: async () => {
        const data = await getCatalogoEstados(account_id); 
        const hasError= data.response.data.status_code

        if(hasError == 400|| hasError == 401){
            const textMsj = errorMsj(data.response.data) 
            throw new Error(`Error al obtener catalogo de estados. Error: ${textMsj?.text}`);
        }else{
            return data.response?.data
        }
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    data,
    isLoading,
    error,
    isFetching,
    refetch,
  };
};
