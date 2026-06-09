"use client";

import { use, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form, FormControl, FormField, FormItem, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, CheckCircle2, Truck, User, Container, KeyRound, Loader2, AlertCircle, QrCode, Download, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadImage } from "@/hooks/useUploadImage";
import { reemplazarGuionMinuscula } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getPassTransportista, validateTokenTransportista } from "@/services/endpoints";

// ── Schema ─────────────────────────────────────────────────────────────────────
const formSchema = z.object({
  // Conductor
  conductor_nombre:          z.string().optional(),
  conductor_no_licencia:     z.string().optional(),
  conductor_lugar_expedicion: z.string().optional(),
  conductor_vigencia:        z.string().optional(),
  // Vehículo
  vehiculo_linea:            z.string().optional(),
  vehiculo_tipo_unidad:      z.string().optional(),
  vehiculo_marca:            z.string().optional(),
  vehiculo_modelo:           z.string().optional(),
  vehiculo_anio:             z.string().optional(),
  vehiculo_placas:           z.string().optional(),
  vehiculo_no_economico:     z.string().optional(),
  vehiculo_niv:              z.string().optional(),
  // Contenedor
  contenedor_linea:          z.string().optional(),
  contenedor_tipo:           z.string().optional(),
  contenedor_no:             z.string().optional(),
  contenedor_placas_sello:   z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ── Componentes auxiliares ─────────────────────────────────────────────────────

function IALabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
      {required && <span className="text-red-400">*</span>}
      {children}
      <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
        <Sparkles className="w-2.5 h-2.5" /> IA
      </span>
    </label>
  );
}

function Card({ icon: Icon, title, subtitle, children }: {
  icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <div className="p-1.5 bg-blue-50 rounded-lg">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">{title}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function PhotoUpload({ label, required, onUpload, fileUrl, uploading }: {
  label: string; required?: boolean; onUpload: (f: File) => void;
  fileUrl?: string; uploading?: boolean;
}) {
  return (
    <div>
      <IALabel required={required}>{label}</IALabel>
      <label className={cn(
        "flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-dashed text-sm cursor-pointer transition-colors",
        uploading ? "border-blue-300 bg-blue-50 text-blue-500 cursor-wait"
          : fileUrl ? "border-green-300 bg-green-50 text-green-600"
          : "border-gray-200 bg-gray-50 text-gray-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-500"
      )}>
        <Camera className="w-4 h-4 shrink-0" />
        <span className="text-xs font-medium">
          {uploading ? "Subiendo..." : fileUrl ? "Imagen subida ✓" : "Tomar foto o subir imagen"}
        </span>
        <input type="file" accept="image/*" className="hidden" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
      </label>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function SubmitTransportistaPage({ params }: { params: Promise<{ token: string }> }) {
  // El param "token" en la URL es en realidad el record_id desde el rediseño del preview
  const { token: recordId } = use(params);
  const { uploadImageMutation } = useUploadImage();

  // ── Estado del gate de token ──
  const [tokenInput,     setTokenInput]     = useState("");
  const [tokenValidated, setTokenValidated] = useState(false);
  const [tokenError,     setTokenError]     = useState<string | null>(null);

  const { mutate: validateToken, isPending: validatingToken } = useMutation({
    mutationFn: () => validateTokenTransportista(recordId, tokenInput.trim()),
    onSuccess: (res) => {
      if (res?.success && res?.response?.data === true) {
        setTokenError(null);
        setTokenValidated(true);
      } else {
        setTokenError("Token incorrecto. Verifica e intenta de nuevo.");
      }
    },
    onError: () => {
      setTokenError("No se pudo validar el token. Intenta de nuevo.");
    },
  });

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["getPassTransportista", recordId],
    queryFn: () => getPassTransportista(recordId),
    refetchOnWindowFocus: false,
    enabled: tokenValidated,
  });

  const d = rawData?.response?.data;
  const pase = {
    folio:   d?.folio   ?? "",
    planta:  d?.ubicacion ?? "",
    destino: d?.direccion ?? "No especificada",
    fecha:   d?.fecha_desde
      ? new Date(d.fecha_desde + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
      : "",
    horario: d?.hora_inicial && d?.hora_final
      ? `${d.hora_inicial.slice(0, 5)} – ${d.hora_final.slice(0, 5)}`
      : "",
    anden:   d?.anden ?? "",
  };

  const [submitted,    setSubmitted]    = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);
  const [photos, setPhotos] = useState<Record<string, { url: string; uploading: boolean }>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const handlePhoto = async (key: string, file: File) => {
    setPhotos((p) => ({ ...p, [key]: { url: "", uploading: true } }));
    try {
      const renamed = new File([file], reemplazarGuionMinuscula(key + "_" + file.name), { type: file.type });
      const result = await uploadImageMutation.mutateAsync({ img: renamed });
      setPhotos((p) => ({ ...p, [key]: { url: result?.file_url ?? "", uploading: false } }));
    } catch {
      setPhotos((p) => ({ ...p, [key]: { url: "", uploading: false } }));
    }
  };

  const photo = (key: string) => ({
    fileUrl: photos[key]?.url,
    uploading: photos[key]?.uploading ?? false,
    onUpload: (f: File) => handlePhoto(key, f),
  });

  const onSubmit = (data: FormValues) => {
    // TODO: submit_datos_transportista(token, { ...data, fotos: photos })
    console.log("submit", { recordId, data, photos });
    setSubmitted(true);
  };

  // ── Gate: ingresar token ──
  if (!tokenValidated) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-5">

        {/* Marca */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">K</div>
          <span className="text-sm text-gray-500">Clave10 · Pase de entrada</span>
        </div>

        {/* Icono + título */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Ingresa tu código</h1>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
              Para acceder al formulario necesitas el código de acceso que te compartieron.
            </p>
          </div>
        </div>

        {/* Input del token */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Código de acceso
          </label>
          <input
            value={tokenInput}
            onChange={(e) => { setTokenInput(e.target.value); setTokenError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter" && tokenInput.trim()) validateToken(); }}
            placeholder="Ej. 6a277dfc0c501d4ac20ed79d"
            className={cn(
              "w-full h-11 px-4 text-sm font-mono border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition",
              tokenError ? "border-red-300 focus:border-red-300" : "border-gray-200 focus:border-blue-300"
            )}
          />
          {tokenError && (
            <div className="flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {tokenError}
            </div>
          )}
        </div>

        <Button
          onClick={() => validateToken()}
          disabled={!tokenInput.trim() || validatingToken}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
          {validatingToken
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
            : "Acceder al formulario"
          }
        </Button>

        <p className="text-center text-[11px] text-gray-300">
          Si no tienes tu código, contacta a quien te generó el pase.
        </p>
      </div>
    </div>
  );

  // ── Cargando datos del pase ──
  if (isLoading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const qrUrl = d?.qr?.[0]?.file_url ?? null;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="w-full max-w-5xl mx-auto space-y-3">

        {/* Cabecera */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">K</div>
          <span className="text-sm text-gray-500">Clave10 <span className="text-gray-300">·</span> Datos de transporte</span>
        </div>

        <div className="px-1">
          <h1 className="text-xl font-bold text-gray-800">Completa tus datos</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Para agilizar tu entrada, sube las fotos de tu licencia y tarjeta de circulación. La IA extraerá los datos automáticamente.
          </p>
        </div>

        {/* Layout: form + sidebar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">

          {/* ── Formulario (columna principal) ── */}
          <div className="flex-1 min-w-0 order-2 lg:order-1 space-y-3">

            {/* Banner de éxito (solo cuando se envió) */}
            {submitted && (
              <div className="rounded-2xl bg-white border border-green-100 shadow-sm p-10 flex flex-col items-center gap-5 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-11 h-11 text-green-600" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-gray-800">¡Datos enviados correctamente!</h2>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                    Tu información quedó asociada al pase <span className="font-semibold text-gray-600">{pase.folio}</span>.
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                    El personal los tendrá listos cuando llegues.
                  </p>
                </div>
              </div>
            )}

            {/* Card motivacional (solo si no se ha enviado) */}
            {!submitted && !formExpanded ? (
              <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-5 space-y-4 flex flex-col h-full">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🚀</div>
                  <div>
                    <p className="text-white font-bold text-base leading-snug">¿Quieres hacer tu proceso más rápido?</p>
                    <p className="text-teal-100 text-xs mt-1 leading-relaxed">
                      Pre-registra tus datos ahora y llega mejor preparado. El personal tendrá tu información lista desde antes de tu visita.
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setFormExpanded(true)}
                  className="w-full h-10 rounded-xl bg-white text-teal-700 text-sm font-bold hover:bg-teal-50 transition-all">
                  Sí, quiero registrar mis datos
                </button>
                <div className="relative rounded-xl overflow-hidden flex-1 min-h-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/pedro-recibe-transportista.png" alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 rounded-xl" style={{ boxShadow: "inset 0 0 40px 20px rgba(0,0,0,0.55)" }} />
                </div>
              </div>
            ) : !submitted ? (
              <div className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚀</span>
                  <p className="text-xs font-semibold text-teal-700">Completa tus datos para agilizar tu entrada</p>
                </div>
                <button type="button" onClick={() => setFormExpanded(false)}
                  className="text-[10px] text-teal-400 hover:text-teal-600 font-medium transition-colors">
                  Colapsar
                </button>
              </div>
            ) : null}

            {formExpanded && !submitted && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

            {/* ── Datos del conductor ── */}
            <Card icon={User} title="Datos del conductor">
              <PhotoUpload label="Foto de licencia" required {...photo("licencia")} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="conductor_nombre" render={({ field }) => (
                  <FormItem>
                    <IALabel>Nombre</IALabel>
                    <FormControl>
                      <Input placeholder="Extraído de licencia..." className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="conductor_no_licencia" render={({ field }) => (
                  <FormItem>
                    <IALabel>No. de licencia</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="conductor_lugar_expedicion" render={({ field }) => (
                  <FormItem>
                    <IALabel>Lugar expedición</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="conductor_vigencia" render={({ field }) => (
                  <FormItem>
                    <IALabel>Vigencia</IALabel>
                    <FormControl>
                      <Input type="date" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </Card>

            {/* ── Datos del vehículo ── */}
            <Card icon={Truck} title="Datos del vehículo">
              <PhotoUpload label="Tarjeta de circulación" required {...photo("tarjeta_circulacion")} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="vehiculo_linea" render={({ field }) => (
                  <FormItem>
                    <IALabel>Línea</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vehiculo_tipo_unidad" render={({ field }) => (
                  <FormItem>
                    <IALabel>Tipo de unidad</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vehiculo_marca" render={({ field }) => (
                  <FormItem>
                    <IALabel>Marca</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vehiculo_modelo" render={({ field }) => (
                  <FormItem>
                    <IALabel>Modelo</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vehiculo_anio" render={({ field }) => (
                  <FormItem>
                    <IALabel>Año</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vehiculo_placas" render={({ field }) => (
                  <FormItem>
                    <IALabel>Placas</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vehiculo_no_economico" render={({ field }) => (
                  <FormItem>
                    <IALabel>No. económico</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vehiculo_niv" render={({ field }) => (
                  <FormItem>
                    <IALabel>NIV</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </Card>

            {/* ── Contenedor ── */}
            <Card icon={Container} title="Contenedor" subtitle="si aplica">
              <PhotoUpload label="Foto del contenedor" {...photo("contenedor")} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="contenedor_linea" render={({ field }) => (
                  <FormItem>
                    <IALabel>Línea</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contenedor_tipo" render={({ field }) => (
                  <FormItem>
                    <IALabel>Tipo</IALabel>
                    <FormControl>
                      <Input placeholder="20', 40', Refrigerado..." className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contenedor_no" render={({ field }) => (
                  <FormItem>
                    <IALabel>No. contenedor</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contenedor_placas_sello" render={({ field }) => (
                  <FormItem>
                    <IALabel>Placas / Sello</IALabel>
                    <FormControl>
                      <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </Card>

            {/* Submit */}
            {!submitted && (
            <div className="pb-2">
              <Button type="submit"
                className="w-full h-12 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Confirmar y enviar datos
              </Button>
              <p className="text-center text-[11px] text-gray-300 mt-3">
                Tus datos quedarán asociados al pase {pase.folio}
              </p>
            </div>
            )}

            </form>
          </Form>
            )}
          </div>
          {/* ──────────────────────────────────────────── */}

          {/* ── Sidebar ── */}
          <div className="w-full lg:w-72 shrink-0 space-y-3 order-1 lg:order-2">

            {/* Datos del pase */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Datos del pase</p>
              {[
                ["Planta",  pase.planta],
                ["Destino", pase.destino],
                ["Fecha",   [pase.fecha, pase.horario].filter(Boolean).join(", ")],
                ["Andén",   pase.anden],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0 gap-3">
                  <span className="text-xs text-gray-400 shrink-0">{label}</span>
                  <span className="text-xs text-gray-700 font-medium text-right">{value}</span>
                </div>
              ))}
            </div>

            {/* QR */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-3">
              <div className="w-full aspect-square rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="QR pase" className="w-full h-full object-cover" />
                ) : (
                  <QrCode className="w-16 h-16 text-gray-200" />
                )}
              </div>
              <span className="text-[10px] text-gray-400 font-mono tracking-wide">{pase.folio}</span>

              <div className="w-full space-y-2">
                <button disabled
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-gray-200 text-xs font-semibold text-gray-400 bg-gray-50 cursor-not-allowed">
                  <Download className="w-3.5 h-3.5" /> Descargar pase
                </button>
                <button disabled
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-gray-200 text-xs font-semibold text-gray-400 bg-gray-50 cursor-not-allowed">
                  <Share2 className="w-3.5 h-3.5" /> Compartir
                </button>
              </div>
            </div>

          </div>
          {/* ── fin sidebar ── */}

        </div>
        {/* ── fin layout ── */}

      </div>
    </div>
  );
}
