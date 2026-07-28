import { getChecksByAreaSdk } from "@/lib/areas-sdk";
import { errorMsj } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export interface AreaCheckRondinInfo {
  id: string;
  folio: string;
  ubicacion: string;
  nombre_recorrido: string;
  asignado_a: string;
  tipo_rondin: string;
  fecha_hora_programada_inicio: string;
  fecha_hora_inicio: string;
  estatus_recorrido: string;
  duracion_rondin: string;
  comentario_general: string;
  porcentaje_avance: string;
  cantidad_areas_inspeccionadas: string;
}

export interface AreaCheckIncidencia {
  categoria?: string;
  subcategoria?: string;
  incidencia?: string;
  incidente_accion?: string;
}

export interface AreaCheckEvidencia {
  file_url?: string;
  thumbnail_url?: string;
}

export interface AreaCheckItem {
  id: string;
  folio: string;
  created_at: string;
  updated_at: string;
  url_rondin: string;
  url_inspeccion: string;
  rondin_area: string[];
  area_tag_id: string;
  tipo_de_area: string[];
  incidente_location: string[];
  check_status: string;
  comentario_check_area: string;
  foto_evidencia_area: AreaCheckEvidencia[];
  foto_area: any[];
  fecha_inspeccion_area: string;
  grupo_incidencias_check: AreaCheckIncidencia[];
  rondin: Partial<AreaCheckRondinInfo>;
}

const WINDOW_DAYS = 360;

const isoDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

// Trae una ventana amplia (360 días) en una sola llamada -- los KPIs
// (30/60/120/360 días), la búsqueda y el orden se calculan en el cliente
// sobre este mismo set, sin ir de nuevo al backend por cada interacción.
export const useAreaChecks = (ubicacion: string, area: string) => {
  const { data, isLoading: isLoadingChecks } = useQuery<{
    checks: AreaCheckItem[];
    total: number;
  }>({
    queryKey: ["areaChecks", ubicacion, area],
    enabled: Boolean(ubicacion && area),
    queryFn: async () => {
      const data = await getChecksByAreaSdk(ubicacion, area, isoDateDaysAgo(WINDOW_DAYS), undefined, 500);
      const textMsj = errorMsj(data);
      if (textMsj) {
        throw new Error(`Error al obtener los checks del área, Error: ${data.error}`);
      }
      return {
        checks: data.response?.data?.data ?? [],
        total: data.response?.data?.total ?? 0,
      };
    },
  });

  return {
    checks: data?.checks ?? [],
    total: data?.total ?? 0,
    isLoadingChecks,
  };
};
