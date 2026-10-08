import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

// Llamadas para la pantalla "Logs de scripts" (Config). Mismo script-runner que
// el resto; el backend vive en lkf-sanic-apps (modulo Base, script_logs_sdk.py).

export interface ScriptLogFiltersState {
  /** "success" | "error" | "running" | "" */
  status: string;
  scriptIds: string[];
  userIds: string[];
  /** ISO 8601 (UTC) */
  dateFrom: string;
  dateTo: string;
  minDuration: string;
  maxDuration: string;
}

export const runScriptSdk = async (scriptName: string, payload: Record<string, any>) => {
  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify({ ...payload, script_name: scriptName }),
  });
  return response.json();
};

const runScript = (payload: Record<string, any>) => runScriptSdk("script_logs_sdk.py", payload);

export const getScriptLogsSdk = (
  filters: ScriptLogFiltersState,
  limit: number = 25,
  skip: number = 0,
) => {
  const runSuccess =
    filters.status === "error" ? false : filters.status === "success" ? true : undefined;
  // "success"/"error" son estados derivados de run_success; en Mongo el status real es running|done.
  const status = filters.status === "running" ? "running" : runSuccess !== undefined ? "done" : "";
  return runScript({
    option: "list_script_logs",
    limit,
    offset: skip,
    status,
    run_success: runSuccess,
    script_ids: filters.scriptIds,
    user_ids: filters.userIds,
    date1: filters.dateFrom,
    date2: filters.dateTo,
    min_duration: filters.minDuration,
    max_duration: filters.maxDuration,
  });
};

export const getScriptLogFiltersSdk = () => runScript({ option: "get_script_log_filters" });

export const getScriptLogContentSdk = (log_url: string) =>
  runScript({ option: "get_script_log_content", log_url });
