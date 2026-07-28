import { getFallasByAreaSdk } from "@/lib/areas-sdk";
import { errorMsj } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export interface AreaFallaItem {
  folio: string;
  created_at: string;
  falla_estatus: string;
  falla_fecha_hora: string;
  falla_reporta_nombre: string;
  falla_reporta_departamento: string;
  falla_ubicacion: string;
  falla_caseta: string;
  falla: string;
  falla_objeto_afectado: string;
  falla_comentarios: string;
  falla_evidencia: any[];
  falla_documento: any[];
  falla_responsable_solucionar_nombre: string;
  falla_comentario_solucion: string;
  falla_folio_accion_correctiva: string;
  falla_grupo_seguimiento_formated: any[];
}

const WINDOW_DAYS = 360;

const isoDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export const useAreaFallas = (ubicacion: string, area: string, enabled: boolean = true) => {
  const { data, isLoading: isLoadingFallas } = useQuery<AreaFallaItem[]>({
    queryKey: ["areaFallas", ubicacion, area],
    enabled: Boolean(ubicacion && area) && enabled,
    queryFn: async () => {
      const data = await getFallasByAreaSdk(ubicacion, area, isoDateDaysAgo(WINDOW_DAYS), todayIso());
      const textMsj = errorMsj(data);
      if (textMsj) {
        throw new Error(`Error al obtener las fallas del área, Error: ${data.error}`);
      }
      return data.response?.data ?? [];
    },
  });

  return {
    fallas: data ?? [],
    isLoadingFallas,
  };
};
