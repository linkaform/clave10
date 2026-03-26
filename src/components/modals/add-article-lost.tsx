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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import LoadImage, { Imagen } from "../upload-Image";
import { useCatalogoAreaEmpleado } from "@/hooks/useCatalogoAreaEmpleado";
import { format } from 'date-fns';
import DateTime from "../dateTime";
import { Loader2 } from "lucide-react";
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
  articulo_seleccion: z.string().min(1, { message: "Este campo es obligatorio" }),
  color_perdido: z.string().min(1, { message: "Este campo es obligatorio" }),
  comentario_perdido: z.string().optional(),
  date_hallazgo_perdido: z.string().optional(),
  descripcion: z.string().optional(),
  estatus_perdido: z.string().optional(),
  foto_perdido: z.array(
    z.object({
      file_url: z.string(),
      file_name: z.string(),
    })
  ).optional(),
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
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState("");
  const { dataAreas: areas, dataLocations: ubicaciones, isLoadingAreas: loadingAreas, isLoadingLocations: loadingUbicaciones } =
    useCatalogoPaseAreaLocation(ubicacionSeleccionada, true, ubicacionSeleccionada ? true : false);
  const { data: dataAreaEmpleado, isLoading: loadingAreaEmpleado, refetch: refetchAreaEmpleado } =
    useCatalogoAreaEmpleado(isSuccess, ubicacionSeleccionada, "Objetos Perdidos");
  const { data: dataTiposArticulos, isLoading: isLoadingTipos } = useCatalogoArticulos("", isSuccess);
  const { data: dataArticulos, isLoading: isLoadingArticulos } = useCatalogoArticulos(tipoArt, isSuccess);
  const { createArticulosPerdidosMutation, isLoading } = useArticulosPerdidos("", "", "abierto", false, "", "", "");
  const { data: response, isLoading: loadingGetLockers } = useGetLockers(ubicacionSeleccionada ?? false, "", "Disponible", isSuccess);
  const responseGetLockers = [...new Map((response ?? []).map((l: any) => [l.locker_id, l])).values()];
  const [isActiveInterno, setIsActiveInterno] = useState<string | null>("externo");
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
    if (location) setUbicacionSeleccionada(location);
  }, []);

  useEffect(() => {
    if (isSuccess) {
      reset();
      setDate(new Date());
      setEvidencia([]);
      setTipoArt("");
      refetchAreaEmpleado();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (!isLoading) handleClose();
  }, [isLoading]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (date) {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
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
        locker_perdido: values.locker_perdido || "",
        quien_entrega: values.quien_entrega || "externo",
        quien_entrega_externo: values.quien_entrega_externo || "",
        quien_entrega_interno: values.quien_entrega_interno || "",
        tipo_articulo_perdido: values.tipo_articulo_perdido || "",
        ubicacion_perdido: ubicacionSeleccionada || "",
      };
      createArticulosPerdidosMutation.mutate({ data_article: formatData });
    } else {
      form.setError("date_hallazgo_perdido", { type: "manual", message: "Fecha es un campo requerido." });
    }
  }

  const handleClose = () => setIsSuccess(false);

  const handleToggleInterno = (value: string) => setIsActiveInterno(value);

  return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess} modal>
      <DialogTrigger></DialogTrigger>

      <DialogContent
        className="max-w-3xl overflow-y-auto max-h-[80vh] flex flex-col"
        aria-describedby=""
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl text-center font-bold">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <FormField
                control={form.control}
                name="articulo_perdido"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>
                      <span className="text-red-500">*</span> Nombre:
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre Completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_articulo_perdido"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Tipo de artículo:</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value: string) => {
                          field.onChange(value);
                          setTipoArt(value);
                          form.setValue("articulo_seleccion", "");
                        }}
                        value={field.value ?? ""}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={isLoadingTipos ? "Cargando tipos..." : "Selecciona un tipo"} />
                        </SelectTrigger>
                        <SelectContent>
                          {dataTiposArticulos?.length > 0 ? (
                           ([...new Map(dataTiposArticulos.map((a: string) => [a.toLowerCase(), a])).values()] as string[])
						   .map((item: string, index: number) => (
							 <SelectItem key={`tipo-${item}-${index}`} value={item}>
							   {item}
							 </SelectItem>
						   ))
                          ) : (
                            <SelectItem disabled value="no_tipos">No hay opciones disponibles</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="articulo_seleccion"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Artículo:</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value: string) => field.onChange(value)}
                        value={field.value ?? ""}
                        disabled={!tipoArt}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={
                            !tipoArt
                              ? "Selecciona un tipo primero..."
                              : isLoadingArticulos
                              ? "Cargando artículos..."
                              : dataArticulos?.length > 0
                              ? "Selecciona una opción..."
                              : "Sin artículos disponibles"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {dataArticulos?.length > 0 ? (
                           ([...new Map(dataTiposArticulos.map((a: string) => [a.toLowerCase(), a])).values()] as string[])
						   .map((item: string, index: number) => (
							 <SelectItem key={`tipo-${item}-${index}`} value={item}>
							   {item}
							 </SelectItem>
						   ))
                          ) : (
                            <SelectItem disabled value="no_opciones">No hay opciones disponibles</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <LoadImage
                  id="evidencia"
                  titulo={"Evidencia"}
                  setImg={setEvidencia}
                  showWebcamOption={true}
                  facingMode="environment"
                  imgArray={evidencia}
                  limit={10}
                />
              </div>

              <FormField
                control={form.control}
                name="color_perdido"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Color:</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value: string) => field.onChange(value)}
                        value={field.value ?? ""}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un color" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalogoColores().map((color: string) => (
                            <SelectItem key={color} value={color}>
                              {color}
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
                name="descripcion"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Descripción:</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Texto" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_hallazgo_perdido"
                render={() => (
                  <FormItem>
                    <FormLabel>Fecha del hallazgo:</FormLabel>
                    <FormControl>
                      <DateTime date={date} setDate={setDate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ubicacion_perdido"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Ubicacion:</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value: string) => {
                          field.onChange(value);
                          setUbicacionSeleccionada(value);
                        }}
                        value={ubicacionSeleccionada ?? ""}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={loadingUbicaciones ? "Cargando ubicaciones..." : "Selecciona una ubicación"} />
                        </SelectTrigger>
                        <SelectContent>
                          {ubicaciones?.map((ubicacion: string, index: number) => (
                            <SelectItem key={index} value={ubicacion}>
                              {ubicacion}
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
                name="area_perdido"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Area:</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value: string) => field.onChange(value)}
                        value={field.value ?? ""}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={loadingAreas ? "Cargando areas..." : "Selecciona un área"} />
                        </SelectTrigger>
                        <SelectContent>
                          {areas?.length > 0 ? (
                            areas.map((area: string, index: number) => (
                              <SelectItem key={index} value={area}>
                                {area}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no_areas" disabled>No hay opciones disponibles.</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comentario_perdido"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Comentarios</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Texto" className="resize-none w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 flex-col">
                <FormLabel className="mb-2">Quién entrega, Selecciona una opción:</FormLabel>
                <div className="flex gap-2">
                  <Button
                    disabled
                    type="button"
                    onClick={() => handleToggleInterno("interno")}
                    className={`px-4 py-2 rounded-md transition-all duration-300 ${
                      isActiveInterno === "interno" ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
                    }`}
                  >
                    <div className={isActiveInterno === "interno" ? "text-white" : "text-blue-600"}>Interno</div>
                  </Button>
                  <Button
                    disabled
                    type="button"
                    onClick={() => handleToggleInterno("externo")}
                    className={`px-4 py-2 rounded-md transition-all duration-300 ${
                      isActiveInterno === "externo" ? "bg-blue-600 text-white" : "border-2 border-blue-400 bg-transparent"
                    }`}
                  >
                    <div className={isActiveInterno === "externo" ? "text-white" : "text-blue-600"}>Externo</div>
                  </Button>
                </div>
              </div>

              <br />

              {isActiveInterno === "interno" ? (
                <FormField
                  control={form.control}
                  name="quien_entrega_interno"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Quien entrega Interno:</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value: string) => field.onChange(value)}
                          value={field.value ?? ""}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingAreaEmpleado ? "Cargando opciones..." : "Selecciona una opcion"} />
                          </SelectTrigger>
                          <SelectContent>
                            {dataAreaEmpleado?.map((empleado: string, index: number) => (
                              <SelectItem key={index} value={empleado}>
                                {empleado}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="quien_entrega_externo"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Quien entrega Externo:</FormLabel>
                      <FormControl>
                        <Input placeholder="Quien entrega Externo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="locker_perdido"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Área de resguardo:</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value: string) => field.onChange(value)}
                        value={field.value ?? ""}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={loadingGetLockers ? "Cargando opciones..." : "Selecciona una opción"} />
                        </SelectTrigger>
                        <SelectContent>
                          {responseGetLockers.length > 0 ? (
                            responseGetLockers.map((locker: any, index: number) => (
                              <SelectItem key={`${locker.locker_id}-${index}`} value={locker.locker_id}>
                                {locker.locker_id}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no_locker" disabled>Selecciona un locker</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="animate-spin" /> Creando Articulo...</>
            ) : (
              "Crear Articulo"
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};