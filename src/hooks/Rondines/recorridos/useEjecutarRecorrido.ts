import { ejecutarRecorrido } from "@/lib/create-incidencia-rondin";
import { errorMsj } from "@/lib/utils";
import { useShiftStore } from "@/store/useShiftStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useEjecutarRecorrido = () => {
    const queryClient = useQueryClient();
    const {isLoading, setLoading} = useShiftStore();
  
      const ejecutarRecorridoMutation = useMutation({
        mutationFn: async ({ dag_id }: { dag_id: string }) => {
            const response = await ejecutarRecorrido(dag_id);
            const hasError =
                  !response?.success || response?.response?.data?.status_code === 400;
                if (hasError) {
                  const textMsj = errorMsj(response);
                  throw new Error(`Error al crear seguimiento, Error: ${textMsj?.text}`);
                } else {
                  return response.response?.data;
                }
          },
          onMutate: () => {
            setLoading(true);
          },
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getListRecorridos"] });
            queryClient.invalidateQueries({ queryKey: ["getStatsRondines"] });
            queryClient.invalidateQueries({ queryKey: ["getRondinById"] });

            toast.success(`Rondín iniciado correctamente.`);
          },
          onError: () => {
            toast.success(`Error al intentar ejecutare el recorrido.`);
          },
          onSettled: () => {
            setLoading(false);
          },
        });

    return{
        ejecutarRecorridoMutation,
        isLoading,
    }
}