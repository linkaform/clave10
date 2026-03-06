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
import TabDatos, { EquipoConcesionado } from "../concesionados-tab-datos";
import { useEffect, useState } from "react";
import { Imagen } from "../upload-Image";
import { capitalizeFirstLetter } from "@/lib/utils";
import { Building2, Calendar, ClipboardList, User } from "lucide-react";
import TabSeguimientos from "../concesionados-tab-seguimientos";

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
  firma?: Imagen[];
  grupo_equipos?: EquipoConcesionado[];
};

interface ViewArtModalProps {
  data: Concesion;
  isSuccess: boolean;
  children: React.ReactNode;
}

const getStatusStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case "abierto":
    case "pendiente": return "bg-red-100 text-red-700 border-red-200";
    case "parcial": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "en proceso": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "completo":
    case "cerrado": return "bg-green-100 text-green-700 border-green-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

export const DetalleDeLaConcesion: React.FC<ViewArtModalProps> = ({ data, children }) => {
  const [equipos, setEquipos] = useState<EquipoConcesionado[]>([]);

  useEffect(() => {
    if (data.grupo_equipos) setEquipos(data.grupo_equipos);
  }, [data]);
  const totalCantidadPendientes = equipos
    .filter((item) => item.status_concesion_equipo === "pendiente")
    .reduce((acc, item) => acc + (item.cantidad_equipo_concesion ?? 0), 0);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white p-0 overflow-hidden">

        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">
            Detalle de la Concesión
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">Folio: {data.folio}</p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6 ">
          <Tabs defaultValue="datos" className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-white border border-gray-200 rounded-xl p-1 mb-4">
              <TabsTrigger value="datos" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Datos
              </TabsTrigger>
              <TabsTrigger value="seguimientos" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Seguimientos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="datos" className="space-y-4 mt-0">

              <div className="p-5 py-0">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="text-blue-500 w-5 h-5" />
                  <h3 className="font-semibold text-gray-700">Información general</h3>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Ubicación</p>
                      <p className="text-sm text-gray-700">{data.ubicacion_concesion || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Fecha y hora</p>
                      <p className="text-sm text-gray-700">{data.fecha_concesion || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Empleado</p>
                      <p className="text-sm text-gray-700">{data.persona_nombre_concesion || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Estado</p>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusStyle(data.status_concesion)}`}>
                        {capitalizeFirstLetter(data.status_concesion)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className=" p-5 py-0">
                <TabDatos equipos={equipos} setEquipos={setEquipos} mode="vista" />
              </div>
            </TabsContent>

            <TabsContent value="seguimientos" className="space-y-4 mt-0">
              <div className=" p-5 py-0">
                <div className="flex items-center justify-between ">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="text-blue-500 w-5 h-5" />
                    <h3 className="font-semibold text-gray-700">Seguimientos</h3>
                  </div>
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 ">
                    <span className="text-xs font-semibold text-red-500">Pendientes:</span>
                    <span className="text-sm font-bold text-red-600">{totalCantidadPendientes}</span>
                  </div>
                </div>
                <TabSeguimientos equipos={equipos} setEquipos={setEquipos} mode="vista" dataConcesion={data}/>
              </div>
            </TabsContent>
          </Tabs>
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