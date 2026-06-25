import { ejecutarRecorrido } from "@/lib/create-incidencia-rondin";
import { errorMsj } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useEjecutarRecorrido = () => {
    const queryClient = useQueryClient();
  
      const ejecutarRecorridoMutation = useMutation({
        mutationFn: async ({ dag_id }: { dag_id: string }) => {
            const response = await ejecutarRecorrido(dag_id);
            const hasError =
                  !response?.success || response?.response?.data?.status_code === 400;
                if (hasError) {
                  const textMsj = errorMsj(response);
                  throw new Error(`Error al ejecutar rondin, Error: ${textMsj?.text}`);
                } else {
                  return response.response?.data;
                }
          },
          onMutate: () => {
          },
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getListRecorridos"] });
            queryClient.invalidateQueries({ queryKey: ["getStatsRondines"] });
            queryClient.invalidateQueries({ queryKey: ["getRondinById"] });

            toast.success(`Rondín ejecutado correctamente.`);
          },
          onError: () => {
            toast.success(`Error al intentar ejecutare el recorrido.`);
          },
          onSettled: () => {
          },
        });

    return{
        ejecutarRecorridoMutation,
        isLoading: ejecutarRecorridoMutation.isPending,
    }
}