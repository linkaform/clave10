import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, PackageX } from "lucide-react";
import { ConcesionAbierta } from "@/lib/articulos-concesionados";

interface ForzarDevolucionEquipoModalProps {
  open: boolean;
  onClose: () => void;
  onForzarConcesion: (concesion: ConcesionAbierta) => void;
  nombreEquipo: string;
  concesionesAbiertas: ConcesionAbierta[];
  forzandoRecordId?: string | null;
}

export const ForzarDevolucionEquipoModal: React.FC<ForzarDevolucionEquipoModalProps> = ({
  open,
  onClose,
  onForzarConcesion,
  nombreEquipo,
  concesionesAbiertas,
  forzandoRecordId,
}) => {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        className="max-w-xl max-h-[90vh] flex flex-col bg-white p-0"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby="">
        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800 flex items-center justify-center gap-2">
            <PackageX className="w-6 h-6 text-red-500" />
            Equipo ya prestado
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">
            <span className="font-semibold text-gray-600">{nombreEquipo}</span>{" "}
            tiene {concesionesAbiertas.length > 1 ? "concesiones abiertas" : "una concesión abierta"} sin devolver
          </p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6 py-5 space-y-3">
          {concesionesAbiertas.map((concesion) => {
            const forzandoEsta = forzandoRecordId === concesion._id;
            const persona = concesion.persona_nombre_concesion || concesion.persona_nombre_otro || "Sin nombre registrado";
            return (
              <div
                key={concesion._id}
                className="flex items-center justify-between gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                <div className="text-sm space-y-1">
                  <div className="flex gap-2">
                    <span className="text-gray-400">Folio:</span>
                    <span className="font-semibold text-gray-700">{concesion.folio}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400">Prestado a:</span>
                    <span className="font-semibold text-gray-700">{persona}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400">Desde:</span>
                    <span className="font-semibold text-gray-700">{concesion.fecha_concesion}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  className="shrink-0 bg-red-600 hover:bg-red-700"
                  disabled={!!forzandoRecordId}
                  onClick={() => onForzarConcesion(concesion)}>
                  {forzandoEsta ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Forzando...
                    </>
                  ) : (
                    "Forzar devolución"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
