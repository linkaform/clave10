import { crearArticuloCon, editarArticuloCon, getListArticulosCon, InputArticuloCon, InputOutArticuloCon } from "@/lib/articulos-concesionados";
import { errorMsj } from "@/lib/utils";
import { useShiftStore } from "@/store/useShiftStore";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SearchFacet } from "@/components/common/FacetSearch";

export const useArticulosConcesionados = (location:string, area:string, status:string, enableList:boolean, date1:string, date2:string, filterDate:string, limit:number = 25, skip:number = 0, locations:string[] = [], facets:SearchFacet[] = []) => {
    const queryClient = useQueryClient();
    const {isLoading, setLoading} = useShiftStore();

    //Obtener lista de ArtículosCon
    const {data: listArticulosCon, isLoading:isLoadingQuery, isFetching, isPlaceholderData, error:errorListArticulosCon } = useQuery<any>({
        queryKey: ["getListArticulosCon",location, area, status, date1, date2, filterDate, limit, skip, locations, facets],
        enabled:enableList,
        // Al cambiar los filtros del buscador cambia el queryKey; sin esto el
        // listado se vaciaría mientras llega la respuesta nueva.
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const data = await getListArticulosCon(location, area, status, date1, date2, filterDate, limit, skip, locations, facets);
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
        // Cargando = se están pidiendo datos NUEVOS (cambió búsqueda, filtro o
        // página): keepPreviousData los marca como placeholder mientras llegan.
        // Los refetch en segundo plano de la misma consulta (p.ej. al volver a
        // la pestaña) no cuentan, para no tapar la vista con el esqueleto.
        isLoadingListArticulosCon: isLoadingQuery || (isFetching && isPlaceholderData),
        errorListArticulosCon,
        //Crear ArticulosCon
        createArticulosConMutation,
        isLoading,
        //Editar ArticulosCon
        editarArticulosConMutation,
    }
}