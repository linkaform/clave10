import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle, PackageX, Loader2 } from "lucide-react";
import { ConcesionAbierta } from "@/lib/articulos-concesionados";

interface ForzarDevolucionEquipoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nombreEquipo: string;
  concesionAbierta?: ConcesionAbierta;
  isLoading?: boolean;
}

export const ForzarDevolucionEquipoModal: React.FC<ForzarDevolucionEquipoModalProps> = ({
  open,
  onClose,
  onConfirm,
  nombreEquipo,
  concesionAbierta,
  isLoading = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <div className="bg-gradient-to-br from-red-600 to-red-700 p-8 flex flex-col items-center justify-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_30%_30%,#fff_0%,transparent_70%)] pointer-events-none" />
          <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm border border-white/30 animate-in zoom-in-50 duration-500 relative">
            <PackageX className="w-12 h-12 text-white" />
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl font-extrabold text-center tracking-tight text-white">
              Equipo ya prestado
            </DialogTitle>
            <DialogDescription className="text-red-100 text-center font-medium opacity-90">
              <span className="font-bold text-white underline decoration-2 underline-offset-4">
                {nombreEquipo}
              </span>{" "}
              tiene una concesión abierta sin devolver.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6 bg-white">
          {concesionAbierta && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Folio</span>
                <span className="font-semibold text-gray-700">{concesionAbierta.folio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Prestado a</span>
                <span className="font-semibold text-gray-700">{concesionAbierta.persona_nombre_concesion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Desde</span>
                <span className="font-semibold text-gray-700">{concesionAbierta.fecha_concesion}</span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100/50 shadow-sm">
            <div className="bg-amber-100 p-2 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 mb-1">
                ACCIÓN IRREVERSIBLE
              </h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                Forzar la devolución cerrará esa concesión como si el equipo ya se
                hubiera regresado, y permitirá continuar agregándolo a la nueva
                concesión. Verifica antes con la persona que lo tiene.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="destructive"
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-red-200 transition-all hover:scale-[1.02] active:scale-[0.98] bg-red-600 hover:bg-red-700 border-b-4 border-red-800 active:border-b-0 active:mt-1"
              onClick={onConfirm}
              disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Forzando devolución...
                </>
              ) : (
                "Forzar devolución y continuar"
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full h-12 text-gray-500 font-semibold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all"
              onClick={onClose}
              disabled={isLoading}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
