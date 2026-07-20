import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

interface Props {
    area?: string;
    location?: string;
    checkin_id?: string;
    support_guards: { user_id: number; name: string }[]; // Campo obligatorio
  }
  
  export const updateSupportGuards = async ({
    area = "Caseta Principal",
    location = "Planta Monterrey",
    checkin_id,
    support_guards,
  }: Props) => {
    const payload = {
      area,
      location,
      checkin_id,
      support_guards,
      option: "update_guards",
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