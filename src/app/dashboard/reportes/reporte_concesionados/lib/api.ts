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
import { useEffect } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
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

// Copia de la última respuesta en el navegador, para que desde la segunda visita el reporte salga
// al instante y se actualice en segundo plano. Se guarda una sola (la última ubicación pedida),
// ligada al usuario. Cerrar sesión borra el localStorage, así que se va con él. Si el navegador no
// deja guardar (modo privado, sin espacio), el reporte funciona igual, solo sin la copia.
const COPIA = "c10-concesionados-copia";
type Copia = { usuario: string; ubicaciones: string; at: number; data: PrestamoRaw[] };

const usuarioActual = () => localStorage.getItem("userId_soter") || localStorage.getItem("user_id") || "";
const llaveUbicaciones = (u: string[]) => [...u].sort().join("|");

const leerCopia = (ubicaciones: string[]): Copia | null => {
  try {
    const c = JSON.parse(localStorage.getItem(COPIA) || "null") as Copia | null;
    if (!c || !Array.isArray(c.data) || c.usuario !== usuarioActual() || c.ubicaciones !== llaveUbicaciones(ubicaciones)) return null;
    return c;
  } catch {
    return null;
  }
};

const guardarCopia = (ubicaciones: string[], data: PrestamoRaw[]) => {
  try {
    const c: Copia = { usuario: usuarioActual(), ubicaciones: llaveUbicaciones(ubicaciones), at: Date.now(), data };
    localStorage.setItem(COPIA, JSON.stringify(c));
  } catch {
    // sin espacio o sin permiso: no pasa nada, solo no queda la copia
  }
};

// Cómo se pide (mismos criterios que asistencias, hooks/useAsistenciasReport.ts):
//   - isLoading: todavía no hay nada (primera vez, sin copia) → la página enseña el esqueleto
//   - isFetching con datos: se está actualizando (copia del navegador, o cambió la ubicación);
//     keepPreviousData deja los datos anteriores en pantalla mientras llegan los nuevos
//   - staleTime 5 min / gcTime 30 min: no se vuelve a pedir al regresar al reporte en ese tiempo
//   - sin refetchOnWindowFocus: no se vuelve a pedir todo solo por regresar a la pestaña
//   - retry 1: si falla, un reintento y luego el mensaje de error con "Reintentar"
export const useReporteConcesionados = (params: ReporteParams) => {
  const queryKey = ["reporteConcesionados", params.desde, params.hasta, params.ubicaciones];
  const qc = useQueryClient();
  const { data, isLoading, isFetching, error, refetch } = useQuery<PrestamoRaw[]>({
    queryKey,
    queryFn: async () => {
      const data = await getReporteConcesionados(params);
      guardarCopia(params.ubicaciones, data);
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // La copia se pone después de montar (no al pintar) para que el HTML del servidor y el del
  // navegador coincidan. La petición ya va en camino y, al llegar, reemplaza la copia.
  const ubicaciones = llaveUbicaciones(params.ubicaciones);
  useEffect(() => {
    if (qc.getQueryData(queryKey) !== undefined) return;
    const c = leerCopia(params.ubicaciones);
    if (c) qc.setQueryData(queryKey, c.data, { updatedAt: c.at });
    // queryKey se arma con estos mismos valores
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, params.desde, params.hasta, ubicaciones]);

  return { raw: data ?? [], hayDatos: data !== undefined, isLoading, isFetching, error, refetch };
};
