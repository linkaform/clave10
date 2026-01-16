import { API_ENDPOINTS } from "@/config/api";

export const getCatalogoPasesAreaNoApi = async (location = "Caseta Principal") => {
    const payload = {
        location,
        option: "catalogos_pase_area",
        script_name: "pase_de_acceso.py",
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
  
  export const getCatalogoPasesAreaUseApi = async (location = "Caseta Principal") => {
    const payload = {
        location,
        option: "catalogos_pase_area",
        script_name: "pase_de_acceso_use_api.py",
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
  