import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

export const getCatalogoPasesLocationNoApi = async () => {
    const payload = {
        option: "catalogos_pase_location",
        script_name: "pase_de_acceso.py",
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
  
//   export const getCatalogoPasesLocationUseApi = async () => {
//     const payload = {
//         option: "catalogos_pase_location",
//         script_name: "pase_de_acceso_use_api.py",
//     };
  
  
//     const response = await fetch(API_ENDPOINTS.runScript, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${userJwt}`,
//         },
//         body: JSON.stringify(payload),
//     });
  
//     const data = await response.json();
//     return data;
//   };
  
  export const getCatalogoPasesLocationUseApi = async () => {
    const payload = {
      option: "catalogos_pase_location",
      script_name: "pase_de_acceso_use_api.py",
    };
  
    const userJwt = await getValidToken();
  
    try {
      const response = await fetch(API_ENDPOINTS.runScript, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userJwt}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        console.error("Error HTTP:", response.status);
        return null;
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error al obtener catálogo de pases:", error);
      return null;
    }
  };