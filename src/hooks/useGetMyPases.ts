/* eslint-disable @typescript-eslint/no-explicit-any */
import { getMyPases } from "@/lib/get-my-pases";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseGetMyPasesProps {
  limit?: number;
  skip?: number;
  searchName?: string;
  tab?: string;
  location?: string;
  dynamicFilters?: Record<string, string | string[]>;
  dateFilter?: string;
  date1?: Date | "";
  date2?: Date | "";
}

export const useGetMyPases = ({
  limit,
  skip,
  searchName,
  tab = "Todos",
  location = "",
  dynamicFilters = {},
  dateFilter = "",
  date1 = "",
  date2 = "",
}: UseGetMyPasesProps) => {
  const {
    data: data,
    isLoading,
    error,
    isFetching,
  } = useQuery<any>({
    queryKey: ["getMyPases", tab, limit, skip, searchName, location, dynamicFilters, dateFilter, date1, date2],
    queryFn: async () => {
      const data = await getMyPases({ tab, limit, skip, searchName, location, dynamicFilters, dateFilter, date1, date2 });
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
