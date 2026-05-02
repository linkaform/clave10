import { getListBitacoraRondines } from "@/lib/create-incidencia-rondin";
import { errorMsj } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

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
  offset: number
) => {
  const { data: listRondines, isLoading: isLoadingListRondines, error: errorListRondines } =
    useQuery<BitacoraRondin[]>({
      queryKey: ["getListRondines", date1, date2, limit, offset],
      enabled: enableList,
      queryFn: async () => {
        const data = await getListBitacoraRondines(date1, date2, limit, offset);
        const textMsj = errorMsj(data);
        if (textMsj) {
          throw new Error(`Error al obtener lista de rondines, Error: ${data.error}`);
        }
        const result = data.response?.data?.data;
        return Array.isArray(result) ? result : [];
      },
    });

  return {
    listRondines,
    isLoadingListRondines,
    errorListRondines,
  };
};