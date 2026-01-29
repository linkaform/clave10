import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ConcesionadosAgregarEquipos, { EquipoConcesionado } from "../concesionados-agregar-equipos";
import ConcesionadosSeguimientos from "../concesionados-seguimientos";
import { useState } from "react";

interface ViewArtModalProps {
  title: string;
  data:EquipoConcesionado[]
  isSuccess: boolean;
  children: React.ReactNode;
}

export const ViewArticuloCon: React.FC<ViewArtModalProps> = ({
  title,
  children,
}) => {
  const [equipos, setEquipos]=useState<EquipoConcesionado[]>([])
  return (
    <Dialog>
    <DialogTrigger asChild>{children}</DialogTrigger>
  
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl text-center font-bold">
          {title}
        </DialogTitle>
      </DialogHeader>
  
      <Tabs defaultValue="datos" className="w-full mt-4">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="seguimientos">Seguimientos</TabsTrigger>
        </TabsList>
  
        <TabsContent value="datos" className="mt-4">
          <div className="flex justify-start">
            <div className="grid grid-cols-2 gap-6 w-full">
  
              <div className="w-full flex gap-2">
                <p className="font-bold">
                  Ubicación: <span className="font-normal">{} Monterrrey</span>
                </p>
              </div>
  
              <div className="w-full flex gap-2">
                <p className="font-bold">
                  Fecha y hora concesion: <span className="font-normal">{} 12 - 07 - 2026</span>
                </p>
              </div>
  
              <div className="w-full flex gap-2">
                <p className="font-bold">
                  Emplreado: <span className="font-normal">{} Emiliano Zapata</span>
                </p>
              </div>
              <div className="w-full flex gap-2">
                <p className="font-bold">
                  Estado: <span className="text-red-500 font-bold">{} Pendiente</span>
                </p>
              </div>
  
              <div className="col-span-1 md:col-span-2">
                <ConcesionadosAgregarEquipos equipos={equipos} setEquipos={setEquipos} ></ConcesionadosAgregarEquipos>
              </div>
            </div>
          </div>
  
        
        </TabsContent>
  
        <TabsContent value="seguimientos" className="mt-4">
          <div className="space-y-4">
           <div><span className="font-bold">Equipos pendientes:</span><span>4</span> </div> 
              <div className="col-span-1 md:col-span-2">
                <ConcesionadosSeguimientos equipos={[{equipo:"Laptop",unidades:2,precio:"Pendiente"},{equipo:"Laptop",unidades:2,precio:"Completo"}]} setEquipos={setEquipos} ></ConcesionadosSeguimientos>
              </div>
          </div>
        </TabsContent>
      </Tabs>
  
      <div className="flex gap-1 my-5">
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
