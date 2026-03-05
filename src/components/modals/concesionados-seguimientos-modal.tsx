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
import { NuevaDevolucionEquipoModal } from "./concesionados-nueva-devolucion";
import { useDevolucionEquipo } from "@/hooks/Concesionados/useDevolverConcesionado";
import { ClipboardList, Loader2, PackageCheck } from "lucide-react";

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
  grupo_equipos_devolucion:any
};

interface SegArtModalProps {
  data: Concesion;
  isSuccess: boolean;
  children: React.ReactNode;
}

export const SeguimientosModalArticuloCon: React.FC<SegArtModalProps> = ({
  data,
  children,
}) => {
  const [equipos, setEquipos] = useState<EquipoConcesionado[]>([]);
  const [nuevaDevolucionModal, setNuevaDevolucionModal] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<EquipoConcesionado>({});
  const { devolverEquipoMutation, isLoading } = useDevolucionEquipo();

  useEffect(() => {
    if (data.grupo_equipos) setEquipos(data.grupo_equipos);
  }, [data]);

  const totalCantidadPendientes = equipos
    .filter((item) => item.status_concesion_equipo === "pendiente")
    .reduce((acc, item) => acc + (item.cantidad_equipo_concesion ?? 0), 0);

  const onDevolver = (equipo: EquipoConcesionado) => {
    setEquipoSeleccionado(equipo);
    setNuevaDevolucionModal(true);
  };

  const onDevolverTodo = (equipo: EquipoConcesionado) => {
    console.log(equipo)
    devolverEquipoMutation.mutate({
      record_id: data._id ?? "",
      status: "total",
      state: "complete",
      quien_entrega: "",
      evidencia: [],
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white p-0 overflow-hidden">

        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">
            Detalle del Seguimiento
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">Folio: {data.folio}</p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6  ">

          <div className=" p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="text-blue-500 w-5 h-5" />
                <h3 className="font-semibold text-gray-700">Seguimientos</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
                  <span className="text-xs font-semibold text-red-500">Pendientes:</span>
                  <span className="text-sm font-bold text-red-600">{totalCantidadPendientes}</span>
                </div>
                <Button
                  type="button"
                  disabled={isLoading || data.status_concesion === "devuelto"}
                  onClick={() => onDevolverTodo({} as EquipoConcesionado)}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm disabled:opacity-50"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                    : <><PackageCheck className="w-4 h-4" /> Devolver todo</>
                  }
                </Button>
              </div>
            </div>
          </div>

          <div className=" p-5">
            <ConcesionadosSegEquipos
              equipos={equipos}
              setEquipos={setEquipos}
              mode="vista"
              onDevolver={onDevolver}
              data={data}
            />
          </div>

        </div>

        <NuevaDevolucionEquipoModal
          title="Devolución de Equipos"
          setIsSuccess={setNuevaDevolucionModal}
          isSuccess={nuevaDevolucionModal}
          equipoSelecionado={equipoSeleccionado} dataConcesion={undefined} >
          <div />
        </NuevaDevolucionEquipoModal>

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