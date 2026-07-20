import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

export const getCatalogoAreaEmpleado = async (location:string, bitacora:string) => {
    const payload = {
        location,
        bitacora,
        option: "catalogo_area_empleado",
        script_name: "incidencias.py",
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



 