import { useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { getPdf } from "@/lib/get-pdf";
import { imprimirYDescargarPDF, dateToString } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";

export const useBitacoraActions = () => {
  const { userParentId } = useAuthStore();
  const [isForcingQuit, setIsForcingQuit] = useState(false);

  /**
   * Acción: Imprimir Pase
   */
  const handlePrintPase = async (paseId: string) => {
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
      const result = await getPdf(userParentId, paseId);
      const data = result?.response?.data;

      if (!data || data.status_code !== 200) {
        const errorMsg = data?.json?.error || "Error desconocido del servidor";
        toast.error(`Error del servidor: ${errorMsg}`);
        Swal.close();
        return;
      }

      const downloadUrl = data?.json?.download_url || data?.data?.download_url;

      if (downloadUrl) {
        imprimirYDescargarPDF(downloadUrl);
        Swal.close();
      } else {
        toast.warning("No se encontró URL de descarga");
        Swal.close();
      }
    } catch (err) {
      console.error("Error al obtener PDF:", err);
      toast.error(`Error inesperado al imprimir pase.`);
      Swal.close();
    }
  };

  /**
   * Acción: Manejo de filtros de fecha internos si es necesario
   */
  const handleDateFilterValidation = (
    date1: Date | "",
    date2: Date | "",
    setDates: (d: string[]) => void,
  ) => {
    if (date1 && date2) {
      const f1 = dateToString(new Date(date1));
      const f2 = dateToString(new Date(date2));
      setDates([f1, f2]);
    } else {
      toast.error("Escoge un rango de fechas.");
    }
  };

  return {
    isForcingQuit,
    setIsForcingQuit,
    handlePrintPase,
    handleDateFilterValidation,
  };
};
