import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

export const getConfSeguridad = async (locations:string[]) => {
    const payload = {
      script_name: "pase_de_acceso_use_api.py",
      option: "get_config_modulo_seguridad",
      locations   
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