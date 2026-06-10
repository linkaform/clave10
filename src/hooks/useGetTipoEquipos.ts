import { getEquiposParams, getEquipos } from "@/lib/get-vehiculos";
import { useQuery } from "@tanstack/react-query";

export const useGetTipoEquipos = ({ account_id, isModalOpen }: getEquiposParams) => {
  const { data, isLoading, error, isFetching, refetch } = useQuery<any>({
    queryKey: ["useGetEquipos", account_id],
    enabled: isModalOpen && !!account_id,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const data = await getEquipos({ account_id });
      return data.response?.data || [];
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