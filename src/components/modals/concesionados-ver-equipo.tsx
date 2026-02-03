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
import { formatCurrency } from "@/lib/utils";

interface ConcesionadosVerEquipoProps {
  title: string;
  data:EquipoConcesionado
  children: React.ReactNode;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  isSuccess:boolean;
}

export const ConcesionadosVerEquipo: React.FC<ConcesionadosVerEquipoProps> = ({
  title,
  data,
  children,
  setIsSuccess,
  isSuccess
}) => {
  return (
    <Dialog open={isSuccess}  onOpenChange={setIsSuccess}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg overflow-scroll"  onInteractOutside={(e) => e.preventDefault()} >
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-start">
        <div className="grid grid-cols-2 gap-6">
            
            <div className="w-full flex gap-2">
            <p className="font-bold">
                Categoría: <span className="font-normal">{data?.categoria|| data?.categoria_equipo_concesion}</span>
            </p>
            </div>

            <div className="w-full flex gap-2">
            <p className="font-bold">
                Equipo: <span className="font-normal">{data?.equipo||data?.nombre_equipo}</span>
            </p>
            </div>

            <div className="col-span-2 w-full flex gap-2">
            <p className="font-bold">
                Unidades: <span className="font-normal">{data?.unidades||data?.cantidad_equipo_concesion}</span>
            </p>
            </div>

            <div className="w-full flex gap-2">
            <p className="font-bold text-blue-500 ">
                Precio Unitario($) <span className="font-normal">{data?.precio ?formatCurrency(data?.precio):"-"}</span>
            </p>
            </div>
            <div className="w-full flex gap-2">
            <p className="font-bold  text-blue-500 ">
                Subtotal($) <span className="font-normal">{data?.total?formatCurrency(data?.total):"-"}</span>
            </p>
            </div>



            <div className="w-full flex gap-2">
            <p className="font-bold">
                Comentario: <span className="font-normal">{data?.comentarios||data?.comentario_entrega}</span>
            </p>
            </div>

        </div>
        </div>
    
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
