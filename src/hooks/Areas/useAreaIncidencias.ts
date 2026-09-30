import { getIncidenciasByAreaSdk } from "@/lib/areas-sdk";
import { errorMsj } from "@/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

// Mismo shape que format_incidencias_rondines en el back. `id` es el
// record_id del rondín, así que varias incidencias pueden compartirlo;
// `ref_number` las distingue dentro del mismo rondín.
export interface AreaIncidenciaItem {
  id: string;
  folio: string;
  ref_number: number;
  ubicacion_incidente: string;
  area_incidente: string;
  nombre_del_recorrido: string;
  fecha_hora_incidente: string;
  categoria: string;
  subcategoria: string;
  incidente: string;
  accion_tomada: string;
  comentarios: string;
  evidencias: { file_name: string; file_url: string }[];
  documentos: { file_name: string; file_url: string }[];
  link: string;
}

export interface AreaIncidenciasPage {
  records: AreaIncidenciaItem[];
  total_records: number;
  total_pages: number;
  actual_page: number;
  records_on_page: number;
}

const EMPTY_PAGE: AreaIncidenciasPage = {
  records: [],
  total_records: 0,
  total_pages: 1,
  actual_page: 1,
  records_on_page: 0,
};

export const useAreaIncidencias = (areaId: string, limit: number = 5, skip: number = 0) => {
  const { data, isLoading, isFetching } = useQuery<AreaIncidenciasPage>({
    queryKey: ["areaIncidencias", areaId, limit, skip],
    enabled: Boolean(areaId),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const data = await getIncidenciasByAreaSdk(areaId, limit, skip);
      const textMsj = errorMsj(data);
      if (textMsj) {
        throw new Error(`Error al obtener las incidencias del área, Error: ${data.error}`);
      }
      return data.response?.data ?? EMPTY_PAGE;
    },
  });

  return {
    incidencias: data ?? EMPTY_PAGE,
    isLoadingIncidencias: isLoading,
    isFetchingIncidencias: isFetching,
  };
};
