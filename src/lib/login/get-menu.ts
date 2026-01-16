import { API_ENDPOINTS } from "@/config/api";

  export const getMenu = async () => {
    const payload = {
      option: "get_user_menu",
      script_name: "script_turnos.py",
    };
    const userJwt = localStorage.getItem("access_token"); 
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
  