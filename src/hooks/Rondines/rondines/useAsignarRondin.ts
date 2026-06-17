import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useShiftStore } from "@/store/useShiftStore";
import { asignarRecorrido } from "@/lib/rondines";

export const useAsignarRondin = () => {
  const queryClient = useQueryClient();
  const { setLoading } = useShiftStore();

  return useMutation({
    mutationFn: async ({ folio ,data}: { folio: string, data:any[] }) => {
      const response = await asignarRecorrido(folio, data);
      const hasError = response.success;

      if (!hasError) {
        throw new Error(`Error al asignar recorrido`);
      } else {
        return response.response?.data;
      }
    },
    onMutate: () => setLoading(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getListRondines"] });
      queryClient.invalidateQueries({ queryKey: ["getStatsRondines"] });
      toast.success("Recorrido asignado correctamente.");
    },
    onError: (err: any) => {
      console.error("Error al asignar recorrido:", err);
      toast.error(err.message || "Hubo un error al asignar el recorrido.");
    },
    onSettled: () => setLoading(false),
  });
};