/* eslint-disable react-hooks/exhaustive-deps */
import { z } from "zod";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { format } from "date-fns";
import { usePaqueteria } from "@/hooks/usePaqueteria";
import {
  ArrowRightLeft,
  Bot,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Sparkles,
  User,
} from "lucide-react";
import { Input } from "../ui/input";
import DateTime from "../dateTime";
import { useRef, useEffect } from "react";
import { useUploadImage } from "@/hooks/useUploadImage";
import { base64ToFile, cn } from "@/lib/utils";
import Image from "next/image";
import LoadImage, { Imagen } from "../upload-Image";

interface DevPaqModalProps {
  title: string;
  data: any;
}

const formSchema = z.object({
  estatus_paqueteria: z.array(z.string()).optional(),
  fecha_entregado_paqueteria: z.string().optional(),
  entregado_a_paqueteria: z.string().optional(),
  firma: z
    .object({
      file_url: z.string(),
      file_name: z.string(),
    })
    .optional(),
});

// Datos extra extraídos de la ID (no van al form, solo se muestran)
interface IdData {
  nombre_completo?: string;
  curp?: string;
  tipo_documento?: string;
  status_vigencia?: string;
  fecha_vigencia?: string;
  nacionalidad?: string;
  direccion?: {
    calle?: string;
    colonia?: string;
    cp?: string;
    estado?: string;
    municipio?: string;
  };
}

export const DevolucionPaqModal: React.FC<DevPaqModalProps> = ({
  title,
  data,
}) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const { devolverPaqueteriaMutation, isLoading } = usePaqueteria(
    "", "", "guardado", false, "", "", ""
  );
  const [date, setDate] = useState<Date | "">("");
  const [textoFirma, setTextoFirma] = useState("");
  const [vistaPrevia, setVistaPrevia] = useState<string>("");
  const { uploadImageMutation, response, isLoading: isLoadingImage } = useUploadImage();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const [idImagen, setIdImagen] = useState<Imagen[]>([]);
  const [ocrDone, setOcrDone] = useState(false);
  const [idData, setIdData] = useState<IdData | null>(null);

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
          console.error("Error:", error);
        }
      }, 800);
    } else {
      setVistaPrevia("");
      form.setValue("firma", { file_name: "", file_url: "" });
    }
  };

  useEffect(() => {
    if (response?.file_url) {
      form.setValue("firma", {
        file_url: response.file_url,
        file_name: response.file_name ?? "",
      });
    }
  }, [response]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      estatus_paqueteria: ["entregado"],
      fecha_entregado_paqueteria: "",
      entregado_a_paqueteria: "",
      firma: undefined,
    },
  });

  const handleOcrResult = (result: any) => {
    setOcrDone(true);
    // Soporta { "0": {...} } o el objeto directo
    const d = result?.["0"] ?? result?.data ?? result;
    if (!d) return;

    const nombre =
      d.nombre_completo ??
      [d.nombre, d.apellido_paterno, d.apellido_materno]
        .filter(Boolean)
        .join(" ") ??
      "";
    if (nombre) form.setValue("entregado_a_paqueteria", nombre);

    // Guardamos el resto para mostrar el resumen
    setIdData({
      nombre_completo: nombre,
      curp: d.curp,
      tipo_documento: d.tipo_documento,
      status_vigencia: d.status_vigencia,
      fecha_vigencia: d.fecha_vigencia,
      nacionalidad: d.nacionalidad,
      direccion: d.direccion,
    });
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const formattedDate = format(new Date(date), "yyyy-MM-dd HH:mm:ss");
    const formatData = {
      estatus_paqueteria: ["entregado"],
      fecha_entregado_paqueteria: formattedDate ?? "",
      entregado_a_paqueteria: values.entregado_a_paqueteria ?? "",
    };
    devolverPaqueteriaMutation.mutate(
      { data_paquete_actualizar: formatData, folio: data.folio },
      {
        onSuccess: () => handleClose(),
        onError: () => handleClose(),
      }
    );
  }

  const handleClose = () => {
    setIsSuccess(false);
    setOcrDone(false);
    setIdData(null);
    setIdImagen([]);
    setTextoFirma("");
    setVistaPrevia("");
    form.reset();
  };

  const vigente = idData?.status_vigencia === "vigente";

  const direccionCompleta = idData?.direccion
    ? [
        idData.direccion.calle,
        idData.direccion.colonia,
        idData.direccion.municipio,
        idData.direccion.estado,
        idData.direccion.cp,
      ]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <Dialog onOpenChange={setIsSuccess} open={isSuccess}>
      <div
        className="cursor-pointer"
        title="Entregar Paquete"
        onClick={() => setIsSuccess(true)}
      >
        <ArrowRightLeft className="w-5 h-5" />
      </div>

      <DialogContent
        className="p-0 overflow-hidden !max-w-[780px] w-[95vw] rounded-3xl shadow-2xl flex flex-col border-none bg-background"
        aria-describedby=""
      >
        <DialogHeader className="px-8 pt-8 pb-4 shrink-0 border-b border-slate-100">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">
            {title}
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">
            Registra la entrega del paquete
          </p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-8  no-scrollbar">
          {/* Folio */}
          <div className="flex gap-2 mb-5">
            <p className="text-sm font-semibold text-gray-500">Folio:</p>
            <p className="text-sm font-bold text-blue-500">{data?.folio}</p>
          </div>
          {/* Banner — ocupa todo el ancho de la columna */}
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-3 w-full">
                <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-800">
                    Verificación con identificación
                  </p>
                  <p className="text-xs text-blue-500 mt-0.5 leading-relaxed">
                    Toma o sube una foto de la identificación oficial del
                    receptor. La IA extraerá su nombre y datos automáticamente.
                  </p>
                  <p className="text-xs text-amber-500 mt-1.5 font-medium">
                    ⚠ Verifica los datos antes de confirmar la entrega.
                  </p>
                </div>
              </div>
          <div className="grid grid-cols-2 gap-6">
            {/* ── Columna izquierda: verificación ID ── */}
            <div className="flex flex-col gap-4">

             

              {/* Upload INE */}
              <LoadImage
                id="identificacion"
                titulo="Identificación del receptor"
                setImg={setIdImagen}
                showWebcamOption={true}
                facingMode="environment"
                imgArray={idImagen}
                showPlaceholder={true}
                tipoOcr="id"
                onOcrResult={handleOcrResult}
              />

              {/* Resumen datos ID */}
              {ocrDone && (
                <div className="flex flex-col gap-3">
                  {/* Estado de análisis */}
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <p className="text-xs text-green-700 font-medium">
                      Análisis completado. Revisa y corrige si es necesario.
                    </p>
                  </div>

                  {idData && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                      {/* Header: tipo doc + vigencia */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            {idData.tipo_documento ?? "Identificación"}
                          </span>
                        </div>
                        {idData.status_vigencia && (
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                              vigente
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-500"
                            )}
                          >
                            {vigente ? "Vigente" : "Vencida"}
                            {idData.fecha_vigencia
                              ? ` · ${idData.fecha_vigencia}`
                              : ""}
                          </span>
                        )}
                      </div>

                      <div className="h-px bg-slate-200" />

                      {/* Nombre */}
                      <div className="flex items-start gap-2">
                        <User className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                            Nombre
                          </p>
                          <p className="text-sm font-semibold text-slate-700">
                            {idData.nombre_completo ?? "—"}
                          </p>
                        </div>
                      </div>

                      {/* CURP */}
                      {idData.curp && (
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                              CURP
                            </p>
                            <p className="text-xs font-mono text-slate-600">
                              {idData.curp}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Dirección */}
                      {direccionCompleta && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                              Domicilio
                            </p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {direccionCompleta}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Nacionalidad */}
                      {idData.nacionalidad && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                            Nacionalidad
                          </span>
                          <span className="text-xs font-medium text-slate-600">
                            {idData.nacionalidad}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Columna derecha: formulario ── */}
            <div className="flex flex-col gap-5">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-5"
                >
                  {/* Entregado a */}
                  <FormField
                    control={form.control}
                    name="entregado_a_paqueteria"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                          Entregado a
                          {ocrDone && (
                            <Sparkles className="w-3 h-3 text-amber-400" />
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nombre de quien recibe..."
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fecha */}
                  <FormField
                    control={form.control}
                    name="fecha_entregado_paqueteria"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Fecha de entrega
                        </FormLabel>
                        <FormControl>
                          <DateTime date={date} setDate={setDate} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Firma */}
                  <FormField
                    control={form.control}
                    name="firma"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Firma
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              className="border-gray-200 font-bold italic bg-white"
                              style={{ fontFamily: "Georgia, serif" }}
                              placeholder="Escribe tu firma..."
                              value={textoFirma}
                              disabled={isLoadingImage}
                              onChange={(e) =>
                                handleTextoChange(e.target.value)
                              }
                            />
                            {vistaPrevia && (
                              <div className="border rounded-lg p-2.5 bg-gray-50">
                                <p className="text-xs text-gray-500 mb-1.5">
                                  Vista previa:
                                </p>
                                <Image
                                  height={100}
                                  width={200}
                                  src={vistaPrevia}
                                  alt="Vista previa de firma"
                                  className="max-w-full h-auto"
                                />
                              </div>
                            )}
                            {isLoadingImage && (
                              <p className="text-xs text-gray-400 flex items-center gap-2">
                                <Loader2 className="animate-spin w-3.5 h-3.5" />
                                Subiendo firma...
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-8 py-4 border-t border-slate-100 shrink-0">
          <DialogClose asChild>
            <Button
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
              onClick={handleClose}
            >
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
              <>
                <Loader2 className="animate-spin" /> Entregando artículo...
              </>
            ) : (
              "Entregar artículo"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};