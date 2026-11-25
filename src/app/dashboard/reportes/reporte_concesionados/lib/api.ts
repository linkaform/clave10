// Conexión al back del reporte de artículos concesionados.
//
// Script reporte_concesionados_sdk.py (lkf-sanic-apps), opción get_prestamos. La lógica está en
// lkf-sanic-apps/addons/accesos/service.py → get_reporte_concesionados: regresa PrestamoRaw[]
// (ver lib/core.ts), una fila por UNIDAD prestada, incluyendo las que salieron antes de `desde`
// y seguían prestadas en el rango. Los agrupados y gráficas se calculan aquí en el front.
//
// Campos que se agregaron a la forma de concesión (121735) para el reporte. El back del
// reporte ya los lee; los registros viejos los traen vacíos y se usa el respaldo indicado:
//   - plazo 6afeb86f7ac0963b3cc0a414 (detalle del catálogo Equipo) y fecha límite
//     6afec078bd8d0a8795b09bec, en "Equipos en Préstamo". Sin plazo guardado: el actual del
//     catálogo; sin ninguno: 24 h (core.ts → plazoDe)
//   - empresa 6afebfb2212240c549ff9872 y guardia que entrega 6afebfb2212240c549ff9873, en el
//     primer nivel. Sin guardia: quien capturó el registro
//   - recibió 6afec2f16b7ce990218fe1e3, en "Devoluciones de Equipo". Sin dato: "Devolución forzada por"
//   - condición: se quedan los 3 estados de la forma, Completo/Dañado/Perdido → Bien/Dañado/No regresó
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "@/lib/login/get-valid-token";
import { PrestamoRaw } from "./core";

export type ReporteParams = { desde: string; hasta: string; ubicaciones: string[] };

export const getReporteConcesionados = async ({ desde, hasta, ubicaciones }: ReporteParams): Promise<PrestamoRaw[]> => {
  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${userJwt}` },
    body: JSON.stringify({
      script_name: "reporte_concesionados_sdk.py",
      option: "get_prestamos",
      date_from: desde,
      date_to: hasta,
      locations: ubicaciones,
    }),
  });
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    throw new Error(String(data?.error?.msg?.[0] ?? data?.error ?? "No se pudo cargar el reporte"));
  }
  return data?.response?.data ?? [];
};

export const useReporteConcesionados = (params: ReporteParams) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery<PrestamoRaw[]>({
    refetchOnWindowFocus: false,
    queryKey: ["reporteConcesionados", params.desde, params.hasta, params.ubicaciones],
    queryFn: () => getReporteConcesionados(params),
  });
  return { raw: data ?? [], isLoading, isFetching, error, refetch };
};
