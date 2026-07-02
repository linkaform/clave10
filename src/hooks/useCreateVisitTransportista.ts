import { createVisitTransportista } from "@/services/endpoints";
import { errorMsj } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface VisitTransportistaResult {
  id: string;
  folio: string;
  created_at: number;
  updated_at: number;
  timezone: string;
}

export const useCreateVisitTransportista = () => {
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const data = await createVisitTransportista(payload);

      const hasError = !data?.success || data?.response?.data?.status_code >= 400;
      if (hasError) {
        const msg = errorMsj(data)?.text || "Error al registrar la visita de transportista";
        throw new Error(msg);
      }

      return data?.response?.data?.json as VisitTransportistaResult;
    },
    onSuccess: (result) => {
      toast.success(`Visita registrada correctamente. Folio: ${result?.folio}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Hubo un error al registrar la visita de transportista.");
    },
  });
};
