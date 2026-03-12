/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
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
import { Textarea } from "../ui/textarea";
import { Dispatch, ReactNode, SetStateAction, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useCatalogoAreaEmpleadoApoyo } from "@/hooks/useCatalogoAreaEmpleadoApoyo";
import { Loader2, Package, ClipboardList } from "lucide-react";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { useArticulosConcesionados } from "@/hooks/useArticulosConcesionados";
import { Input } from "../ui/input";
import LoadImage, { Imagen } from "../upload-Image";
import TabDatos, { EquipoConcesionado } from "../concesionados-tab-datos";
import { useBoothStore } from "@/store/useBoothStore";
import { useUploadImage } from "@/hooks/useUploadImage";
import { base64ToFile } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import DateTimePicker from "../dateTimerPicker";
import { SearchSelect } from "../custom-search-select";

interface ArticuloData {
  ubicacion_concesion?: string;
  area_concesion?: string;
  caseta_concesion?: string;
  status_concesion?: string;
  persona_nombre_concesion?: string;
  persona_email_concesion?: string | string[];
  persona_id_concesion?: number | number[];
  persona_nombre_otro?: string;
  persona_email_otro?: string;
  persona_identificacion_otro?: Imagen[];
  fecha_concesion?: string;
  equipos?: EquipoConcesionado[];
  observacion_concesion?: string;
  evidencia?: Imagen[];
  firma?: Imagen;
  solicita_concesion?: string;
  equipo_concesion?: string;
  persona_text?: string;
}

interface AddFallaModalProps {
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  mode?: "create" | "edit";
  initialData?: ArticuloData;
  children: ReactNode;
}

const imagenSchema = z.object({
  file_url: z.string(),
  file_name: z.string(),
});

export const equipoSchema = z.object({
  id_movimiento: z.string().optional(),
  categoria_equipo_concesion: z.string(),
  nombre_equipo: z.string(),
  costo_equipo_concesion: z.union([z.number(), z.array(z.number())]).optional(),
  imagen_equipo_concesion: z.array(imagenSchema).optional(),
  cantidad_equipo_concesion: z.number(),
  evidencia_entrega: z.array(imagenSchema).optional(),
  comentario_entrega: z.string().optional(),
});

const formSchema = z.object({
  ubicacion_concesion: z.string().optional(),
  area_concesion: z.string().optional(),
  caseta_concesion: z.string().optional(),
  status_concesion: z.string().optional(),
  persona_nombre_concesion: z.string().optional(),
  persona_email_concesion: z.union([z.string(), z.array(z.string())]).optional(),
  persona_id_concesion: z.union([z.number(), z.array(z.number())]).optional(),
  persona_nombre_otro: z.string().optional(),
  persona_email_otro: z.string().optional(),
  persona_identificacion_otro: z.array(imagenSchema).optional(),
  fecha_concesion: z.string().optional(),
  equipos: z.array(equipoSchema).optional().default([]),
  observacion_concesion: z.string().optional(),
  evidencia: z.array(imagenSchema).optional().default([]),
  firma: imagenSchema.optional(),
  solicita_concesion: z.string().min(2, { message: "Este campo es requerido." }),
});

export const AddArticuloConModal: React.FC<AddFallaModalProps> = ({
  isSuccess,
  setIsSuccess,
  mode = "create",
  initialData,
  children,
}) => {
  const { location, area } = useBoothStore();
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(location ?? "");
  const [equipos, setEquipos] = useState<any[]>([]);
  const { dataAreas: areas, dataLocations: ubicaciones, isLoadingAreas: loadingAreas, isLoadingLocations: loadingUbicaciones } =
    useCatalogoPaseAreaLocation(ubicacionSeleccionada, true, ubicacionSeleccionada ? true : false);
  const [loadingIdentificacion, setLoadingIdentificacion] = useState(false);
  const { data: dataAreaEmpleadoApoyoArray, isLoading: loadingAreaEmpleadoApoyo } =
    useCatalogoAreaEmpleadoApoyo(isSuccess);
    const dataAreaEmpleadoApoyo = dataAreaEmpleadoApoyoArray?.filter(Boolean);
  const { createArticulosConMutation, editarArticulosConMutation, isLoading } =
    useArticulosConcesionados(ubicacionSeleccionada, area ?? "", "", false, "", "", "");
  const [date, setDate] = useState<Date | undefined>(undefined);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ubicacion_concesion: "",
      area_concesion: "",
      caseta_concesion: "",
      status_concesion: "",
      persona_nombre_concesion: "",
      persona_email_concesion: "",
      persona_id_concesion: undefined,
      persona_nombre_otro: "",
      persona_email_otro: "",
      persona_identificacion_otro: [],
      fecha_concesion: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      equipos: [],
      observacion_concesion: "",
      evidencia: [],
      firma: undefined,
      solicita_concesion: "empleado",
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (isSuccess) {
      if (mode === "edit" && initialData) {
        reset({
          ubicacion_concesion: initialData.ubicacion_concesion || "",
          area_concesion: initialData.area_concesion || "",
          caseta_concesion: initialData.area_concesion || "",
          status_concesion: initialData.status_concesion || "",
          persona_nombre_concesion: initialData.persona_nombre_concesion || "",
          persona_email_concesion: initialData.persona_email_concesion || "",
          persona_id_concesion: initialData.persona_id_concesion || undefined,
          persona_nombre_otro: initialData.persona_nombre_otro || "",
          persona_email_otro: initialData.persona_email_otro || "",
          persona_identificacion_otro: initialData.persona_identificacion_otro || [],
          fecha_concesion: initialData.fecha_concesion || "",
          equipos: initialData.equipos || [],
          observacion_concesion: initialData.observacion_concesion || "",
          evidencia: initialData.evidencia || [],
          firma: initialData.firma || undefined,
          solicita_concesion: initialData.solicita_concesion || "",
        });
        if (initialData.ubicacion_concesion) setUbicacionSeleccionada(initialData.ubicacion_concesion);
        if (initialData.fecha_concesion) setDate(new Date(initialData.fecha_concesion));
      } else {
        reset({
          ubicacion_concesion: "",
          area_concesion: "",
          caseta_concesion: "",
          status_concesion: "",
          persona_nombre_concesion: "",
          persona_email_concesion: "",
          persona_id_concesion: undefined,
          persona_nombre_otro: "",
          persona_email_otro: "",
          persona_identificacion_otro: [],
          fecha_concesion: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          equipos: [],
          observacion_concesion: "",
          evidencia: [],
          firma: undefined,
          solicita_concesion: "empleado",
        });
        setDate(new Date());
        setEquipos([]);
        setUbicacionSeleccionada(location ?? "");
        setTextoFirma("");
        setVistaPrevia("");
      }
    }
  }, [isSuccess, mode, initialData, reset, location]);

  useEffect(() => {
    if (!isLoading) handleClose();
  }, [isLoading]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!equipos || equipos.length === 0) {
      toast.error("Debe agregar al menos un equipo antes de enviar.");
      form.setError("equipos", { type: "manual", message: "Debe agregar al menos un equipo." });
      return;
    }
    if (date) {
      const formattedDate = format(new Date(date), "yyyy-MM-dd HH:mm:ss");
      const formatData = {
        ubicacion_concesion: values.ubicacion_concesion ?? "",
        area_concesion: values.area_concesion ?? "",
        caseta_concesion: values.area_concesion ?? "",
        status_concesion: mode === "create" ? "abierto" : values.status_concesion || "abierto",
        persona_nombre_concesion: values.persona_nombre_concesion ?? "",
        persona_email_concesion: values.persona_email_concesion ?? "",
        persona_id_concesion: values.persona_id_concesion ?? undefined,
        persona_nombre_otro: values.persona_nombre_otro ?? "",
        persona_email_otro: values.persona_email_otro ?? "",
        persona_identificacion_otro: values.persona_identificacion_otro ?? [],
        fecha_concesion: formattedDate ?? "",
        equipos: equipos ?? [],
        observacion_concesion: values.observacion_concesion ?? "",
        evidencia: values.evidencia ?? [],
        firma: values.firma ?? undefined,
      };
      if (mode === "edit") {
        editarArticulosConMutation.mutate({ data_article_update: formatData, folio: "" });
      } else {
        createArticulosConMutation.mutate({ data_article: formatData });
      }
    } else {
      form.setError("fecha_concesion", { type: "manual", message: "Fecha es un campo requerido." });
    }
  }

  const handleClose = () => setIsSuccess(false);
  const tipoCon = form.watch("solicita_concesion");
  const buttonText = mode === "edit" ? "Actualizar Consesión" : "Crear Consesión";

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

  useEffect(() => {
    form.setValue("equipos", equipos);
  }, [equipos, form]);

  const [textoFirma, setTextoFirma] = useState("");
  const [vistaPrevia, setVistaPrevia] = useState<string>("");
  const { uploadImageMutation, response, isLoading: isLoadingImage } = useUploadImage();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleTextoChange = async (texto: string) => {
    setTextoFirma(texto);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (texto.trim()) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const imagenBase64 = await convertirTextoAImagen(texto);
          setVistaPrevia(imagenBase64);
          const imagenFile = base64ToFile(imagenBase64, `firma_${Date.now()}`);
          uploadImageMutation.mutate({ img: imagenFile });
        } catch (error) {
          console.error("Error:", error);
        }
      }, 800);
    } else {
      setVistaPrevia("");
      form.setValue("firma", undefined);
    }
  };

  useEffect(() => {
    if (response?.file_url) {
      form.setValue("firma", { file_url: response.file_url, file_name: response.file_name ?? "" });
    }
  }, [response]);

  return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess} modal>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent
        className="max-w-3xl overflow-y-auto max-h-[90vh] flex flex-col p-0 overflow-visible"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby=""
      >
        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">
            {mode === "edit" ? "Editar Concesión" : "Nueva Concesión"}
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">Completa la información para registrar la concesión</p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto overflow-x-visible px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>

              <div className="p-5 py-0 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="text-blue-500 w-5 h-5" />
                  <h3 className="font-semibold text-gray-700">Información general</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <FormField
                    control={form.control}
                    name="ubicacion_concesion"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Ubicación
                        </FormLabel>
                        <FormControl>
                          <SearchSelect
                            options={ubicaciones ?? []}
                            value={field.value}
                            onChange={(val) => { field.onChange(val); setUbicacionSeleccionada(val); }}
                            isLoading={loadingUbicaciones}
                            placeholder="Selecciona una ubicación"
                            noOptionsMessage="Sin ubicaciones disponibles"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="area_concesion"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Área
                        </FormLabel>
                        <FormControl>
                          <SearchSelect
                            options={areas ?? []}
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            isLoading={loadingAreas}
                            placeholder="Selecciona un área"
                            noOptionsMessage="Sin áreas disponibles"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fecha_concesion"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Fecha y hora de la concesión
                        </FormLabel>
                        <FormControl>
                          <DateTimePicker
                            showTime={true}
                            allowPast={true}
                            placeholder="Selecciona fecha y hora"
                            date={field.value ? new Date(field.value) : undefined}
                            setDate={(date) => {
                              field.onChange(date ? format(date, "yyyy-MM-dd HH:mm:ss") : "");
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="solicita_concesion"
                    defaultValue="empleado"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Solicitante
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => field.onChange("empleado")}
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
                              onClick={() => { field.onChange("otro"); form.setValue("persona_nombre_concesion", ""); }}
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

                  {tipoCon === "otro" && (
                    <FormField
                      control={form.control}
                      name="persona_nombre_otro"
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
                  )}

                  {tipoCon === "empleado" && (
                    <FormField
                      control={form.control}
                      name="persona_nombre_concesion"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Persona
                          </FormLabel>
                          <FormControl>
                            <SearchSelect
                              options={dataAreaEmpleadoApoyo ?? []}
                              value={field.value??null}
                              onChange={(val) => field.onChange(val)}
                              isLoading={loadingAreaEmpleadoApoyo}
                              placeholder="Selecciona una opción..."
                              noOptionsMessage="Sin opciones disponibles"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="mb-2">
                    <Controller
                      control={form.control}
                      name="evidencia"
                      render={({ field, fieldState }) => (
                        <div className="flex flex-col">
                          <LoadImage
                            id="identificacion"
                            titulo={"Identificación"}
                            imgArray={field.value || []}
                            setImg={(imgs) => field.onChange(imgs)}
                            showWebcamOption={true}
                            facingMode="environment"
                            limit={20}
                            onLoadingChange={setLoadingIdentificacion}
                          />
                          {fieldState.error && (
                            <span className="text-red-500 text-sm mt-1">{fieldState.error.message}</span>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="text-blue-500 w-5 h-5" />
                  <h3 className="font-semibold text-gray-700">Equipos</h3>
                </div>
                <TabDatos equipos={equipos} setEquipos={setEquipos} mode={"editar"} from={"nueva_concesion"} dataConcesion={initialData} />
                {form.formState.errors.equipos && (
                  <p className="text-sm text-red-500 mt-2">{form.formState.errors.equipos.message}</p>
                )}
              </div>

              <div className="p-5 py-0 space-y-4">
                <h3 className="font-semibold text-gray-700">Observaciones y firma</h3>

                <FormField
                  control={form.control}
                  name="observacion_concesion"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Observaciones
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Escribe un comentario..." className="resize-none bg-white border-gray-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <FormField
                    control={form.control}
                    name="firma"
                    render={() => (
                      <FormItem className="w-1/2">
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Firma
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <Input
                              className="border-gray-200 font-bold italic bg-white"
                              style={{ fontFamily: "Georgia, serif" }}
                              placeholder="Escribe tu firma..."
                              value={textoFirma}
                              disabled={isLoadingImage}
                              onChange={(e) => handleTextoChange(e.target.value)}
                            />
                            {vistaPrevia && (
                              <div className="border rounded-lg p-3 bg-gray-50">
                                <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                                <Image height={250} width={200} src={vistaPrevia} alt="Vista previa de firma" className="max-w-full h-auto" />
                              </div>
                            )}
                            {isLoadingImage && (
                              <p className="text-sm text-gray-400 flex items-center gap-2">
                                <Loader2 className="animate-spin w-4 h-4" /> Subiendo firma...
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

            </form>
          </Form>
        </div>

        <div className="flex-shrink-0 bg-white border-t px-6 py-4 flex gap-3">
          <DialogClose asChild>
            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium" onClick={handleClose}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
            disabled={isLoading || loadingIdentificacion || isLoadingImage}
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
            ) : isLoadingImage ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo firma...</>
            ) : loadingIdentificacion ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo evidencia...</>
            ) : (
              buttonText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};