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
import { useEffect, useState } from "react";
import { Imagen } from "../upload-Image";
import { capitalizeFirstLetter } from "@/lib/utils";

export type Concesion = {
  _id: string;
  folio: string;
  status_concesion: string;
  fecha_concesion: string;
  observacion_concesion?: string;
  tipo_persona_solicita: "empleado" | "otro";
  persona_nombre_concesion?: string;
  persona_id_concesion?: number[];
  persona_email_concesion?: string[];
  persona_nombre_otro?: string;
  persona_email_otro?: string;
  persona_identificacion_otro?: Imagen[];

  ubicacion_concesion?: string;
  caseta_concesion?: string;
  firma?:Imagen[]
  grupo_equipos?: EquipoConcesionado[];
};
interface ViewArtModalProps {
  title: string;
  data:Concesion
  isSuccess: boolean;
  children: React.ReactNode;
}

export const ViewArticuloCon: React.FC<ViewArtModalProps> = ({
  data,
  title,
  children,
}) => {
  const [equipos, setEquipos]=useState<EquipoConcesionado[]>([])

  useEffect(()=>{
    if(data.grupo_equipos){
      setEquipos(data.grupo_equipos)
    }
  },[data])
  const totalCantidadPendientes = equipos
  .filter(item => item.status_concesion_equipo === "pendiente")
  .reduce((acc, item) => acc + (item.cantidad_equipo_concesion ?? 0), 0);

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
                  Ubicación: <span className="font-normal">{data.ubicacion_concesion} </span>
                </p>
              </div>
  
              <div className="w-full flex gap-2">
                <p className="font-bold">
                  Fecha y hora concesion: <span className="font-normal">{data.fecha_concesion}</span>
                </p>
              </div>
  
              <div className="w-full flex gap-2">
                <p className="font-bold">
                  Emplreado: <span className="font-normal">{data.persona_nombre_concesion}</span>
                </p>
              </div>
              <div className="w-full flex gap-2">
                <p className="font-bold">
                  Estado: <span className="text-red-500 font-bold">{capitalizeFirstLetter(data.status_concesion)}</span>
                </p>
              </div>
  
              <div className="col-span-1 md:col-span-2">
                <ConcesionadosAgregarEquipos equipos={equipos} setEquipos={setEquipos} mode={"editar"}></ConcesionadosAgregarEquipos>
              </div>
            </div>
          </div>
  
        
        </TabsContent>
  
        <TabsContent value="seguimientos" className="mt-4">
          <div className="space-y-4">
           <div><span className="font-bold">Equipos pendientes: </span><span>{totalCantidadPendientes}</span> </div> 
              <div className="col-span-1 md:col-span-2">
                <ConcesionadosSeguimientos equipos={equipos} setEquipos={setEquipos} mode={"vista"}></ConcesionadosSeguimientos>
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
