import { getPlantillasImpresionQrSdk } from "@/lib/areas-sdk";
import { errorMsj } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export interface PlantillaImpresionQr {
  id: number | string;
  nombre: string;
}

/**
 * Plantillas PDF de la forma Impresión de QR en la cuenta del usuario. Los ids
 * son por cuenta, por eso se piden al back en lugar de fijarlos en el front.
 */
export const usePlantillasImpresionQr = (enabled: boolean = true) => {
  const { data, isLoading } = useQuery<PlantillaImpresionQr[]>({
    queryKey: ["plantillasImpresionQr"],
    enabled,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const result = await getPlantillasImpresionQrSdk();
      if (errorMsj(result)) return [];
      const lista = result?.response?.data;
      return Array.isArray(lista) ? lista : [];
    },
  });

  return { plantillas: data ?? [], isLoadingPlantillas: isLoading };
};
