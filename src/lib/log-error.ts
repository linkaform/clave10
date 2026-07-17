import { API_ENDPOINTS } from "@/config/api";

export const logClientError = async (error: {
  name: string;
  message: string;
  stack?: string;
  digest?: string;
  url?: string;
  context?: string;
}) => {
  try {
    const params = error.url ? new URL(error.url).searchParams : null;
    const account_id = params ? (Number(params.get("user")) || null) : null;
    await fetch(API_ENDPOINTS.runScript, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        script_name: "pase_de_acceso_use_api.py",
        option: "log_client_error",
        account_id,
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack ?? null,
        error_digest: error.digest ?? null,
        url: error.url ?? null,
        context: error.context ?? null,
      }),
    });
  } catch {
    // silencioso — no queremos loops de error
  }
};
