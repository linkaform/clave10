import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

/**
 * Areas de una ubicacion.
 * `uso` aplica la marca "Utilizar Area en:" del modulo que pregunta
 * (pases, incidencias, paqueteria, fallas, articulos_perdidos, rondines,
 * articulos_concesionados, notas, casetas). Sin `uso` el back regresa todas las areas.
 */
export const getCatalogoPasesAreaNoApi = async (
    location = "",
    uso?: string,
) => {
    const payload: Record<string, unknown> = {
        location,
        option: "catalogos_pase_area",
        script_name: "pase_de_acceso.py",
    };
    if (uso) payload.uso = uso;

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
