import { getConfSeguridad } from "@/lib/get-configuracion-seguridad";
import { useQuery } from "@tanstack/react-query";

export const useGetConfSeguridad = (location:string[], account_id?: number) => {
  const { data: data, isLoading, error, isFetching, refetch } = useQuery<any>({
    queryKey: ["getConfSeguridad", location, account_id],
    enabled: location?true:false,
    queryFn: async () => {
<<<<<<< HEAD
        const data = await getConfSeguridad(location);
        return data.response?.data || [];
=======
        const data = await getConfSeguridad(location, account_id);
        return data.response?.data.requerimientos || [];
>>>>>>> develop
    },
  });

  return {
    data,
    isLoading,
    error,
    isFetching,
    refetch
  };
};
