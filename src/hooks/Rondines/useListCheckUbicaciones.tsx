import { getListCheckUbicaciones } from "@/lib/get-all-checks";
import { errorMsj } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export const useGetListCheckUbicaciones = (
  enableList: boolean,
  ubicacion?: string,
  nombreRondin?: string,
) => {
  const { data: listCheckUbicaciones, isLoading: isLoadingListCheckUbicaciones, error: errorListCheckUbicaciones } = useQuery({
    queryKey: ["getListCheckUbicaciones", ubicacion, nombreRondin],
    enabled: enableList,
    queryFn: async () => {
      const data = await getListCheckUbicaciones(ubicacion ?? "Planta Monterrey", nombreRondin);
      const textMsj = errorMsj(data);
      if (textMsj) {
        throw new Error(`Error al obtener lista de check ubicaciones, Error: ${data.error}`);
      } else {
        const result = data.response?.data?.data;
        console.log("RESULs", result)
        return Array.isArray(result) ? result : [];
      }
    },
  });

  return {
    listCheckUbicaciones,
    isLoadingListCheckUbicaciones,
    errorListCheckUbicaciones,
    
  };
};