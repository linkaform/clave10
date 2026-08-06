import { Imagen } from "@/components/upload-Image";
import { API_ENDPOINTS } from "@/config/api";
import { Equipo, Vehiculo } from "./update-pass";

export type VisitaAWalkin = {
  nombre?: string;
  email?: string;
  telefono?: string;
};

export type AccessPassWalkin = {
  ubicaciones: string[];
  nombre: string;
  perfil_pase: string;
  telefono?: string;
  visita_a: VisitaAWalkin;
  email?: string;
  empresa: string;
  foto: Imagen[];
  identificacion: Imagen[];
  equipos: Equipo[];
  vehiculos: Vehiculo[];
  motivo: string;
  created_from: string;
  // Ojo: el backend compara este valor contra el string literal "true" (no
  // contra un booleano ni contra "sí"/"no") — ver create_access_pass.
  acepto_aviso_privacidad: string;
  conservar_datos_por: string;
  firma_reglas_de_acceso?: { file_url: string; file_name: string };
  // Mismo caso: comparado contra el string literal "true".
  acepto_reglas_ingreso?: string;
};

interface CreateAccessPassWalkinParams {
  access_pass: AccessPassWalkin;
  account_id: number;
}

export const createAccessPassWalkin = async ({
  access_pass,
  account_id,
}: CreateAccessPassWalkinParams) => {
  const payload = {
    script_name: "pase_de_acceso_use_api.py",
    option: "create_access_pass",
    access_pass,
    account_id,
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
