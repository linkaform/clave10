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
import { Camera, Sparkles, CheckCircle2, Truck, User, Container } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadImage } from "@/hooks/useUploadImage";
import { reemplazarGuionMinuscula } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getPassTransportistaByToken } from "@/services/endpoints";

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
  const { token } = use(params);
  const { uploadImageMutation } = useUploadImage();

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["getPassTransportista", token],
    queryFn: () => getPassTransportistaByToken(token),
    refetchOnWindowFocus: false,
    enabled: !!token,
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

  const [submitted, setSubmitted] = useState(false);
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
    console.log("submit", { token, data, photos });
    setSubmitted(true);
  };

  // ── Pantalla de éxito ──
  if (isLoading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 gap-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="w-9 h-9 text-green-600" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-800">Datos enviados</h2>
        <p className="text-sm text-gray-400 mt-1">Tus datos han sido asociados al pase <span className="font-semibold text-gray-600">{pase.folio}</span>.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-[500px] space-y-3">

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

        {/* Resumen del pase */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Datos del pase</p>
          {[
            ["Planta",  pase.planta],
            ["Destino", pase.destino],
            ["Fecha",   `${pase.fecha}, ${pase.horario}`],
            ["Andén",   pase.anden],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-xs text-gray-700 font-medium text-right">{value}</span>
            </div>
          ))}
        </div>

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

          </form>
        </Form>
      </div>
    </div>
  );
}
