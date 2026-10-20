import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAsistencia, setAsistencia, type Asistencia } from "@/lib/asistencia-sdk";

const KEY = ["asistencia"];

export const useAsistencia = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: getAsistencia,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });

  const mutation = useMutation({
    mutationFn: (estatus: Asistencia["estatus"]) => setAsistencia(estatus),
    onSuccess: (res) => {
      queryClient.setQueryData(KEY, res);
      // Pasar a Ausente cierra el Check In abierto en el back.
      if (res.estatus === "ausente") queryClient.invalidateQueries({ queryKey: ["checkin"] });
      toast.success(res.estatus === "disponible" ? "Se registró tu asistencia" : "Cambiaste tu estatus a Ausente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    asistencia: data,
    isLoading,
    disponible: data?.estatus === "disponible",
    setEstatus: mutation.mutate,
    isSaving: mutation.isPending,
  };
};
