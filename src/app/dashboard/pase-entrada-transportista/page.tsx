"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Truck,
  ArrowLeftRight,
  Package,
  Building2,
  Info,
  AlertTriangle,
  Upload,
  X,
  Plus,
  CalendarDays,
  BoxesIcon,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useUploadImage } from "@/hooks/useUploadImage";
import { reemplazarGuionMinuscula } from "@/lib/utils";
import { useCreatePaseTransportista } from "@/hooks/useCreatePaseTransportista";
import { ConfirmPaseTransportistaModal } from "@/components/modals/confirm-pase-transportista-modal";
import { useQuery } from "@tanstack/react-query";
import { getHorariosData, getAndenes } from "@/services/endpoints";
import {
  HorariosConcurrenciaChart,
  type HorarioItem,
} from "@/components/horarios-concurrencia-chart";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Documento {
  id: string;
  tipo: string;
  archivo: File | null;
  file_name: string;
  file_url: string;
  uploading: boolean;
}

// ── Schema ─────────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    tipo_operacion: z.enum(
      [
        "entrega_materia_prima",
        "recoleccion_materia_prima",
        "entrega_producto_terminado",
        "recoleccion_producto_terminado",
      ],
      { required_error: "Selecciona un tipo de operación." },
    ),

    // ── Entrega (materia prima / producto terminado)
    proveedor: z.string().optional(),
    material: z.string().optional(),
    cantidad: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: "La cantidad debe ser un número entero.",
      }),

    // ── Recolección de materia prima
    proveedor_origen: z.string().optional(),
    direccion_recoleccion: z.string().optional(),
    material_a_recoger: z.string().optional(),

    // ── Entrega de producto terminado
    cliente: z.string().optional(),
    direccion_entrega: z.string().optional(),
    producto: z.string().optional(),
    orden_venta_remision: z.string().optional(),
    responsable_entrega: z.string().optional(),
    responsable_despacho: z.string().optional(),

    // ── Compartido
    orden_compra: z.string().optional(),
    transportista: z.string().optional(),
    placas: z.string().optional(),
    nombre_operador: z.string().optional(),
    fecha_pase_transportista_desde: z.string().optional(),
    fecha_pase_transportista_hasta: z.string().optional(),
    horario: z.string().optional(),
    anden: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const add = (path: string, msg: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: [path] });

    if (data.tipo_operacion === "entrega_materia_prima") {
      if (!data.proveedor) add("proveedor", "El proveedor es requerido.");
      if (!data.material) add("material", "El material es requerido.");
      if (!data.fecha_pase_transportista_desde)
        add(
          "fecha_pase_transportista_desde",
          "La fecha de llegada es requerida.",
        );
      if (!data.anden) add("anden", "El andén es requerido.");
    }

    if (data.tipo_operacion === "recoleccion_materia_prima") {
      if (!data.proveedor_origen)
        add("proveedor_origen", "El proveedor / origen es requerido.");
      if (!data.direccion_recoleccion)
        add(
          "direccion_recoleccion",
          "La dirección de recolección es requerida.",
        );
      if (!data.material_a_recoger)
        add("material_a_recoger", "El material a recoger es requerido.");
      if (!data.transportista)
        add("transportista", "El transportista es requerido.");
      if (!data.placas)
        add("placas", "Las placas del vehículo son requeridas.");
      if (!data.fecha_pase_transportista_desde)
        add(
          "fecha_pase_transportista_desde",
          "La fecha estimada de retorno es requerida.",
        );
      if (!data.anden) add("anden", "El andén es requerido.");
    }

    if (data.tipo_operacion === "entrega_producto_terminado") {
      if (!data.cliente) add("cliente", "El cliente es requerido.");
      if (!data.direccion_entrega)
        add("direccion_entrega", "La dirección de entrega es requerida.");
      if (!data.producto) add("producto", "El producto es requerido.");
      if (!data.transportista)
        add("transportista", "El transportista es requerido.");
      if (!data.placas)
        add("placas", "Las placas del vehículo son requeridas.");
      if (!data.fecha_pase_transportista_desde)
        add(
          "fecha_pase_transportista_desde",
          "La fecha de salida es requerida.",
        );
      if (!data.anden) add("anden", "El andén de embarque es requerido.");
    }

    if (data.tipo_operacion === "recoleccion_producto_terminado") {
      if (!data.cliente) add("cliente", "El cliente es requerido.");
      if (!data.producto) add("producto", "El producto es requerido.");
      if (!data.fecha_pase_transportista_desde)
        add(
          "fecha_pase_transportista_desde",
          "La fecha de recolección es requerida.",
        );
      if (!data.anden) add("anden", "El andén de embarque es requerido.");
    }
  });

type FormValues = z.infer<typeof formSchema>;

// ── Constantes ─────────────────────────────────────────────────────────────────

const TIPOS_OPERACION = [
  {
    value: "entrega_materia_prima" as const,
    label: "Entrega de materia prima",
    description: "El proveedor viene a tu planta con mercancía",
    icon: Truck,
    tags: ["DDP", "DAP", "CIF"],
  },
  {
    value: "recoleccion_materia_prima" as const,
    label: "Recolección de materia prima",
    description: "Tu transporte va por la mercancía al proveedor",
    icon: ArrowLeftRight,
    tags: ["FOB", "EXW", "FCA"],
  },
  {
    value: "entrega_producto_terminado" as const,
    label: "Entrega de producto terminado",
    description: "Tu transporte lleva el producto al cliente",
    icon: Package,
    tags: ["DAP", "DDP cliente"],
  },
  {
    value: "recoleccion_producto_terminado" as const,
    label: "Recolección de producto terminado",
    description: "El cliente recoge en tu planta",
    icon: Building2,
    tags: ["EXW", "FCA tu planta"],
  },
] as const;

const TIPOS_DOCUMENTO = [
  { value: "carta_porte", label: "Carta porte" },
  { value: "factura", label: "Factura" },
  { value: "remision", label: "Remisión" },
  { value: "pedido", label: "Pedido" },
  { value: "guia", label: "Guía" },
  { value: "otro", label: "Otro" },
];

// ── Componentes auxiliares ─────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
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

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-800">
      <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
      <p>{children}</p>
    </div>
  );
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4 text-sm text-amber-800">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
      <p>{children}</p>
    </div>
  );
}

function FieldLabel({
  required,
  children,
}: {
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {required && <span className="text-red-400">* </span>}
      {children}
    </FormLabel>
  );
}

// ── Secciones por tipo de operación ───────────────────────────────────────────

function SeccionEntregaMateriaPrima({
  form,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  return (
    <Section icon={BoxesIcon} title="Proveedor y material">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField
          control={form.control}
          name="proveedor"
          render={({ field }) => (
            <FormItem>
              <FieldLabel required>Proveedor</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Buscar proveedor..."
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="material"
          render={({ field }) => (
            <FormItem>
              <FieldLabel required>Material</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Ej. Resina PET"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cantidad"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Cantidad</FieldLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Ej. 20"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="orden_compra"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Orden de compra</FieldLabel>
              <FormControl>
                <Input
                  placeholder="OC-2026-0042"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Section>
  );
}

function SeccionRecoleccionMateriaPrima({
  form,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  return (
    <Section icon={BoxesIcon} title="Origen de recolección">
      <InfoBox>
        El pase se envía al transportista con instrucciones de a dónde ir y qué
        recoger. También funciona como pase de entrada al regresar a tu planta.
      </InfoBox>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField
          control={form.control}
          name="proveedor_origen"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FieldLabel required>Proveedor / Origen</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Buscar proveedor..."
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="direccion_recoleccion"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FieldLabel required>Dirección de recolección</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Calle, ciudad, estado..."
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="material_a_recoger"
          render={({ field }) => (
            <FormItem>
              <FieldLabel required>Material a recoger</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Ej. Acero inoxidable"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="orden_compra"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Orden de compra</FieldLabel>
              <FormControl>
                <Input
                  placeholder="OC-2026-0042"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Section>
  );
}

function SeccionTransportistaEntrega({
  form,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  return (
    <Section icon={User} title="Transportista">
      <InfoBox>
        El proveedor usa su propio transporte. Si ya sabes quién viene,
        captúralo. Si no, el pase queda como{" "}
        <strong>pendiente de transportista</strong> — el guardia registrará los
        datos al llegar.
      </InfoBox>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField
          control={form.control}
          name="transportista"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Transportista</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Buscar o captura libre..."
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="placas"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Placas del vehículo</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Opcional si no se conoce"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <WarnBox>
        Si se deja vacío, el guardia completará los datos en caseta al momento
        de la llegada.
      </WarnBox>
    </Section>
  );
}

function SeccionTransportistaAsignado({
  form,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  return (
    <Section icon={User} title="Transportista asignado">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField
          control={form.control}
          name="transportista"
          render={({ field }) => (
            <FormItem>
              <FieldLabel required>Transportista</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Buscar o captura libre..."
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="placas"
          render={({ field }) => (
            <FormItem>
              <FieldLabel required>Placas del vehículo</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Ej. ABC-123-D"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nombre_operador"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FieldLabel>Nombre del operador</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Opcional"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Section>
  );
}

function SeccionEntregaProductoTerminado({
  form,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  return (
    <Section icon={BoxesIcon} title="Cliente y producto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField
          control={form.control}
          name="cliente"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FieldLabel required>Cliente</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Buscar cliente..."
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="direccion_entrega"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FieldLabel required>Dirección de entrega</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Planta o almacén del cliente..."
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="producto"
          render={({ field }) => (
            <FormItem>
              <FieldLabel required>Producto</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Ej. Producto terminado A"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="orden_venta_remision"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Orden de venta / Remisión</FieldLabel>
              <FormControl>
                <Input
                  placeholder="OV-2026-0018"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cantidad"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Cantidad</FieldLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Ej. 5"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="responsable_entrega"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Responsable de entrega</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Nombre del encargado"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Section>
  );
}

function SeccionRecoleccionProductoTerminado({
  form,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  return (
    <Section icon={BoxesIcon} title="Cliente y producto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField
          control={form.control}
          name="cliente"
          render={({ field }) => (
            <FormItem>
              <FieldLabel required>Cliente</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Buscar cliente..."
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="orden_venta_remision"
          render={({ field }) => (
            <FormItem>
              <FieldLabel required>Orden de venta / Remisión</FieldLabel>
              <FormControl>
                <Input
                  placeholder="OV-2026-0018"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="producto"
          render={({ field }) => (
            <FormItem>
              <FieldLabel required>Producto</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Ej. Producto terminado A"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cantidad"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Cantidad</FieldLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Ej. 3"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="responsable_despacho"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FieldLabel>Responsable de despacho</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Quien entrega el producto en almacén"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Section>
  );
}

function SeccionTransportistaCliente({
  form,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  return (
    <Section icon={User} title="Transportista del cliente">
      <InfoBox>
        El cliente usa su propio transporte. Si ya te informaron quién viene,
        captúralo. Si no, el guardia registrará los datos al momento de la
        llegada.
      </InfoBox>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField
          control={form.control}
          name="transportista"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Transportista</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Buscar o captura libre..."
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="placas"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Placas del vehículo</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Opcional si no se conoce"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nombre_operador"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FieldLabel>Nombre del operador</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Opcional"
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <WarnBox>
        Si se deja vacío, el guardia completará los datos en caseta al momento
        de la llegada.
      </WarnBox>
    </Section>
  );
}

const HORAS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, "0")}:00`,
);
const INTERVALOS = [1, 2, 3, 4];

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

function SeccionProgramacion({
  form,
  title = "Programación",
  andenLabel = "Andén de recepción",
  horarios = [],
  diaIndex = 0,
  onDiaChange,
  isLoadingHorarios = false,
  andenes = [],
  isLoadingAndenes = false,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  title?: string;
  andenLabel?: string;
  horarios?: HorarioItem[];
  diaIndex?: number;
  onDiaChange?: (index: number) => void;
  isLoadingHorarios?: boolean;
  andenes?: string[];
  isLoadingAndenes?: boolean;
}) {
  const [usarRango, setUsarRango] = useState(false);
  const [usarHorario, setUsarHorario] = useState(false);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [intervalo, setIntervalo] = useState(2);

  const slots = generarSlots(horaInicio, intervalo);

  const handleToggleRango = (checked: boolean) => {
    setUsarRango(checked);
    if (!checked) form.setValue("fecha_pase_transportista_hasta", "");
  };

  return (
    <Section icon={CalendarDays} title={title}>
      <div className="space-y-5">
        {/* ── Fecha ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Fecha
            </p>
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <span>Rango de fechas</span>
              <Switch
                checked={usarRango}
                onCheckedChange={handleToggleRango}
                className="data-[state=checked]:bg-blue-600"
              />
            </label>
          </div>

          <div
            className={cn(
              "grid gap-5",
              usarRango
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2",
            )}>
            <FormField
              control={form.control}
              name="fecha_pase_transportista_desde"
              render={({ field }) => (
                <FormItem>
                  {usarRango && <FieldLabel required>Desde</FieldLabel>}
                  <FormControl>
                    <Input
                      type="date"
                      className="rounded-xl border-gray-200 bg-gray-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {usarRango && (
              <FormField
                control={form.control}
                name="fecha_pase_transportista_hasta"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>Hasta</FieldLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="rounded-xl border-gray-200 bg-gray-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* ── Horario ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Horario disponible
            </p>
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <span>Habilitar horario</span>
              <Switch
                checked={usarHorario}
                onCheckedChange={(checked) => {
                  setUsarHorario(checked);
                  if (!checked) form.setValue("horario", "");
                }}
                className="data-[state=checked]:bg-blue-600"
              />
            </label>
          </div>
          {usarHorario && (
            <>
              {horarios.length > 0 && (
                <div className="mb-4">
                  <HorariosConcurrenciaChart
                    horarios={horarios}
                    diaIndex={diaIndex}
                    onDiaChange={onDiaChange ?? (() => {})}
                    isLoading={isLoadingHorarios}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Hora de inicio</p>
                  <Select
                    value={horaInicio}
                    onValueChange={(v) => {
                      setHoraInicio(v);
                      form.setValue("horario", "");
                    }}>
                    <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HORAS.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    Cada cuántas horas
                  </p>
                  <Select
                    value={String(intervalo)}
                    onValueChange={(v) => {
                      setIntervalo(Number(v));
                      form.setValue("horario", "");
                    }}>
                    <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVALOS.map((i) => (
                        <SelectItem key={i} value={String(i)}>
                          {i}h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <FormField
                control={form.control}
                name="horario"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>Selecciona un slot</FieldLabel>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => field.onChange(slot)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                            field.value === slot
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600",
                          )}>
                          {slot}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        {/* ── Andén ── */}
        <FormField
          control={form.control}
          name="anden"
          render={({ field }) => (
            <FormItem>
              <FieldLabel required>{andenLabel}</FieldLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingAndenes}>
                  <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50">
                    <SelectValue
                      placeholder={
                        isLoadingAndenes
                          ? "Cargando andenes..."
                          : "Seleccionar andén..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {andenes?.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Section>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

const PaseEntradaTransportistaPage = () => {
  const [documentos, setDocumentos] = useState<Documento[]>([
    {
      id: crypto.randomUUID(),
      tipo: "",
      archivo: null,
      file_name: "",
      file_url: "",
      uploading: false,
    },
  ]);
  const { uploadImageMutation } = useUploadImage();
  const { mutate: crearPase, isPending } = useCreatePaseTransportista();
  const [modalPayload, setModalPayload] = useState<Record<string, any> | null>(
    null,
  );

  const [diaIndex, setDiaIndex] = useState(0);

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
      proveedor: "",
      material: "",
      cantidad: "",
      proveedor_origen: "",
      direccion_recoleccion: "",
      material_a_recoger: "",
      orden_compra: "",
      transportista: "",
      placas: "",
      nombre_operador: "",
      fecha_pase_transportista_desde: "",
      fecha_pase_transportista_hasta: "",
      horario: "",
      anden: "",
    },
  });

  const tipoOperacion = form.watch("tipo_operacion");

  const TIPO_OPERACION_LABEL: Record<string, string> = {
    entrega_materia_prima: "entrega_de_materia_prima",
    entrega_producto_terminado: "entrega_de_producto_terminado",
    recoleccion_materia_prima: "recoleccion_de_materia_prima",
    recoleccion_producto_terminado: "recoleccion_de_producto_terminado",
  };

  const buildPayload = (data: FormValues) => {
    const documentosPayload = documentos
      .filter((d) => d.tipo)
      .map((d) => ({
        tipo_de_documento: d.tipo,
        documento_transportista: d.file_url
          ? [{ file_name: d.file_name, file_url: d.file_url }]
          : [],
      }));

    switch (data.tipo_operacion) {
      case "entrega_materia_prima":
        return {
          tipo_de_operacion: TIPO_OPERACION_LABEL[data.tipo_operacion],
          creado_desde: "pase_de_entrada_web",
          proveedor_y_material: {
            proveedor: data.proveedor,
            material: data.material,
            cantidad: data.cantidad ? parseInt(data.cantidad, 10) : null,
            orden_compra: data.orden_compra || null,
          },
          transportista: {
            nombre: data.transportista || null,
            placas_vehiculo: data.placas || null,
          },
          programacion: {
            fecha_pase_transportista_desde: data.fecha_pase_transportista_desde,
            ...(data.fecha_pase_transportista_hasta && {
              fecha_pase_transportista_hasta:
                data.fecha_pase_transportista_hasta,
            }),
            horario_disponible: data.horario,
            anden: data.anden,
          },
          documentos: documentosPayload,
        };

      case "recoleccion_materia_prima":
        return {
          tipo_de_operacion: TIPO_OPERACION_LABEL[data.tipo_operacion],
          creado_desde: "pase_de_entrada_web",
          origen_recoleccion: {
            proveedor: data.proveedor_origen,
            direccion_recoleccion: data.direccion_recoleccion,
            material_a_recoger: data.material_a_recoger,
            orden_compra: data.orden_compra || null,
          },
          transportista: {
            nombre: data.transportista || null,
            placas_vehiculo: data.placas || null,
            nombre_operador: data.nombre_operador || null,
          },
          programacion_regreso: {
            fecha_pase_transportista_desde: data.fecha_pase_transportista_desde,
            ...(data.fecha_pase_transportista_hasta && {
              fecha_pase_transportista_hasta:
                data.fecha_pase_transportista_hasta,
            }),
            horario_disponible: data.horario,
            anden: data.anden,
          },
          documentos: documentosPayload,
        };

      case "entrega_producto_terminado":
        return {
          tipo_de_operacion: TIPO_OPERACION_LABEL[data.tipo_operacion],
          creado_desde: "pase_de_entrada_web",
          cliente_y_producto: {
            cliente: data.cliente,
            direccion_entrega: data.direccion_entrega,
            producto: data.producto,
            orden_venta_remision: data.orden_venta_remision || null,
            cantidad: data.cantidad ? parseInt(data.cantidad, 10) : null,
            responsable_entrega: data.responsable_entrega || null,
          },
          transportista: {
            nombre: data.transportista || null,
            placas_vehiculo: data.placas || null,
            nombre_operador: data.nombre_operador || null,
          },
          programacion_salida: {
            fecha_pase_transportista_desde: data.fecha_pase_transportista_desde,
            ...(data.fecha_pase_transportista_hasta && {
              fecha_pase_transportista_hasta:
                data.fecha_pase_transportista_hasta,
            }),
            horario_disponible: data.horario,
            anden: data.anden,
          },
          documentos: documentosPayload,
        };

      case "recoleccion_producto_terminado":
        return {
          tipo_de_operacion: TIPO_OPERACION_LABEL[data.tipo_operacion],
          creado_desde: "pase_de_entrada_web",
          cliente_y_producto: {
            cliente: data.cliente,
            orden_venta_remision: data.orden_venta_remision || null,
            producto: data.producto,
            cantidad: data.cantidad ? parseInt(data.cantidad, 10) : null,
            responsable_despacho: data.responsable_despacho || null,
          },
          transportista: {
            nombre: data.transportista || null,
            placas_vehiculo: data.placas || null,
            nombre_operador: data.nombre_operador || null,
          },
          programacion: {
            fecha_pase_transportista_desde: data.fecha_pase_transportista_desde,
            ...(data.fecha_pase_transportista_hasta && {
              fecha_pase_transportista_hasta:
                data.fecha_pase_transportista_hasta,
            }),
            horario_disponible: data.horario,
            anden: data.anden,
          },
          documentos: documentosPayload,
        };
    }
  };

  const onSubmit = (data: FormValues) => {
    const payload = buildPayload(data);
    setModalPayload(payload as Record<string, any>);
  };

  const emptyDoc = (): Documento => ({
    id: crypto.randomUUID(),
    tipo: "",
    archivo: null,
    file_name: "",
    file_url: "",
    uploading: false,
  });

  const addDocumento = () => setDocumentos((prev) => [...prev, emptyDoc()]);

  const removeDocumento = (id: string) =>
    setDocumentos((prev) => prev.filter((d) => d.id !== id));

  const handleArchivoChange = async (id: string, file: File) => {
    setDocumentos((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, archivo: file, uploading: true } : d,
      ),
    );
    try {
      const renamed = new File(
        [file],
        reemplazarGuionMinuscula("doc_transportista " + file.name),
        { type: file.type },
      );
      const result = await uploadImageMutation.mutateAsync({ img: renamed });
      setDocumentos((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                file_name: result?.file_name ?? file.name,
                file_url: result?.file_url ?? "",
                uploading: false,
              }
            : d,
        ),
      );
    } catch {
      setDocumentos((prev) =>
        prev.map((d) => (d.id === id ? { ...d, uploading: false } : d)),
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-5 px-4">
      <ConfirmPaseTransportistaModal
        open={!!modalPayload}
        onClose={() => setModalPayload(null)}
        onConfirm={() => {
          crearPase(modalPayload, { onSuccess: () => setModalPayload(null) });
        }}
        payload={modalPayload}
        isPending={isPending}
      />
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col space-y-5 max-w-4xl mx-auto pt-4">
            {/* Header */}
            <div className="text-center">
              <h1 className="font-bold text-2xl text-gray-800">
                Pase de entrada — Transportista
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Registra el ingreso de un vehículo de carga
              </p>
            </div>

            {/* ── TIPO DE OPERACIÓN ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Tipo de operación
              </p>
              <FormField
                control={form.control}
                name="tipo_operacion"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 gap-2">
                      {TIPOS_OPERACION.map(
                        ({ value, label, description, icon: Icon, tags }) => {
                          const isSelected = field.value === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => field.onChange(value)}
                              className={cn(
                                "flex flex-col items-center text-center p-3 rounded-xl border-2 transition-all duration-150 gap-2",
                                isSelected
                                  ? "border-teal-500 bg-teal-50/50"
                                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                              )}>
                              <div
                                className={cn(
                                  "p-2 rounded-lg",
                                  isSelected ? "bg-teal-100" : "bg-gray-100",
                                )}>
                                <Icon
                                  className={cn(
                                    "w-5 h-5",
                                    isSelected
                                      ? "text-teal-600"
                                      : "text-gray-400",
                                  )}
                                />
                              </div>
                              <p
                                className={cn(
                                  "font-semibold text-xs leading-snug",
                                  isSelected
                                    ? "text-teal-700"
                                    : "text-gray-700",
                                )}>
                                {label}
                              </p>
                              <p className="text-[10px] text-gray-400 leading-snug hidden sm:block">
                                {description}
                              </p>
                              <div className="flex flex-wrap justify-center gap-1">
                                {tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[9px] font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                    <FormMessage className="mt-2" />
                  </FormItem>
                )}
              />
            </div>

            {/* ── SECCIONES DINÁMICAS ── */}
            {tipoOperacion === "entrega_materia_prima" && (
              <>
                <SeccionEntregaMateriaPrima form={form} />
                <SeccionTransportistaEntrega form={form} />
                <SeccionProgramacion
                  form={form}
                  horarios={horarios}
                  diaIndex={diaIndex}
                  onDiaChange={setDiaIndex}
                  isLoadingHorarios={isLoadingHorarios}
                  andenes={andenes}
                  isLoadingAndenes={isLoadingAndenes}
                />
              </>
            )}

            {tipoOperacion === "recoleccion_materia_prima" && (
              <>
                <SeccionRecoleccionMateriaPrima form={form} />
                <SeccionTransportistaAsignado form={form} />
                <SeccionProgramacion
                  form={form}
                  title="Programación de regreso"
                  horarios={horarios}
                  diaIndex={diaIndex}
                  onDiaChange={setDiaIndex}
                  isLoadingHorarios={isLoadingHorarios}
                  andenes={andenes}
                  isLoadingAndenes={isLoadingAndenes}
                />
              </>
            )}

            {tipoOperacion === "entrega_producto_terminado" && (
              <>
                <SeccionEntregaProductoTerminado form={form} />
                <SeccionTransportistaAsignado form={form} />
                <SeccionProgramacion
                  form={form}
                  title="Programación de salida"
                  andenLabel="Andén de embarque"
                  horarios={horarios}
                  diaIndex={diaIndex}
                  onDiaChange={setDiaIndex}
                  isLoadingHorarios={isLoadingHorarios}
                  andenes={andenes}
                  isLoadingAndenes={isLoadingAndenes}
                />
              </>
            )}

            {tipoOperacion === "recoleccion_producto_terminado" && (
              <>
                <SeccionRecoleccionProductoTerminado form={form} />
                <SeccionTransportistaCliente form={form} />
                <SeccionProgramacion
                  form={form}
                  andenLabel="Andén de embarque"
                  horarios={horarios}
                  diaIndex={diaIndex}
                  onDiaChange={setDiaIndex}
                  isLoadingHorarios={isLoadingHorarios}
                  andenes={andenes}
                  isLoadingAndenes={isLoadingAndenes}
                />
              </>
            )}

            {/* ── DOCUMENTOS ── */}
            {tipoOperacion && (
              <Section icon={Upload} title="Documentos">
                <div className="space-y-3">
                  {documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <select
                        value={doc.tipo}
                        onChange={(e) =>
                          setDocumentos((prev) =>
                            prev.map((d) =>
                              d.id === doc.id
                                ? { ...d, tipo: e.target.value }
                                : d,
                            ),
                          )
                        }
                        className="h-10 rounded-xl border border-gray-200 bg-gray-50 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[160px]">
                        <option value="">Seleccionar tipo...</option>
                        {TIPOS_DOCUMENTO.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <label
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed text-sm px-3 transition-colors",
                          doc.uploading
                            ? "border-blue-300 bg-blue-50 text-blue-500 cursor-wait"
                            : doc.file_url
                              ? "border-green-300 bg-green-50 text-green-700 cursor-pointer"
                              : "border-gray-300 bg-gray-50 text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50",
                        )}>
                        {doc.uploading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                            <span className="truncate">Subiendo...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {doc.file_name || "Seleccionar o arrastrar"}
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          disabled={doc.uploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleArchivoChange(doc.id, file);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeDocumento(doc.id)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addDocumento}
                    className="w-full rounded-xl border-dashed border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 h-10">
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar documento
                  </Button>
                </div>
              </Section>
            )}

            {/* ── ACCIONES ── */}
            {tipoOperacion && (
              <div className="flex gap-3 justify-center pb-8 mt-2">
                <Button
                  className="bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 w-full sm:w-1/3 md:w-1/4 rounded-full py-3 font-semibold transition-all"
                  variant="outline"
                  type="button"
                  onClick={() => window.history.back()}>
                  ← Cancelar
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-1/3 md:w-1/4 rounded-full py-3 font-semibold shadow-sm shadow-blue-200 transition-all"
                  variant="secondary"
                  type="submit"
                  disabled={isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)();
                  }}>
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    "Siguiente →"
                  )}
                </Button>
              </div>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PaseEntradaTransportistaPage;
