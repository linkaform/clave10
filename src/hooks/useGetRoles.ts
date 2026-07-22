import { getCatalogoRoles } from "@/lib/get-roles";
import { useQuery } from "@tanstack/react-query";

export const useCatalogoRoles = (enabled = true, account_id: number) => {
  const { data, isLoading, error, isFetching, refetch } = useQuery<any[]>({
    queryKey: ["catalogoRoles", account_id],
    queryFn: async () => {
      if (!enabled) return [];
      const data = await getCatalogoRoles({ account_id });
      return data.response?.data;
    },
    enabled,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  return {
    data,
    isLoading,
    error,
    isFetching,
    refetch,
  };
};