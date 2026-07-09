import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { Dispatch, SetStateAction } from "react";
import { Box, Calendar, IdCard, ImageIcon, MessageCircleCodeIcon, Package, User } from "lucide-react";
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
const estatusBadge = (estatus: string) => {
  const map: Record<string, string> = {
    completo: "bg-green-100 text-green-700",
    damage: "bg-red-100 text-red-600",
    dañado: "bg-red-100 text-red-600",
    perdido: "bg-red-100 text-red-600",
    pendiente: "bg-yellow-100 text-yellow-700",
    "en proceso": "bg-yellow-100 text-yellow-700",
  };
  return map[estatus?.toLowerCase()] ?? "bg-gray-100 text-gray-600";
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
          className="max-w-lg flex flex-col bg-white p-0 max-h-[90vh] overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
            <DialogTitle className="text-2xl text-center font-bold text-gray-800">
              Detalle de Devolución
            </DialogTitle>
            <p className="text-center text-sm text-gray-400">Información del registro</p>
          </DialogHeader>
  
          <div className="flex-grow overflow-y-auto px-6 py-4">
            {!devolucion ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                <Package size={28} className="text-gray-300" />
                <p className="text-sm">Sin datos</p>
              </div>
            ) : (
             <div className="rounded-xl overflow-hidden">
                <div className="flex items-center justify-between ">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Estado de la devolución
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${estatusBadge(devolucion.estatus_equipo)}`}>
                    {devolucion.estatus_equipo}
                  </span>
                </div>

                <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Fecha</p>
                      <p className="text-sm font-medium text-gray-700">{devolucion?.fecha_devolucion_concesion || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Box className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Unidades</p>
                      <p className="text-sm font-medium text-gray-700">{Number(devolucion?.cantidad_devolucion)} </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 col-span-2">
                    <User className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Entregado por ({devolucion?.entregado_por})</p>
                      <p className="text-sm font-medium text-gray-700">{devolucion?.quien_entrega}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 col-span-2">
                    <MessageCircleCodeIcon className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Comentario</p>
                      <p className="text-sm text-gray-600">{devolucion.comentario_entrega || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 col-span-2">
                    <ImageIcon className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                   <div className="w-full">
                        <p className="text-xs text-gray-400 mb-2">Evidencia de devolución</p>
                        {devolucion?.evidencia_entrega?.length > 0 ? (
                          <div className="flex justify-center">
                            <Carousel >
                              <CarouselContent>
                                {devolucion.evidencia_entrega.map((img, i) => (
                                  <CarouselItem key={i}>
                                    <div className="rounded-xl overflow-hidden border bg-gray-50 aspect-square flex items-center justify-center">
                                      <ViewImage imageUrl={img} size="lg" />
                                    </div>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              {devolucion.evidencia_entrega.length > 1 && (
                                <>
                                  <CarouselPrevious type="button" />
                                  <CarouselNext type="button" />
                                </>
                              )}
                            </Carousel>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-400">
                            <p className="text-xs">Sin evidencia de devolución disponible</p>
                          </div>
                        )}
                      </div>
                  </div>
                </div>

               <div className="mx-4 mb-4 p-4 rounded-xl border-2 border-blue-100 bg-blue-50/50">
                  <div className="flex items-center gap-1.5 mb-3">
                    <IdCard className="w-4 h-4 text-blue-500" />
                    <p className="text-sm font-bold text-blue-600">Identificación de quien realiza la devolución</p>
                  </div>
                  {devolucion?.identificacion_entrega?.length > 0 ? (
                    <div className="flex justify-center">
                      <Carousel>
                        <CarouselContent>
                          {devolucion.identificacion_entrega.map((img, i) => (
                            <CarouselItem key={i}>
                              <div className="rounded-xl overflow-hidden border-2 border-blue-200 bg-white aspect-square flex items-center justify-center">
                                <ViewImage imageUrl={img} size="lg" />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {devolucion.identificacion_entrega.length > 1 && (
                          <>
                            <CarouselPrevious type="button" />
                            <CarouselNext type="button" />
                          </>
                        )}
                      </Carousel>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400">
                      <p className="text-xs">Sin identificación disponible</p>
                    </div>
                  )}
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