import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorMsj } from "@/lib/utils";
import { toast } from "sonner";
import { useShiftStore } from "@/store/useShiftStore";
import { deleteIncidencias } from "@/lib/incidencias";

export const useEliminarIncidencia = () => {
    const queryClient = useQueryClient();
    const { setLoading } = useShiftStore();
  
    return useMutation({
        mutationFn: async ({ folio }: { folio: string[] }) => {
            const response = await deleteIncidencias(folio);
            // Sanic regresa las excepciones (p. ej. sin permiso de borrar) como
            // { title, msg } dentro de response, con success en true.
            const exception = response?.response?.msg ? response.response : null;
            const hasError = (!response?.success) || (response?.response?.data?.status_code === 400 ) || !!exception
            if (hasError) {
                const text = exception
                    ? [exception.msg].flat().join(", ")
                    : errorMsj(response)?.text;
                throw new Error(text || "Hubo un error al eliminar la incidencia.");
            } else {
                return response.response?.data
            }
        },
        onMutate: () => {
            setLoading(true);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getListIncidencias"] });
            queryClient.invalidateQueries({ queryKey: ["getStats"] });
            toast.success("Incidencia eliminada correctamente.");
        },
        onError: (err) => {
            toast.error(err.message || "Hubo un error al eliminar la incidencia.",{
                style: {
                    background: "#dc2626",
                    color: "#fff",
                    border: 'none'
                },
            })

        },
        onSettled: () => {
            setLoading(false);
        },
    });
}