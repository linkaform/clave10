import { getStats } from "@/lib/get-stats";
import { useQuery } from "@tanstack/react-query";

export const useGetStats = (
  enable: boolean,
  location: string | string[],
  area: string,
  page: string,
  month?: number,
  year?: number,
  dateFrom?: string,
  dateTo?: string,
  filterDate?: string,
  dynamicFilters?: { key: string; value: string }[],
) => {
  const { data, isLoading, error, isFetching, refetch } = useQuery<any>({
    queryKey: ["getStats", location, area, page, month, year, dateFrom, dateTo, filterDate, dynamicFilters],
    enabled: enable,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const data = await getStats(location, area, page, month, year, dateFrom, dateTo, filterDate, dynamicFilters);
      return data.response?.data;
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


