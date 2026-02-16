import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle, Users, Loader2 } from "lucide-react";

interface ForceQuitConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  locationName?: string;
  isLoading?: boolean;
  personasDentro: number;
}

const ForceQuitConfirmationModal: React.FC<ForceQuitConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  locationName,
  isLoading = false,
  personasDentro
}) => {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <div className="bg-gradient-to-br from-red-600 to-red-700 p-8 flex flex-col items-center justify-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_30%_30%,#fff_0%,transparent_70%)] pointer-events-none" />
          <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm border border-white/30 animate-in zoom-in-50 duration-500 relative">
            <Users className="w-12 h-12 text-white" />
            <div className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
              {personasDentro}
            </div>
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-3xl font-extrabold text-center tracking-tight text-white">
              Salida Masiva
            </DialogTitle>
            <DialogDescription className="text-red-100 text-center font-medium opacity-90">
              Se marcará salida a las <span className="font-bold text-white underline decoration-2 underline-offset-4">{personasDentro} personas</span> que se encuentran dentro de la ubicación seleccionada.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6 bg-white">
          <div className="flex items-start gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100/50 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="bg-amber-100 p-2 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                ACCIÓN IRREVERSIBLE
              </h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                ¿Estás seguro de que deseas registrar la salida de todas las personas dentro en{" "}
                <span className="font-bold text-amber-950 inline-block px-1 bg-amber-200/50 rounded">
                  {locationName}
                </span>?
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="destructive"
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-red-200 transition-all hover:scale-[1.02] active:scale-[0.98] bg-red-600 hover:bg-red-700 border-b-4 border-red-800 active:border-b-0 active:mt-1 group"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <span className="flex items-center gap-2">
                  Confirmar
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full h-12 text-gray-500 font-semibold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForceQuitConfirmationModal;