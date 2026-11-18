// Conexión al back del reporte de artículos concesionados.
//
// TODO(back): todavía no existe el endpoint. Mientras tanto se devuelve una lista vacía y el
// reporte muestra sus estados "sin datos". Al conectarlo:
//   1. Crear un script `*_sdk.py` en lkf-sanic-apps (no tocar addons) que reciba
//      { desde, hasta, ubicaciones } y devuelva PrestamoRaw[] (ver lib/core.ts): una fila por
//      artículo prestado, incluyendo los que salieron ANTES de `desde` y siguen abiertos.
//   2. Reemplazar el cuerpo de getReporteConcesionados por el fetch a API_ENDPOINTS.runScript
//      (mismo patrón que reportes/endpoints/asistenciasReport.ts).
//   3. Huecos de datos por confirmar con el equipo: plazo por categoría (PLAZOS en core.ts),
//      unidad, empresa del solicitante, guardia que prestó/cerró, condiciones de devolución
//      (la forma tiene completo/dañado/perdido; el diseño usa Bien/Dañado/Roto/Incompleto/No regresó).
import { useQuery } from "@tanstack/react-query";
import { PrestamoRaw } from "./core";

export type ReporteParams = { desde: string; hasta: string; ubicaciones: string[] };

export const getReporteConcesionados = async (params: ReporteParams): Promise<PrestamoRaw[]> => {
  void params;
  return [];
};

export const useReporteConcesionados = (params: ReporteParams) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery<PrestamoRaw[]>({
    queryKey: ["reporteConcesionados", params.desde, params.hasta, params.ubicaciones],
    queryFn: () => getReporteConcesionados(params),
  });
  return { raw: data ?? [], isLoading, isFetching, error, refetch };
};
