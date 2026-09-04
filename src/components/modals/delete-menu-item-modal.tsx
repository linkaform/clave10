import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  label: string;
  isDeleting?: boolean;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  onOpenChange,
  title = "Eliminar",
  label,
  isDeleting = false,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="max-w-md" aria-describedby="">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold">{title}</DialogTitle>
        </DialogHeader>

        <div className="my-3 flex flex-col items-center text-center">
          <p className="text-xl font-bold">
            ¿Seguro que quieres eliminar &quot;{label}&quot;?
          </p>
          <small>Esta acción no se puede revertir.</small>
        </div>

        <div className="flex gap-2">
          <DialogClose asChild>
            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={onConfirm}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
            disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="animate-spin" /> Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
