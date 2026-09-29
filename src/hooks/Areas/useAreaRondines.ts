import { getRondinesByAreaSdk } from "@/lib/areas-sdk";
import { errorMsj } from "@/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface AreaRondinItem {
  record_id: string;
  // record_id de la configuración del recorrido (lo que abre ver-recorrido).
  recorrido_id: string;
  folio: string;
  nombre_recorrido: string;
  ubicacion: string;
  asignado_a: string;
  estatus_rondin: string;
  fecha_programacion: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface AreaRondinesPage {
  records: AreaRondinItem[];
  total_records: number;
  total_pages: number;
  actual_page: number;
  records_on_page: number;
}

const EMPTY_PAGE: AreaRondinesPage = {
  records: [],
  total_records: 0,
  total_pages: 1,
  actual_page: 1,
  records_on_page: 0,
};

export const useAreaRondines = (areaId: string, limit: number = 5, skip: number = 0) => {
  const { data, isLoading, isFetching } = useQuery<AreaRondinesPage>({
    queryKey: ["areaRondines", areaId, limit, skip],
    enabled: Boolean(areaId),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const data = await getRondinesByAreaSdk(areaId, limit, skip);
      const textMsj = errorMsj(data);
      if (textMsj) {
        throw new Error(`Error al obtener los rondines del área, Error: ${data.error}`);
      }
      return data.response?.data ?? EMPTY_PAGE;
    },
  });

  return {
    rondines: data ?? EMPTY_PAGE,
    isLoadingRondines: isLoading,
    isFetchingRondines: isFetching,
  };
};
