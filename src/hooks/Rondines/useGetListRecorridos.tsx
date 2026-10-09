import { getListRecorridos, getListBitacoraRondines } from "@/lib/rondines";
import { errorMsj } from "@/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SearchFacet } from "@/components/common/FacetSearch";

// Con facets (aunque sea []), el listado viene paginado del back
// ({records, total_records...}); sin facets, la lista de siempre.
export const useGetListRecorridos = (enableList:boolean, date1:string, date2:string, limit:number, offset:number, facets?: SearchFacet[]) => {

    const {data: listRecorridos, isLoading:isLoadingListRecorridos, isFetching:isFetchingListRecorridos, error:errorListRecorridos} = useQuery<any>({
        queryKey: ["getListRecorridos", date1, date2, limit, offset, facets],
        enabled:enableList,
        // conserva la pagina anterior mientras llega la siguiente (sin parpadeo)
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const data = await getListRecorridos(date1, date2, limit, offset, facets);
            const textMsj = errorMsj(data) 
            if (textMsj){
              throw new Error (`Error al obtener lista de rondines, Error: ${data.error}`);
            }else {

              if (facets) return data.response?.data ?? { records: [], total_records: 0 };
              const res = Array.isArray(data.response?.data)? data.response?.data : [];
              return res ?? [];
            }
        },
    });

    return{
        listRecorridos,
        isLoadingListRecorridos,
        isFetchingListRecorridos,
        errorListRecorridos,
    }
}
export interface BitacoraRondin {
  id: string;
  folio: string;
  created_at: string;
  updated_at: string;
  ubicacion: string;
  nombre_recorrido: string;
  asignado_a: string;
  tipo_rondin: string;
  fecha_hora_programada_inicio: string;
  fecha_hora_inicio: string;
  estatus_recorrido: string;
  duracion_rondin: string | number;
  motivo_cancelacion: string;
  comentario_general: string;
  comentarios_generales: any[];
  porcentaje_avance: string | number;
  cantidad_areas_inspeccionadas: string | number;
  total_checks: number;
  areas: {
    area: string;
    detalle: {
      area: string;
      checks_mes: any[];
      fotos: { file_name: string; file_url: string }[];
      hora_de_check: string;
      ubicacion: string;
      tiempo_traslado: string | number;
      comentarios: string;
      incidencias: any[];
    };
  }[];
  incidencias: any[];
}

export const useGetListRondines = (
  enableList: boolean,
  date1: string,
  date2: string,
  limit: number,
  offset: number,
  locations: string[] = [],
  facets?: SearchFacet[],
) => {
  const { data, isLoading: isLoadingListRondines, isFetching: isFetchingListRondines, error: errorListRondines } =
    useQuery<{ records: BitacoraRondin[]; total: number }>({
      queryKey: ["getListRondines", date1, date2, limit, offset, locations, facets],
      enabled: enableList,
      // conserva la pagina anterior mientras llega la siguiente (sin parpadeo)
      placeholderData: keepPreviousData,
      queryFn: async () => {
        const data = await getListBitacoraRondines(date1, date2, limit, offset, locations, facets);
        const textMsj = errorMsj(data);
        if (textMsj) {
          throw new Error(`Error al obtener lista de rondines, Error: ${data.error}`);
        }
        const result = data.response?.data?.data;
        const records = Array.isArray(result) ? result : [];
        // total_records solo viene con facets (buscador avanzado).
        return { records, total: data.response?.data?.total_records ?? records.length };
      },
    });
  const listRondines = data?.records;

  return {
    listRondines,
    totalRondines: data?.total ?? 0,
    isLoadingListRondines,
    isFetchingListRondines,
    errorListRondines,
  };
};
