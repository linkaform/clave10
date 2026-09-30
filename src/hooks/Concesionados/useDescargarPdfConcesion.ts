import { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import useAuthStore from "@/store/useAuthStore";
import { getPdfIncidencias } from "@/lib/get-pdf-incidencias";
import { descargarPdfPase } from "@/lib/download-pdf";

// Plantilla de PDF de la forma de artículos concesionados en Linkaform.
const TEMPLATE_PDF_CONCESION = 655;

export const useDescargarPdfConcesion = () => {
  const { userIdSoter } = useAuthStore();
  const [isDescargando, setIsDescargando] = useState(false);

  const descargarPdf = async (recordId: string, folio?: string) => {
    if (!recordId) {
      toast.error("Esta concesión no tiene un registro válido.");
      return;
    }
    setIsDescargando(true);
    // Mismo loader de pantalla completa que imprimir QR de áreas / pases.
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
      const nombre = `Articulo_concesionado${folio ? `_${folio}` : ""}`;
      // get_pdf_incidencias: la opción que sí respeta el template_id.
      const result = await getPdfIncidencias(recordId, TEMPLATE_PDF_CONCESION, userIdSoter, nombre, "get_pdf_incidencias");
      const data = result?.response?.data;
      const downloadUrl = data?.json?.download_url || data?.data?.download_url;
      if (!downloadUrl) {
        toast.error(`No se pudo generar el PDF: ${data?.json?.error || "sin URL de descarga"}`);
        return;
      }
      await descargarPdfPase(downloadUrl, `${nombre}.pdf`);
      toast.success("PDF descargado.");
    } catch (err) {
      console.error("Error al descargar PDF de concesión:", err);
      toast.error("Error inesperado al descargar el PDF.");
    } finally {
      Swal.close();
      setIsDescargando(false);
    }
  };

  return { descargarPdf, isDescargando };
};
