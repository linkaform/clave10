import { actualizarInspeccion } from "@/lib/rondines";
import { errorMsj } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useActualizarInspeccion = () => {
  const queryClient = useQueryClient();
  
  const actualizarInspeccionMutation = useMutation({
    mutationFn: async ({ folio, rondin_data }: { folio: string; rondin_data: any }) => {
      const response = await actualizarInspeccion(folio, rondin_data);
      const hasError =
        !response?.success || response?.response?.data?.status_code === 400;
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al actualizar inspección, Error: ${textMsj?.text}`);
      } else {
        return response.response?.data;
      }
    },
    onMutate: () => {
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getListRondines"] });
      queryClient.invalidateQueries({ queryKey: ["getStatsRondines"] });
      queryClient.invalidateQueries({ queryKey: ["getRondinById"] });
      toast.success("Inspección actualizada correctamente.");
    },
    onError: () => {
      toast.error("Error al intentar actualizar la inspección.");
    },
    onSettled: () => {
    },
  });

  return {
    actualizarInspeccionMutation,
    isLoading:actualizarInspeccionMutation.isPending,
  };
};