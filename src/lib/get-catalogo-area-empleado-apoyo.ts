import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

export const getCatalogoAreaEmpleadoApoyo = async () => {
    const payload = {
        option: "catalogo_area_empleado_apoyo",
        script_name: "fallas.py",
    };
    const userJwt = await getValidToken();
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