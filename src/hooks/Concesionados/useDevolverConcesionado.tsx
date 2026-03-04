import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMsj } from "@/lib/utils";
import { useShiftStore } from "@/store/useShiftStore";
import { devolucionEquipoConcesionado, InputDevolucionEquipo } from "@/lib/devolucion-concesion";

export const useDevolucionEquipo = () => {
  const queryClient = useQueryClient();
  const { isLoading, setLoading } = useShiftStore();

  const devolverEquipoMutation = useMutation({
    mutationFn: async (data: InputDevolucionEquipo) => {
      const response = await devolucionEquipoConcesionado(data);
      const hasError = (!response?.success) || (response?.response?.data?.status_code === 400 )
      if (hasError) {
          const textMsj = errorMsj(response)
          throw new Error(`Error al crear seguimiento, Error: ${textMsj?.text}`);
      } else {
          return response.response?.data
      }

    },
    onMutate: () => setLoading(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getArticulosConcesionados"] });
      toast.success("Equipo devuelto correctamente.");
    },
    onError: (err: Error) => {
      console.error("Error al devolver equipo", err);
      toast.error(err.message || "Hubo un error al devolver el equipo");
    },
    onSettled: () => setLoading(false),
  });

  return {
    devolverEquipoMutation,
    isLoading,
  };
};