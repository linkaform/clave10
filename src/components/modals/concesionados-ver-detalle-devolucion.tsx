import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Dispatch, SetStateAction } from "react";
import { ImageOff, Package, RotateCcw } from "lucide-react";
import ViewImage from "./view-image";

export interface DevolucionItem {
  id_movimiento_devolucion: string;
  estatus_equipo: string;
  fecha_devolucion_concesion: string;
  quien_entrega: string;
  quien_entrega_company: string | null;
  entregado_por: string;
  cantidad_devolucion: { source: string; parsedValue: number };
  evidencia_entrega: { file_name: string; file_url: string }[];
  identificacion_entrega: { file_name: string; file_url: string }[];
  comentario_entrega:  string|null;
}
const labelClass = "text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5";

const estatusBadge = (estatus: string) => {
  const map: Record<string, string> = {
    completo: "bg-green-100 text-green-700 border-green-300",
    damage: "bg-red-100 text-red-600 border-red-300",
    dañado: "bg-red-100 text-red-600 border-red-300",
    perdido: "bg-red-100 text-red-600 border-red-300",
    pendiente: "bg-yellow-100 text-yellow-700 border-yellow-300",
    "en proceso": "bg-yellow-100 text-yellow-700 border-yellow-300",
  };
  return map[estatus?.toLowerCase()] ?? "bg-gray-100 text-gray-600 border-gray-300";
};

interface HistorialDevolucionesModalProps {
    devolucion: DevolucionItem | null;
    children: React.ReactNode;
    setIsSuccess: Dispatch<SetStateAction<boolean>>;
    isSuccess: boolean;
  }
  
  export const VerDetalleDevolucion: React.FC<HistorialDevolucionesModalProps> = ({
    devolucion,
    children,
    setIsSuccess,
    isSuccess,
  }) => {
 
    return (
      <Dialog open={isSuccess} onOpenChange={setIsSuccess}>
        <DialogTrigger asChild>{children}</DialogTrigger>
  
        <DialogContent
          className="max-w-2xl flex flex-col gap-0 bg-white p-0 max-h-[90vh] overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
            <DialogTitle className="text-2xl text-center font-bold text-gray-800">
              Detalle de Devolución
            </DialogTitle>
            <p className="text-center text-sm text-gray-400">Información del registro</p>
          </DialogHeader>
  
          <div className="flex-grow overflow-y-auto px-6 pt-3 pb-4">
            {!devolucion ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                <Package size={28} className="text-gray-300" />
                <p className="text-sm">Sin datos</p>
              </div>
            ) : (
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="text-blue-500 w-5 h-5" />
                    <h3 className="font-semibold text-gray-700">Información de la devolución</h3>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full border text-sm font-semibold capitalize ${estatusBadge(devolucion.estatus_equipo)}`}>
                    {devolucion.estatus_equipo}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className={labelClass}>Fecha</p>
                    <p className="text-sm text-gray-700">{devolucion?.fecha_devolucion_concesion || "—"}</p>
                  </div>

                  <div>
                    <p className={labelClass}>Unidades</p>
                    <p className="text-sm text-gray-700">{Number(devolucion?.cantidad_devolucion?.parsedValue ?? devolucion?.cantidad_devolucion) || "—"}</p>
                  </div>

                  <div>
                    <p className={labelClass}>
                      Persona que devuelve{devolucion?.entregado_por ? ` (${devolucion.entregado_por})` : ""}
                    </p>
                    <p className="text-sm text-gray-700">{devolucion?.quien_entrega || "—"}</p>
                  </div>

                  <div>
                    <p className={labelClass}>Comentario</p>
                    {devolucion.comentario_entrega?.trim() ? (
                      <p className="text-sm text-gray-700">{devolucion.comentario_entrega}</p>
                    ) : (
                      <p className="text-sm italic text-gray-400">Sin comentario disponible</p>
                    )}
                  </div>

                  {devolucion?.quien_entrega_company && (
                    <div>
                      <p className={labelClass}>Empresa</p>
                      <p className="text-sm text-gray-700">{devolucion.quien_entrega_company}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-6 items-start border-t border-gray-100 pt-4">
                  <div>
                    <p className={`${labelClass} mb-2`}>Evidencia de devolución</p>
                    {devolucion?.evidencia_entrega?.length > 0 ? (
                      <div className="flex justify-center">
                        <div className={`inline-flex items-center rounded-xl border bg-gray-50 overflow-hidden ${devolucion.evidencia_entrega.length > 1 ? "pr-2" : ""}`}>
                          <ViewImage imageUrl={devolucion.evidencia_entrega} size="lg" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col gap-1 items-center justify-center text-center px-2">
                          <ImageOff className="w-5 h-5 text-gray-300" />
                          <p className="text-xs text-gray-400">Sin evidencia</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className={`${labelClass} mb-2`}>Identificación de quien devuelve</p>
                    {devolucion?.identificacion_entrega?.length > 0 ? (
                      <div className="flex justify-center">
                        <div className={`inline-flex items-center rounded-xl border bg-gray-50 overflow-hidden ${devolucion.identificacion_entrega.length > 1 ? "pr-2" : ""}`}>
                          <ViewImage imageUrl={devolucion.identificacion_entrega} size="lg" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col gap-1 items-center justify-center text-center px-2">
                          <ImageOff className="w-5 h-5 text-gray-300" />
                          <p className="text-xs text-gray-400">Sin identificación</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
  
          <div className="flex-shrink-0 bg-white border-t px-6 py-4">
            <DialogClose asChild>
              <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium">
                Cerrar
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    );
  };