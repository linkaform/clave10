import { apiPost } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import type { ApiResponse } from "@/types/api";
import { handleMock } from "@/mocks/contratistas/handlers";

/**
 * Script de Sanic que expone las rutas de contratistas (módulo `accesos`).
 * Los nombres de script y de `option` son provisionales: los fija cada tarea
 * de back (R-01, ME-14, ME-15, CF-01…). Si cambian, solo se tocan aquí y en
 * los services; los tipos no cambian.
 */
export const CONTRATISTAS_SCRIPT = "contratistas_sdk.py";

/**
 * Mocks prendidos por defecto mientras no existe el back. Para pegarle al back
 * real: NEXT_PUBLIC_CONTRATISTAS_MOCKS=0 en .env.local.
 */
export const USE_CONTRATISTAS_MOCKS =
  process.env.NEXT_PUBLIC_CONTRATISTAS_MOCKS !== "0";

export class ContratistasError extends Error {}

/**
 * Llama una opción del back de contratistas y regresa `response.data` ya
 * tipado. Lanza `ContratistasError` si el back responde con error, para que
 * React Query lo trate como fallo.
 */
export async function callContratistas<T>(
  option: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  if (USE_CONTRATISTAS_MOCKS) {
    return handleMock<T>(option, params);
  }
  const data = await apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: CONTRATISTAS_SCRIPT,
    option,
    ...params,
  });
  if (!data?.success || data.error) {
    throw new ContratistasError(data?.error || `Error en ${option}`);
  }
  return data.response?.data as T;
}
