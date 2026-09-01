import { crearArticuloCon, editarArticuloCon, getListArticulosCon, InputArticuloCon, InputOutArticuloCon } from "@/lib/articulos-concesionados";
import { errorMsj } from "@/lib/utils";
import { useShiftStore } from "@/store/useShiftStore";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useArticulosConcesionados = (location:string, area:string, status:string, enableList:boolean, date1:string, date2:string, filterDate:string, limit:number = 25, skip:number = 0, locations:string[] = [], search:string = "", searchFields:string[] = []) => {
    const queryClient = useQueryClient();
    const {isLoading, setLoading} = useShiftStore();

    //Obtener lista de ArtículosCon
    const {data: listArticulosCon, isLoading:isLoadingQuery, isFetching, error:errorListArticulosCon } = useQuery<any>({
        queryKey: ["getListArticulosCon",location, area, status, date1, date2, filterDate, limit, skip, locations, search, searchFields],
        enabled:enableList,
        // Al elegir campos en "Buscar en" sin haber escrito nada, la query
        // queda enabled:false (ver puedeBuscarCon en articulos/page.tsx) y
        // además cambia de queryKey (search/searchFields) — sin esto, el
        // listado se vaciaría en vez de seguir mostrando lo que ya había.
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const data = await getListArticulosCon(location, area, status, date1, date2, filterDate, limit, skip, locations, search, searchFields);
            const textMsj = errorMsj(data)
            if (textMsj){
              throw new Error (`Error al obtener lista de artículos concesionados, Error: ${data.error}`);
            }else {
              return data.response?.data ?? { records: [], total_records: 0, total_pages: 1, actual_page: 1, records_on_page: 0 };
            }
        },

    });

     //Crear ArtículoConcesionado
     const createArticulosConMutation = useMutation({
        mutationFn: async ({ data_article} : { data_article: InputArticuloCon }) => {
            const response = await crearArticuloCon(data_article);
            const hasError = (!response?.success) || (response?.response?.data?.status_code === 400 )
            if (hasError) {
                const textMsj = errorMsj(response)
                throw new Error(`Error al crear seguimiento, Error: ${textMsj?.text}`);
            } else {
                return response.response?.data
            }
        },
        onMutate: () => {
          setLoading(true);
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getListArticulosCon"] });
          queryClient.invalidateQueries({ queryKey: ["getStatsArticulos"] });
          toast.success("Artículo creado creado correctamente.");
        },
        onError: (err) => {
          console.error("Error al crear el artículo concesionado:", err);
          toast.error(err.message || "Hubo un error al crear el artículo concesionado.");
    
        },
        onSettled: () => {
          setLoading(false);
        },
      });

      //Editar artículo concesionado
     const editarArticulosConMutation = useMutation({
        mutationFn: async ({ data_article_update, folio} : { data_article_update: InputArticuloCon | InputOutArticuloCon, folio:string }) => {
            const response = await editarArticuloCon(data_article_update, folio);
            const hasError= response.response.data.status_code

            if(hasError == 400|| hasError == 401){
                const textMsj = errorMsj(response.response.data) 
                throw new Error(`Error al editar artículo concesionado, Error: ${textMsj?.text}`);
            }else{
                return response.response?.data
            }
        },
        onMutate: () => {
          setLoading(true);
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getListArticulosCon"] });
          queryClient.invalidateQueries({ queryKey: ["getStatsArticulos"] });
          toast.success("Artículo concesionado editado correctamente.");
        },
        onError: (err) => {
          console.error("Error al editar el artículo concesionado:", err);
          toast.error(err.message || "Hubo un error al editar el artículo concesionado.");
    
        },
        onSettled: () => {
          setLoading(false);
        },
      });

    return{
        //Lista de ArticulosCon
        listArticulosCon,
        // isFetching cubre también los refetch en segundo plano que
        // placeholderData/keepPreviousData deja pasar como isLoading:false
        // (para no dejar la pantalla en blanco) — sin esto, el loader
        // desaparecía al cambiar de campos de búsqueda.
        isLoadingListArticulosCon: isLoadingQuery || isFetching,
        errorListArticulosCon,
        //Crear ArticulosCon
        createArticulosConMutation,
        isLoading,
        //Editar ArticulosCon
        editarArticulosConMutation,
    }
}