import { Imagen } from "@/components/upload-Image";
import { API_ENDPOINTS } from "@/config/api";

interface EvidenciaDevolucion {
  file_url: string;
  file_name?: string;
}

interface EquipoDevolucion {
  id_movimiento: string;
  cantidad_devuelta: number;
  state: string;
  evidencia: EvidenciaDevolucion[];
  comentario_entrega:string;
}

export interface InputDevolucionTotal {
  record_id: string;
  status: "total";
  state: "complete" | "lost" | "damage";
  quien_entrega: string;
  company?: string;
  identificacion_entrega?: {
    file_name: string;
    file_url: string;
  };
  comentarios?: string;
  evidencia?: { file_url: string; file_name?: string }[];
  comentario_entrega?:string
}
export interface InputDevolucionEquipo {
  record_id: string;
  status:string;
  state?:string;
  quien_entrega: string;
  quien_entrega_company?: string;
  identificacion_entrega?: Imagen;
  entregado_por: "empleado" | "otro";
  equipos: EquipoDevolucion[];
  comentario_entrega?:string
}

export const devolucionEquipoConcesionado = async (data: InputDevolucionEquipo | InputDevolucionTotal) => {
  const payload = {
    script_name: "articulos_consecionados.py",
    option: "update_article",
    ...data,
  };
console.log("comenraeriosss", data)
  const userJwt = localStorage.getItem("access_token");
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};