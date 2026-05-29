/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "../ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { format } from 'date-fns';
import { useCatalogoAreaEmpleadoApoyo } from "@/hooks/useCatalogoAreaEmpleadoApoyo";
import DateTime from "../dateTime";
import { ArrowLeft, ArrowRight, Bell, Bot, CheckCircle2, List, Loader2, MapPin, Package, Pencil, ScanLine, Sparkles } from "lucide-react";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { usePaqueteria } from "@/hooks/usePaqueteria";
import LoadImage, { Imagen } from "../upload-Image";
import { useCatalogoProveedores } from "@/hooks/useCatalogoProveedores";
import { useGetLockers } from "@/hooks/useGetLockers";
import { useBoothStore } from "@/store/useBoothStore";
import { cn } from "@/lib/utils";

interface AddFallaModalProps {
  title: string;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
}

const formSchema = z.object({
  ubicacion_paqueteria: z.string().min(2, { message: "Ubicación campo es requerido." }),
  area_paqueteria: z.string().min(2, { message: "Area es campo requerido." }),
  fotografia_paqueteria: z.array(z.object({ file_url: z.string(), file_name: z.string() })).optional(),
  descripcion_paqueteria: z.string().optional(),
  quien_recibe_paqueteria: z.string().optional(),
  guardado_en_paqueteria: z.string().optional(),
  fecha_recibido_paqueteria: z.string().optional(),
  estatus_paqueteria: z.array(z.string()).optional(),
  proveedor: z.string().optional(),
  no_guia: z.string().optional(),
  receptor: z.string().optional(),
  remitente: z.string().optional(),
  direccion_remitente: z.string().optional(),
  notificacion: z.enum(["ninguna", "correo", "sms"]).optional(),
});

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

export const AddPaqueteriaModal: React.FC<AddFallaModalProps> = ({
  title, isSuccess, setIsSuccess,
}) => {
  const { location, area } = useBoothStore();
  const [step, setStep] = useState(1);
  const [conSelected, setConSelected] = useState<string>(area ?? "");
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(location ?? "");
  const { dataAreas: areas, dataLocations: ubicaciones, isLoadingAreas: loadingAreas, isLoadingLocations: loadingUbicaciones } = useCatalogoPaseAreaLocation(ubicacionSeleccionada, true, ubicacionSeleccionada ? true : false);
  const { data: dataAreaEmpleadoApoyo, isLoading: loadingAreaEmpleadoApoyo } = useCatalogoAreaEmpleadoApoyo(isSuccess);
  const { dataProveedores } = useCatalogoProveedores(isSuccess);
  const { createPaqueteriaMutation, isLoading } = usePaqueteria(ubicacionSeleccionada, area ?? "", "", false, "", "", "");
  const { data: responseGetLockers, isLoading: loadingGetLockers } = useGetLockers(ubicacionSeleccionada ?? false, "", "Disponible", isSuccess);
  const [date, setDate] = useState<Date | "">(new Date());
  const [evidencia, setEvidencia] = useState<Imagen[]>([]);
  const [etiqueta, setEtiqueta] = useState<Imagen[]>([]);
  const [ocrDone, setOcrDone] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ubicacion_paqueteria: location,
      area_paqueteria: area,
      fotografia_paqueteria: [],
      descripcion_paqueteria: "",
      quien_recibe_paqueteria: "",
      guardado_en_paqueteria: "",
      fecha_recibido_paqueteria: "",
      estatus_paqueteria: ["guardado"],
      proveedor: "",
      no_guia: "",
      receptor: "",
      remitente: "",
      direccion_remitente: "",
      notificacion: "ninguna",
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (isSuccess) {
      reset();
      setDate(new Date());
      setUbicacionSeleccionada(location ?? "");
      setConSelected(area ?? "");
      setStep(1);
      setOcrDone(false);
      setEvidencia([]);
      setEtiqueta([]);
      reset({ ubicacion_paqueteria: location, area_paqueteria: area, notificacion: "ninguna" });
    }
  }, [isSuccess]);

  useEffect(() => {
    if (!isLoading) handleClose();
  }, [isLoading]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (date) {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
      const allImages = [...evidencia, ...etiqueta];
      const formatData = {
        ubicacion_paqueteria: ubicacionSeleccionada,
        area_paqueteria: values.area_paqueteria ?? "",
        fotografia_paqueteria: allImages ?? [],
        descripcion_paqueteria: values.descripcion_paqueteria ?? "",
        quien_recibe_paqueteria: values.quien_recibe_paqueteria ?? "",
        guardado_en_paqueteria: values.guardado_en_paqueteria ?? "",
        fecha_recibido_paqueteria: formattedDate ?? "",
        fecha_entregado_paqueteria: "",
        entregado_a_paqueteria: "",
        estatus_paqueteria: ["guardado"],
        proveedor: values.proveedor ?? "",
      };
      createPaqueteriaMutation.mutate({ data_paquete: formatData });
    } else {
      form.setError("fecha_recibido_paqueteria", { type: "manual", message: "Fecha es un campo requerido." });
    }
  }

  const handleOcrResult = (result: any) => {
    // Siempre muestra los inputs aunque el OCR falle o devuelva vacío
    setOcrDone(true);

    const data = result?.data ?? result;
    if (!data) return;

    if (data?.no_guia) form.setValue("no_guia", data.no_guia);
    if (data?.receptor) form.setValue("quien_recibe_paqueteria", data.receptor);
    if (data?.remitente) form.setValue("remitente", data.remitente);
    if (data?.direccion_remitente) form.setValue("direccion_remitente", data.direccion_remitente);
    if (data?.descripcion) form.setValue("descripcion_paqueteria", data.descripcion);

    if (data?.paqueteria) {
      const normalize = (str: string) =>
        str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() ?? "";
      const match = dataProveedores?.find((p: string) =>
        normalize(p).includes(normalize(data.paqueteria)) ||
        normalize(data.paqueteria).includes(normalize(p))
      );
      // Si hay match usa el catálogo, si no pone el texto raw del OCR en el input
      form.setValue("proveedor", match ?? data.paqueteria);
    }
  };

  const handleClose = () => { setIsSuccess(false); setStep(1); };
  const canGoNext = etiqueta.length > 0 || evidencia.length > 0;

  return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess} modal>
      <DialogTrigger />
      <DialogContent
        className="p-0 overflow-hidden !max-w-[680px] w-[95vw] max-h-[95vh] rounded-3xl shadow-2xl flex flex-col border-none bg-white"
        aria-describedby=""
        onInteractOutside={(e) => e.preventDefault()}>

        <DialogHeader className="px-8 pt-7 pb-0 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-slate-800 text-center">{title}</DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5 text-center">
                {step === 1 ? "Fotografía del paquete y etiqueta" : "Completa los detalles del envío"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full transition-all", step === 1 ? "bg-blue-500 w-6" : "bg-slate-200")} />
              <div className={cn("w-2 h-2 rounded-full transition-all", step === 2 ? "bg-blue-500 w-6" : "bg-slate-200")} />
            </div>
          </div>
          <div className="h-px bg-slate-100 -mx-8 mt-4" />
        </DialogHeader>

        <Form {...form}>
          <form className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 px-8 py-6 no-scrollbar">

              {/* ── STEP 1: Fotos ── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Análisis automático con IA</p>
                      <p className="text-xs text-blue-500 mt-0.5 leading-relaxed">
                        Al cargar las fotos, se extraerá información con IA.
                      </p>
                      <p className="text-xs text-amber-500 mt-1 font-medium">
                        ⚠ La IA puede cometer errores, verifica los datos antes de continuar.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
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
                        limit={5}
                        showPlaceholder={true}
                        tipoOcr="truck"
                        onOcrResult={handleOcrResult}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
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
                        limit={5}
                        tipoOcr="paquete"
                        onOcrResult={handleOcrResult}
                        showPlaceholder={true}
                      />
                    </div>
                  </div>

                  {/* Banner OCR done */}
                  {ocrDone && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <p className="text-xs text-green-700 font-medium">Análisis completado. Revisa y corrige los datos detectados.</p>
                    </div>
                  )}

                  {/* Inputs — siempre visibles tras OCR (con o sin datos) */}
                  {ocrDone && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Datos del paquete</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="no_guia"
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-500">No. Guía</FormLabel>
                              <FormControl><Input {...field} className="h-9 text-sm" placeholder="Número de guía" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="proveedor"
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-500">Paquetería</FormLabel>
                              <FormControl>
                                <InputOrSelect
                                  value={field.value}
                                  onChange={field.onChange}
                                  options={dataProveedores ?? []}
                                  placeholder="Selecciona o escribe..."
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="quien_recibe_paqueteria"
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-500">Destinatario</FormLabel>
                              <FormControl>
                                <InputOrSelect
                                  value={field.value}
                                  onChange={field.onChange}
                                  options={dataAreaEmpleadoApoyo ?? []}
                                  placeholder="Selecciona o escribe..."
                                  isLoading={loadingAreaEmpleadoApoyo}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="remitente"
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-500">Remitente</FormLabel>
                              <FormControl><Input {...field} className="h-9 text-sm" placeholder="Nombre del remitente" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="descripcion_paqueteria"
                          render={({ field }: any) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="text-xs text-slate-500">Descripción</FormLabel>
                              <FormControl>
                                <Textarea {...field} className="resize-none text-sm min-h-[70px]" placeholder="Descripción del contenido..." />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: Detalles ── */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-slate-700">Ubicación y entrega</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="ubicacion_paqueteria"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ubicación</FormLabel>
                            <FormControl>
                              <Select {...field} onValueChange={(value: string) => { field.onChange(value); setUbicacionSeleccionada(value); }} value={ubicacionSeleccionada}>
                                <SelectTrigger className="w-full">
                                  {loadingUbicaciones ? <SelectValue placeholder="Cargando..." /> : <SelectValue placeholder="Selecciona ubicación" />}
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
                      <FormField control={form.control} name="area_paqueteria"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Área</FormLabel>
                            <FormControl>
                              <Select {...field} onValueChange={(value: string) => { field.onChange(value); setConSelected(value); }} value={conSelected}>
                                <SelectTrigger className="w-full">
                                  {loadingAreas ? <SelectValue placeholder="Cargando..." /> : <SelectValue placeholder="Selecciona área" />}
                                </SelectTrigger>
                                <SelectContent>
                                  {areas?.length > 0
                                    ? areas.map((a: string, i: number) => <SelectItem key={i} value={a}>{a}</SelectItem>)
                                    : <SelectItem key="1" value="1" disabled>Sin opciones.</SelectItem>}
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
                            <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha de recepción</FormLabel>
                            <FormControl>
                              <DateTime date={date} setDate={setDate} disablePastDates={false} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="guardado_en_paqueteria"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Locker / Guardado en</FormLabel>
                            <FormControl>
                              <Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
                                <SelectTrigger className="w-full">
                                  {loadingGetLockers ? <SelectValue placeholder="Cargando..." /> : <SelectValue placeholder={responseGetLockers?.length > 0 ? "Selecciona..." : "Sin opciones"} />}
                                </SelectTrigger>
                                <SelectContent>
                                  {responseGetLockers?.length > 0
                                    ? responseGetLockers.map((item: any, i: number) => <SelectItem key={i} value={item.locker_id}>{item.locker_id}</SelectItem>)
                                    : <SelectItem disabled value="no opciones">Sin opciones</SelectItem>}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-slate-700">Notificación a destinatario</span>
                    </div>
                    <FormField control={form.control} name="notificacion"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 w-fit">
                              {[
                                { value: "ninguna", label: "Ninguna" },
                                { value: "correo", label: "Correo" },
                                { value: "sms", label: "SMS" },
                              ].map((opt) => (
                                <button key={opt.value} type="button" onClick={() => field.onChange(opt.value)}
                                  className={cn("px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    field.value === opt.value ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {ocrDone && (
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resumen detectado por IA</span>
                      </div>
                      {[
                        { label: "No. Guía", value: form.watch("no_guia") },
                        { label: "Paquetería", value: form.watch("proveedor") },
                        { label: "Destinatario", value: form.watch("quien_recibe_paqueteria") },
                        { label: "Remitente", value: form.watch("remitente") },
                        { label: "Descripción", value: form.watch("descripcion_paqueteria") },
                      ].filter(i => i.value).map((item, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="text-slate-700 font-medium truncate ml-4 max-w-[60%] text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 px-8 py-4 border-t border-slate-100 shrink-0">
              {step === 1 ? (
                <>
                  <DialogClose asChild>
                    <Button type="button" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 shadow-none border-0" onClick={handleClose}>
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="button" onClick={() => setStep(2)} disabled={!canGoNext}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white gap-2">
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" onClick={() => setStep(1)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 shadow-none border-0 gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                  </Button>
                  <Button type="button" onClick={form.handleSubmit(onSubmit)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white gap-2" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="animate-spin w-4 h-4" /> Guardando...</> : <><CheckCircle2 className="w-4 h-4" /> Guardar paquete</>}
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};