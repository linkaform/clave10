import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

  export const getStats = async ({
    area = "",
    location = "Planta Monterrey",
    page = "Turnos",
  }) => {


    const payload = {
      area,
      location,
      page,
      option: "get_stats",
      script_name: "get_stats.py",
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
  