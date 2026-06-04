import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "¿Estás seguro?",
  description = "Esta acción no se puede deshacer.",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogOverlay className="pointer-events-auto" />
      <DialogContent
        className="max-w-sm rounded-2xl p-0 gap-0 border-none pointer-events-auto bg-white"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby=""
      >
        <div className="flex flex-col items-center px-6 pt-7 pb-6 gap-4 bg-white rounded-2xl">
          <div className="bg-red-50 p-3 rounded-full">
            <AlertTriangle className="text-red-500" size={24} />
          </div>

          <div className="text-center space-y-1">
            <DialogTitle className="text-base font-semibold text-gray-800">
              {title}
            </DialogTitle>
            <p className="text-sm text-gray-500 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex gap-2 w-full mt-1">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-10 text-sm"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              className="flex-1 rounded-xl h-10 text-sm bg-red-500 hover:bg-red-600 text-white"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading
                ? <><Loader2 className="animate-spin mr-1.5" size={14} />Procesando...</>
                : confirmText
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}