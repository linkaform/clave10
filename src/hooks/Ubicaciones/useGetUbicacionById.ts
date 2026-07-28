import { getUbicacionByIdSdk } from "@/lib/ubicaciones-sdk";
import { errorMsj } from "@/lib/utils";
import { UbicacionRow } from "@/lib/ubicaciones";
import { useQuery } from "@tanstack/react-query";

export const useGetUbicacionById = (record_id: string) => {
  const { data, isLoading: isLoadingUbicacion } = useQuery<UbicacionRow | null>({
    queryKey: ["getUbicacionById", record_id],
    enabled: record_id ? true : false,
    queryFn: async () => {
      const data = await getUbicacionByIdSdk(record_id);
      const textMsj = errorMsj(data);
      if (textMsj) {
        throw new Error(`Error al obtener la ubicación, Error: ${data.error}`);
      }
      return data.response?.data ?? null;
    },
  });

  return {
    ubicacion: data,
    isLoadingUbicacion,
  };
};
