import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

interface GetSupportGuards {
    area?: string;
    location?: string;
  }
  
  export const getSupportGuards = async ({
    area = "Caseta Principal",
    location = "Planta Monterrey",
  }: GetSupportGuards = {}) => {
    const payload = {
      area,
      location,
      option: "guardias_de_apoyo",
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
  