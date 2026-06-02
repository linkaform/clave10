// @/hooks/useNotas.ts
import { cerrarNota, crearNota, editarNota, getNotes, InputNote } from "@/lib/notes";
import { errorMsj } from "@/lib/utils";
import { useShiftStore } from "@/store/useShiftStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useNotas = (
  location: string,
  area: string = "",
  dateFrom: string = "",
  dateTo: string = "",
  status: string = "abierto",
  limit: number = 100,
  offset: number = 0,
) => {
  const queryClient = useQueryClient();
  const { isLoading: loading, setLoading } = useShiftStore();

  const {
    data: listNotasData,
    isLoading: isLoadingListNotas,
    error: errorListNotas,
    refetch: refetchNotas,
  } = useQuery<any>({
    queryKey: ["getListNotas", location, area, dateFrom, dateTo, status, limit, offset],
    enabled: location !== "",
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const data = await getNotes(area, location, limit, offset, dateFrom, dateTo, status);
      return Array.isArray(data.response?.data?.records)
        ? data.response.data.records
        : Array.isArray(data.response?.data)
        ? data.response.data
        : [];
    },
  });

  const createNotaMutation = useMutation({
    mutationFn: async ({ data_notes }: { data_notes: InputNote }) => {
      const response = await crearNota(location, area, data_notes);
      const hasError = !response?.success || response?.response?.data?.status_code === 400;
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al crear nota, Error: ${textMsj?.text}`);
      }
      return response.response?.data;
    },
    onMutate: () => setLoading(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getListNotas"] });
      toast.success("Nota creada correctamente.");
    },
    onError: (err) => {
      toast.error(err.message || "Hubo un error al crear la nota.");
    },
    onSettled: () => setLoading(false),
  });

  const editarNotaMutation = useMutation({
    mutationFn: async ({ folio, data_update }: { folio: string; data_update: any }) => {
      const response = await editarNota({ folio, data_update });
      const hasError = !response?.success || response?.response?.data?.status_code === 400;
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al editar nota, Error: ${textMsj?.text}`);
      }
      return response.response?.data;
    },
    onMutate: () => setLoading(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getListNotas"] });
      toast.success("Nota editada correctamente.");
    },
    onError: (err) => {
      toast.error(err.message || "Hubo un error al editar la nota.");
    },
    onSettled: () => setLoading(false),
  });

  const cerrarNotaMutation = useMutation({
    mutationFn: async ({ folio, data_update }: { folio: string; data_update: any }) => {
      const response = await cerrarNota({ folio, data_update });
      const hasError = !response?.success || response?.response?.data?.status_code === 400;
      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(`Error al cerrar nota, Error: ${textMsj?.text}`);
      }
      return response.response?.data;
    },
    onMutate: () => setLoading(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getListNotas"] });
      toast.success("Nota cerrada correctamente.");
    },
    onError: (err) => {
      toast.error(err.message || "Hubo un error al cerrar la nota.");
    },
    onSettled: () => setLoading(false),
  });

  return {
    listNotas: listNotasData ?? [],
    isLoadingListNotas,
    loading,
    errorListNotas,
    refetchNotas,
    createNotaMutation,
    editarNotaMutation,
    cerrarNotaMutation,
  };
};