import { playOrPauseRondin } from "@/lib/create-incidencia-rondin";
import { errorMsj } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const usePlayOrPauseRondin = () => {
    const queryClient = useQueryClient();
  
      const playOrPauseRondinMutation = useMutation({
        mutationFn: async ({ paused, record_id }: { paused: boolean; record_id: string }) => {
            const response = await playOrPauseRondin( record_id, paused);
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
          },
          onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["getListRecorridos"] });
            queryClient.invalidateQueries({ queryKey: ["getStatsRondines"] });
            queryClient.invalidateQueries({ queryKey: ["getRondinById"] });
            queryClient.refetchQueries({ queryKey: ["getRondinById"] });

            const accion = variables.paused ? "pausado" : "iniciado";
            toast.success(`Rondín ${accion} correctamente.`);
          },
          onError: (err: unknown, _variables) => {
            const accion = _variables.paused ? "pausar" : "inicar";
            toast.success(`Error al intentar ${accion} un rondin.`);
          },
          onSettled: () => {
          },
        });

    return{
        playOrPauseRondinMutation,
        isLoading:playOrPauseRondinMutation.isPending,
    }
}