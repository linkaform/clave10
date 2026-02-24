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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { format } from 'date-fns';
import { useCatalogoAreaEmpleadoApoyo } from "@/hooks/useCatalogoAreaEmpleadoApoyo";
import DateTime from "../dateTime";
import { Loader2 } from "lucide-react";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { useArticulosConcesionados } from "@/hooks/useArticulosConcesionados";
import { Input } from "../ui/input";
import LoadImage, { Imagen } from "../upload-Image";
import ConcesionadosAgregarEquipos, { EquipoConcesionado } from "../concesionados-agregar-equipos";
import { useBoothStore } from "@/store/useBoothStore";
import { useUploadImage } from "@/hooks/useUploadImage";
import { base64ToFile } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";


interface ArticuloData {
  ubicacion_concesion?: string;
  area_concesion?: string;
  caseta_concesion?: string;
  status_concesion?: string;
  persona_nombre_concesion?: string;
  persona_email_concesion?: string | string[]; // Puede ser string o array de strings
  persona_id_concesion?: number | number[]; // Puede ser número o array de numeros
  persona_nombre_otro?: string;
  persona_email_otro?: string;
  persona_identificacion_otro?: Imagen[];
  fecha_concesion?: string;
  equipos?: EquipoConcesionado[];
  observacion_concesion?: string;
  evidencia?: Imagen[];
  firma?: Imagen; // Solo es imagen sin array

  solicita_concesion?: string;
  equipo_concesion?: string;
  persona_text?: string;
}

interface AddFallaModalProps {
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  mode?: 'create' | 'edit';
  initialData?: ArticuloData;
  children:ReactNode;
}

const imagenSchema = z.object({
  file_url: z.string(),
  file_name: z.string(),
});

export const equipoSchema = z.object({
  id_movimiento: z.string().optional(),
  categoria_equipo_concesion: z.string(),
  nombre_equipo: z.string(),
  costo_equipo_concesion: z.union([z.number(), z.array(z.number())]).optional(), // Puede ser número o array
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
  solicita_concesion: z.string().min(2, {
    message: "Este campo es requerido.",
  }),
});

export const AddArticuloConModal: React.FC<AddFallaModalProps> = ({
  isSuccess,
  setIsSuccess,
  mode = 'create',
  initialData,
  children
}) => {
  const [conSelected, setConSelected] = useState<string>("");
  console.log(conSelected)
  const { location, area } = useBoothStore();
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(location??"");
  const [equipos, setEquipos]= useState<any[]>([])
  const { dataAreas: areas, dataLocations: ubicaciones, isLoadingAreas: loadingAreas, isLoadingLocations: loadingUbicaciones } = 
    useCatalogoPaseAreaLocation(ubicacionSeleccionada, true);
  const { data: dataAreaEmpleadoApoyo, isLoading: loadingAreaEmpleadoApoyo } = 
    useCatalogoAreaEmpleadoApoyo(isSuccess);
  const { createArticulosConMutation, editarArticulosConMutation, isLoading } = 
    useArticulosConcesionados(ubicacionSeleccionada, area??"", "", false, "", "", "");
  const [date, setDate] = useState<Date | "">("");

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
      fecha_concesion: "",
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
      if (mode === 'edit' && initialData) {
        reset({
          ubicacion_concesion: initialData.ubicacion_concesion || "",
          area_concesion: initialData.area_concesion || "",
          caseta_concesion: initialData.caseta_concesion || "",
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
        if (initialData.ubicacion_concesion) {
          setUbicacionSeleccionada(initialData.ubicacion_concesion);
        }
        if (initialData.caseta_concesion) {
          setConSelected(initialData.caseta_concesion);
        }
        if (initialData.fecha_concesion) {
          setDate(new Date(initialData.fecha_concesion));
        }
      } else {
        reset();
        setDate(new Date());
        setUbicacionSeleccionada(location??"");
        setConSelected("");
      }
    }
  }, [isSuccess, mode, initialData, reset, location]);

  useEffect(() => {
    if (!isLoading) {
      handleClose();
    }
  }, [isLoading]);

  function onSubmit(values: z.infer<typeof formSchema>) {

    if (!equipos || equipos.length === 0) {
      toast.error("Debe agregar al menos un equipo antes de enviar.");
      form.setError("equipos", { 
        type: "manual", 
        message: "Debe agregar al menos un equipo." 
      });
      return; 
    }
    if (date) {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
      const formatData = {
        ubicacion_concesion: values.ubicacion_concesion ?? "",
        area_concesion: values.area_concesion ?? "",
        caseta_concesion: values.caseta_concesion ?? "",
        status_concesion: mode === 'create' ? "abierto" : (values.status_concesion || "abierto"),
        persona_nombre_concesion: values.persona_nombre_concesion ?? "",
        persona_email_concesion: values.persona_email_concesion ?? "",
        persona_id_concesion: values.persona_id_concesion ?? undefined,
        persona_nombre_otro: values.persona_nombre_otro ?? "",
        persona_email_otro: values.persona_email_otro ?? "",
        persona_identificacion_otro: values.persona_identificacion_otro ?? [],
        fecha_concesion: formattedDate ?? "",
        equipos:equipos ?? [],
        observacion_concesion: values.observacion_concesion ?? "",
        evidencia: values.evidencia ?? [],
        firma: values.firma ?? undefined, 
      };
      if (mode === 'edit') {
        
        editarArticulosConMutation.mutate({data_article_update: formatData , folio:""});
      } else {
        createArticulosConMutation.mutate({ data_article: formatData });
      }
    } else {
      form.setError("fecha_concesion", { type: "manual", message: "Fecha es un campo requerido." });
    }
  }

  const handleClose = () => {
    setIsSuccess(false);
  };

  const tipoCon = form.watch("solicita_concesion");

  const buttonText = mode === 'edit' ? 'Actualizar Artículo' : 'Crear Artículo';
  const loadingText = mode === 'edit' ? 'Actualizando Artículo...' : 'Creando Artículo...';
  
  const convertirTextoAImagen = (texto: string): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    canvas.width = 400;
    canvas.height = 100;
    
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#000000';
    ctx.font = 'bold italic 32px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, canvas.width / 2, canvas.height / 2);
    
    return canvas.toDataURL('image/png');
  };

  useEffect(() => {
    form.setValue("equipos", equipos);
  }, [equipos, form]);


  const [textoFirma, setTextoFirma] = useState('');
  const [vistaPrevia, setVistaPrevia] = useState<string>('');
  const { uploadImageMutation, response, isLoading:isLoadingImage } = useUploadImage();
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const handleTextoChange = async (texto: string) => {
    setTextoFirma(texto);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (texto.trim()) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const imagenBase64 = await convertirTextoAImagen(texto);
          setVistaPrevia(imagenBase64);
          const imagenFile = base64ToFile(imagenBase64, `firma_${Date.now()}`);
          uploadImageMutation.mutate({ img: imagenFile });
        } catch (error) {
          console.error('Error:', error);
        }
      }, 800);
    } else {
      setVistaPrevia('');
      form.setValue('firma', undefined);
    }
  };
  
  useEffect(() => {
    if (response?.file_url) {
      form.setValue('firma', {
        file_url: response.file_url,
        file_name: response.file_name??""
      });
    }
  }, [response]);

  return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess} modal>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[80vh] flex flex-col" onInteractOutside={(e) => e.preventDefault()} aria-describedby="">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl text-center font-bold">
           Nueva Concesión
          </DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="ubicacion_concesion"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Ubicacion:</FormLabel>
                    <FormControl>
                      <Select {...field} className="input"
                        onValueChange={(value: string) => {
                          field.onChange(value);
                          setUbicacionSeleccionada(value);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          {loadingUbicaciones ?
                            <SelectValue placeholder="Cargando ubicaciones..." /> : <SelectValue placeholder="Selecciona una ubicación" />}
                        </SelectTrigger>
                        <SelectContent>
                          {ubicaciones?.map((vehiculo: string, index: number) => (
                            <SelectItem key={index} value={vehiculo}>
                              {vehiculo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Area:</FormLabel>
                    <FormControl>
                      <Select {...field} className="input"
                        onValueChange={(value: string) => {
                          field.onChange(value);
                          setConSelected(value);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          {loadingAreas ?
                            <SelectValue placeholder="Cargando areas..." /> : <SelectValue placeholder="Selecciona una ubicación" />}
                        </SelectTrigger>
                        <SelectContent>
                          {areas?.length > 0 ? (
                            <>
                              {areas?.map((area: string, index: number) => {
                                return (
                                  <SelectItem key={index} value={area}>
                                    {area}
                                  </SelectItem>
                                );
                              })}
                            </>
                          ) : <SelectItem key={"1"} value={"1"} disabled>No hay opciones disponibles.</SelectItem>}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fecha_concesion"
                render={() => (
                  <FormItem>
                    <FormLabel> Fecha y hora de la concesion:</FormLabel>
                    <FormControl>
                      <DateTime date={date} setDate={setDate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                <FormField
                    control={form.control}
                    name="solicita_concesion"
                    defaultValue="si"
                    render={({ field }: any) => (
                        <FormItem>
                            <FormLabel>Solicitante:</FormLabel>
                            <FormControl>
                                <div className="flex gap-2 ">
                                    <button
                                    type="button"
                                    onClick={() => {field.onChange("empleado");}}
                                    className={`px-6 py-2 rounded ${
                                        field.value === "empleado"
                                        ? "bg-blue-600 text-white "
                                        : "bg-white-200 text-blue-600 border border-blue-500 "
                                    }`}
                                    >
                                    Empleado
                                    </button>
                                    <button
                                    type="button"
                                    onClick={() => {field.onChange("otro"); form.setValue("persona_nombre_concesion","")}}
                                    className={`px-6 py-2 rounded ${
                                        field.value === "otro"
                                        ? "bg-blue-600 text-white"
                                        : "bg-white-200 text-blue-600 border border-blue-500"
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
     
              {tipoCon == "otro" &&
                <FormField
                  control={form.control}
                  name="persona_nombre_otro"
                  render={({ field }: any) => (
                    <FormItem className="col-span-1">
                      <FormLabel>Persona: </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Persona"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />}

              {(tipoCon == "empleado" ) &&
                <FormField
                  control={form.control}
                  name="persona_nombre_concesion"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Persona:</FormLabel>
                      <FormControl>
                        <Select {...field} className="input"
                          onValueChange={(value: string) => {
                            field.onChange(value);
                          }}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            {loadingAreaEmpleadoApoyo ? (
                              <SelectValue placeholder="Cargando empleados..." />
                            ) : (<>
                              {dataAreaEmpleadoApoyo?.length > 0 ? (<SelectValue placeholder="Selecciona una opción..." />)
                                : (<SelectValue placeholder="Selecciona una categoria para ver las opciones..." />)
                              }
                            </>)}

                          </SelectTrigger>
                          <SelectContent>
                            {dataAreaEmpleadoApoyo?.length > 0 ? (
                              dataAreaEmpleadoApoyo?.map((item: string, index: number) => {
                                return (
                                  <SelectItem key={index} value={item}>
                                    {item}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <><SelectItem disabled value={"no opciones"}>No hay opciones disponibles</SelectItem></>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              }
          {tipoCon == "otro" &&
            <div >
              <Controller
                control={form.control}
                name="evidencia"
                render={({ field, fieldState }) => (
                  <div className="flex ">
                    <div className="flex flex-col">
                      <LoadImage
                        id="identificacion"
                        titulo={"Identificación"}
                        imgArray={field.value || []}
                        setImg={field.onChange}
                        showWebcamOption={true}
                        facingMode="environment"
                        limit={10} />
                      {fieldState.error && <span className="block w-full text-red-500 text-sm mt-1">{fieldState.error.message}</span>}
                    </div>
                  </div>)
                }
              />
            </div>
            }

              <div className="col-span-1 md:col-span-2">
                <ConcesionadosAgregarEquipos equipos={equipos} setEquipos={setEquipos} mode={"editar"}></ConcesionadosAgregarEquipos>
                {form.formState.errors.equipos && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.equipos.message}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="observacion_concesion"
                render={({ field }: any) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Observaciones: </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Texto"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                <div className="flex col-span-2 w-1/2 ">

                <FormField
                  control={form.control}
                  name="firma"
                  render={() => (
                    <FormItem>
                      <FormLabel>Firma</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <Input 
                            className="border-none font-bold italic" 
                            style={{ fontFamily: 'Georgia, serif' }} 
                            placeholder="Escribe tu firma..." 
                            value={textoFirma}
                            disabled={isLoadingImage}
                            onChange={(e) => handleTextoChange(e.target.value)}
                          />
                          
                          {vistaPrevia && (
                            <div className="border rounded-md p-4 bg-gray-50">
                              <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
                              <Image 
                                height={250}
                                width={200}
                                src={vistaPrevia} 
                                alt="Vista previa de firma" 
                                className="max-w-full h-auto"
                              />
                            </div>
                          )}
                          
                          {isLoadingImage && (
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <span className="animate-spin">⏳</span>
                              Subiendo firma...
                            </p>
                          )}
                        </div>
      
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </form>
          </Form>
        </div>
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={handleClose}>
              Cancelar
            </Button>
          </DialogClose>

          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white " 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" /> {loadingText}
              </>
            ) : (buttonText)}
          </Button>

          
        </div>

      </DialogContent>
    </Dialog>
  );
};