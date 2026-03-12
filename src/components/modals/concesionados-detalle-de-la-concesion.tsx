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
import { Building2, Calendar, CircleDot, ClipboardList, IdCard, PenLine, User } from "lucide-react";
import TabSeguimientos from "../concesionados-tab-seguimientos";
import Image from "next/image";

export type Concesion = {
  _id: string;
  folio: string;
  status_concesion: string;
  fecha_concesion: string;
  observacion_concesion?: string;
  tipo_persona_solicita: string
  persona_nombre_concesion?: string;
  persona_id_concesion?: number[];
  persona_email_concesion?: string[];
  persona_nombre_otro?: string;
  persona_email_otro?: string;
  persona_identificacion_otro?: Imagen[];
  ubicacion_concesion?: string;
  caseta_concesion?: string;
  firma?: Imagen;
  grupo_equipos?: EquipoConcesionado[];
  grupo_equipos_devolucion?: any;
  equipos?: EquipoConcesionado[];
};

interface ViewArtModalProps {
  data: Concesion;
  isSuccess: boolean;
  children: React.ReactNode;
}

const estatusStyle: Record<string, string> = {
  abierto: "bg-red-100 text-red-600 border-red-200",
  parcial: "bg-yellow-100 text-yellow-700 border-yellow-200",
  devuelto: "bg-green-100 text-green-700 border-green-200",
};

export const DetalleDeLaConcesion: React.FC<ViewArtModalProps> = ({ data, children }) => {
  const [equipos, setEquipos] = useState<EquipoConcesionado[]>([]);

  useEffect(() => {
    if (data.grupo_equipos) setEquipos(data.grupo_equipos);
  }, [data]);

  const empleado =
    data?.persona_nombre_concesion ||
    data?.persona_nombre_otro ||
    "—";
  const estatus = data?.status_concesion ?? "";
  const firmaRaw = Array.isArray(data?.firma)
    ? data.firma[0]
    : data?.firma;
  const firma = firmaRaw?.file_url ? firmaRaw : null;
  const identificacionRaw =
    data?.persona_identificacion_otro?.[0] ||
    data?.grupo_equipos_devolucion?.[0]?.identificacion_entrega?.[0];
  const identificacion = identificacionRaw?.file_url ? identificacionRaw : null;

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
      <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Área</p>
        <p className="text-sm text-gray-700">{ data.caseta_concesion || "—"}</p>
      </div>
    </div>

    <div className="flex items-start gap-2">
      <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Fecha y hora</p>
        <p className="text-sm text-gray-700">{data.fecha_concesion || "—"}</p>
      </div>
    </div>

    <div className="flex items-start gap-2.5">
      <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Empleado</p>
        <p className="text-sm font-medium text-gray-700">{empleado}</p>
      </div>
    </div>

    <div className="flex items-start gap-2.5">
      <CircleDot className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Estado de la Concesión</p>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${estatusStyle[estatus] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
          {estatus || "—"}
        </span>
      </div>
    </div>

    <div className="flex items-start gap-2.5">
      <PenLine className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Firma</p>
        {firma?.file_url ? (
          <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 inline-flex">
            <Image
              src={firma.file_url}
              alt="Firma"
              width={160}
              height={40}
              className="h-9 w-auto"
              unoptimized
            />
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 rounded-lg px-4 py-3 bg-gray-50 flex flex-col items-center justify-center gap-1 w-44">
            <PenLine className="w-5 h-5 text-gray-300" />
            <p className="text-xs text-gray-400">No disponible</p>
          </div>
        )}
      </div>
    </div>

    <div className="flex items-start gap-2.5">
      <IdCard className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Identificación</p>
        {identificacion?.file_url ? (
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 w-48 h-28">
            <Image
              src={identificacion.file_url}
              alt="Identificación"
              width={192}
              height={112}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 w-48 h-28 flex flex-col items-center justify-center gap-1">
            <IdCard className="w-6 h-6 text-gray-300" />
            <p className="text-xs text-gray-400">No disponible</p>
          </div>
        )}
      </div>
    </div>

  </div>
            </div>

              <div className="p-5 py-0">
                <TabDatos equipos={equipos} setEquipos={setEquipos} mode="vista" dataConcesion={data}/>
              </div>
            </TabsContent>

            <TabsContent value="seguimientos" className="space-y-4 mt-0">
              <div className="p-5 py-0">
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