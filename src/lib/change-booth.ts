import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

interface GetShiftParams {
    area?: string;
    location?: string;
  }
  
  export const changeBooth = async ({
    area = "Caseta Principal",
    location = "Planta Monterrey",
  }: GetShiftParams = {}) => {
    const payload = {
      area,
      location,
      option: "load_shift",
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
  