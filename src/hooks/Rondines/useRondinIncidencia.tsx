import { crearIncidenciaRondin, getListIncidenciasRondin, IncidenciasRondinSearch } from "@/lib/create-incidencia-rondin";
import { useShiftStore } from "@/store/useShiftStore";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Con search: {records, total_records...} paginado por incidencia; sin él, la lista de siempre.
export const useIncidenciaRondin = (location:string, area:string, search?: IncidenciasRondinSearch) => {

    const queryClient = useQueryClient();
    const {isLoading, setLoading} = useShiftStore();
        
    const {data: listIncidenciasRondin, isLoading:isLoadingQuery, isFetching, isPlaceholderData} = useQuery<any>({
        queryKey: ["getListIncidenciasRondin",location, area, search],
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            const data = await getListIncidenciasRondin(location, area, search);
            return data?.response?.data; 
        },
    });
   
      const playOrPauseRondinMutation =useMutation({
        mutationFn: async (rondin_data: any) => {
              const response = await crearIncidenciaRondin(rondin_data);
  
              if(response.response.data.status =="error"){
                  throw new Error(`Error al crear iniciar/pausar rondin, Error: ${response.response.data.message }`);
              }else{
                  return response.response?.data
              }
          },
          onMutate: () => {
            setLoading(true);
          },
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getListRondines"] });
            queryClient.invalidateQueries({ queryKey: ["getStatsRondines"] });
            toast.success("Acción realizada correctamente.");
          },
          onError: (err) => {
            console.error("Error al crear incidencia rondin", err);
            toast.error(err.message || "Hubo un error al iniciar/pausar rondin.");
      
          },
          onSettled: () => {
            setLoading(false);
          },
        });

        

    return{
        playOrPauseRondinMutation,
        isLoading,
        // Cargando = datos nuevos (cambió búsqueda, filtro o página).
        isLoadingListIncidencias: isLoadingQuery || (isFetching && isPlaceholderData),
        listIncidenciasRondin
    }
}