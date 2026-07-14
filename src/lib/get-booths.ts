import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

export const getBooths = async () => {
    const payload = {
      script_name: "script_turnos.py",
      option: "get_user_booths",   
    };
  
    const userJwt = await getValidToken();
  
      const response = await fetch(API_ENDPOINTS.runScript, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userJwt}`,
        },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json(); 
      return data 
     
  
  };


