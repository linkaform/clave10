/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ENDPOINTS } from "@/config/api";

// Pagina publica /auth/set-password: el usuario nuevo fija su contraseña con el
// enlace del correo de bienvenida (record_id + token). Mismo runner y shape que
// contratistas-sdk.ts; aqui NUNCA se manda JWT: la pagina puede abrirse en un
// navegador con la sesion de otro usuario y la escritura debe hacerse con el
// API key de la cuenta, no con esa identidad.

const SCRIPT = "user_activation_sdk.py";

export interface SetUserPasswordParams {
  /** Cuenta dueña del registro; viaja en la liga como `user`. */
  account_id: number;
  record_id: string;
  token: string;
  password: string;
  password2: string;
}

export const setUserPasswordSdk = async (params: SetUserPasswordParams) => {
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      script_name: SCRIPT,
      option: "set_user_password",
      ...params,
    }),
  });
  return response.json();
};
