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
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
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
  email_receptor: z.string().optional(),
  tipo_paquete: z.string().optional(),
  telefono_receptor: z.string().optional(),
  telefono_remitente: z.string().optional()
});

// ── Generador de comprobante con Canvas ──────────────────────────────────────
interface ComprobanteData {
  ubicacion: string;
  area: string;
  fecha: string;
  destinatario: string;
  guardado_en: string;
  proveedor: string;
  no_guia: string;
  tipo_paquete: string;
  descripcion: string;
  remitente: string;
  direccion_remitente: string;
  telefono_remitente: string;
  email_receptor: string;
  telefono_receptor: string;
}

const generarYDescargarComprobante = (data: ComprobanteData) => {
  const W = 800;
  const PADDING = 40;
  const COL = (W - PADDING * 2) / 2 - 10;

  // ── helpers de medida ──
  const tmpCanvas = document.createElement("canvas");
  const tmpCtx = tmpCanvas.getContext("2d")!;

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string): string[] => {
    ctx.font = font;
    const words = (text || "—").split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  // ── calcular campos ──
  const campos = [
    { label: "Destinatario", value: data.destinatario },
    { label: "Ubicación", value: data.ubicacion },
    { label: "Área", value: data.area },
    { label: "Guardado en", value: data.guardado_en },
    { label: "Fecha de recepción", value: data.fecha },
    { label: "Proveedor / Paquetería", value: data.proveedor },
    { label: "No. Guía", value: data.no_guia },
    { label: "Tipo de paquete", value: data.tipo_paquete },
    { label: "Descripción", value: data.descripcion },
    { label: "Remitente", value: data.remitente },
    { label: "Dirección remitente", value: data.direccion_remitente },
    { label: "Teléfono remitente", value: data.telefono_remitente },
    { label: "Email destinatario", value: data.email_receptor },
    { label: "Teléfono destinatario", value: data.telefono_receptor },
  ];

  const FONT_LABEL = "bold 11px system-ui, sans-serif";
  const FONT_VALUE = "13px system-ui, sans-serif";
  const LINE_H = 18;
  const CELL_PAD = 14;
  const CELL_GAP = 10;

  // Pre-calcular alturas de cada celda
  const cellHeights = campos.map(({ value }) => {
    const lines = wrapText(tmpCtx, value || "—", COL - CELL_PAD * 2, FONT_VALUE);
    return CELL_PAD * 2 + LINE_H + lines.length * LINE_H + 4;
  });

  // Layout en 2 columnas
  interface Cell { campo: typeof campos[0]; x: number; y: number; h: number }
  const cells: Cell[] = [];
  let yL = 0, yR = 0;
  campos.forEach((campo, i) => {
    const h = cellHeights[i];
    if (yL <= yR) {
      cells.push({ campo, x: PADDING, y: yL, h });
      yL += h + CELL_GAP;
    } else {
      cells.push({ campo, x: PADDING + COL + 20, y: yR, h });
      yR += h + CELL_GAP;
    }
  });

  const HEADER_H = 110;
  const FOOTER_H = 60;
  const GRID_H = Math.max(yL, yR);
  const H = HEADER_H + GRID_H + FOOTER_H + PADDING;

  // ── dibujar ──
  const canvas = document.createElement("canvas");
  canvas.width = W * 2;   // retina
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);

  // Fondo
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, W, H);

  // Header
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "#1d4ed8");
  grad.addColorStop(1, "#3b82f6");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, HEADER_H - 10, [0, 0, 24, 24]);
  ctx.fill();

  // Ícono caja (simple)
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.roundRect(PADDING, 18, 52, 52, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(PADDING + 12, 28, 28, 28);
  ctx.beginPath();
  ctx.moveTo(PADDING + 12, 34);
  ctx.lineTo(PADDING + 40, 34);
  ctx.stroke();

  // Título
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText("Comprobante de Recepción", PADDING + 64, 38);
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(`Generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm")} hrs`, PADDING + 64, 58);

  // Badge "GUARDADO"
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.roundRect(W - PADDING - 90, 24, 90, 28, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✓ GUARDADO", W - PADDING - 45, 43);
  ctx.textAlign = "left";

  // ── Celdas ──
  const OY = HEADER_H + 14;

  cells.forEach(({ campo, x, y, h }) => {
    const absY = y + OY;

    // Sombra suave
    ctx.shadowColor = "rgba(0,0,0,0.06)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(x, absY, COL, h, 10);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Borde izquierdo accent
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.roundRect(x, absY + 8, 3, h - 16, 2);
    ctx.fill();

    // Label
    ctx.fillStyle = "#94a3b8";
    ctx.font = FONT_LABEL;
    ctx.fillText(campo.label.toUpperCase(), x + CELL_PAD, absY + CELL_PAD + 11);

    // Value (multiline)
    ctx.fillStyle = "#1e293b";
    ctx.font = FONT_VALUE;
    const lines = wrapText(ctx, campo.value || "—", COL - CELL_PAD * 2, FONT_VALUE);
    lines.forEach((line, li) => {
      ctx.fillText(line, x + CELL_PAD, absY + CELL_PAD + 11 + LINE_H + li * LINE_H);
    });

    // Dash si vacío
    if (!campo.value) {
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "italic 13px system-ui, sans-serif";
      ctx.fillText("Sin información", x + CELL_PAD, absY + CELL_PAD + 11 + LINE_H);
    }
  });

  // ── Footer ──
  const footerY = HEADER_H + GRID_H + PADDING + 10;
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(PADDING, footerY, W - PADDING * 2, 1);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Sistema de Paquetería  ·  Documento generado automáticamente", W / 2, footerY + 20);
  ctx.textAlign = "left";

  // ── Descargar ──
  const link = document.createElement("a");
  link.download = `comprobante_paquete_${format(new Date(), "yyyyMMdd_HHmm")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

// ── InputOrSelect (sin cambios) ───────────────────────────────────────────────
const InputOrSelect = ({
  value, onChange, options, placeholder, isLoading: loading,
}: {
  value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string; isLoading?: boolean;
}) => {
  const [isInput, setIsInput] = useState(false);
  const hasMatch = !!(value && options?.length > 0 && options.some(o => o?.toLowerCase() === value?.toLowerCase()));
  const forceInput = !!(value && options?.length > 0 && !hasMatch);
  const showInput = isInput || forceInput;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1">
        {showInput ? (
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 text-sm" />
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
      <button type="button" onClick={() => setIsInput((prev) => !prev)}
        className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
        title={showInput ? "Ver lista" : "Escribir manualmente"}>
        {showInput ? <List className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};

// ── Modal principal ───────────────────────────────────────────────────────────
export const AddPaqueteriaModal: React.FC<AddFallaModalProps> = ({ title, isSuccess, setIsSuccess }) => {
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

  // Guardamos snapshot de los valores para el comprobante
  const comprobanteRef = useRef<ComprobanteData | null>(null);

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
      email_receptor: "",
      telefono_receptor: "",
      tipo_paquete: "",
      telefono_remitente: ""
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
      comprobanteRef.current = null;
      reset({ ubicacion_paqueteria: location, area_paqueteria: area, notificacion: "ninguna" });
    }
  }, [isSuccess]);

  useEffect(() => {
    if (!isLoading) handleClose();
  }, [isLoading]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!date) {
      form.setError("fecha_recibido_paqueteria", { type: "manual", message: "Fecha es un campo requerido." });
      return;
    }

    const formattedDate = format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
    const allImages = [...evidencia, ...etiqueta];

    // Snapshot para el comprobante ANTES de mutar
    comprobanteRef.current = {
      ubicacion: ubicacionSeleccionada,
      area: values.area_paqueteria ?? "",
      fecha: format(new Date(date), "dd/MM/yyyy HH:mm") + " hrs",
      destinatario: values.quien_recibe_paqueteria ?? "",
      guardado_en: values.guardado_en_paqueteria ?? "",
      proveedor: values.proveedor ?? "",
      no_guia: values.no_guia ?? "",
      tipo_paquete: values.tipo_paquete ?? "",
      descripcion: values.descripcion_paqueteria ?? "",
      remitente: values.remitente ?? "",
      direccion_remitente: values.direccion_remitente ?? "",
      telefono_remitente: values.telefono_remitente ?? "",
      email_receptor: values.email_receptor ?? "",
      telefono_receptor: values.telefono_receptor ?? "",
    };

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

    createPaqueteriaMutation.mutate(
      { data_paquete: formatData },
      {
        onSuccess: () => {
          // Generar y descargar comprobante al éxito
          if (comprobanteRef.current) {
            generarYDescargarComprobante(comprobanteRef.current);
          }
        },
      }
    );
  }

  const handleOcrResult = (result: any) => {
    setOcrDone(true);
    const data = result?.data ?? result;
    if (!data) return;
    if (data?.no_guia) form.setValue("no_guia", data.no_guia);
    if (data?.receptor) form.setValue("quien_recibe_paqueteria", data.receptor);
    if (data?.remitente) form.setValue("remitente", data.remitente);
    if (data?.direccion_remitente) form.setValue("direccion_remitente", data.direccion_remitente);
    if (data?.descripcion) form.setValue("descripcion_paqueteria", data.descripcion);
    if (data?.tipo_paquete) form.setValue("tipo_paquete", data.tipo_paquete);
    if (data?.paqueteria) {
      const normalize = (str: string) =>
        str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() ?? "";
      const match = dataProveedores?.find((p: string) =>
        normalize(p).includes(normalize(data.paqueteria)) ||
        normalize(data.paqueteria).includes(normalize(p))
      );
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

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Análisis automático con IA</p>
                      <p className="text-xs text-blue-500 mt-0.5 leading-relaxed">Al cargar las fotos, se extraerá información con IA.</p>
                      <p className="text-xs text-amber-500 mt-1 font-medium">⚠ La IA puede cometer errores, verifica los datos antes de continuar.</p>
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
                      <LoadImage id="evidencia" titulo="Fotografía del paquete" setImg={setEvidencia}
                        showWebcamOption={true} facingMode="environment" imgArray={evidencia}
                        limit={5} showPlaceholder={true} tipoOcr="truck" onOcrResult={handleOcrResult} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                          <ScanLine className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Etiqueta</span>
                      </div>
                      <LoadImage id="etiqueta" titulo="Fotografía de la etiqueta" setImg={setEtiqueta}
                        showWebcamOption={true} facingMode="environment" imgArray={etiqueta}
                        limit={5} tipoOcr="paquete" onOcrResult={handleOcrResult} showPlaceholder={true} />
                    </div>
                  </div>

                  {ocrDone && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <p className="text-xs text-green-700 font-medium">Análisis completado. Revisa y corrige los datos detectados.</p>
                    </div>
                  )}

                  {ocrDone && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Datos del paquete</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="quien_recibe_paqueteria"
                          render={({ field }: any) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="text-xs text-slate-500">Destinatario</FormLabel>
                              <FormControl>
                                <InputOrSelect value={field.value} onChange={field.onChange}
                                  options={dataAreaEmpleadoApoyo ?? []} placeholder="Selecciona o escribe..."
                                  isLoading={loadingAreaEmpleadoApoyo} />
                              </FormControl>
                              <div className="flex gap-3 mt-1 px-1">
                                {form.watch("email_receptor") ? (
                                  <span className="text-[11px] text-slate-400"><span className="font-mono">{form.watch("email_receptor")}</span></span>
                                ) : (
                                  <span className="text-[11px] text-amber-400">No se detectó email del destinatario.</span>
                                )}
                                {form.watch("telefono_receptor") ? (
                                  <span className="text-[11px] text-slate-400"><span className="font-mono">{form.watch("telefono_receptor")}</span></span>
                                ) : (
                                  <span className="text-[11px] text-amber-400">No se detectó teléfono del destinatario.</span>
                                )}
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="no_guia"
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-500">No. Guía</FormLabel>
                              <FormControl><Input {...field} className="h-9 text-sm" placeholder="Número de guía" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="tipo_paquete"
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-500">Tipo de paquete</FormLabel>
                              <FormControl><Input {...field} className="h-9 text-sm" placeholder="Ej. sobre, caja, bolsa..." /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="descripcion_paqueteria"
                          render={({ field }: any) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="text-xs text-slate-500">Descripción</FormLabel>
                              <FormControl><Textarea {...field} className="resize-none text-sm min-h-[70px]" placeholder="Descripción del contenido..." /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="remitente"
                          render={({ field }: any) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="text-xs text-slate-500">Remitente</FormLabel>
                              <FormControl><Input {...field} className="h-9 text-sm" placeholder="Nombre del remitente" /></FormControl>
                              {(form.watch("direccion_remitente") || form.watch("telefono_remitente")) && (
                                <div className="flex flex-col gap-0.5 mt-1 px-1">
                                  {form.watch("direccion_remitente") && <span className="text-[11px] text-slate-400">📍 {form.watch("direccion_remitente")}</span>}
                                  {form.watch("telefono_remitente") && <span className="text-[11px] text-slate-400">📱 <span className="font-mono">{form.watch("telefono_remitente")}</span></span>}
                                </div>
                              )}
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="proveedor"
                          render={({ field }: any) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="text-xs text-slate-500">Paquetería</FormLabel>
                              <FormControl>
                                <InputOrSelect value={field.value} onChange={field.onChange}
                                  options={dataProveedores ?? []} placeholder="Selecciona o escribe..." />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-slate-700">Recepción y ubicación</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="fecha_recibido_paqueteria"
                        render={() => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha de recepción</FormLabel>
                            <FormControl><DateTime date={date} setDate={setDate} disablePastDates={false} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="ubicacion_paqueteria"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ubicación</FormLabel>
                            <FormControl>
                              <Select {...field} onValueChange={(v) => { field.onChange(v); setUbicacionSeleccionada(v); }} value={ubicacionSeleccionada}>
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
                              <Select {...field} onValueChange={(v) => { field.onChange(v); setConSelected(v); }} value={conSelected}>
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
                      <FormField control={form.control} name="guardado_en_paqueteria"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Guardado en</FormLabel>
                            <FormControl>
                              <Select {...field} onValueChange={(v) => field.onChange(v)} value={field.value}>
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

                  {(form.watch("email_receptor") || form.watch("telefono_receptor")) && (
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
                                  ...(form.watch("email_receptor") ? [{ value: "correo", label: "Correo" }] : []),
                                  ...(form.watch("telefono_receptor") ? [{ value: "sms", label: "SMS" }] : []),
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
                  )}

                  {/* Resumen IA — igual que antes */}
                  {ocrDone && (
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resumen detectado por IA</span>
                      </div>
                      {[
                        { label: "Destinatario", value: form.watch("quien_recibe_paqueteria") },
                        { label: "Email destinatario", value: form.watch("email_receptor") },
                        { label: "Teléfono destinatario", value: form.watch("telefono_receptor") },
                        { label: "No. Guía", value: form.watch("no_guia") },
                        { label: "Tipo de paquete", value: form.watch("tipo_paquete") },
                        { label: "Descripción", value: form.watch("descripcion_paqueteria") },
                        { label: "Remitente", value: form.watch("remitente") },
                        { label: "Dirección remitente", value: form.watch("direccion_remitente") },
                        { label: "Teléfono remitente", value: form.watch("telefono_remitente") },
                        { label: "Paquetería", value: form.watch("proveedor") },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-400 shrink-0">{item.label}</span>
                          {item.value
                            ? <span className="text-slate-700 font-medium truncate ml-4 max-w-[60%] text-right">{item.value}</span>
                            : <span className="text-amber-400 ml-4 text-right">No detectado</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
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
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" onClick={() => setStep(1)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 shadow-none border-0 gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </Button>
                  <Button type="button" onClick={form.handleSubmit(onSubmit)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white gap-2" disabled={isLoading}>
                    {isLoading
                      ? <><Loader2 className="animate-spin w-4 h-4" /> Guardando...</>
                      : <><CheckCircle2 className="w-4 h-4" /> Guardar paquete</>}
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