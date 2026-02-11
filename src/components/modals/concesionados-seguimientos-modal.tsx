import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { EquipoConcesionado } from "../concesionados-agregar-equipos";
import { useEffect, useState } from "react";
import { Imagen } from "../upload-Image";
import ConcesionadosSegEquipos from "../concesionados-seguimientos-table";

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
interface SegArtModalProps {
  data:Concesion
  isSuccess: boolean;
  children: React.ReactNode;
}

export const SeguimientosModalArticuloCon: React.FC<SegArtModalProps> = ({
  data,
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
          Detalle de la Concesión
        </DialogTitle>
      </DialogHeader>
  
  
          <div className="flex justify-start">
            <div className="grid grid-cols-2 gap-6 w-full">
                <div className="w-full flex flex-col gap-2">
                  <p className="font-bold">
                    Folio: <span className="font-normal">{data.folio} </span>
                  </p>

                  <p className="font-bold">
                    Equipos Pendientes: <span className="font-normal">{totalCantidadPendientes}</span>
                  </p>
                </div>
    
                <div className="col-span-1 md:col-span-2">
                  <ConcesionadosSegEquipos equipos={equipos} setEquipos={setEquipos} mode={"vista"}></ConcesionadosSegEquipos>
                </div>
            </div>
          </div>
  
        
       
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
