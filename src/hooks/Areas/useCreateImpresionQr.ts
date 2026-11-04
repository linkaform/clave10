import { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { createImpresionQrSdk, getAreaPdfSdk } from "@/lib/areas-sdk";
import { errorMsj, imprimirUrlEnIframe } from "@/lib/utils";

export const useCreateImpresionQr = () => {
  const [isCreating, setIsCreating] = useState(false);

  /** Regresa el record_id del registro creado en Impresión de QR, o null si falló. */
  const handleCreateImpresionQr = async (paginas: number): Promise<string | null> => {
    setIsCreating(true);
    try {
      const result = await createImpresionQrSdk(paginas);
      const textMsj = errorMsj(result);
      if (textMsj) {
        toast.error(`Error al crear la plantilla: ${textMsj.text}`);
        return null;
      }
      const recordId = result?.response?.data?.record_id;
      if (!recordId) {
        toast.error("Error al crear la plantilla: no se recibió el registro creado.");
        return null;
      }
      toast.success("Plantilla creada correctamente.");
      return recordId;
    } catch (err) {
      console.error("Error al crear la plantilla QR:", err);
      toast.error("Error inesperado al crear la plantilla.");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Mismo servicio get_pdf que el QR de un área, pero solo abre el diálogo de
  // impresión (imprimirUrlEnIframe): sin descarga ni pestaña nueva.
  const handlePrintPlantillaQr = async (recordId: string) => {
    Swal.fire({
      title: "Preparando documento",
      html: "Cargando PDF para imprimir...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const result = await getAreaPdfSdk(recordId);
      const data = result?.response?.data;
      if (!data || data.status_code !== 200) {
        toast.error(`Error del servidor: ${data?.json?.error || "Error desconocido del servidor"}`);
        return;
      }

      const downloadUrl = data?.json?.download_url || data?.data?.download_url;
      if (!downloadUrl) {
        toast.warning("No se encontró URL de descarga");
        return;
      }
      await imprimirUrlEnIframe(downloadUrl);
    } catch (err) {
      console.error("Error al imprimir la plantilla QR:", err);
      toast.error("Error inesperado al imprimir la plantilla.");
    } finally {
      Swal.close();
    }
  };

  return { handleCreateImpresionQr, handlePrintPlantillaQr, isCreating };
};
