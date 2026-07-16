import { runOcrEquipo, runOcrId, runOcrPaquete, runOcrPersona, runOcrTruck, runOcrVehiculo } from "@/lib/ocr";
import { errorMsj } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useOcr = (accountId?: number) => {

  const ocrIdMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      const response = await runOcrId(imageUrls, accountId);
      const hasError = (!response?.success) || (response?.response?.data?.status_code === 400);
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al procesar identificación, Error: ${textMsj?.text}`);
      }
      return response.response?.data;
    },
    onError: (err) => {
      toast.error(err.message || "Error al procesar identificación.");
    },
  });

  const ocrPaqueteMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      const response = await runOcrPaquete(imageUrls);
      const hasError = (!response?.success) || (response?.response?.data?.status_code === 400);
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al procesar paquete, Error: ${textMsj?.text}`);
      }
      return response.response?.data;
    },
    onError: (err) => {
      toast.error(err.message || "Error al procesar paquete.");
    },
  });

  const ocrTruckMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      const response = await runOcrTruck(imageUrls);
      const hasError = (!response?.success) || (response?.response?.data?.status_code === 400);
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al procesar vehículo, Error: ${textMsj?.text}`);
      }
      return response.response?.data;
    },
    onError: (err) => {
      toast.error(err.message || "Error al procesar vehículo.");
    },
  });

  const ocrVehiculoMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      const response = await runOcrVehiculo(imageUrls);
      const hasError = (!response?.success) || (response?.response?.data?.status_code === 400);
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al procesar vehículo, Error: ${textMsj?.text}`);
      }
      return response.response?.data;
    },
    onError: (err) => {
      toast.error(err.message || "Error al procesar vehículo.");
    },
  });
  
    const ocrEquipoMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      const response = await runOcrEquipo(imageUrls);
      const hasError = (!response?.success) || (response?.response?.data?.status_code === 400);
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al procesar vehículo, Error: ${textMsj?.text}`);
      }
      return response.response?.data;
    },
    onError: (err) => {
      toast.error(err.message || "Error al procesar vehículo.");
    },
  });

    const ocrPersonaMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      const response = await runOcrPersona(imageUrls, accountId);
      const hasError = (!response?.success) || (response?.response?.data?.status_code === 400);
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al procesar vehículo, Error: ${textMsj?.text}`);
      }
      return response.response?.data;
    },
    onError: (err) => {
      toast.error(err.message || "Error al procesar vehículo.");
    },
  });



  return {
    ocrIdMutation,
    ocrPaqueteMutation,
    ocrTruckMutation,
    ocrVehiculoMutation,
    ocrEquipoMutation,
    ocrPersonaMutation
  };
};