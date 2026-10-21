import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getBandeja, resolverBandeja } from "@/lib/asistencia-sdk";

export const useBandeja = () =>
  useQuery({
    queryKey: ["bandeja"],
    queryFn: getBandeja,
    staleTime: 1000 * 20,
    // La app avisa al instante; en web basta con revisar seguido.
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
  });

export const useResolverBandeja = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; decision: "aprobada" | "rechazada"; comentario?: string }) =>
      resolverBandeja(v.id, v.decision, v.comentario),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["bandeja"] });
      toast.success(res.autorizacion_status === "aprobada" ? "Horas extra aprobadas" : "Horas extra rechazadas");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
