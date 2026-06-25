/* eslint-disable react-hooks/exhaustive-deps */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { useEliminarRondin } from "@/hooks/Rondines/useEliminarRondin";
import { useRouter } from "next/navigation";

interface DeleteRondinModalProps {
  title: string;
  folio: string;
  setModalEliminarAbierto: Dispatch<SetStateAction<boolean>>;
  modalEliminarAbierto: boolean;
}

export const EliminarRondinModal: React.FC<DeleteRondinModalProps> = ({
  title,
  folio,
  setModalEliminarAbierto,
  modalEliminarAbierto,
}) => {
  const eliminarRondinMutation = useEliminarRondin();
  const router = useRouter();
  const handleClose = () => setModalEliminarAbierto(false);

  const deleteRondines = () => {
    if (folio) {
      eliminarRondinMutation.mutate({ folio }, {
        onSuccess: () => {
          handleClose()
          router.push("/dashboard/rondines?tab=recorridos");
        },
        onError: () => handleClose(),
      });
    } else {
      toast.error("Selecciona un rondín para poder eliminarlo...");
    }
  };

  return (
    <Dialog onOpenChange={setModalEliminarAbierto} open={modalEliminarAbierto} modal>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border border-gray-100 shadow-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Icono y mensaje */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 border border-red-100">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">¿Eliminar rondín?</h3>
          <p className="text-sm text-gray-500 leading-snug">
            Esta acción no se puede revertir. El rondín{" "}
            <span className="font-semibold text-gray-700">#{folio}</span> será eliminado permanentemente.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={handleClose}
            disabled={eliminarRondinMutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={deleteRondines}
            disabled={eliminarRondinMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm">
            {eliminarRondinMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando...</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Eliminar rondín</>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};