import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";
import { descargarPdfPase } from "./download-pdf";
import useAuthStore from "@/store/useAuthStore";
import { toast } from "sonner";
import Swal from "sweetalert2";

// option: "get_pdf" (default) usa la plantilla por defecto de la forma e ignora
// template_id; "get_pdf_incidencias" sí respeta el template_id que se manda.
export const getPdfIncidencias = async (
  qr_code:string,
  template_id:number|null,
  account_id:number,
  name_pdf?:string,
  option: "get_pdf" | "get_pdf_incidencias" = "get_pdf",
) => {
    const payload = {
      script_name: "pase_de_acceso_use_api.py",
      option,
      qr_code:qr_code,
      template_id,
      account_id,
      name_pdf
    };
  
    const response = await fetch(API_ENDPOINTS.runScript, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data
}

// PDF de incidencia con la plantilla v2; el back la busca por nombre en la cuenta.
export const getPdfIncidenciaV2 = async (qr_code: string, name_pdf?: string) => {
  // incidencias.py corre con la sesión del usuario (no con la api key), necesita el JWT.
  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify({
      script_name: "incidencias.py",
      option: "get_pdf_incidencia",
      qr_code,
      name_pdf,
    }),
  });
  return response.json();
}

// v2 y, si la cuenta aún no tiene la opción en el script, el PDF de siempre.
export const getPdfIncidenciaConFallback = async (qr_code: string, account_id: number, name_pdf?: string) => {
  const v2 = await getPdfIncidenciaV2(qr_code, name_pdf);
  if (v2?.response?.data?.status_code === 200) return v2;
  return getPdfIncidencias(qr_code, 592, account_id, name_pdf);
}

// Botón "Imprimir PDF" de tabla, tarjetas y detalle de incidencias.
export const descargarPdfIncidencia = async (incidencia: { _id: string; folio?: string }) => {
  const nombre = `Seguimiento_de_Incidente-${incidencia.folio ?? ""}`;
  // Mismo loader de pantalla completa que concesión, pases e impresión de QR.
  Swal.fire({
    title: "Preparando documento",
    html: "Generando PDF...",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
  try {
    const result = await getPdfIncidenciaConFallback(incidencia._id, useAuthStore.getState().userIdSoter ?? 0, nombre);
    const downloadUrl = result?.response?.data?.json?.download_url;
    if (!downloadUrl) {
      toast.error("No se pudo generar el PDF");
      return;
    }
    await descargarPdfPase(downloadUrl, `${nombre}.pdf`);
    toast.success("¡PDF descargado correctamente!");
  } catch (error) {
    toast.error(`Error al descargar el PDF: ${error}`);
  } finally {
    Swal.close();
  }
}