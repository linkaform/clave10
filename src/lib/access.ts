import { Imagen } from "@/components/upload-Image";
import { API_ENDPOINTS } from "@/config/api";

export const searchAccessPass = async (
  area: string,
  location: string,
  qr_code: string
) => {
  const payload = {
    script_name: "script_turnos.py",
    option: "search_access_pass",
    area,
    location,
    qr_code,
  };

  const userJwt = localStorage.getItem("access_token");

  const response = await fetch(
    API_ENDPOINTS.runScript,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwt}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();
  return data;
};

export const fetchTemporalPasses = async ({
  area = "Caseta Principal",
  location = "Planta Monterrey",
  inActive = "",
}) => {
  const payload = {
    caseta: area,
    inActive,
    location,
    option: "lista_pases",
    script_name: "script_turnos.py",
  };

  const userJwt = localStorage.getItem("access_token");

  const response = await fetch(
    API_ENDPOINTS.runScript,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwt}`,
      },
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json();
  return data;
};

export const fetchPasesActivos = async ({
  location = "",
}) => {
  const payload = {
    location,
    option: "lista_pases",
    script_name: "script_turnos.py",
  };
  
  const userJwt = localStorage.getItem("access_token");
  const response = await fetch(
    API_ENDPOINTS.runScript,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwt}`,
      },
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json();
  return data;
};


export interface RegisterIncomingProps {
  area?: string;
  location?: string;
  qr_code: string;
  comentario_acceso?: any[];
  comentario_pase?: any[];
  equipo?: any[];
  vehiculo?: any[];
  visita_a?: any[];
  gafete?: any;
}

export const registerIncoming = async (props: RegisterIncomingProps) => {
  const payload = {
    area: props.area || "Caseta Principal",
    location: props.location || "Planta Monterrey",
    qr_code: props.qr_code,
    comentario_acceso: props.comentario_acceso || [],
    comentario_pase: props.comentario_pase || [],
    equipo: props.equipo || [],
    vehiculo: props.vehiculo || [],
    gafete: props.gafete || {},
    visita_a: props.visita_a || [],
    option: "do_access",
    script_name: "script_turnos.py",
  };

  const userJwt = localStorage.getItem("access_token");
  const response = await fetch(
    API_ENDPOINTS.runScript,    {
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


export const exitRegister = async (
  area: string,
  location: string,
  qr_code: string,
  gafete_id?: ""
) => {
  const payload = {
    area,
    location,
    gafete_id,
    qr_code,
    option: "do_out",
    script_name: "script_turnos.py",
  };

  const userJwt = localStorage.getItem("access_token");

  const response = await fetch(
    API_ENDPOINTS.runScript,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwt}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  return data;
};

export const getAccessAssets = async (location: string, cat?:string) => {
  const payload = {
    location,
    cat,
    option: "assets_access_pass",
    script_name: "script_turnos.py",
  };

  const userJwt = localStorage.getItem("access_token");

  const response = await fetch(
    API_ENDPOINTS.runScript,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwt}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();
  return data;
};

export interface AccessPass {
  created_from:string;
  ubicaciones: string[] | undefined;
  nombre: string;
  empresa: string;
  visita_a: string;
  perfil_pase?: string;
  foto: Imagen[] | undefined;
  identificacion: Imagen[] | undefined;
  email?: string;
  telefono?: string;
  status_pase?:string;
}

export const addNewVisit = async (
  location: string,
  access_pass: any
) => {
  const payload = {
    location,
    access_pass: {
      site: 'accesos',
      nombre: access_pass.nombre,
      empresa: access_pass.empresa,
      visita_a: access_pass.visita_a,
      perfil_pase: access_pass.perfil_pase || "Visita general",
      foto: access_pass.foto || [],
      identificacion: access_pass.identificacion || [],
      email: access_pass.email || "",
      telefono: access_pass.telefono || "",
      created_from:access_pass.created_from,
      ubicaciones: access_pass.ubicaciones,
      tipo_visita_pase: access_pass.tipo_visita_pase || "rango_de_fechas",
      fechaFija: access_pass.fechaFija? access_pass.fechaFija.replace("T", " ")+":00" || ""  :"",
      fecha_desde_visita: access_pass.fechaFija !== ""
      ?  access_pass.fechaFija? access_pass.fechaFija.replace("T", " ")+":00" || ""  :""
      : access_pass.fecha_desde_visita !== ""
        ? access_pass.fecha_desde_visita + " 00:00:00"
        : new Date().toISOString().split("T")[0] + " 00:00:00",
    
      fecha_desde_hasta: access_pass.fechaFija !== ""
      ? ""
      : access_pass.fecha_desde_hasta !== ""
        ? access_pass.fecha_desde_hasta + " 23:59:00"
        : new Date().toISOString().split("T")[0] + " 23:59:00",
      config_dia_de_acceso: access_pass.config_dia_de_acceso || "cualquier_día",
      config_dias_acceso: access_pass.config_dias_acceso || [],
      config_limitar_acceso: access_pass.config_limitar_acceso || 0,
      },
    option: "create_access_pass",
    script_name: "pase_de_acceso.py",
  };

  const userJwt = localStorage.getItem("access_token");

  const response = await fetch(
    API_ENDPOINTS.runScript,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userJwt}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();
  return data;
};