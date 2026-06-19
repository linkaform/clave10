import { ejecutarRecorrido } from "@/lib/create-incidencia-rondin";
import { useShiftStore } from "@/store/useShiftStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useEjecutarRecorrido = () => {
    const queryClient = useQueryClient();
    const {isLoading, setLoading} = useShiftStore();
  
      const ejecutarRecorridoMutation = useMutation({
        mutationFn: async ({ dag_id }: { dag_id: string }) => {
            const response = await ejecutarRecorrido(dag_id);
  
              if(response.response.data.status =="error"){
                  throw new Error(`Error al crear ejecutar recorrido, Error: ${response.response.data.message }`);
              }else{
                  return response.response?.data
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