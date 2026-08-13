import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

export const getConfSeguridad = async (locations:string[], account_id?: number) => {
    const payload = {
      script_name: "pase_de_acceso_use_api.py",
      option: "get_config_modulo_seguridad",
      locations,
      ...(account_id ? { account_id } : {}),
     };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    // Cuando se manda account_id explícito (flujo público, sin sesión, p.ej.
    // registro-ingreso) NO se manda Authorization: si el navegador trae un
    // JWT válido de OTRA cuenta (alguien con sesión abierta en el dashboard),
    // el backend resuelve por ese JWT en vez del account_id del payload, y la
    // ubicación termina sin encontrarse. Solo se manda el JWT para el uso
    // original (dashboard autenticado, sin account_id explícito).
    if (!account_id) {
      const userJwt = await getValidToken();
      headers['Authorization'] = `Bearer ${userJwt}`;
    }

    const response = await fetch(API_ENDPOINTS.runScript, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data
  };