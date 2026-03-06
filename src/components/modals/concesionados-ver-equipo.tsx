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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { EquipoConcesionado } from "../concesionados-tab-datos";
import { Dispatch, SetStateAction, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Box, Calculator, Calendar, Eye, ImageOff, Package, User } from "lucide-react";
import { DevolucionItem, HistorialDevolucionesModal } from "./concesionados-historial-devolucion-ver";

interface ConcesionadosVerEquipoProps {
  title: string;
  data: EquipoConcesionado;
  children: React.ReactNode;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  isSuccess: boolean;
  dataConcesion:any
}

export const ConcesionadosVerEquipo: React.FC<ConcesionadosVerEquipoProps> = ({
  title,
  data,
  children,
  setIsSuccess,
  isSuccess,
  dataConcesion
}) => {
  const getCosto = (costo: number | number[] | undefined): number => {
    if (Array.isArray(costo)) return costo[0] ?? 0;
    return costo ?? 0;
  };
  const subtotal = data?.total
    ? data.total
    : (data?.cantidad_equipo_concesion ?? 0) * getCosto(data.costo_equipo_concesion);
  console.log("data", data)

  const [verDevolucionModal, setVerDevolucionModal] = useState(false);
  const [devolucionSeleccionada, setDevolucionSeleccionada] = useState<DevolucionItem | null>(null);

  
    return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="max-w-md flex flex-col bg-white p-0 max-h-[90vh] overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">
            {title}
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">Detalle del equipo concesionado</p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">

          <div className=" p-5 py-0">
            <div className="flex items-center gap-2 mb-1">
              <Package className="text-blue-500 w-5 h-5" />
              <h3 className="font-semibold text-gray-700">Información del equipo</h3>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Categoría</p>
                <p className="text-sm text-gray-700">{data?.categoria_equipo_concesion || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Equipo</p>
                <p className="text-sm text-gray-700">{data?.nombre_equipo || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Unidades</p>
                <p className="text-sm text-gray-700">{data?.cantidad_equipo_devuelto} / {data?.cantidad_equipo_concesion ?? "—"}</p>
              </div>

              {data?.comentario_entrega && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Comentario</p>
                  <p className="text-sm text-gray-700">{data.comentario_entrega}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <div className="flex-1 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                <Calculator size={14} className="text-blue-400" />
                <div>
                  <p className="text-xs text-blue-400 font-medium">Precio unitario</p>
                  <p className="text-sm font-bold text-blue-700">{formatCurrency(getCosto(data?.costo_equipo_concesion))}</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                <Calculator size={14} className="text-blue-500" />
                <div>
                  <p className="text-xs text-blue-400 font-medium">Subtotal</p>
                  <p className="text-sm font-bold text-blue-700">{formatCurrency(subtotal)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className=" p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Evidencia</h3>

            {data?.imagen_equipo_concesion && data.imagen_equipo_concesion.length > 0 ? (
              <div className="flex justify-center">
                <Carousel className="w-52">
                  <CarouselContent>
                    {data.imagen_equipo_concesion.map((a, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <div className="rounded-xl overflow-hidden border bg-gray-50 aspect-square flex items-center justify-center">
                            <Image
                              width={280}
                              height={280}
                              src={a.file_url || "/nouser.svg"}
                              alt="Evidencia"
                              className="w-full h-full object-contain"
                              unoptimized
                            />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {data.imagen_equipo_concesion.length > 1 && (
                    <>
                      <CarouselPrevious type="button" />
                      <CarouselNext type="button" />
                    </>
                  )}
                </Carousel>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-gray-400">
                <ImageOff size={28} className="text-gray-300" />
                <p className="text-sm">No hay evidencias disponibles</p>
              </div>
            )}
          </div>
          {(() => {
          const devoluciones = dataConcesion?.grupo_equipos_devolucion?.filter(
            (d:any) => d.id_movimiento_devolucion === data.id_movimiento
          ) || [];
          return devoluciones.length > 0 ? (
            <div className="col-span-2 mt-2 px-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Sobre las devoluciones ({devoluciones.length})
              </p>
              <div className="flex flex-col gap-2">
                {devoluciones.map((devItem:any, index:number) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-3 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-gray-500">Fecha:</span>
                      <span className="text-xs font-medium text-gray-700">{devItem.fecha_devolucion_concesion||"-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="text-xs text-gray-500">Entrega:</span>
                      <span className="text-xs font-medium text-gray-700">{devItem.quien_entrega||"-"} </span>
                      <button
                        type="button"
                          onClick={() => {
                            setDevolucionSeleccionada(devItem);
                            setVerDevolucionModal(true);
                          }}
                          className="text-blue-400 hover:text-blue-600 transition-colors ml-20"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="text-xs text-gray-500">Unidades devueltas:</span>
                      <span className="text-xs font-medium text-gray-700">{devItem.cantidad_devolucion||"-"}</span>
                    </div>
                  
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}
        </div>
        <HistorialDevolucionesModal
          devolucion={devolucionSeleccionada}
          isSuccess={verDevolucionModal}
          setIsSuccess={setVerDevolucionModal}
        >
          <div />
        </HistorialDevolucionesModal>
      
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