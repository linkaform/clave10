import { toast } from "sonner";
import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";
import {
  getAreaPdfSdk,
  updateAreaEstadoSdk,
  updateAreaDisponibilidadSdk,
} from "@/lib/areas-sdk";
import { imprimirYDescargarPDF } from "@/lib/utils";

export const useAreaActions = () => {
  const queryClient = useQueryClient();

  const handleToggleAreaEstado = async (recordId: string, estadoActual: string) => {
    if (!recordId) {
      toast.error("Esta área no tiene un registro válido.");
      return;
    }
    const nuevoEstado = estadoActual?.toLowerCase() === "activa" ? "inactiva" : "activa";

    try {
      const result = await updateAreaEstadoSdk(recordId, nuevoEstado);
      const data = result?.response?.data;
      if (!data || data.status_code >= 400) {
        toast.error(`Error al cambiar el estatus del área: ${data?.error || "error desconocido"}`);
        return;
      }
      toast.success(`Área marcada como ${nuevoEstado}.`);
      queryClient.invalidateQueries({ queryKey: ["areasCatalog"] });
    } catch (err) {
      console.error("Error al cambiar estatus de área:", err);
      toast.error("Error inesperado al cambiar el estatus del área.");
    }
  };

  const handleChangeAreaDisponibilidad = async (recordId: string, disponibilidad: string) => {
    if (!recordId) {
      toast.error("Esta área no tiene un registro válido.");
      return;
    }
    try {
      const result = await updateAreaDisponibilidadSdk(recordId, disponibilidad);
      const data = result?.response?.data;
      if (!data || data.status_code >= 400) {
        toast.error(`Error al cambiar la disponibilidad del área: ${data?.error || "error desconocido"}`);
        return;
      }
      toast.success(`Disponibilidad actualizada a "${disponibilidad}".`);
      queryClient.invalidateQueries({ queryKey: ["areasCatalog"] });
    } catch (err) {
      console.error("Error al cambiar disponibilidad de área:", err);
      toast.error("Error inesperado al cambiar la disponibilidad del área.");
    }
  };

  const handlePrintAreaQR = async (recordId: string) => {
    if (!recordId) {
      toast.error("Esta área no tiene un registro válido para imprimir.");
      return;
    }

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
        const errorMsg = data?.json?.error || "Error desconocido del servidor";
        toast.error(`Error del servidor: ${errorMsg}`);
        Swal.close();
        return;
      }

      const downloadUrl = data?.json?.download_url || data?.data?.download_url;
      if (downloadUrl) {
        imprimirYDescargarPDF(downloadUrl);
      } else {
        toast.warning("No se encontró URL de descarga");
        Swal.close();
      }
    } catch (err) {
      console.error("Error al obtener PDF de área:", err);
      toast.error("Error inesperado al imprimir el QR del área.");
      Swal.close();
    }
  };

  return { handlePrintAreaQR, handleToggleAreaEstado, handleChangeAreaDisponibilidad };
};
