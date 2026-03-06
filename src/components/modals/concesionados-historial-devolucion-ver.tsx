import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { Dispatch, SetStateAction } from "react";
import { Box, Calendar, ImageOff, Package, User } from "lucide-react";

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
  comentario_entrega: string;
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
  
  export const HistorialDevolucionesModal: React.FC<HistorialDevolucionesModalProps> = ({
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
              <div className="rounded-xl  overflow-hidden">
  
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
  
                  {devolucion.comentario_entrega && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Comentario</p>
                      <p className="text-sm text-gray-600">{devolucion.comentario_entrega}</p>
                    </div>
                  )}
                </div>
  
                {devolucion?.evidencia_entrega?.length > 0 ? (
                  <div className="px-4 pb-4">
                     <p className="text-xs text-gray-400 mb-0.5">Evidencia de la entrega</p>
                    {/* <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Evidencia</p> */}
                    <div className="flex justify-center">
                      <Carousel className="w-44">
                        <CarouselContent>
                          {devolucion.evidencia_entrega.map((img, i) => (
                            <CarouselItem key={i}>
                              <div className="rounded-xl overflow-hidden border bg-gray-50 aspect-square flex items-center justify-center">
                                <Image
                                  width={200}
                                  height={200}
                                  src={img.file_url || "/nouser.svg"}
                                  alt={img.file_name}
                                  className="w-full h-full object-contain"
                                  unoptimized
                                />
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
                  </div>
                ) : (
                  <div className="px-4 pb-4 flex items-center gap-2 text-gray-300">
                    <ImageOff size={16} />
                    <p className="text-xs">Sin evidencia</p>
                  </div>
                )}

                  {devolucion?.identificacion_entrega?.length > 0 ? (
                  <div className="px-4 pb-4">
                     <p className="text-xs text-gray-400 mb-0.5">Identificación de quien entrega</p>
                    {/* <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Evidencia</p> */}
                    <div className="flex justify-center">
                      <Carousel className="w-44">
                        <CarouselContent>
                          {devolucion.identificacion_entrega.map((img, i) => (
                            <CarouselItem key={i}>
                              <div className="rounded-xl overflow-hidden border bg-gray-50 aspect-square flex items-center justify-center">
                                <Image
                                  width={200}
                                  height={200}
                                  src={img.file_url || "/nouser.svg"}
                                  alt={img.file_name}
                                  className="w-full h-full object-contain"
                                  unoptimized
                                />
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
                  </div>
                ) : (
                  <div className="px-4 pb-4 flex items-center gap-2 text-gray-300">
                    <ImageOff size={16} />
                    <p className="text-xs">Sin evidencia</p>
                  </div>
                )}
  
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