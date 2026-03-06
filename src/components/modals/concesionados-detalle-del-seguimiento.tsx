import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { EquipoConcesionado } from "../concesionados-tab-datos";
import { useEffect, useState } from "react";
import { Imagen } from "../upload-Image";
import DetalleSeguimientoTable from "../concesionados-seguimientos-table";
import { NuevaDevolucionEquipoModal } from "./concesionados-nueva-devolucion";
// import { useDevolucionEquipo } from "@/hooks/Concesionados/useDevolverConcesionado";
import { Loader2, PackageCheck } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadImage from "../upload-Image";
import { useCatalogoAreaEmpleadoApoyo } from "@/hooks/useCatalogoAreaEmpleadoApoyo";
import { NuevaDevolucionMiniEquipoModal } from "./concesionados-nueva-devolucion-mini";

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
  grupo_equipos_devolucion: any;
};

interface SegArtModalProps {
  data: Concesion;
  isSuccess: boolean;
  children: React.ReactNode;
}

const formSchema = z.object({
  entrega_tipo: z.string().optional(),
  entrega_concesion: z.string().optional(),
  entrega_concesion_otro: z.string().optional(),
  identificacion_entrega: z.array(z.any()).optional(),
});

export const DetalleDelSeguimiento: React.FC<SegArtModalProps> = ({
  data,
  children,
}) => {
  const [equipos, setEquipos] = useState<EquipoConcesionado[]>([]);
  const [nuevaDevolucionModal, setNuevaDevolucionModal] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<EquipoConcesionado | null>(null);
  // const { devolverEquipoMutation, isLoading } = useDevolucionEquipo();
  const { data: dataAreaEmpleadoApoyo, isLoading: loadingAreaEmpleadoApoyo } =
    useCatalogoAreaEmpleadoApoyo(nuevaDevolucionModal);
    const [openDevolucionMiniEquiposModal, setOpenDevolucionMiniEquiposModal] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entrega_tipo: "empleado",
      entrega_concesion: "",
      entrega_concesion_otro: "",
      identificacion_entrega: [],
    },
  });

  const tipoCon = form.watch("entrega_tipo");
  const formValues = form.watch();

  const dataDevolucion = {
    entrega_tipo: formValues.entrega_tipo ?? "",
    quien_entrega: formValues.entrega_tipo === "empleado"
      ? formValues.entrega_concesion ?? ""
      : formValues.entrega_concesion_otro ?? "",
    identificacion_entrega: formValues.identificacion_entrega ?? [],
  };

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

  const onDevolverTodo = () => {
    setOpenDevolucionMiniEquiposModal(true)
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

        <div className="flex-grow overflow-y-auto px-6">

          <div className="p-5 border-b">
            <div className="flex justify-between">
              <p className="text-sm text-gray-500 mb-4 uppercase font-semibold">
                Rellena los datos para realizar la devolución
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-semibold text-red-500">Pendientes:</span>
                    <span className="text-sm font-bold text-red-600">{totalCantidadPendientes}</span>
                  </div>
                  <Button
                    type="button"
                    disabled={data.status_concesion === "devuelto"}
                    onClick={onDevolverTodo}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm disabled:opacity-50"
                  >
                    {false
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                      : <><PackageCheck className="w-4 h-4" /> Devolver todo</>
                    }
                  </Button>
                </div>
              </div>

            </div>
            <Form {...form}>
              <form className="grid grid-cols-2 gap-4">

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="entrega_tipo"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Entrega
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { field.onChange("empleado"); form.setValue("entrega_concesion_otro", ""); }}
                              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                field.value === "empleado"
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "border border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
                              }`}
                            >
                              Empleado
                            </button>
                            <button
                              type="button"
                              onClick={() => { field.onChange("otro"); form.setValue("entrega_concesion", ""); }}
                              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                field.value === "otro"
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "border border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
                              }`}
                            >
                              Otro
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {tipoCon === "empleado" && (
                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name="entrega_concesion"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Persona
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-gray-200">
                                <SelectValue placeholder={
                                  loadingAreaEmpleadoApoyo ? "Cargando empleados..." :
                                  dataAreaEmpleadoApoyo?.length > 0 ? "Selecciona una opción..." :
                                  "Sin opciones disponibles"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dataAreaEmpleadoApoyo?.length > 0
                                ? dataAreaEmpleadoApoyo.map((item: string, index: number) => (
                                  <SelectItem key={index} value={item}>{item}</SelectItem>
                                ))
                                : <SelectItem disabled value="no opciones">No hay opciones disponibles</SelectItem>
                              }
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {tipoCon === "otro" && (
                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name="entrega_concesion_otro"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Persona
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre de la persona" className="bg-white border-gray-200" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {(tipoCon === "empleado" || tipoCon === "otro") && (
                  <div className="col-span-1">
                    <Controller
                      control={form.control}
                      name="identificacion_entrega"
                      render={({ field, fieldState }) => (
                        <div className="flex flex-col">
                          <LoadImage
                            id="fotografia-seguimiento"
                            titulo="Identificación de la persona"
                            showWebcamOption={true}
                            imgArray={field.value || []}
                            setImg={(imgs) => field.onChange(imgs)}
                            facingMode="user"
                            limit={10}
                          />
                          {fieldState.error && (
                            <span className="text-red-500 text-sm mt-1">{fieldState.error.message}</span>
                          )}
                        </div>
                      )}
                    />
                  </div>
                )}

              </form>
            </Form>
          </div>


          <div className="p-5">
            <DetalleSeguimientoTable
              equipos={equipos}
              setEquipos={setEquipos}
              onDevolver={onDevolver}
              data={data}
              dataDevolucion={dataDevolucion}
            />
          </div>

        </div>
		
        <NuevaDevolucionMiniEquipoModal
            title={"Devolución de Equipos"}
            setIsSuccess={setOpenDevolucionMiniEquiposModal}
            isSuccess={openDevolucionMiniEquiposModal}
            equipoSelecionado={null} dataConcesion={data} 
            dataDevolucion={dataDevolucion}	>
                  <div></div>
        </NuevaDevolucionMiniEquipoModal>


        <NuevaDevolucionEquipoModal
          title="Devolución de Equipos"
          setIsSuccess={setNuevaDevolucionModal}
          isSuccess={nuevaDevolucionModal}
          equipoSelecionado={equipoSeleccionado}
          dataConcesion={data}
        >
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