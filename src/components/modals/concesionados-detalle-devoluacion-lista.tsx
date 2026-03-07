import { Box, Calendar, Eye, User } from "lucide-react";
import { useState } from "react";
import { VerDetalleDevolucion } from "./concesionados-ver-detalle-devolucion";

interface HistorialDevolucionesListProps {
  devoluciones: any[];
}

export const HistorialDevolucionesList: React.FC<HistorialDevolucionesListProps> = ({
  devoluciones,
}) => {
  const [verDevolucionModal, setVerDevolucionModal] = useState(false);
  const [devolucionSeleccionada, setDevolucionSeleccionada] = useState<any>(null);

  if (!devoluciones || devoluciones.length === 0) return null;

  return (
    <div className="col-span-2 mt-2 px-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Sobre las devoluciones ({devoluciones.length})
      </p>
      <div className="flex flex-col gap-2">
      {devoluciones.map((devItem: any, index: number) => (
            <div
                key={index}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3 relative"
            >
                <button
                type="button"
                onClick={() => {
                    setDevolucionSeleccionada(devItem);
                    setVerDevolucionModal(true);
                }}
                className="absolute top-2.5 right-2.5 text-blue-400 hover:text-blue-600 transition-colors"
                >
                <Eye className="w-5 h-5" />
                </button>

                <div className="flex flex-col gap-1 pr-7">
                <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="text-xs text-gray-500">Fecha:</span>
                    <span className="text-xs font-medium text-gray-700">{devItem.fecha_devolucion_concesion || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-gray-500">Entrega:</span>
                    <span className="text-xs font-medium text-gray-700">{devItem.quien_entrega || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Box className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-gray-500">Unidades devueltas:</span>
                    <span className="text-xs font-medium text-gray-700">{devItem.cantidad_devolucion || "-"}</span>
                </div>
                </div>
            </div>
            ))}
      </div>

      <VerDetalleDevolucion
        devolucion={devolucionSeleccionada}
        isSuccess={verDevolucionModal}
        setIsSuccess={setVerDevolucionModal}
      >
        <div />
      </VerDetalleDevolucion>
    </div>
  );
};