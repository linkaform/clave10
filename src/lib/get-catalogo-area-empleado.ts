import { API_ENDPOINTS } from "@/config/api";

export const getCatalogoAreaEmpleado = async (location:string, bitacora:string) => {
    const payload = {
        location,
        bitacora,
        option: "catalogo_area_empleado",
        script_name: "incidencias.py",
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



 