import { API_ENDPOINTS } from "@/config/api";

export interface getVehiculosParams {
    tipo: string,
    account_id: number,
    marca?:string
    isModalOpen?: boolean;
  }
  
  export const getVehiculos = async ({
    account_id,
    tipo,
    marca
  }:getVehiculosParams) => {
    const payload = {
        account_id,
        option: "catalago_vehiculo",
        script_name: "pase_de_acceso_use_api.py",
        tipo,
        marca
    };

    const response = await fetch(API_ENDPOINTS.runScript, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
  
    const data = await response.json();
    return data;
  };