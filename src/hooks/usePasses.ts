import { useQuery } from "@tanstack/react-query";
import { fetchPasesActivos } from "@/lib/access";

export const usePasses = (location: string | null, area?: string) => {

  const {
    data,
    isLoading: isLoadingPasses,
    error,
    isFetching,
    refetch,
  } = useQuery<any>({
    enabled: !!location, 
    queryKey: ["getActivePasses", location, area],
    queryFn: async () => {
      if (!location) return []; 
      const data = await fetchPasesActivos({ location, area });
      return Array.isArray(data.response?.data)
        ? data.response.data
        : [];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnReconnect: true,
  });

  return {
    data,
    isLoadingPasses,
    error,
    isFetching,
    refetch,
  };
};
