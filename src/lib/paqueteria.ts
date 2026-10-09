import { Imagen } from "@/components/upload-Image";
import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";
import { facetListPayload, FacetListParams } from "./facet-search";

export interface InputPaqueteria {
    ubicacion_paqueteria:string,
    area_paqueteria: string,
    fotografia_paqueteria: Imagen[],
    descripcion_paqueteria: string,
    quien_recibe_paqueteria?: string,
    // Destinatario externo ("Otro"): campo de texto aparte del catálogo de empleados.
    quien_recibe_otro?: string,
    guardado_en_paqueteria: string,
    fecha_recibido_paqueteria: string,
    fecha_entregado_paqueteria?: string,
    estatus_paqueteria?: string[],
    entregado_a_paqueteria:string,
    proveedor:string,
    notificacion_paqueteria?: string[]
}

// Aviso al destinatario al recibir el paquete; va aparte de data_paquete porque
// no son campos de la forma de Paquetería.
export interface NotificacionPaquete {
    canales: string[],
    email?: string,
    telefono?: string,
    destinatario?: string,
    no_guia?: string,
}

export interface InputPaqueteriaDevolver {
    estatus_paqueteria: string[],
    fecha_entregado_paqueteria: string,
    entregado_a_paqueteria:string,
}
  
export const getListPaqueteria  = async (
    location:string,status:string, area:string, date1:string, date2:string, filterDate:string, paging?: FacetListParams) => {
    const payload = {
        dateFrom:date1,
        dateTo:date2,
        filterDate,
        location: location,
        area,
        status:status,
        // Con paging: listado paginado + filtros del buscador (ver facet-search).
        ...facetListPayload(paging),
        option: "get_paquetes",
        script_name: "paqueteria.py",
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

  export const getCatalogoProveedores  = async () => {
    const payload = {
        option: "get_catalogo_paquetes",
        script_name: "paqueteria.py",
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


export interface DestinatarioPaquete {
    nombre: string,
    email: string,
    telefono: string,
}

// Empleados con su email/teléfono para el destinatario de Paquetería.
export const getDestinatariosPaqueteria = async (): Promise<any> => {
    const userJwt = await getValidToken();
    const response = await fetch(API_ENDPOINTS.runScript, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userJwt}`,
        },
        body: JSON.stringify({ option: "catalogo_destinatarios", script_name: "paqueteria.py" }),
    });
    return response.json();
};

export const crearPaqueteria  = async (data_paquete: InputPaqueteria  | null, notificacion?: NotificacionPaquete)=> {
    const payload = {
        data_paquete,
        ...(notificacion?.canales?.length ? { notificacion } : {}),
        option: "nuevo_paquete",
        script_name: "paqueteria.py",
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

export const editarPaqueteria  = async (data_paquete_actualizar: InputPaqueteria  | InputPaqueteriaDevolver, folio:string)=> {
    const payload = {
        option: "actualizar_paquete",
        script_name: "paqueteria.py",
        data_paquete_actualizar,
        folio: folio
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