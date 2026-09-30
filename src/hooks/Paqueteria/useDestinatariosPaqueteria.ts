import { DestinatarioPaquete, getDestinatariosPaqueteria } from "@/lib/paqueteria";
import { errorMsj } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useDestinatariosPaqueteria = (enabled: boolean) => {
  const { data, isLoading } = useQuery<DestinatarioPaquete[]>({
    queryKey: ["getDestinatariosPaqueteria"],
    enabled,
    // El contacto se edita en Linkaform: siempre datos frescos al abrir el modal.
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const res = await getDestinatariosPaqueteria();
      if (errorMsj(res)) {
        toast.error("Error al obtener los destinatarios de paquetería.");
        return [];
      }
      return Array.isArray(res?.response?.data) ? res.response.data : [];
    },
  });

  return { data: data ?? [], isLoading };
};
