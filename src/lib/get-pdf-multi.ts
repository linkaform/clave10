import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

// A diferencia de getPdf (get_pdf, por qr_code, un solo pase), este servicio
// recibe los _id de Mongo de varios registros de Pase de Entrada (titular +
// acompañantes) y regresa un solo PDF ya mergeado. El backend lo arma de
// forma asíncrona (polling interno en LinkaForm) y puede tardar hasta ~2
// minutos — quien lo llame debe mostrar su propio loading mientras espera.
export interface GetPdfMultiSuccess {
  _id: string;
  path: string;
  status: string;
}

export interface GetPdfMultiSinRegistros {
  data: string;
  status_code: number;
}

export interface GetPdfMultiError {
  error: string;
}

export type GetPdfMultiResponse =
  | GetPdfMultiSuccess
  | GetPdfMultiSinRegistros
  | GetPdfMultiError;

export const getPdfMulti = async (
  record_ids: string[],
): Promise<GetPdfMultiResponse> => {
  const payload = {
    record_ids,
    option: "get_pdf_multi",
    script_name: "pase_de_acceso.py",
  };

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
