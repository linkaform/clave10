import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./get-valid-token";

  export const getMenu = async () => {
    const payload = {
      option: "get_user_menu",
      script_name: "script_turnos.py",
    };
    const userJwt = await getValidToken();
    const response = await fetch(API_ENDPOINTS.runScript, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwt}`,
      },
      body: JSON.stringify(payload),
    });
  
    const data = await response.json();
    return data;
  };
  