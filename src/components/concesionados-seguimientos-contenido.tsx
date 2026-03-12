import { useEffect, useRef, useState } from "react";
import { Loader2, PackageCheck, RotateCcw } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCatalogoAreaEmpleadoApoyo } from "@/hooks/useCatalogoAreaEmpleadoApoyo";
import { useDevolucionEquipo } from "@/hooks/Concesionados/useDevolverConcesionado";
import { useUploadImage } from "@/hooks/useUploadImage";
import { base64ToFile } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";
import LoadImage from "./upload-Image";
import { EquipoConcesionado } from "./concesionados-tab-datos";
import DetalleSeguimientoTable, { EquipoForm } from "./concesionados-seguimientos-table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { NuevaDevolucionMiniEquipoModal } from "./modals/concesionados-nueva-devolucion-mini";
import { NuevaDevolucionEquipoModal } from "./modals/concesionados-nueva-devolucion";
import { ConfirmacionDevolucionModal } from "./modals/concesionados-confirmacion-devolucion";
import { Concesion } from "./modals/concesionados-detalle-de-la-concesion";


const formSchema = z.object({
  entrega_tipo: z.string().optional(),
  entrega_concesion: z.string().optional(),
  entrega_concesion_otro: z.string().optional(),
  identificacion_entrega: z.array(z.any()).optional(),
  firma: z.any().optional(),
});

interface ConcesionadosSeguimientoContenidoProps {
  data: Concesion;
  onClose: () => void;
  type?:string
}

export const ConcesionadosSeguimientoContenido: React.FC<ConcesionadosSeguimientoContenidoProps> = ({
  data,
  onClose,
  type="detalle"
}) => {
  const [equipos, setEquipos] = useState<EquipoConcesionado[]>([]);
  const [nuevaDevolucionModal, setNuevaDevolucionModal] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<EquipoConcesionado | null>(null);
  const { devolverEquipoMutation, isLoading } = useDevolucionEquipo();
  const [equipoForms, setEquipoForms] = useState<Record<number, EquipoForm>>({});
  const { data: dataAreaEmpleadoApoyo, isLoading: loadingAreaEmpleadoApoyo } = useCatalogoAreaEmpleadoApoyo(true);
  const [openDevolucionMiniEquiposModal, setOpenDevolucionMiniEquiposModal] = useState(false);

  const [confirmacionOpen, setConfirmacionOpen] = useState(false);
  const [intentoEnvio, setIntentoEnvio] = useState(false);
  const [isLoadingFoto, setIsLoadingFoto] = useState(false);
  const [isLoadingEvidencia, setIsLoadingEvidencia] = useState(false);

  const [textoFirma, setTextoFirma] = useState("");
  const [vistaPrevia, setVistaPrevia] = useState<string>("");
  const { uploadImageMutation, response: firmaResponse, isLoading: isLoadingImage } = useUploadImage();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const convertirTextoAImagen = (texto: string): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    canvas.width = 400;
    canvas.height = 100;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    ctx.font = "bold italic 32px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL("image/png");
  };

  const handleTextoChange = async (texto: string) => {
    setTextoFirma(texto);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (texto.trim()) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const imagenBase64 = convertirTextoAImagen(texto);
          setVistaPrevia(imagenBase64);
          const imagenFile = base64ToFile(imagenBase64, `firma_${Date.now()}`);
          uploadImageMutation.mutate({ img: imagenFile });
        } catch (error) {
          console.error("Error al generar firma:", error);
        }
      }, 800);
    } else {
      setVistaPrevia("");
      form.setValue("firma", undefined);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entrega_tipo: "empleado",
      entrega_concesion: "",
      entrega_concesion_otro: "",
      identificacion_entrega: [],
      firma: undefined,
    },
  });

  useEffect(() => {
    if (firmaResponse) form.setValue("firma", firmaResponse);
  }, [firmaResponse, form]);

  const totalCantidadPendientes = data?.grupo_equipos?.reduce((acc: any, item: any) => {
    const pendiente = typeof item.cantidad_equipo_pendiente === "object"
      ? (item.cantidad_equipo_pendiente as any)?.parsedValue ?? 0
      : Number(item.cantidad_equipo_pendiente ?? 0);
    return acc + pendiente;
  }, 0);

  const tipoCon = form.watch("entrega_tipo");
  const formValues = form.watch();

  const dataDevolucion = {
    entrega_tipo: formValues.entrega_tipo ?? "",
    quien_entrega: formValues.entrega_tipo === "empleado"
      ? formValues.entrega_concesion ?? ""
      : formValues.entrega_concesion_otro ?? "",
    identificacion_entrega: formValues.identificacion_entrega ?? [],
    firma: formValues.firma,
  };

  const equiposAgregados = Object.entries(equipoForms).filter(([, f]) => f.agregado && f.estatus);

  const errores = {
    persona: !dataDevolucion.quien_entrega,
    identificacion: !dataDevolucion.identificacion_entrega?.length,
    firma: !dataDevolucion.firma,
    firmaSubiendo: isLoadingImage,
    equipos: equiposAgregados.length === 0,
  };

  function traducirEstatus(estatus: string): "complete" | "lost" | "damage" {
    switch (estatus.toLowerCase()) {
      case "completo": return "complete";
      case "perdido": return "lost";
      case "dañado":
      case "danado": return "damage";
      default: return "complete";
    }
  }

  function handleDevolver() {
    setIntentoEnvio(true);
    if (errores.persona) { toast.warning("Selecciona o escribe la persona que entrega."); return; }
    if (errores.firmaSubiendo) { toast.warning("Espera a que termine de subir la firma."); return; }
    if (errores.firma) { toast.warning("Escribe tu firma para continuar."); return; }
    if (errores.identificacion) { toast.warning("Agrega la fotografía de identificación."); return; }
    if (errores.equipos) { toast.warning("Agrega al menos un equipo a la devolución."); return; }
    setConfirmacionOpen(true);
  }

  function ejecutarDevolucion() {
    const equiposMutate = equiposAgregados.map(([index, f]) => {
      const equipo = equipos[Number(index)];
      return {
        id_movimiento: equipo.id_movimiento ?? "",
        cantidad_devuelta: f.unidades,
        state: traducirEstatus(f.estatus),
        evidencia: (f.evidencia_entrega ?? [])
          .filter((img) => img.file_url !== undefined)
          .map((img) => ({ file_url: img.file_url!, file_name: img.file_name ?? "" })),
        comentario_entrega: f.comentario_entrega ?? "",
      };
    });

    devolverEquipoMutation.mutate({
      record_id: data._id ?? "",
      status: "parcial",
      entregado_por: dataDevolucion.entrega_tipo as string,
      quien_entrega: dataDevolucion.quien_entrega,
      quien_entrega_company: dataDevolucion.entrega_tipo === "otro" ? dataDevolucion.quien_entrega : undefined,
      identificacion_entrega: dataDevolucion.identificacion_entrega?.[0] ?? undefined,
      firma: dataDevolucion.firma,
      equipos: equiposMutate,
    }, {
      onSuccess: () => {
        setConfirmacionOpen(false);
        onClose();
      },
    });
  }

  useEffect(() => {
    form.reset({
      entrega_tipo: "empleado",
      entrega_concesion: "",
      entrega_concesion_otro: "",
      identificacion_entrega: [],
      firma: undefined,
    });
    setTextoFirma("");
    setVistaPrevia("");
    setEquipoForms({});
    setIntentoEnvio(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data.grupo_equipos) setEquipos(data.grupo_equipos);
  }, [data]);

  const onDevolver = (equipo: EquipoConcesionado) => {
    setEquipoSeleccionado(equipo);
    setNuevaDevolucionModal(true);
  };

  return (
    <>
      <div className="flex-grow overflow-y-auto px-6">
        <div className="p-5 border-b space-y-4">

          {data.status_concesion !== "devuelto" ? (
            <div className="flex justify-between items-center">
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
                  onClick={() => { setEquipoSeleccionado(null); setNuevaDevolucionModal(true); }}
                  className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm disabled:opacity-50"
                >
                  <PackageCheck className="w-4 h-4" /> Devolver todo
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Historial de devoluciones
              </span>
            </div>
          )}

          {data.status_concesion !== "devuelto" && (
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
                      </FormItem>
                    )}
                  />
                </div>

                {(tipoCon === "empleado" || tipoCon === "otro") && (
                  <>
                    <div className="col-span-1 flex flex-col gap-3">

                      {tipoCon === "empleado" && (
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
                                  <SelectTrigger className={`bg-white transition-colors ${intentoEnvio && errores.persona ? "border-yellow-400 ring-1 ring-yellow-300" : "border-gray-200"}`}>
                                    <SelectValue placeholder={
                                      loadingAreaEmpleadoApoyo ? "Cargando empleados..." :
                                      dataAreaEmpleadoApoyo?.length > 0 ? "Selecciona una opción..." :
                                      "Sin opciones disponibles"
                                    } />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {dataAreaEmpleadoApoyo?.length > 0
                                    ? dataAreaEmpleadoApoyo.map((item: string, i: number) => (
                                      <SelectItem key={i} value={item}>{item}</SelectItem>
                                    ))
                                    : <SelectItem disabled value="no opciones">No hay opciones disponibles</SelectItem>
                                  }
                                </SelectContent>
                              </Select>
                              {intentoEnvio && errores.persona && (
                                <p className="text-xs text-red-500 mt-1">Selecciona la persona que entrega</p>
                              )}
                            </FormItem>
                          )}
                        />
                      )}

                      {tipoCon === "otro" && (
                        <FormField
                          control={form.control}
                          name="entrega_concesion_otro"
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Persona
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nombre de la persona"
                                  className={`bg-white transition-colors ${intentoEnvio && errores.persona ? "border-yellow-400 ring-1 ring-yellow-300" : "border-gray-200"}`}
                                  {...field}
                                />
                              </FormControl>
                              {intentoEnvio && errores.persona && (
                                <p className="text-xs text-red-500 mt-1">Escribe el nombre de la persona</p>
                              )}
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="firma"
                        render={() => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Firma <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input
                                  className={`font-bold italic bg-white transition-colors ${intentoEnvio && errores.firma ? "border-yellow-400 ring-1 ring-yellow-300" : "border-gray-200"}`}
                                  style={{ fontFamily: "Georgia, serif" }}
                                  placeholder="Escribe tu firma..."
                                  value={textoFirma}
                                  disabled={isLoadingImage}
                                  onChange={(e) => handleTextoChange(e.target.value)}
                                />
                                {vistaPrevia && (
                                  <div className="border rounded-lg p-2 bg-gray-50">
                                    <p className="text-xs text-gray-400 mb-1">Vista previa:</p>
                                    <Image
                                      height={50}
                                      width={200}
                                      src={vistaPrevia}
                                      alt="Vista previa de firma"
                                      className="max-w-full h-auto"
                                    />
                                  </div>
                                )}
                                {isLoadingImage && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                    <Loader2 className="animate-spin w-3 h-3" /> Subiendo firma...
                                  </p>
                                )}
                                {intentoEnvio && errores.firmaSubiendo && (
                                  <p className="text-xs text-red-500 mt-1">Espera a que termine de subir la firma</p>
                                )}
                                {intentoEnvio && errores.firma && !errores.firmaSubiendo && (
                                  <p className="text-xs text-red-500 mt-1">Escribe tu firma para continuar</p>
                                )}
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

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
                              onLoadingChange={setIsLoadingFoto}
                            />
                            {fieldState.error && (
                              <span className="text-red-500 text-sm mt-1">{fieldState.error.message}</span>
                            )}
                            {intentoEnvio && errores.identificacion && (
                              <p className="text-xs text-red-500 mt-1">Agrega la fotografía de identificación</p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </>
                )}

              </form>
            </Form>
          )}

          {intentoEnvio && errores.equipos && data.status_concesion !== "devuelto" && (
            <p className="text-xs text-red-500 mt-1">Agrega al menos un equipo a la devolución antes de continuar</p>
          )}

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
            isLoadingFotoExterna={isLoadingFoto}
            onLoadingEvidenciaChange={setIsLoadingEvidencia}
          />
        </div>
      </div>

      <NuevaDevolucionMiniEquipoModal
        title="Devolución de Equipos"
        setIsSuccess={setOpenDevolucionMiniEquiposModal}
        isSuccess={openDevolucionMiniEquiposModal}
        equipoSelecionado={null}
        dataConcesion={data}
        dataDevolucion={dataDevolucion}
      >
        <div />
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

      <ConfirmacionDevolucionModal
        isOpen={confirmacionOpen}
        onClose={() => setConfirmacionOpen(false)}
        onConfirm={ejecutarDevolucion}
        isLoading={isLoading}
        equipos={equipos}
        equipoForms={equipoForms}
        quienEntrega={dataDevolucion.quien_entrega}
        entregaTipo={dataDevolucion.entrega_tipo}
        firma={dataDevolucion.firma}
        identificacion={dataDevolucion.identificacion_entrega}
      />

      <div className="flex gap-3 bg-white border-t px-6 py-4 flex-shrink-0">
        {type!=="detalle" &&
        <Button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
        >
          Cerrar
        </Button>}
        <Button
          type="button"
          disabled={data.status_concesion === "devuelto" || isLoadingImage || isLoadingFoto || isLoadingEvidencia}
          onClick={handleDevolver}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm disabled:opacity-50"
        >
          {isLoadingImage
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo firma...</>
            : isLoadingFoto
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo foto...</>
            : isLoadingEvidencia
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo evidencia...</>
            : <><PackageCheck className="w-4 h-4" /> Devolver</>
          }
        </Button>
      </div>
    </>
  );
};