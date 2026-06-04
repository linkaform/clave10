"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Truck, ArrowLeftRight, Package, Building2,
  Info, BoxesIcon, User, MapPin, Send, Eye, Upload, Sparkles, X, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useUploadImage } from "@/hooks/useUploadImage";
import { reemplazarGuionMinuscula } from "@/lib/utils";
import { useCreatePaseTransportista } from "@/hooks/useCreatePaseTransportista";
import { ConfirmPaseTransportistaModal } from "@/components/modals/confirm-pase-transportista-modal";
import { PaseTransportistaSuccessModal } from "@/components/modals/pase-transportista-success-modal";
import { useQuery } from "@tanstack/react-query";
import { getHorariosData, getAndenes } from "@/services/endpoints";
import { HorariosConcurrenciaChart, type HorarioItem } from "@/components/horarios-concurrencia-chart";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Documento {
  id: string;
  tipo: string;
  archivo: File | null;
  file_name: string;
  file_url: string;
  uploading: boolean;
}

// ── Constantes ─────────────────────────────────────────────────────────────────


const TIPOS_OPERACION = [
  { value: "entrega_materia_prima" as const,          label: "Entrega de materia prima",       description: "El proveedor viene a tu planta",         icon: Truck,          tags: ["DDP", "DAP", "CIF"] },
  { value: "recoleccion_materia_prima" as const,      label: "Recolección de materia prima",   description: "Tu transporte va al proveedor",           icon: ArrowLeftRight, tags: ["FOB", "EXW", "FCA"] },
  { value: "entrega_producto_terminado" as const,     label: "Entrega de producto terminado",  description: "Tu transporte lleva el producto",         icon: Package,        tags: ["DAP", "DDP cliente"] },
  { value: "recoleccion_producto_terminado" as const, label: "Recolección de producto terminado", description: "El cliente recoge en tu planta",       icon: Building2,      tags: ["EXW", "FCA tu planta"] },
] as const;

const TIPO_OPERACION_LABEL: Record<string, string> = {
  entrega_materia_prima:          "entrega_de_materia_prima",
  entrega_producto_terminado:     "entrega_de_producto_terminado",
  recoleccion_materia_prima:      "recoleccion_de_materia_prima",
  recoleccion_producto_terminado: "recoleccion_de_producto_terminado",
};

const SEGUNDA_PERSONA: Record<string, { titulo: string; subtitulo: string }> = {
  entrega_materia_prima:          { titulo: "Quién entrega",    subtitulo: "recibirá el pase" },
  recoleccion_materia_prima:      { titulo: "Proveedor origen", subtitulo: "referencia del origen" },
  entrega_producto_terminado:     { titulo: "Cliente destino",  subtitulo: "referencia del destino" },
  recoleccion_producto_terminado: { titulo: "Cliente",          subtitulo: "recibirá el pase" },
};

const GENERAR_PASE: Record<string, { info: string; botones: { label: string; primary: boolean }[] }> = {
  entrega_materia_prima: {
    info: "El pase se enviará al proveedor con un QR. El proveedor podrá reenviarlo al transportista.",
    botones: [{ label: "Enviar a proveedor", primary: true }],
  },
  recoleccion_materia_prima: {
    info: "El pase se enviará al proveedor de transporte para que asigne conductor y llene los datos del vehículo.",
    botones: [{ label: "Enviar a transportista", primary: true }, { label: "Notificar a proveedor", primary: false }],
  },
  entrega_producto_terminado: {
    info: "El pase se enviará al proveedor de transporte. Una vez que llene sus datos, podrás notificar al cliente.",
    botones: [{ label: "Enviar a transportista", primary: true }, { label: "Notificar a cliente", primary: false }],
  },
  recoleccion_producto_terminado: {
    info: "El pase se enviará al cliente con un QR. El cliente podrá reenviarlo al transportista.",
    botones: [{ label: "Enviar a cliente", primary: true }],
  },
};

const METODOS_EMBARQUE = ["Terrestre", "Aéreo", "Marítimo", "Ferroviario", "Multimodal"];
const INCOTERMS = ["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"];
const HORARIOS_SIMPLES = [
  "06:00-08:00", "07:00-09:00", "08:00-10:00", "09:00-11:00",
  "10:00-12:00", "11:00-13:00", "12:00-14:00", "13:00-15:00",
  "14:00-16:00", "15:00-17:00", "16:00-18:00", "17:00-19:00",
  "18:00-20:00", "19:00-21:00",
];
const HORAS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const INTERVALOS = [1, 2, 3, 4];

// ── Schema ─────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  tipo_operacion: z.enum([
    "entrega_materia_prima", "recoleccion_materia_prima",
    "entrega_producto_terminado", "recoleccion_producto_terminado",
  ], { required_error: "Selecciona un tipo de operación." }),

  // Quien recibe
  crea_el_pase_nombre:   z.string().min(1, { message: "El nombre es requerido." }),
  crea_el_pase_email:    z.string().min(1, { message: "El email es requerido." }),
  crea_el_pase_telefono: z.string().optional(),

  // Segunda persona
  recibe_el_pase_nombre:   z.string().optional(),
  recibe_el_pase_email:    z.string().optional(),
  recibe_el_pase_telefono: z.string().optional(),

  // Material (AI)
  material_proveedor_cliente: z.string().optional(),
  material_nombre:            z.string().optional(),
  material_cantidad:          z.string().optional().refine(
    (val) => !val || /^\d+$/.test(val), { message: "Debe ser un número entero." }
  ),
  material_orden_compra: z.string().optional(),

  // Lugar de entrega / recepción
  ubicacion:      z.string().optional(),
  direccion_lugar: z.string().optional(),
  fecha_pase_transportista_desde: z.string().optional(),
  fecha_pase_transportista_hasta: z.string().optional(),
  horario: z.string().optional(),
  anden:   z.string().optional(),

  // Lugar de recolección (tipos 2 y 3)
  lugar_reco_lugar:     z.string().optional(),
  lugar_reco_direccion: z.string().optional(),
  lugar_reco_fecha:     z.string().optional(),
  lugar_reco_horario:   z.string().optional(),
  lugar_reco_anden:     z.string().optional(),
  transporte_responsable: z.string().optional(),
  transporte_email:       z.string().optional(),
  transporte_telefono:    z.string().optional(),
  metodo_embarque: z.string().optional(),
  incoterm:        z.string().optional(),
}).superRefine((data, ctx) => {
  const add = (path: string, msg: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: [path] });

  if (!data.crea_el_pase_nombre) add("crea_el_pase_nombre", "El nombre es requerido.");
  if (!data.crea_el_pase_email)  add("crea_el_pase_email",  "El email es requerido.");
  if (!data.recibe_el_pase_nombre) add("recibe_el_pase_nombre", "El nombre es requerido.");
  if (!data.recibe_el_pase_email)  add("recibe_el_pase_email",  "El email es requerido.");

  if (["recoleccion_materia_prima", "entrega_producto_terminado"].includes(data.tipo_operacion)) {
    if (!data.lugar_reco_lugar)     add("lugar_reco_lugar",     "El lugar es requerido.");
    if (!data.lugar_reco_direccion) add("lugar_reco_direccion", "La dirección es requerida.");
    if (!data.lugar_reco_fecha)     add("lugar_reco_fecha",     "La fecha es requerida.");
    if (!data.transporte_responsable) add("transporte_responsable", "El responsable es requerido.");
    if (!data.transporte_email)       add("transporte_email",       "El email es requerido.");
  }
});

type FormValues = z.infer<typeof formSchema>;

// ── Componentes auxiliares ─────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-50 rounded-xl">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <p className="font-semibold text-gray-700">{title}</p>
      </div>
      {children}
    </div>
  );
}

function InfoBox({ children, warning }: { children: React.ReactNode; warning?: boolean }) {
  return (
    <div className={cn(
      "flex items-start gap-2 rounded-xl px-4 py-3 mb-4 text-sm",
      warning
        ? "bg-amber-50 border border-amber-200 text-amber-800"
        : "bg-blue-50 border border-blue-200 text-blue-800"
    )}>
      <Info className={cn("w-4 h-4 mt-0.5 shrink-0", warning ? "text-amber-500" : "text-blue-500")} />
      <p>{children}</p>
    </div>
  );
}

function FieldLabel({ required, children, ia }: {
  required?: boolean; children: React.ReactNode; ia?: boolean;
}) {
  return (
    <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
      {required && <span className="text-red-400">*</span>}
      {children}
      {ia && (
        <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          <Sparkles className="w-2.5 h-2.5" /> IA
        </span>
      )}
    </FormLabel>
  );
}

function PersonaFields({ form, prefix, required }: {
  form: ReturnType<typeof useForm<FormValues>>;
  prefix: "crea_el_pase" | "recibe_el_pase";
  required?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <FormField control={form.control} name={`${prefix}_nombre`} render={({ field }) => (
        <FormItem>
          <FieldLabel required={required}>Nombre</FieldLabel>
          <FormControl>
            <Input placeholder="Nombre completo" className="rounded-xl border-gray-200 bg-gray-50" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name={`${prefix}_email`} render={({ field }) => (
        <FormItem>
          <FieldLabel required={required}>Email</FieldLabel>
          <FormControl>
            <Input placeholder="correo@empresa.com" className="rounded-xl border-gray-200 bg-gray-50" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name={`${prefix}_telefono`} render={({ field }) => (
        <FormItem>
          <FieldLabel>Teléfono</FieldLabel>
          <FormControl>
            <Input placeholder="+52 55 1234 5678" className="rounded-xl border-gray-200 bg-gray-50" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}

// ── Secciones ──────────────────────────────────────────────────────────────────

function SeccionQuienRecibe({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-50 rounded-xl">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-700">Quien recibe</p>
          <p className="text-xs text-gray-400">persona que crea el pase</p>
        </div>
      </div>
      <PersonaFields form={form} prefix="crea_el_pase" required />
    </div>
  );
}

function SeccionSegundaPersona({ form, tipo }: {
  form: ReturnType<typeof useForm<FormValues>>;
  tipo: string;
}) {
  const config = SEGUNDA_PERSONA[tipo] ?? { titulo: "Contacto", subtitulo: "" };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-50 rounded-xl">
          <Building2 className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-700">{config.titulo}</p>
          {config.subtitulo && <p className="text-xs text-gray-400">{config.subtitulo}</p>}
        </div>
      </div>
      <PersonaFields form={form} prefix="recibe_el_pase" required />
    </div>
  );
}

function SeccionMaterial({ form, documentos, onRemoveDoc, onArchivoDoc }: {
  form: ReturnType<typeof useForm<FormValues>>;
  documentos: Documento[];
  onRemoveDoc: (id: string) => void;
  onArchivoDoc: (id: string, file: File) => void;
}) {
  return (
    <Section icon={BoxesIcon} title="Material">
      <InfoBox>
        Sube la factura, OC o carta porte y la IA extraerá los datos automáticamente.
        Puedes corregir cualquier campo.
      </InfoBox>

      {/* Upload múltiple IA */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          Factura / OC / Carta porte / Packing slip
          <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5" /> IA
          </span>
        </p>

        {/* Cards de docs subidos */}
        {documentos.filter((d) => d.file_url || d.uploading).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {documentos.filter((d) => d.file_url || d.uploading).map((doc) => {
              const isImage = /\.(jpe?g|png|gif|webp)$/i.test(doc.file_name);
              return (
                <div key={doc.id} className="relative group w-20">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                    {doc.uploading ? (
                      <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={doc.file_url} alt={doc.file_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <FileText className="w-7 h-7 text-blue-400" />
                        <span className="text-[9px] font-bold text-blue-400 uppercase">
                          {doc.file_name.split(".").pop()}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Nombre */}
                  {!doc.uploading && (
                    <p className="text-[9px] text-gray-500 mt-1 truncate text-center leading-tight">{doc.file_name}</p>
                  )}
                  {/* Eliminar */}
                  {doc.file_url && (
                    <button type="button" onClick={() => onRemoveDoc(doc.id)}
                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex w-5 h-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Slot de upload */}
        {documentos.filter((d) => !d.file_url && !d.uploading).slice(0, 1).map((doc) => (
          <label key={doc.id} className="flex items-center gap-2 h-10 w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 px-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <Upload className="w-4 h-4 shrink-0" />
            <span className="text-xs">Seleccionar o arrastrar archivo</span>
            <input type="file" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onArchivoDoc(doc.id, f); }} />
          </label>
        ))}
      </div>

      {/* Botón IA */}
      {(() => {
        const tieneDoc = documentos.some((d) => d.file_url);
        return (
          <button
            type="button"
            disabled={!tieneDoc}
            className={cn(
              "w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-all mb-5",
              tieneDoc
                ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm shadow-blue-200 hover:opacity-90"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <Sparkles className="w-4 h-4" />
            {tieneDoc ? "Extraer datos con IA" : "Sube un documento para usar IA"}
          </button>
        );
      })()}

      {/* Campos IA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="material_proveedor_cliente" render={({ field }) => (
          <FormItem>
            <FieldLabel ia>Proveedor / Cliente</FieldLabel>
            <FormControl>
              <Input placeholder="Extraído del documento..." className="rounded-xl border-gray-200 bg-gray-50" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="material_nombre" render={({ field }) => (
          <FormItem>
            <FieldLabel ia>Material</FieldLabel>
            <FormControl>
              <Input placeholder="Extraído del documento..." className="rounded-xl border-gray-200 bg-gray-50" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="material_cantidad" render={({ field }) => (
          <FormItem>
            <FieldLabel ia>Cantidad</FieldLabel>
            <FormControl>
              <Input type="number" min={0} step={1} placeholder="" className="rounded-xl border-gray-200 bg-gray-50" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="material_orden_compra" render={({ field }) => (
          <FormItem>
            <FieldLabel ia>Orden de compra</FieldLabel>
            <FormControl>
              <Input placeholder="Extraído del documento..." className="rounded-xl border-gray-200 bg-gray-50" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </Section>
  );
}

function SeccionLugarRecoleccion({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-50 rounded-xl">
          <MapPin className="w-4 h-4 text-blue-600" />
        </div>
        <p className="font-semibold text-gray-700">Lugar de recolección</p>
      </div>

      <div className="space-y-4">
        {/* Lugar y dirección */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="lugar_reco_lugar" render={({ field }) => (
            <FormItem>
              <FieldLabel required>Lugar</FieldLabel>
              <FormControl>
                <Input placeholder="Nombre de la ubicación origen" className="rounded-xl border-gray-200 bg-gray-50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lugar_reco_direccion" render={({ field }) => (
            <FormItem>
              <FieldLabel required>Dirección</FieldLabel>
              <FormControl>
                <Input placeholder="Calle, ciudad, estado" className="rounded-xl border-gray-200 bg-gray-50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Fecha, horario, andén */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="lugar_reco_fecha" render={({ field }) => (
            <FormItem>
              <FieldLabel required>Fecha</FieldLabel>
              <FormControl>
                <Input type="date" className="rounded-xl border-gray-200 bg-gray-50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lugar_reco_horario" render={({ field }) => (
            <FormItem>
              <FieldLabel>Horario</FieldLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {HORARIOS_SIMPLES.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lugar_reco_anden" render={({ field }) => (
            <FormItem>
              <FieldLabel>Andén</FieldLabel>
              <FormControl>
                <Input placeholder="Opcional" className="rounded-xl border-gray-200 bg-gray-50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Proveedor de transporte */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Proveedor de transporte <span className="text-gray-400 lowercase font-normal">(recibirá el pase)</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="transporte_responsable" render={({ field }) => (
              <FormItem>
                <FieldLabel required>Responsable</FieldLabel>
                <FormControl>
                  <Input placeholder="Contacto en transportista" className="rounded-xl border-gray-200 bg-gray-50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="transporte_email" render={({ field }) => (
              <FormItem>
                <FieldLabel required>Email</FieldLabel>
                <FormControl>
                  <Input placeholder="transportista@empresa.com" className="rounded-xl border-gray-200 bg-gray-50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="transporte_telefono" render={({ field }) => (
              <FormItem>
                <FieldLabel>Teléfono</FieldLabel>
                <FormControl>
                  <Input placeholder="" className="rounded-xl border-gray-200 bg-gray-50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Método de embarque e Incoterm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="metodo_embarque" render={({ field }) => (
            <FormItem>
              <FieldLabel>Método de embarque</FieldLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {METODOS_EMBARQUE.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="incoterm" render={({ field }) => (
            <FormItem>
              <FieldLabel>Incoterm</FieldLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOTERMS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>
    </div>
  );
}

function generarSlots(horaInicio: string, intervalo: number): string[] {
  const inicio = parseInt(horaInicio.split(":")[0], 10);
  const slots: string[] = [];
  let current = inicio;
  while (current + intervalo <= 24) {
    const from = `${String(current).padStart(2, "0")}:00`;
    const toH = current + intervalo;
    const to = toH === 24 ? "00:00" : `${String(toH).padStart(2, "0")}:00`;
    slots.push(`${from}-${to}`);
    current += intervalo;
  }
  return slots;
}

function SeccionProgramacion({ form, title = "Lugar de entrega / recepción", andenLabel = "Andén", horarios = [], diaIndex = 0, onDiaChange, isLoadingHorarios = false, andenes = [], isLoadingAndenes = false, locations = [] }: {
  form: ReturnType<typeof useForm<FormValues>>;
  title?: string;
  andenLabel?: string;
  horarios?: HorarioItem[];
  diaIndex?: number;
  onDiaChange?: (index: number) => void;
  isLoadingHorarios?: boolean;
  andenes?: string[];
  isLoadingAndenes?: boolean;
  locations?: string[];
}) {
  const [usarRango, setUsarRango] = useState(false);
  const [usarHorario, setUsarHorario] = useState(false);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [intervalo, setIntervalo] = useState(2);
  const slots = generarSlots(horaInicio, intervalo);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-50 rounded-xl">
          <MapPin className="w-4 h-4 text-blue-600" />
        </div>
        <p className="font-semibold text-gray-700">{title}</p>
      </div>

      <div className="space-y-5">
        {/* Ubicación y dirección */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="ubicacion" render={({ field }) => (
            <FormItem>
              <FieldLabel required>Ubicación</FieldLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50">
                    <SelectValue placeholder="Seleccionar ubicación..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="direccion_lugar" render={({ field }) => (
            <FormItem>
              <FieldLabel>Dirección</FieldLabel>
              <FormControl>
                <Input placeholder="Av. Industrial 420, Monterrey" className="rounded-xl border-gray-200 bg-gray-50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Fecha con toggle */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</p>
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <span>Rango de fechas</span>
              <Switch checked={usarRango} onCheckedChange={(c) => { setUsarRango(c); if (!c) form.setValue("fecha_pase_transportista_hasta", ""); }} className="data-[state=checked]:bg-blue-600" />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="fecha_pase_transportista_desde" render={({ field }) => (
              <FormItem>
                {usarRango && <FieldLabel required>Desde</FieldLabel>}
                <FormControl><Input type="date" className="rounded-xl border-gray-200 bg-gray-50" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {usarRango && (
              <FormField control={form.control} name="fecha_pase_transportista_hasta" render={({ field }) => (
                <FormItem>
                  <FieldLabel required>Hasta</FieldLabel>
                  <FormControl><Input type="date" className="rounded-xl border-gray-200 bg-gray-50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
          </div>
        </div>

        {/* Horario con toggle */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Horario</p>
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <span>Habilitar horario</span>
              <Switch checked={usarHorario} onCheckedChange={(c) => { setUsarHorario(c); if (!c) form.setValue("horario", ""); }} className="data-[state=checked]:bg-blue-600" />
            </label>
          </div>
          {usarHorario && (
            <>
              <div className="mb-4">
                {isLoadingHorarios && horarios.length === 0 ? (
                  <div className="rounded-xl border border-gray-100 bg-white p-4 flex items-center justify-center h-24">
                    <span className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <HorariosConcurrenciaChart horarios={horarios} diaIndex={diaIndex} onDiaChange={onDiaChange ?? (() => {})} isLoading={isLoadingHorarios} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Hora de inicio</p>
                  <Select value={horaInicio} onValueChange={(v) => { setHoraInicio(v); form.setValue("horario", ""); }}>
                    <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50"><SelectValue /></SelectTrigger>
                    <SelectContent>{HORAS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Cada cuántas horas</p>
                  <Select value={String(intervalo)} onValueChange={(v) => { setIntervalo(Number(v)); form.setValue("horario", ""); }}>
                    <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50"><SelectValue /></SelectTrigger>
                    <SelectContent>{INTERVALOS.map((i) => <SelectItem key={i} value={String(i)}>{i}h</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <FormField control={form.control} name="horario" render={({ field }) => (
                <FormItem>
                  <FieldLabel required>Selecciona un slot</FieldLabel>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {slots.map((slot) => (
                      <button key={slot} type="button" onClick={() => field.onChange(slot)}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          field.value === slot ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600")}>
                        {slot}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            </>
          )}
        </div>

        {/* Andén */}
        <FormField control={form.control} name="anden" render={({ field }) => (
          <FormItem>
            <FieldLabel>{andenLabel}</FieldLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange} disabled={isLoadingAndenes}>
                <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50">
                  <SelectValue placeholder={isLoadingAndenes ? "Cargando andenes..." : "Seleccionar andén..."} />
                </SelectTrigger>
                <SelectContent>
                  {andenes.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );
}

function SeccionGenerarPase({ tipo, onEnviar, isPending }: {
  tipo: string;
  onEnviar: () => void;
  isPending: boolean;
}) {
  const config = GENERAR_PASE[tipo];
  if (!config) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-50 rounded-xl">
          <Send className="w-4 h-4 text-blue-600" />
        </div>
        <p className="font-semibold text-gray-700">Generar y enviar pase</p>
      </div>
      <InfoBox>{config.info}</InfoBox>
      <div className="flex flex-wrap gap-3">
        {config.botones.map(({ label, primary }) => (
          label === "Vista previa" ? (
            <Button key={label} type="button" variant="outline"
              className="rounded-full border-gray-200 text-gray-600 gap-2">
              <Eye className="w-4 h-4" /> {label}
            </Button>
          ) : primary ? (
            <Button key={label} type="button" disabled={isPending}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={onEnviar}>
              {isPending
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
                : <><Send className="w-4 h-4" /> {label}</>
              }
            </Button>
          ) : (
            <Button key={label} type="button" variant="outline"
              className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 gap-2">
              <Send className="w-4 h-4" /> {label}
            </Button>
          )
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

const PaseEntradaTransportistaPage = () => {
  const { uploadImageMutation } = useUploadImage();
  const { mutate: crearPase, isPending } = useCreatePaseTransportista();
  const [modalPayload, setModalPayload] = useState<Record<string, any> | null>(null);
  const [successData, setSuccessData] = useState<{ id: string; folio: string } | null>(null);
  const [diaIndex, setDiaIndex] = useState(0);

  const emptyDoc = (): Documento => ({ id: crypto.randomUUID(), tipo: "", archivo: null, file_name: "", file_url: "", uploading: false });
  const [documentos, setDocumentos] = useState<Documento[]>([emptyDoc()]);

  const handleRemoveDoc = (id: string) => setDocumentos((p) => p.filter((d) => d.id !== id));
  const handleArchivoDoc = async (id: string, file: File) => {
    setDocumentos((p) => p.map((d) => d.id === id ? { ...d, archivo: file, uploading: true } : d));
    try {
      const renamed = new File([file], reemplazarGuionMinuscula("doc_transportista " + file.name), { type: file.type });
      const result = await uploadImageMutation.mutateAsync({ img: renamed });
      setDocumentos((p) => [
        ...p.map((d) => d.id === id ? { ...d, file_name: (result?.file_name ?? file.name).replace(/ /g, "_"), file_url: result?.file_url ?? "", uploading: false } : d),
        emptyDoc(),
      ]);
    } catch {
      setDocumentos((p) => p.map((d) => d.id === id ? { ...d, uploading: false } : d));
    }
  };

  const { locations, fetchLocations } = useAreasLocationStore();
  React.useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const { data: andenesData, isLoading: isLoadingAndenes } = useQuery({
    queryKey: ["getAndenes"],
    queryFn: getAndenes,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 30,
  });
  const andenes: string[] = andenesData?.response?.data ?? [];

  const { data: horariosData, isFetching: isLoadingHorarios } = useQuery({
    queryKey: ["getHorariosData", diaIndex],
    queryFn: () => getHorariosData(diaIndex),
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 30,
  });
  const horarios: HorarioItem[] = horariosData?.response?.data?.horarios ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_operacion: "entrega_materia_prima",
      crea_el_pase_nombre: "", crea_el_pase_email: "", crea_el_pase_telefono: "",
      recibe_el_pase_nombre: "", recibe_el_pase_email: "", recibe_el_pase_telefono: "",
      material_proveedor_cliente: "", material_nombre: "", material_cantidad: "", material_orden_compra: "",
      ubicacion: "", direccion_lugar: "",
      fecha_pase_transportista_desde: "", fecha_pase_transportista_hasta: "",
      horario: "", anden: "",
      lugar_reco_lugar: "", lugar_reco_direccion: "", lugar_reco_fecha: "",
      lugar_reco_horario: "", lugar_reco_anden: "",
      transporte_responsable: "", transporte_email: "", transporte_telefono: "",
      metodo_embarque: "", incoterm: "",
    },
  });

  const tipoOperacion = form.watch("tipo_operacion");
  const tieneRecoleccion = ["recoleccion_materia_prima", "entrega_producto_terminado"].includes(tipoOperacion);


  const buildPayload = (data: FormValues) => ({
    tipo_de_operacion: TIPO_OPERACION_LABEL[data.tipo_operacion],
    creado_desde: "pase_de_entrada_web",
    dominio: typeof window !== "undefined" ? window.location.origin : "",
    crea_el_pase: { nombre: data.crea_el_pase_nombre, email: data.crea_el_pase_email, telefono: data.crea_el_pase_telefono || null },
    recibe_el_pase: { nombre: data.recibe_el_pase_nombre || null, email: data.recibe_el_pase_email || null, telefono: data.recibe_el_pase_telefono || null },
    material: {
      proveedor_cliente: data.material_proveedor_cliente || null,
      material: data.material_nombre || null,
      cantidad: data.material_cantidad ? parseInt(data.material_cantidad, 10) : null,
      orden_compra: data.material_orden_compra || null,
      documentos: documentos
        .filter((d) => d.file_url)
        .map((d) => ({ file_name: d.file_name, file_url: d.file_url })),
    },
    lugar_entrega_recepcion: {
      ubicacion: data.ubicacion || null,
      direccion: data.direccion_lugar || null,
      fecha_pase_transportista_desde: data.fecha_pase_transportista_desde || null,
      ...(data.fecha_pase_transportista_hasta && { fecha_pase_transportista_hasta: data.fecha_pase_transportista_hasta }),
      horario_disponible: data.horario || null,
      anden: data.anden || null,
    },
    ...(tieneRecoleccion && {
      lugar_recoleccion: {
        lugar: data.lugar_reco_lugar || null,
        direccion: data.lugar_reco_direccion || null,
        fecha: data.lugar_reco_fecha || null,
        horario: data.lugar_reco_horario || null,
        anden: data.lugar_reco_anden || null,
        transporte: {
          responsable: data.transporte_responsable || null,
          email: data.transporte_email || null,
          telefono: data.transporte_telefono || null,
        },
        metodo_embarque: data.metodo_embarque || null,
        incoterm: data.incoterm || null,
      },
    }),
  });

  const onSubmit = (data: FormValues) => {
    setModalPayload(buildPayload(data) as Record<string, any>);
  };

  const programacionProps = { form, horarios, diaIndex, onDiaChange: setDiaIndex, isLoadingHorarios, andenes, isLoadingAndenes, locations };

  return (
    <div className="min-h-screen bg-gray-100 py-5 px-4">
      <ConfirmPaseTransportistaModal
        open={!!modalPayload}
        onClose={() => setModalPayload(null)}
        onConfirm={() => {
          crearPase(modalPayload, {
            onSuccess: (result) => {
              setModalPayload(null);
              if (result?.id) setSuccessData({ id: result.id, folio: result.folio });
            },
          });
        }}
        payload={modalPayload}
        isPending={isPending}
      />

      <PaseTransportistaSuccessModal
        open={!!successData}
        onClose={() => setSuccessData(null)}
        id={successData?.id ?? ""}
        folio={successData?.folio ?? ""}
      />

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col space-y-5 max-w-4xl mx-auto pt-4">

            {/* Header */}
            <div className="text-center">
              <h1 className="font-bold text-2xl text-gray-800">Pase de entrada — Transportista</h1>
              <p className="text-sm text-gray-400 mt-1">Registra el ingreso de un vehículo de carga</p>
            </div>

            {/* Tipo de operación */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tipo de operación</p>
              <FormField control={form.control} name="tipo_operacion" render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS_OPERACION.map(({ value, label, description, icon: Icon, tags }) => {
                      const isSelected = field.value === value;
                      return (
                        <button key={value} type="button" onClick={() => field.onChange(value)}
                          className={cn("text-left p-4 rounded-xl border-2 transition-all duration-150",
                            isSelected ? "border-teal-500 bg-teal-50/50" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50")}>
                          <div className="flex items-start gap-3">
                            <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", isSelected ? "text-teal-600" : "text-gray-400")} />
                            <div className="min-w-0">
                              <p className={cn("font-semibold text-sm leading-snug", isSelected ? "text-teal-700" : "text-gray-700")}>{label}</p>
                              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {tags.map((tag) => (
                                  <span key={tag} className="text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{tag}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage className="mt-2" />
                </FormItem>
              )} />
            </div>

            {/* Quien recibe */}
            <SeccionQuienRecibe form={form} />

            {/* Segunda persona */}
            <SeccionSegundaPersona form={form} tipo={tipoOperacion} />

            {/* Material */}
            <SeccionMaterial
              form={form}
              documentos={documentos}
              onRemoveDoc={handleRemoveDoc}
              onArchivoDoc={handleArchivoDoc}
            />

            {/* Lugar de entrega / recepción */}
            <SeccionProgramacion {...programacionProps} />

            {/* Lugar de recolección (tipos 2 y 3) */}
            {tieneRecoleccion && <SeccionLugarRecoleccion form={form} />}

            {/* Generar y enviar pase */}
            <SeccionGenerarPase
              tipo={tipoOperacion}
              onEnviar={() => form.handleSubmit(onSubmit)()}
              isPending={isPending}
            />

          </div>
        </form>
      </Form>
    </div>
  );
};

export default PaseEntradaTransportistaPage;
