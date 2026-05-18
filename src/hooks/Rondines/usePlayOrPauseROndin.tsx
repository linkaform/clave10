import { playOrPauseRondin } from "@/lib/create-incidencia-rondin";
import { useShiftStore } from "@/store/useShiftStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const usePlayOrPauseRondin = () => {
    const queryClient = useQueryClient();
    const {isLoading, setLoading} = useShiftStore();
  
      const playOrPauseRondinMutation = useMutation({
        mutationFn: async ({ paused, record_id }: { paused: boolean; record_id: string }) => {
            const response = await playOrPauseRondin( record_id, paused);
  
              if(response.response.data.status =="error"){
                const accion = paused ? "pausar" : "iniciar";
                  throw new Error(`Error al crear ${accion} rondin, Error: ${response.response.data.message }`);
              }else{
                  return response.response?.data
              }
          },
          onMutate: () => {
            setLoading(true);
          },
          onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["getListRecorridos"] });
            queryClient.invalidateQueries({ queryKey: ["getStatsRondines"] });
            queryClient.invalidateQueries({ queryKey: ["getRecorridoById"] });

            const accion = variables.paused ? "pausado" : "iniciado";
            toast.success(`Rondín ${accion} correctamente.`);
          },
          onError: (err: unknown, _variables) => {
            const accion = _variables.paused ? "pausar" : "inicar";
            toast.success(`Error al intentar ${accion} un rondin.`);
          },
          onSettled: () => {
            setLoading(false);
          },
        });

    return{
        playOrPauseRondinMutation,
        isLoading,
    }
}