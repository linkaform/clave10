import { ConcesionadosSeguimientoContenido } from "../concesionados-seguimientos-contenido";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useState } from "react";
import { Concesion } from "./concesionados-detalle-de-la-concesion";

interface SegArtModalProps {
  data: Concesion;
  isSuccess: boolean;
  children: React.ReactNode;
}

export const DetalleDelSeguimiento: React.FC<SegArtModalProps> = ({ data, children }) => {
  const [detalleSeg, setDetalleSeg] = useState<boolean>(false);

  return (
    <Dialog open={detalleSeg} onOpenChange={setDetalleSeg}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white p-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">
            Detalle del Seguimiento
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">Folio: {data.folio}</p>
        </DialogHeader>

        <ConcesionadosSeguimientoContenido
          data={data}
          onClose={() => setDetalleSeg(false)}
          type="seg"
        />
      </DialogContent>
    </Dialog>
  );
};