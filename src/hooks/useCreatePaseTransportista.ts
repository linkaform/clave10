import { createPaseTransportista } from "@/services/endpoints";
import { errorMsj } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface PaseTransportistaResult {
  id: string;
  folio: string;
  created_at: number;
  updated_at: number;
  timezone: string;
}

export const useCreatePaseTransportista = () => {
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const data = await createPaseTransportista(payload);

      const hasError = !data?.success || data?.response?.data?.status_code >= 400;
      if (hasError) {
        const msg = errorMsj(data)?.text || "Error al crear el pase de transportista";
        throw new Error(msg);
      }

      return data?.response?.data?.json as PaseTransportistaResult;
    },
    onSuccess: (result) => {
      toast.success(`Pase creado correctamente. Folio: ${result?.folio}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Hubo un error al crear el pase de transportista.");
    },
  });
};
