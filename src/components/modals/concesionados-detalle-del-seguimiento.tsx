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
import { useDevolucionEquipo } from "@/hooks/Concesionados/useDevolverConcesionado";
import { toast } from "sonner";

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
  const [detalleSeg, setDetalleSeg] = useState<boolean>(false);
  const { devolverEquipoMutation, isLoading } = useDevolucionEquipo();
  // const { devolverEquipoMutation, isLoading } = useDevolucionEquipo();
  type EquipoForm = {
    evidencia_entrega: any; unidades: number; estatus: string; agregado: boolean; 
};
  const [equipoForms, setEquipoForms] = useState<Record<number, EquipoForm>>({});
  const { data: dataAreaEmpleadoApoyo, isLoading: loadingAreaEmpleadoApoyo } = useCatalogoAreaEmpleadoApoyo(detalleSeg);
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

  const totalCantidadPendientes = data?.grupo_equipos?.reduce((acc: any, item: any) => {
    const pendiente = typeof item.cantidad_equipo_pendiente === "object"
      ? (item.cantidad_equipo_pendiente as any)?.parsedValue ?? 0
      : Number(item.cantidad_equipo_pendiente ?? 0);
    return acc + pendiente;
  }, 0);


  const tipoCon = form.watch("entrega_tipo");
  const formValues = form.watch();
  function traducirEstatus(estatus: string): "complete" | "lost" | "damage" {
    switch (estatus.toLowerCase()) {
      case "completo": return "complete";
      case "perdido": return "lost";
      case "dañado":
      case "danado": return "damage";
      default: return "complete";
    }
  }

  function onSubmit() {  
    if (!dataDevolucion.entrega_tipo) {
    toast.error("Selecciona el tipo de entrega.");
    return;
    }
    if (!dataDevolucion.quien_entrega) {
      toast.error("Indica la persona que entrega.");
      return;
    }
    if (!dataDevolucion.identificacion_entrega?.length) {
      toast.error("Agrega la fotografía de identificación.");
      return;
    }

    const equiposAgregados = Object.entries(equipoForms)
      .filter(([, form]) => form.agregado && form.estatus)
      .map(([index, form]) => {
        const equipo = equipos[Number(index)];
        console.log("EQUIPOOOO",form)
        return {
          id_movimiento: equipo.id_movimiento ?? "",
          cantidad_devuelta: form.unidades,
          state: traducirEstatus(form.estatus),
          evidencia: form.evidencia_entrega,
        };
      });
    if (equiposAgregados.length === 0) {
      toast.error("Agrega al menos un equipo para devolver.");
      return;
    }
  
    devolverEquipoMutation.mutate({
      record_id: data._id ?? "",
      status: "parical",
      entregado_por: dataDevolucion.entrega_tipo as "empleado" | "otro",
      quien_entrega: dataDevolucion.quien_entrega,
      quien_entrega_company: dataDevolucion.entrega_tipo === "otro" ? dataDevolucion.quien_entrega : undefined,
      identificacion_entrega: dataDevolucion.identificacion_entrega?.[0] ?? undefined,
      equipos: equiposAgregados,
    }, {
      onSuccess: () => setDetalleSeg(false) 
    });
  }
  useEffect(() => {
    if (detalleSeg) {
      form.reset({
        entrega_tipo: "empleado",
        entrega_concesion: "",
        entrega_concesion_otro: "",
        identificacion_entrega: [],
      });
      setEquipoForms({});
    }
  }, [detalleSeg, form]);

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

  // const totalCantidadPendientes = equipos
  //   .filter((item) => item.status_concesion_equipo === "pendiente")
  //   .reduce((acc, item) => acc + (item.cantidad_equipo_concesion ?? 0), 0);

  const onDevolver = (equipo: EquipoConcesionado) => {
    setEquipoSeleccionado(equipo);
    setNuevaDevolucionModal(true);
  };

  return (
    <Dialog open={detalleSeg} onOpenChange={setDetalleSeg}>
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
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500 uppercase font-semibold">
              Rellena los datos para realizar la devolución
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
                <span className="text-xs font-semibold text-red-500">Pendientes:</span>
                <span className="text-sm font-bold text-red-600">{totalCantidadPendientes}</span>
              </div>
              <Button
                type="button"
                disabled={data.status_concesion === "devuelto"}
                onClick={() => {
                  setEquipoSeleccionado(null);
                  setNuevaDevolucionModal(true);
                }}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm disabled:opacity-50"
              >
                <PackageCheck className="w-4 h-4" /> Devolver todo
              </Button>
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
              setEquipoForms={setEquipoForms}
              equipoForms={equipoForms}
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

        <div className="flex gap-3 bg-white border-t px-6 py-4">
        <DialogClose asChild>
          <Button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium">
            Cerrar
          </Button>
        </DialogClose>
        <Button
          type="button"
          disabled={data.status_concesion === "devuelto" || isLoading}
          onClick={onSubmit}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm disabled:opacity-50"
        >
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
            : <><PackageCheck className="w-4 h-4" /> Devolver</>
          }
        </Button>
      </div>

      </DialogContent>
    </Dialog>
  );
};