import { editarRondin, InputEditarRondinCompleto } from "@/lib/rondines";
import { errorMsj } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useEditarRondin = () => {
    const queryClient = useQueryClient();
    
     const editarRondinMutation = useMutation({
        mutationFn: async ({folio, rondin_data} : { folio:string, rondin_data: InputEditarRondinCompleto }) => {
            const response = await editarRondin(folio, rondin_data);
            const hasError= response.response.data.status_code

            if(hasError == 400|| hasError == 401){
                const textMsj = errorMsj(response.response.data) 
                throw new Error(`Error al editar rondin Error: ${textMsj?.text}`);
            }else{
                return response.response?.data
            }
        },
        onMutate: () => {
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getListRondines"] });
          queryClient.invalidateQueries({ queryKey: ["getStatsRondines"] });
          toast.success("Rondin editado correctamente.");
        },
        onError: (err) => {
          console.error("Error al editar rondin", err);
          toast.error(err.message || "Hubo un error al editar rondin");
    
        },
        onSettled: () => {
        },
      });


    return{
        editarRondinMutation,
        isLoading:editarRondinMutation.isPending,
    }
}