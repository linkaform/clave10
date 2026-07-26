import { getAreaByIdSdk } from "@/lib/areas-sdk";
import { errorMsj } from "@/lib/utils";
import { AreaRow } from "@/lib/areas";
import { useQuery } from "@tanstack/react-query";

export const useGetAreaById = (record_id: string) => {
  const { data, isLoading: isLoadingArea } = useQuery<AreaRow | null>({
    queryKey: ["getAreaById", record_id],
    enabled: record_id ? true : false,
    queryFn: async () => {
      const data = await getAreaByIdSdk(record_id);
      const textMsj = errorMsj(data);
      if (textMsj) {
        throw new Error(`Error al obtener el área, Error: ${data.error}`);
      }
      return data.response?.data ?? null;
    },
  });

  return {
    area: data,
    isLoadingArea,
  };
};
