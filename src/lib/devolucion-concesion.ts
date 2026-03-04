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
}

export interface InputDevolucionEquipo {
  record_id: string;
  status:string;
  quien_entrega: string;
  quien_entrega_company?: string;
  identificacion_entrega?: Imagen;
  entregado_por: "empleado" | "otro";
  equipos: EquipoDevolucion[];
}

export const devolucionEquipoConcesionado = async (data: InputDevolucionEquipo) => {
  const payload = {
    script_name: "articulos_consecionados.py",
    option: "update_article",
    data,
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

  return response.json();
};