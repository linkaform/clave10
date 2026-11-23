import { apiPost } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import type { ApiResponse } from "@/types/api";
import { handleMock } from "@/mocks/contratistas/handlers";

/**
 * Script de Sanic por defecto para las rutas de contratistas (módulo `accesos`).
 * Es provisional: cada tarea de back fija el script de su área (un script por
 * área) y su service lo pasa en `callContratistas`. Los tipos no cambian.
 */
export const CONTRATISTAS_SCRIPT = "contratistas_sdk.py";

/** Scripts ya fijados por su tarea de back. */
export const CONTRATISTAS_SCRIPTS = {
  /** ME-14 */
  contratos: "contratos_sdk.py",
  /** R-01 */
  relaciones: "relaciones_sdk.py",
  /** ME-15 */
  cumplimiento: "cumplimiento_sdk.py",
} as const;

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
  script: string = CONTRATISTAS_SCRIPT,
): Promise<T> {
  if (USE_CONTRATISTAS_MOCKS) {
    return handleMock<T>(option, params);
  }
  const data = await apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: script,
    option,
    ...params,
  });
  if (!data?.success || data.error) {
    throw new ContratistasError(data?.error || `Error en ${option}`);
  }
  return data.response?.data as T;
}
