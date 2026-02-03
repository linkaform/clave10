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
import { Card, CardContent } from "../ui/card";
import { EquipoConcesionado } from "../concesionados-agregar-equipos";
import { Dispatch, SetStateAction } from "react";
import { History } from "lucide-react";
import HistorialDevoluciones, { Devolucion } from "../concesionados-historial-devoluciones";

interface ConcesionadosDetalleSeguimientoProps {
  title: string;
  data:EquipoConcesionado
  children: React.ReactNode;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  isSuccess:boolean;
}

export const ConcesionadosDetalleSeguimiento: React.FC<ConcesionadosDetalleSeguimientoProps> = ({
  title,
  data,
  children,
  setIsSuccess,
  isSuccess
}) => {

  const devolucionesDemo: Devolucion[] = [
    {
      id: 1,
      unidadesDevueltas: 1,
      unidadesTotales: 2,
      estatus: "En Proceso",
      progreso: 50,
      fecha: "15/01/2024",
      equipo: "Laptop Dell XPS 15",
      solicitante: "Juan Pérez Martínez",
      motivo: "Equipo defectuoso - pantalla con fallas",
      comentarios: "La pantalla presenta líneas verticales intermitentes. Se ha devuelto una unidad para revisión técnica.",
    },
    {
      id: 2,
      unidadesDevueltas: 3,
      unidadesTotales: 3,
      estatus: "abierto",
      progreso: 100,
      fecha: "10/01/2024",
      equipo: "Monitor LG UltraWide 34 pulgadas",
      solicitante: "María García López",
      motivo: "Finalización de proyecto",
      fechaDevolucion: "20/01/2024",
      comentarios: "Devolución completa de equipos asignados al proyecto X. Todos los monitores en excelente estado.",
    },
    {
      id: 3,
      unidadesDevueltas: 0,
      unidadesTotales: 5,
      estatus: "pendiente",
      progreso: 0,
      fecha: "25/01/2024",
      equipo: "Teclado Mecánico Logitech MX Keys",
      solicitante: "Carlos López Ramírez",
      motivo: "Cambio de área - Transferencia a oficina remota",
      comentarios: "Pendiente coordinar fecha de devolución con el empleado.",
    },
  ];
  console.log("data",data)

  // const devolucionesFiltradas = devolucionesDemo.filter(
  //   (devolucion) => devolucion.estatus.toLowerCase() === (data.status_concesion_equipo?.toLowerCase() ?? "")
  // );
  return (
    <Dialog open={isSuccess}  onOpenChange={setIsSuccess}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg overflow-scroll"  onInteractOutside={(e) => e.preventDefault()} >
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="font-bold">Sobre el equipo</div>

        <div className="flex justify-start">
        <div className="grid grid-cols-2 gap-6">
            
            <div className="w-full flex gap-2">
            <p className="font-bold">
                Categoría: <span className="font-normal">{data?.cantidad_equipo_concesion}</span>
            </p>
            </div>

            <div className="w-full flex gap-2">
            <p className="font-bold">
                Equipo: <span className="font-normal">{data?.nombre_equipo}</span>
            </p>
            </div>
        </div>
        </div>

        <div className="flex gap-2">
        <History className="text-green-500"/> HISTORIAL DE DEVOLUCIONES
        </div>
        <HistorialDevoluciones devoluciones={devolucionesDemo}></HistorialDevoluciones>

        {data?.evidencia && data?.evidencia.length>0 ?
        <div className="w-full flex flex-col">
            <p className="font-bold mb-2">Evidencia: </p>
            <div className="flex justify-center">
                <Carousel className="w-36 ">
                    <CarouselContent>
                        {data?.evidencia.map((a, index) => (
                        <CarouselItem key={index}>
                            <div className="p-1">
                            <Card>
                                <CardContent className="flex aspect-square items-center justify-center p-0">
                                    <Image
                                        width={280}
                                        height={280}
                                        src= {a.file_url || "/nouser.svg"}
                                        alt="Imagen"
                                        className="w-42 h-42 object-contain bg-gray-200 rounded-lg" 
                                    />
                                </CardContent>
                            </Card>
                            </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>
        </div>
        :
            <div className="mt-2">
                <p className="font-bold">Evidencia: </p>
                <div className="text-gray-500">
                    No hay evidencias disponibles.
                </div>
            </div>
         }
      

        <div className="flex  gap-1 my-5">
          <DialogClose asChild>
            <Button className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700">
              Cerrar
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
