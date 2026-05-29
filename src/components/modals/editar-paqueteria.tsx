/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "../ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle,
} from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { format } from 'date-fns';
import { useCatalogoAreaEmpleado } from "@/hooks/useCatalogoAreaEmpleado";
import DateTime from "../dateTime";
import { Camera, Edit, List, Loader2, MapPin, Package, Pencil, ScanLine } from "lucide-react";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { useShiftStore } from "@/store/useShiftStore";
import { usePaqueteria } from "@/hooks/usePaqueteria";
import { useGetLockers } from "@/hooks/useGetLockers";
import { Textarea } from "../ui/textarea";
import { useCatalogoProveedores } from "@/hooks/useCatalogoProveedores";
import LoadImage, { Imagen } from "../upload-Image";
import { cn } from "@/lib/utils";

interface EditarFallaModalProps {
  title: string;
  data: any;
  setShowLoadingModal: Dispatch<SetStateAction<boolean>>;
  showLoadingModal: boolean;
}

const formSchema = z.object({
  ubicacion_paqueteria: z.string().min(2, { message: "Ubicación campo es requerido." }),
  area_paqueteria: z.string().min(2, { message: "Area es campo requerido." }),
  fotografia_paqueteria: z.array(z.object({ file_url: z.string(), file_name: z.string() })).optional(),
  descripcion_paqueteria: z.string().min(2, { message: "Este campo es requerido." }),
  quien_recibe_paqueteria: z.string().optional(),
  guardado_en_paqueteria: z.string().min(2, { message: "Este campo es requerido." }),
  entregado_a_paqueteria: z.string().optional(),
  fecha_recibido_paqueteria: z.string().optional(),
  fecha_entregado_paqueteria: z.string().optional(),
  estatus_paqueteria: z.array(z.string()).optional(),
  proveedor: z.string().optional(),
  // campos OCR
  no_guia: z.string().optional(),
  receptor: z.string().optional(),
  remitente: z.string().optional(),
});

// Toggle Input / Select
const InputOrSelect = ({
  value, onChange, options, placeholder, isLoading: loading,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  isLoading?: boolean;
}) => {
  const [isInput, setIsInput] = useState(false);
  const hasMatch = !!(value && options?.length > 0 && options.some(
    (o) => o?.toLowerCase() === value?.toLowerCase()
  ));
  const forceInput = !!(value && options?.length > 0 && !hasMatch);
  const showInput = isInput || forceInput;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1">
        {showInput ? (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-9 text-sm"
          />
        ) : (
          <Select value={value} onValueChange={(v) => { onChange(v); setIsInput(false); }}>
            <SelectTrigger className="h-9 text-sm">
              {loading ? <SelectValue placeholder="Cargando..." /> : <SelectValue placeholder={placeholder} />}
            </SelectTrigger>
            <SelectContent>
              {options?.map((item, i) => <SelectItem key={i} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      <button
        type="button"
        onClick={() => setIsInput((prev) => !prev)}
        className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
        title={showInput ? "Ver lista" : "Escribir manualmente"}>
        {showInput ? <List className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};

export const EditarPaqueteria: React.FC<EditarFallaModalProps> = ({
  title, data, setShowLoadingModal,
}) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(data.ubicacion_paqueteria);
  const { location } = useShiftStore();
  const { dataAreas: areas, dataLocations: ubicaciones, isLoadingAreas: loadingAreas } = useCatalogoPaseAreaLocation(ubicacionSeleccionada, true, ubicacionSeleccionada ? true : false);
  const { data: dataAreaEmpleado, isLoading: loadingAreaEmpleado } = useCatalogoAreaEmpleado(isSuccess, location, "Incidencias");
  const { editarPaqueteriaMutation, isLoading } = usePaqueteria("", "", "abierto", false, "", "", "");
  const { dataProveedores, isLoadingProveedores } = useCatalogoProveedores(isSuccess);
  const { data: responseGetLockers, isLoading: loadingGetLockers } = useGetLockers(ubicacionSeleccionada ?? false, "", "Disponible", isSuccess);
  const [evidencia, setEvidencia] = useState<Imagen[]>([]);
  const [date, setDate] = useState<Date | "">("");
  const [etiqueta, setEtiqueta] = useState<Imagen[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ubicacion_paqueteria: data.ubicacion_paqueteria,
      area_paqueteria: data.area_paqueteria,
      fotografia_paqueteria: evidencia,
      descripcion_paqueteria: data.descripcion_paqueteria,
      quien_recibe_paqueteria: data.quien_recibe_paqueteria,
      guardado_en_paqueteria: data.guardado_en_paqueteria,
      fecha_recibido_paqueteria: "",
      entregado_a_paqueteria: data.entregado_a_paqueteria,
      proveedor: data.proveedor,
      no_guia: data.no_guia ?? "",
      receptor: data.receptor ?? "",
      remitente: data.remitente ?? "",
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (isSuccess) {
      reset();
      	setDate(new Date(data.fecha_recibido_paqueteria));
	  	setEvidencia(data.fotografia_paqueteria ?? []);
		setEtiqueta(data.fotografia_etiqueta ?? []);
      	setShowLoadingModal(false);
    }
  }, [isSuccess]);

  useEffect(() => {
    if (!isLoading) handleClose();
  }, [isLoading]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (date) {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
      const formatData = {
        ubicacion_paqueteria: values.ubicacion_paqueteria,
        area_paqueteria: values.area_paqueteria ?? "",
        fotografia_paqueteria: [...evidencia, ...etiqueta],
        descripcion_paqueteria: values.descripcion_paqueteria ?? "",
        quien_recibe_paqueteria: values.quien_recibe_paqueteria ?? "",
        guardado_en_paqueteria: values.guardado_en_paqueteria ?? "",
        fecha_recibido_paqueteria: formattedDate ?? "",
        entregado_a_paqueteria: values.entregado_a_paqueteria ?? "",
        proveedor: values.proveedor ?? "",
      };
      editarPaqueteriaMutation.mutate({ data_paquete_actualizar: formatData, folio: data.folio });
    } else {
      form.setError("fecha_recibido_paqueteria", { type: "manual", message: "Fecha es un campo requerido." });
    }
  }

  const handleClose = () => { reset(); setShowLoadingModal(false); setIsSuccess(false); };
  const handleOpenModal = async () => { setShowLoadingModal(false); setIsSuccess(true); };

  return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess} modal>
      <div className="cursor-pointer" title="Editar Paquete" onClick={handleOpenModal}>
        <Edit className="w-5 h-5" />
      </div>
      <DialogContent
        className="p-0 overflow-hidden !max-w-[900px] w-[95vw] sm:w-[92vw] max-h-[95vh] rounded-3xl shadow-2xl flex flex-col border-none bg-background"
        aria-describedby="">

        <DialogHeader className="px-8 pt-8 pb-4 shrink-0 border-b border-slate-100">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">{title}</DialogTitle>
          <p className="text-center text-sm text-gray-400">Modifica la información del paquete</p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-8 no-scrollbar">
          <Form {...form}>
            <form className="space-y-6 py-6">

              {/* Información general */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="text-blue-500 w-5 h-5" />
                  <h3 className="font-semibold text-gray-700">Información general</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField control={form.control} name="ubicacion_paqueteria"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ubicación</FormLabel>
                        <FormControl>
                          <Select {...field} onValueChange={(value: string) => { field.onChange(value); setUbicacionSeleccionada(value); }} value={ubicacionSeleccionada}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecciona una ubicación" />
                            </SelectTrigger>
                            <SelectContent>
                              {ubicaciones?.length > 0
                                ? ubicaciones.map((v: string, i: number) => <SelectItem key={i} value={v}>{v}</SelectItem>)
                                : <SelectItem key="1" value="1" disabled>No hay opciones disponibles.</SelectItem>}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="area_paqueteria"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Área</FormLabel>
                        <FormControl>
                          <Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
                            <SelectTrigger className="w-full">
                              {loadingAreas ? <SelectValue placeholder="Cargando áreas..." /> : <SelectValue placeholder="Selecciona una opción..." />}
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

                  <FormField control={form.control} name="fecha_recibido_paqueteria"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha de recepción</FormLabel>
                        <FormControl>
                          <DateTime date={date} setDate={setDate} disablePastDates={false} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="quien_recibe_paqueteria"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Destinatario</FormLabel>
                        <FormControl>
                          <InputOrSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={dataAreaEmpleado ?? []}
                            placeholder="Selecciona o escribe..."
                            isLoading={loadingAreaEmpleado}
                          />
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
					<h3 className="font-semibold text-gray-700">Fotografías</h3>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
					<div className="flex items-center gap-2">
						<div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
						<Package className="w-3.5 h-3.5 text-slate-500" />
						</div>
						<span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Paquete</span>
					</div>
					<LoadImage
						id="evidencia"
						titulo="Fotografía del paquete"
						setImg={setEvidencia}
						showWebcamOption={true}
						facingMode="environment"
						imgArray={evidencia}
						limit={10}
						showPlaceholder={true}
					/>
					</div>

					<div className="space-y-2">
					<div className="flex items-center gap-2">
						<div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
						<ScanLine className="w-3.5 h-3.5 text-blue-500" />
						</div>
						<span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Etiqueta</span>
					</div>
					<LoadImage
						id="etiqueta"
						titulo="Fotografía de la etiqueta"
						setImg={setEtiqueta}
						showWebcamOption={true}
						facingMode="environment"
						imgArray={etiqueta}
						limit={10}
						showPlaceholder={true}
					/>
					</div>
				</div>
			</div>

              {/* Detalles del paquete */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="text-blue-500 w-5 h-5" />
                  <h3 className="font-semibold text-gray-700">Detalles del paquete</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <FormField control={form.control} name="proveedor"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Proveedor</FormLabel>
                        <FormControl>
                          <InputOrSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={dataProveedores ?? []}
                            placeholder="Selecciona o escribe..."
                            isLoading={isLoadingProveedores}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="guardado_en_paqueteria"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guardado en</FormLabel>
                        <FormControl>
                          <Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
                            <SelectTrigger className="w-full">
                              {loadingGetLockers ? <SelectValue placeholder="Cargando..." /> : <SelectValue placeholder={responseGetLockers?.length > 0 ? "Selecciona una opción..." : "Sin opciones"} />}
                            </SelectTrigger>
                            <SelectContent>
                              {responseGetLockers?.length > 0
                                ? responseGetLockers.map((item: any, i: number) => <SelectItem key={i} value={item.locker_id}>{item.locker_id}</SelectItem>)
                                : <SelectItem disabled value="no opciones">No hay opciones disponibles</SelectItem>}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="no_guia"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">No. Guía</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-9 text-sm" placeholder="Número de guía" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="receptor"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Receptor</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-9 text-sm" placeholder="Nombre del receptor" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="remitente"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Remitente</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-9 text-sm" placeholder="Nombre del remitente" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="descripcion_paqueteria"
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
          <Button type="button" onClick={form.handleSubmit(onSubmit)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
            {isLoading ? <><Loader2 className="animate-spin" /> Editando paquetería...</> : "Editar paquetería"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};