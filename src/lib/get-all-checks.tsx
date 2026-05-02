import { API_ENDPOINTS } from "@/config/api";

export const getListCheckUbicaciones = async (
    ubicacion?: string,
    nombreRondin?: string,
  ) => {
    const payload = {
      ubicacion: ubicacion ?? "",
      nombre_rondin: nombreRondin ?? "",
      option: "get_all_checks",
      script_name: "rondines.py",
    };
  
    const userJwt = localStorage.getItem("access_token");
    const response = await fetch(API_ENDPOINTS.runScript, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userJwt}`,
      },
      body: JSON.stringify(payload),
    });
  
    const data = await response.json();
    return data;
  };