import { editarAreasRondin } from "@/lib/rondines";
import { errorMsj } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useEditAreasRondin = () => {
    const queryClient = useQueryClient();
  
      const editAreasRodindMutation = useMutation({
        mutationFn: async ({ areas, record_id, folio }: { areas:any, record_id:string, folio:string}) => {
            const response = await editarAreasRondin( areas, record_id, folio);
            const hasError = (!response?.success) || (response?.response?.data?.status_code === 400 )
            if (hasError) {
                const textMsj = errorMsj(response)
                throw new Error(`Error al intentar editar las areas, Error: ${textMsj?.text}`);
            } else {
                return response.response?.data
            }
          },
          onMutate: () => {
          },
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getListRondines"] });
            queryClient.invalidateQueries({ queryKey: ["getStatsRondines"] });
            queryClient.invalidateQueries({ queryKey: ["getRondinById"] });

                      
            toast.success("Áreas editadas correctamente.", {
              style: {
                background: "#16a34a", 
                color: "#fff",
              },
            
            });
          },
          onError: () => {
            toast.success(`Error al intentar editar las areas.`,{ style: {
              background: "#dc2626", 
              color: "#fff",
            },});
          },
          onSettled: () => {
          },
        });

    return{
        editAreasRodindMutation,
        isLoading:editAreasRodindMutation.isPending,
    }
}