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
import { useForm } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import LoadImage, { Imagen } from "../upload-Image";
import { useCatalogoAreaEmpleado } from "@/hooks/useCatalogoAreaEmpleado";
import { format } from "date-fns";

import DateTime from "../dateTime";
import { Camera, Loader2, MapPin, Package, Truck, User } from "lucide-react";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { useArticulosPerdidos } from "@/hooks/useArticulosPerdidos";
import { catalogoColores } from "@/lib/utils";
import { Input } from "../ui/input";
import { useCatalogoArticulos } from "@/hooks/useCatalogoArticulos";
import { useGetLockers } from "@/hooks/useGetLockers";
import { useBoothStore } from "@/store/useBoothStore";

interface AddFallaModalProps {
  title: string;
  data: any;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
}

const formSchema = z.object({
  area_perdido: z.string().optional(),
  articulo_perdido: z.string().optional(),
  articulo_seleccion: z
    .string()
    .min(1, { message: "Este campo es obligatorio" }),
  color_perdido: z.string().min(1, { message: "Este campo es obligatorio" }),
  comentario_perdido: z.string().optional(),
  date_hallazgo_perdido: z.string().optional(),
  descripcion: z.string().optional(),
  estatus_perdido: z.string().optional(),
  foto_perdido: z
    .array(
      z.object({
        file_url: z.string(),
        file_name: z.string(),
      }),
    )
    .optional(),
  locker_perdido: z.string().min(1, { message: "Este campo es obligatorio" }),
  quien_entrega: z.string().optional(),
  quien_entrega_externo: z.string().optional(),
  quien_entrega_interno: z.string().optional(),
  tipo_articulo_perdido: z.string().optional(),
  ubicacion_perdido: z.string().optional(),
});

export const AddArticuloModal: React.FC<AddFallaModalProps> = ({
  title,
  isSuccess,
  setIsSuccess,
}) => {
  const [tipoArt, setTipoArt] = useState<string>("");
  const { location } = useBoothStore();
  // const [catalagoSub, setCatalogoSub] = useState<string[]>([]);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState("");
  const {
    dataAreas: areas,
    dataLocations: ubicaciones,
    isLoadingAreas: loadingAreas,
    isLoadingLocations: loadingUbicaciones,
  } = useCatalogoPaseAreaLocation(
    ubicacionSeleccionada,
    true,
    ubicacionSeleccionada ? true : false,
  );

  const {
    data: dataAreaEmpleado,
    isLoading: loadingAreaEmpleado,
    refetch: refetchAreaEmpleado,
  } = useCatalogoAreaEmpleado(
    isSuccess,
    ubicacionSeleccionada,
    "Objetos Perdidos",
  );
  const { data: dataArticulos, isLoading: isLoadingArticulos } =
    useCatalogoArticulos(tipoArt, isSuccess);
  const { createArticulosPerdidosMutation, isLoading } = useArticulosPerdidos(
    "",
    "",
    "abierto",
    false,
    "",
    "",
    "",
  );
  const { data: responseGetLockers, isLoading: loadingGetLockers } =
    useGetLockers(ubicacionSeleccionada ?? false, "", "Disponible", isSuccess);
  const [isActiveInterno, setIsActiveInterno] = useState<string | null>(
    "interno",
  );

  const [evidencia, setEvidencia] = useState<Imagen[]>([]);
  const [date, setDate] = useState<Date | "">("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      area_perdido: "",
      articulo_perdido: "",
      articulo_seleccion: "",
      color_perdido: "",
      comentario_perdido: "",
      date_hallazgo_perdido: "",
      descripcion: "",
      estatus_perdido: "",
      foto_perdido: [],
      locker_perdido: "",
      quien_entrega: "",
      quien_entrega_externo: "",
      quien_entrega_interno: "",
      tipo_articulo_perdido: "",
      ubicacion_perdido: "",
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (location) {
      setUbicacionSeleccionada(location);
    }
  }, []);

  useEffect(() => {
    if (isSuccess) {
      reset();
      setDate(new Date());
      setEvidencia([]);
      refetchAreaEmpleado();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (!isLoading) {
      handleClose();
    }
  }, [isLoading]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (date) {
      const formattedDate = format(new Date(date), "yyyy-MM-dd HH:mm:ss");
      const formatData = {
        area_perdido: values.area_perdido || "",
        articulo_perdido: values.articulo_perdido || "",
        articulo_seleccion: values.articulo_seleccion || "",
        color_perdido: values.color_perdido || "",
        comentario_perdido: values.comentario_perdido || "",
        date_hallazgo_perdido: formattedDate || "",
        descripcion: values.descripcion || "",
        estatus_perdido: values.estatus_perdido || "pendiente",
        foto_perdido: evidencia || [],
        locker_perdido:
          responseGetLockers?.find((l: any) => l._id === values.locker_perdido)
            ?.locker_id || values.locker_perdido,
        quien_entrega: values.quien_entrega || "externo",
        quien_entrega_externo: values.quien_entrega_externo || "",
        quien_entrega_interno: values.quien_entrega_interno || "",
        tipo_articulo_perdido: values.tipo_articulo_perdido || "",
        ubicacion_perdido: ubicacionSeleccionada || "",
      };
      createArticulosPerdidosMutation.mutate({ data_article: formatData });
    } else {
      form.setError("date_hallazgo_perdido", {
        type: "manual",
        message: "Fecha es un campo requerido.",
      });
    }
  }

  const handleClose = () => {
    setIsSuccess(false);
  };

  const handleToggleInterno = (value: string) => {
    setIsActiveInterno(value);
  };

  return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess} modal>
    <DialogTrigger />
    <DialogContent
      className="p-0 overflow-hidden !max-w-[900px] w-[95vw] sm:w-[92vw] max-h-[95vh] rounded-3xl shadow-2xl flex flex-col border-none bg-background"
      aria-describedby=""
      onInteractOutside={(e) => e.preventDefault()}>
  
      <DialogHeader className="px-8 pt-8 pb-4 shrink-0 border-b border-slate-100">
        <DialogTitle className="text-2xl text-center font-bold text-gray-800">
          {title}
        </DialogTitle>
        <p className="text-center text-sm text-gray-400">
          Completa la información para registrar el artículo perdido
        </p>
      </DialogHeader>
  
      <div className="overflow-y-auto flex-1 px-8 py-6 no-scrollbar">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
  
            {/* Información general */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="text-blue-500 w-5 h-5" />
                <h3 className="font-semibold text-gray-700">Información general</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField control={form.control} name="ubicacion_perdido"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ubicación</FormLabel>
                      <FormControl>
                        <Select {...field} onValueChange={(value: string) => { field.onChange(value); setUbicacionSeleccionada(value); }} value={ubicacionSeleccionada}>
                          <SelectTrigger className="w-full">
                            {loadingUbicaciones ? <SelectValue placeholder="Cargando ubicaciones..." /> : <SelectValue placeholder="Selecciona una ubicación" />}
                          </SelectTrigger>
                          <SelectContent>
                            {ubicaciones?.map((v: string, i: number) => <SelectItem key={i} value={v}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
  
                <FormField control={form.control} name="area_perdido"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Área</FormLabel>
                      <FormControl>
                        <Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
                          <SelectTrigger className="w-full">
                            {loadingAreas ? <SelectValue placeholder="Cargando areas..." /> : <SelectValue placeholder="Selecciona un área" />}
                          </SelectTrigger>
                          <SelectContent>
                            {areas?.length > 0
                              ? areas.map((a: string, i: number) => <SelectItem key={i} value={a}>{a}</SelectItem>)
                              : <SelectItem key="1" value="1" disabled>No hay opciones disponibles.</SelectItem>}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
  
                <FormField control={form.control} name="date_hallazgo_perdido"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha del hallazgo</FormLabel>
                      <FormControl>
                        <DateTime date={date} setDate={setDate} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
  
                <FormField control={form.control} name="locker_perdido"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Área de resguardo</FormLabel>
                      <FormControl>
                        <Select {...field} onValueChange={(selectedId: string) => field.onChange(selectedId)} value={field.value}>
                          <SelectTrigger className="w-full">
                            {loadingGetLockers ? <SelectValue placeholder="Cargando opciones..." /> : <SelectValue placeholder="Selecciona una opción" />}
                          </SelectTrigger>
                          <SelectContent>
                            {responseGetLockers
                              ? responseGetLockers.map((locker: any) => <SelectItem key={locker._id} value={locker._id}>{locker.locker_id} - {locker.area}</SelectItem>)
                              : <SelectItem value="__no_lockers__" disabled>Selecciona una ubicación</SelectItem>}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
  
                {/* Fotografía */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Camera className="text-blue-500 w-5 h-5" />
                <h3 className="font-semibold text-gray-700">Fotografía del artículo</h3>
              </div>
              <div className="grid grid-cols-2">
              <LoadImage
                id="evidencia"
                titulo="Fotografía del artículo"
                setImg={setEvidencia}
                showWebcamOption={true}
                facingMode="environment"
                imgArray={evidencia}
                limit={10}
                // tipoOcr="truck"
                // onOcrResult={(result) => {
                //   console.log("OCR truck result:", result);
                // }}
              />
              </div>
            </div>
            {/* Detalles del artículo */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="text-blue-500 w-5 h-5" />
                <h3 className="font-semibold text-gray-700">Detalles del artículo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField control={form.control} name="articulo_perdido"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del artículo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
  
                <FormField control={form.control} name="tipo_articulo_perdido"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de artículo</FormLabel>
                      <FormControl>
                        <Select {...field} onValueChange={(value: string) => { field.onChange(value); setTipoArt(value); }} value={field.value}>
                          <SelectTrigger className="w-full">
                            {isLoadingArticulos && tipoArt === ""
                              ? <SelectValue placeholder="Cargando artículos..." />
                              : <SelectValue placeholder="Selecciona un tipo" />}
                          </SelectTrigger>
                          <SelectContent>
                            {dataArticulos?.map((v: string, i: number) => <SelectItem key={i} value={v}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
  
                <FormField control={form.control} name="articulo_seleccion"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Artículo</FormLabel>
                      <FormControl>
                        <Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
                          <SelectTrigger className="w-full">
                            {isLoadingArticulos && tipoArt
                              ? <SelectValue placeholder="Cargando artículos..." />
                              : <SelectValue placeholder={dataArticulos?.length > 0 ? "Selecciona una opción..." : "Selecciona una categoría primero"} />}
                          </SelectTrigger>
                          <SelectContent>
                            {dataArticulos?.length > 0
                              ? dataArticulos.map((item: string, i: number) => <SelectItem key={i} value={item}>{item}</SelectItem>)
                              : <SelectItem disabled value="no opciones">No hay opciones disponibles</SelectItem>}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
  
                <FormField control={form.control} name="color_perdido"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Color</FormLabel>
                      <FormControl>
                        <Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona un color" />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogoColores().map((v: string) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
  
                <FormField control={form.control} name="descripcion"
                  render={({ field }: any) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Escribe una descripción..." className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
  
                <FormField control={form.control} name="comentario_perdido"
                  render={({ field }: any) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Comentarios</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Comentarios adicionales..." className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
  
            {/* Quién entrega */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="text-blue-500 w-5 h-5" />
                <h3 className="font-semibold text-gray-700">Quién entrega</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleToggleInterno("interno")}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActiveInterno === "interno"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "border border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
                    }`}>
                    Interno
                  </button>
                  <button type="button" onClick={() => handleToggleInterno("externo")}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActiveInterno === "externo"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "border border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
                    }`}>
                    Externo
                  </button>
                </div>
  
                {isActiveInterno === "interno" ? (
                  <FormField control={form.control} name="quien_entrega_interno"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quien entrega (Interno)</FormLabel>
                        <FormControl>
                          <Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
                            <SelectTrigger className="w-full">
                              {loadingAreaEmpleado ? <SelectValue placeholder="Cargando opciones..." /> : <SelectValue placeholder="Selecciona una opción" />}
                            </SelectTrigger>
                            <SelectContent>
                              {dataAreaEmpleado?.map((v: string, i: number) => <SelectItem key={i} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField control={form.control} name="quien_entrega_externo"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quien entrega (Externo)</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de quien entrega" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
  
          </form>
        </Form>
      </div>
  
      <div className="flex gap-2 px-8 py-4 border-t border-slate-100 shrink-0">
        <DialogClose asChild>
          <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={handleClose}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" onClick={form.handleSubmit(onSubmit)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
          {isLoading ? <><Loader2 className="animate-spin" /> Creando Artículo...</> : "Crear Artículo"}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  );
};
