import { Imagen } from "@/components/upload-Image";
import { API_ENDPOINTS } from "@/config/api"
import { getValidToken } from "./login/get-valid-token";

export interface InputArticuloCon {
    status_concesion:string,
    ubicacion_concesion:string,
    // solicita_concesion:string,
    persona_nombre_concesion:string,
    caseta_concesion:string,
    fecha_concesion:string,
    area_concesion:string,
    observacion_concesion:string,
    evidencia:Imagen[],
    // persona_text:string
}
export interface InputOutArticuloCon {
    fecha_devolucion_concesion:string,
    status_concesion:string
}


export const getListArticulosCon = async (location:string, area:string,status:string,date1:string, date2:string, filterDate:string, limit:number = 25, skip:number = 0, locations:string[] = [], search:string = "", searchFields:string[] = []) => {
    const payload = {
        dateFrom:date1,
        dateTo: date2,
        filterDate:filterDate,
        status:status,
        location:"",
        locations,
        area:area,
        limit,
        skip,
        search,
        // Acota `search` a estos campos (OR entre ellos) en vez de la
        // búsqueda genérica de siempre. Vacío = comportamiento actual.
        search_fields: searchFields,
        option: "get_articles",
        script_name: "articulos_consecionados.py",
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

export const getTipoConcesion = async (location:string, tipo:string) => {
    const payload = {
        // location,
        tipo,
        option: "catalogo_tipo_concesion",
        script_name: "articulos_consecionados.py",
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

// NOTA PARA BACKEND: opción nueva pendiente de implementar en articulos_consecionados.py.
// Dado un `nombre_equipo` (y opcionalmente `location`), debe buscar si existe una
// concesión con status_concesion en ["abierto", "parcial"] que lo contenga dentro de
// su grupo_equipos, y devolver:
//   { disponible: boolean, concesion_abierta?: { record_id, folio, persona_nombre_concesion, fecha_concesion, id_movimiento } }
// `record_id` e `id_movimiento` son los que se necesitan para poder forzar la
// devolución de ese equipo puntual vía `devolucionEquipoConcesionado` (ver
// src/lib/devolucion-concesion.ts) sin tener que devolver la concesión completa.
export interface ConcesionAbierta {
    record_id: string;
    folio: string;
    id_movimiento: string;
    persona_nombre_concesion: string;
    fecha_concesion: string;
}

export interface DisponibilidadEquipo {
    disponible: boolean;
    concesion_abierta?: ConcesionAbierta;
}

export const checkDisponibilidadEquipo = async (location: string, nombre_equipo: string): Promise<{ response: { data: DisponibilidadEquipo } }> => {
    const payload = {
        location,
        nombre_equipo,
        option: "check_disponibilidad_equipo",
        script_name: "articulos_consecionados.py",
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

export const crearArticuloCon = async (data_article: InputArticuloCon | null)=> {
    const payload = {
        data_article,
        option: "new_article",
        script_name: "articulos_consecionados.py",
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

export const editarArticuloCon = async (data_article_update: InputArticuloCon | InputOutArticuloCon, folio:string)=> {
    const payload = {
        option: "update_article",
        script_name: "articulos_consecionados.py",
        data_article_update,
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
