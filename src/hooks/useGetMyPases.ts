/* eslint-disable @typescript-eslint/no-explicit-any */
import { getMyPases } from "@/lib/get-my-pases";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseGetMyPasesProps {
  limit?: number;
  skip?: number;
  searchName?: string;
  tab?: string;
}

export const useGetMyPases = ({
  limit,
  skip,
  searchName,
  tab = "Todos",
}: UseGetMyPasesProps) => {
  const {
    data: data,
    isLoading,
    error,
    isFetching,
  } = useQuery<any>({
    queryKey: ["getMyPases", tab, limit, skip, searchName],
    queryFn: async () => {
      const data = await getMyPases({ tab, limit, skip, searchName });
      if (data?.error) {
        toast.error("Error al obtener pases");
      }
      return data.response?.data || [];
    },
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isLoading,
    error,
    isFetching,
  };
};
