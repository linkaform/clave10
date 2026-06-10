"use client";

import React, { useState, useEffect } from "react";
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
  BoxesIcon,
  User,
  MapPin,
  Send,
  Eye,
  Upload,
  Sparkles,
  X,
  FileText,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Search, UserPlus, CalendarDays } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { useUploadImage } from "@/hooks/useUploadImage";
import { reemplazarGuionMinuscula } from "@/lib/utils";
import { useCreatePaseTransportista } from "@/hooks/useCreatePaseTransportista";
import { ConfirmPaseTransportistaModal } from "@/components/modals/confirm-pase-transportista-modal";
import { PaseTransportistaSuccessModal } from "@/components/modals/pase-transportista-success-modal";
import { useQuery } from "@tanstack/react-query";
import {
  getHorariosData,
  getAndenes,
  getUsersDataTransportista,
  getLocationData,
  getProveedoresTransportista,
} from "@/services/endpoints";
import {
  HorariosConcurrenciaChart,
  type HorarioItem,
} from "@/components/horarios-concurrencia-chart";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { useMenuStore } from "@/store/useGetMenuStore";
import useAuthStore from "@/store/useAuthStore";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

// ── Helpers ────────────────────────────────────────────────────────────────────

const PHONE_PREFIX_TO_COUNTRY: Record<number, string> = {
  1: "US", 7: "RU", 27: "ZA", 30: "GR", 31: "NL", 32: "BE", 33: "FR",
  34: "ES", 36: "HU", 39: "IT", 40: "RO", 41: "CH", 43: "AT", 44: "GB",
  45: "DK", 46: "SE", 47: "NO", 48: "PL", 49: "DE", 51: "PE", 52: "MX",
  53: "CU", 54: "AR", 55: "BR", 56: "CL", 57: "CO", 58: "VE", 60: "MY",
  61: "AU", 62: "ID", 63: "PH", 64: "NZ", 65: "SG", 66: "TH", 81: "JP",
  82: "KR", 84: "VN", 86: "CN", 90: "TR", 91: "IN", 92: "PK", 98: "IR",
};

function prefijoToCountry(prefijo?: number): string {
  return (prefijo != null && PHONE_PREFIX_TO_COUNTRY[prefijo]) || "MX";
}

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Documento {
  id: string;
  tipo: string;
  no_doc: string;
  archivo: File | null;
  file_name: string;
  file_url: string;
  uploading: boolean;
}

interface MaterialItem {
  id: string;
  contenedor: string;
  sello: string;
  tipo: string;
  cantidad: string;
  peso: string;
  volumen: string;
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const TIPOS_OPERACION = [
  {
    value: "entrega_materia_prima" as const,
    label: "Entrega de materia prima",
    description: "El proveedor viene a tu planta",
    icon: Truck,
    tags: ["DDP", "DAP", "CIF"],
  },
  {
    value: "recoleccion_materia_prima" as const,
    label: "Recolección de materia prima",
    description: "Tu transporte va al proveedor",
    icon: ArrowLeftRight,
    tags: ["FOB", "EXW", "FCA"],
  },
  {
    value: "entrega_producto_terminado" as const,
    label: "Entrega de producto terminado",
    description: "Tu transporte lleva el producto",
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

const TIPO_OPERACION_LABEL: Record<string, string> = {
  entrega_materia_prima: "entrega_de_materia_prima",
  entrega_producto_terminado: "entrega_de_producto_terminado",
  recoleccion_materia_prima: "recoleccion_de_materia_prima",
  recoleccion_producto_terminado: "recoleccion_de_producto_terminado",
};

const SEGUNDA_PERSONA: Record<string, { titulo: string; subtitulo: string }> = {
  entrega_materia_prima: { titulo: "Proveedor", subtitulo: "recibirá el pase" },
  recoleccion_materia_prima: {
    titulo: "Proveedor origen",
    subtitulo: "referencia del origen",
  },
  entrega_producto_terminado: {
    titulo: "Cliente destino",
    subtitulo: "referencia del destino",
  },
  recoleccion_producto_terminado: {
    titulo: "Cliente",
    subtitulo: "recibirá el pase",
  },
};

const GENERAR_PASE: Record<
  string,
  { info: string; botones: { label: string; primary: boolean }[] }
> = {
  entrega_materia_prima: {
    info: "El pase se enviará al proveedor con un QR. El proveedor podrá reenviarlo al transportista.",
    botones: [{ label: "Enviar a proveedor", primary: true }],
  },
  recoleccion_materia_prima: {
    info: "El pase se enviará al proveedor de transporte para que asigne conductor y llene los datos del vehículo.",
    botones: [
      { label: "Enviar a transportista", primary: true },
      { label: "Notificar a proveedor", primary: false },
    ],
  },
  entrega_producto_terminado: {
    info: "El pase se enviará al proveedor de transporte para que asigne conductor y llene los datos del vehículo.",
    botones: [
      { label: "Enviar a transportista", primary: true },
    ],
  },
  recoleccion_producto_terminado: {
    info: "El pase se enviará al cliente con un QR. El cliente podrá reenviarlo al transportista.",
    botones: [{ label: "Enviar a cliente", primary: true }],
  },
};


const HORARIOS_SIMPLES = [
  "06:00-08:00",
  "07:00-09:00",
  "08:00-10:00",
  "09:00-11:00",
  "10:00-12:00",
  "11:00-13:00",
  "12:00-14:00",
  "13:00-15:00",
  "14:00-16:00",
  "15:00-17:00",
  "16:00-18:00",
  "17:00-19:00",
  "18:00-20:00",
  "19:00-21:00",
];
const HORAS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, "0")}:00`,
);
const INTERVALOS = [1, 2, 3, 4];

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

    // Quien recibe
    crea_el_pase_nombre: z
      .string()
      .min(1, { message: "El nombre es requerido." }),
    crea_el_pase_email: z
      .string()
      .min(1, { message: "El email es requerido." }),
    crea_el_pase_telefono: z.string().optional(),
    crea_el_pase_es_nuevo: z.boolean().optional(),

    // Segunda persona
    recibe_el_pase_nombre: z.string().optional(),
    recibe_el_pase_email: z.string().optional(),
    recibe_el_pase_telefono: z.string().optional(),

    // Material (AI)
    material_proveedor_cliente: z.string().optional(),
    material_orden_compra: z.string().optional(),

    // Lugar de entrega / recepción
    ubicacion: z.string().optional(),
    direccion_lugar: z.string().optional(),
    fecha_pase_transportista_desde: z.string().optional(),
    fecha_pase_transportista_hasta: z.string().optional(),
    horario: z.string().optional(),
    anden: z.string().optional(),
    area: z.string().optional(),

    // Lugar de recolección (tipos 2 y 3)
    lugar_reco_lugar: z.string().optional(),
    lugar_reco_es_nuevo: z.boolean().optional(),
    lugar_reco_direccion: z.string().optional(),
    lugar_reco_fecha: z.string().optional(),
    lugar_reco_horario: z.string().optional(),
    lugar_reco_anden: z.string().optional(),
    transporte_responsable: z.string().optional(),
    transporte_email: z.string().optional(),
    transporte_telefono: z.string().optional(),
    metodo_embarque: z.string().optional(),
    incoterm: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const add = (path: string, msg: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: [path] });

    if (!data.crea_el_pase_nombre)
      add("crea_el_pase_nombre", "El nombre es requerido.");
    if (!data.crea_el_pase_email)
      add("crea_el_pase_email", "El email es requerido.");
    if (!data.recibe_el_pase_nombre)
      add("recibe_el_pase_nombre", "El nombre es requerido.");
    if (!data.recibe_el_pase_email)
      add("recibe_el_pase_email", "El email es requerido.");

    if (
      ["recoleccion_materia_prima", "entrega_producto_terminado"].includes(
        data.tipo_operacion,
      )
    ) {
      if (!data.lugar_reco_lugar)
        add("lugar_reco_lugar", "El lugar es requerido.");
      if (!data.lugar_reco_direccion)
        add("lugar_reco_direccion", "La dirección es requerida.");
      if (!data.lugar_reco_fecha)
        add("lugar_reco_fecha", "La fecha es requerida.");
      if (!data.transporte_responsable)
        add("transporte_responsable", "El responsable es requerido.");
      if (!data.transporte_email)
        add("transporte_email", "El email es requerido.");
    }
  });

type FormValues = z.infer<typeof formSchema>;

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

function InfoBox({
  children,
  warning,
}: {
  children: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl px-4 py-3 mb-4 text-sm",
        warning
          ? "bg-amber-50 border border-amber-200 text-amber-800"
          : "bg-blue-50 border border-blue-200 text-blue-800",
      )}>
      <Info
        className={cn(
          "w-4 h-4 mt-0.5 shrink-0",
          warning ? "text-amber-500" : "text-blue-500",
        )}
      />
      <p>{children}</p>
    </div>
  );
}

function FieldLabel({
  required,
  children,
  ia,
}: {
  required?: boolean;
  children: React.ReactNode;
  ia?: boolean;
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

function PersonaFields({
  form,
  prefix,
  required,
  defaultCountry = "MX",
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  prefix: "crea_el_pase" | "recibe_el_pase";
  required?: boolean;
  defaultCountry?: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <FormField
        control={form.control}
        name={`${prefix}_nombre`}
        render={({ field }) => (
          <FormItem>
            <FieldLabel required={required}>Nombre</FieldLabel>
            <FormControl>
              <Input
                placeholder="Nombre completo"
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
        name={`${prefix}_email`}
        render={({ field }) => (
          <FormItem>
            <FieldLabel required={required}>Email</FieldLabel>
            <FormControl>
              <Input
                placeholder="correo@empresa.com"
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
        name={`${prefix}_telefono`}
        render={({ field }) => (
          <FormItem>
            <FieldLabel>Teléfono</FieldLabel>
            <FormControl>
              <PhoneInput
                {...field}
                onChange={(v) => field.onChange(v ?? "")}
                placeholder="Teléfono"
                defaultCountry={defaultCountry as any}
                containerComponentProps={{
                  className:
                    "flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-3 py-0 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 md:text-sm",
                }}
                numberInputProps={{ className: "pl-3 bg-transparent" }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// ── Secciones ──────────────────────────────────────────────────────────────────

// ── Mock data — reemplazar con servicio real ──────────────────────────────────
type Empleado = {
  nombre: string;
  email: string | null;
  telefono: string | null;
};

function SeccionQuienRecibe({
  form,
  empleados = [],
  defaultCountry = "MX",
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  empleados?: Empleado[];
  defaultCountry?: string;
}) {
  const { userNameSoter, userEmailSoter } = useAuthStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [usandoOtro, setUsandoOtro] = useState(false);

  const nombreSeleccionado = form.watch("crea_el_pase_nombre");
  const esNuevo = form.watch("crea_el_pase_es_nuevo");

  // Pre-fill con el usuario actual al montar
  useEffect(() => {
    if (userNameSoter && !form.getValues("crea_el_pase_nombre")) {
      form.setValue("crea_el_pase_nombre", userNameSoter);
      form.setValue("crea_el_pase_email", userEmailSoter ?? "");
    }
  }, [userNameSoter, userEmailSoter, form]);

  const esUsuarioActual =
    !usandoOtro &&
    nombreSeleccionado === userNameSoter &&
    !esNuevo;

  const filtrados = query.trim()
    ? empleados.filter((e) =>
        e.nombre.toLowerCase().includes(query.toLowerCase()),
      )
    : empleados;

  const sinResultados = query.trim() && filtrados.length === 0;

  const seleccionar = (e: (typeof empleados)[0]) => {
    form.setValue("crea_el_pase_nombre", e.nombre);
    form.setValue("crea_el_pase_email", e.email ?? "");
    form.setValue(
      "crea_el_pase_telefono",
      e.telefono?.startsWith("+") ? e.telefono : "",
    );
    form.setValue("crea_el_pase_es_nuevo", false);
    setQuery("");
    setOpen(false);
  };

  const crearNuevo = () => {
    form.setValue("crea_el_pase_nombre", query.trim());
    form.setValue("crea_el_pase_email", "");
    form.setValue("crea_el_pase_telefono", "");
    form.setValue("crea_el_pase_es_nuevo", true);
    setQuery("");
    setOpen(false);
  };

  const volverAUsuarioActual = () => {
    form.setValue("crea_el_pase_nombre", userNameSoter ?? "");
    form.setValue("crea_el_pase_email", userEmailSoter ?? "");
    form.setValue("crea_el_pase_telefono", "");
    form.setValue("crea_el_pase_es_nuevo", false);
    setUsandoOtro(false);
    setQuery("");
  };


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

      {/* Grid 3 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Columna 1: responsable */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            <span className="text-red-400">*</span> Responsable
          </p>

          <div className="relative">
            {/* Tarjeta del usuario seleccionado */}
            <div className={cn(
              "flex items-center justify-between gap-2 px-3 h-11 rounded-xl border transition-all",
              esUsuarioActual ? "border-blue-200 bg-blue-50" :
              esNuevo        ? "border-amber-300 bg-amber-50" :
                               "border-blue-200 bg-blue-50"
            )}>
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  esNuevo ? "bg-amber-200 text-amber-700" : "bg-blue-200 text-blue-700"
                )}>
                  {nombreSeleccionado ? nombreSeleccionado.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-700 truncate">
                      {nombreSeleccionado || "Sin seleccionar"}
                    </span>
                    {esUsuarioActual && (
                      <span className="text-[9px] font-bold bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full shrink-0">tú</span>
                    )}
                    {esNuevo && (
                      <span className="text-[9px] font-bold bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full shrink-0">nuevo</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{form.watch("crea_el_pase_email") || "—"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setOpen((v) => !v); setQuery(""); }}
                className="shrink-0 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 rounded-lg px-2.5 h-7 transition-all hover:bg-blue-50">
                Cambiar
              </button>
            </div>

            {/* Dropdown de búsqueda */}
            {open && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                {/* Buscador */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    autoFocus
                    onChange={(e) => setQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    placeholder="Buscar empleado..."
                    className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none py-1"
                  />
                </div>

                <ul className="max-h-52 overflow-y-auto py-1">
                  {/* Usuario actual siempre primero si hay nombre */}
                  {userNameSoter && !query.trim() && (
                    <li>
                      <button type="button" onMouseDown={volverAUsuarioActual}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left bg-blue-50/50">
                        <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0">
                          {userNameSoter.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-700 truncate">{userNameSoter}</p>
                            <span className="text-[9px] font-bold bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full shrink-0">tú</span>
                          </div>
                          <p className="text-xs text-gray-400 truncate">{userEmailSoter}</p>
                        </div>
                      </button>
                    </li>
                  )}

                  {filtrados.map((e) => (
                    <li key={e.nombre}>
                      <button type="button" onMouseDown={() => { seleccionar(e); setUsandoOtro(true); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold shrink-0">
                          {e.nombre.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{e.nombre}</p>
                          <p className="text-xs text-gray-400 truncate">{e.email}</p>
                        </div>
                      </button>
                    </li>
                  ))}

                  {sinResultados && (
                    <li>
                      <button type="button" onMouseDown={crearNuevo}
                        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-amber-50 transition-colors text-left">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Agregar <span className="text-blue-600">&ldquo;{query}&rdquo;</span></p>
                          <p className="text-xs text-amber-600">Nuevo contacto — no existe en el sistema</p>
                        </div>
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {form.formState.errors.crea_el_pase_nombre && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.crea_el_pase_nombre.message}
            </p>
          )}
        </div>

        {/* Columnas 2 y 3: email y teléfono */}
        <FormField
          control={form.control}
          name="crea_el_pase_email"
          render={({ field }) => (
            <FormItem>
              <FieldLabel required>Email</FieldLabel>
              <FormControl>
                <Input
                  placeholder="correo@empresa.com"
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
          name="crea_el_pase_telefono"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Teléfono</FieldLabel>
              <FormControl>
                <PhoneInput
                  {...field}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="Teléfono"
                  defaultCountry={defaultCountry as any}
                  containerComponentProps={{
                    className:
                      "flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-3 py-0 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 md:text-sm",
                  }}
                  numberInputProps={{ className: "pl-3 bg-transparent" }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function SeccionSegundaPersona({
  form,
  tipo,
  defaultCountry = "MX",
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  tipo: string;
  defaultCountry?: string;
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
          {config.subtitulo && (
            <p className="text-xs text-gray-400">{config.subtitulo}</p>
          )}
        </div>
      </div>
      <PersonaFields form={form} prefix="recibe_el_pase" required defaultCountry={defaultCountry} />
    </div>
  );
}

const TIPOS_DOCUMENTO = [
  "BL / Conocimiento de embarque",
  "Sea Waybill",
  "Salida de Puerto",
  "Factura",
  "Orden de Compra",
  "Carta Porte",
  "Packing Slip",
  "Otro",
] as const;

function SeccionMaterial({
  form,
  documentos,
  onRemoveDoc,
  onArchivoDoc,
  onAddDoc,
  onChangeDocField,
  materialItems,
  onAddMaterialItem,
  onRemoveMaterialItem,
  onChangeMaterialItem,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  documentos: Documento[];
  onRemoveDoc: (id: string) => void;
  onArchivoDoc: (id: string, file: File) => void;
  onAddDoc: () => void;
  onChangeDocField: (id: string, field: "tipo" | "no_doc", value: string) => void;
  materialItems: MaterialItem[];
  onAddMaterialItem: () => void;
  onRemoveMaterialItem: (id: string) => void;
  onChangeMaterialItem: (
    id: string,
    field: keyof Omit<MaterialItem, "id">,
    value: string,
  ) => void;
}) {
  const tieneDoc = documentos.some((d) => d.file_url);
  return (
    <Section icon={BoxesIcon} title="Material">
      <InfoBox>
        Sube los documentos del embarque (BL, Salida de Puerto, Factura, etc.) y la IA extraerá los datos automáticamente.
      </InfoBox>

      {/* Tabla de documentos */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          Documentos
          <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5" /> IA
          </span>
        </p>

        <div className="rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide w-56">Tipo</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide w-36">No. Documento</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Archivo</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {documentos.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 last:border-0 group">
                  {/* Tipo */}
                  <td className="px-3 py-2">
                    <ComboboxField
                      value={doc.tipo ?? ""}
                      onChange={(v) => onChangeDocField(doc.id, "tipo", v)}
                      options={TIPOS_DOCUMENTO as unknown as string[]}
                      placeholder="Buscar tipo..."
                    />
                  </td>
                  {/* No. Documento */}
                  <td className="px-3 py-2">
                    <input
                      value={doc.no_doc ?? ""}
                      onChange={(e) => onChangeDocField(doc.id, "no_doc", e.target.value)}
                      placeholder="Ej. BL-2026-001"
                      className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-300 outline-none"
                    />
                  </td>
                  {/* Archivo */}
                  <td className="px-3 py-2">
                    {doc.uploading ? (
                      <span className="flex items-center gap-2 text-xs text-blue-500">
                        <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                        Subiendo...
                      </span>
                    ) : doc.file_url ? (
                      <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1 w-fit max-w-[200px]">
                        <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="text-[11px] text-gray-600 truncate">{doc.file_name}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveDoc(doc.id)}
                          className="ml-1 text-gray-400 hover:text-red-500 shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : (
                      <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-blue-500 transition-colors w-fit">
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        <span>Seleccionar archivo</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) onArchivoDoc(doc.id, f);
                          }}
                        />
                      </label>
                    )}
                  </td>
                  {/* Eliminar fila */}
                  <td className="px-2 py-2">
                    {documentos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveDoc(doc.id)}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={onAddDoc}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-200 text-xs font-medium text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all">
          <Plus className="w-3.5 h-3.5" />
          Agregar documento
        </button>
      </div>

      {/* Botón IA */}
      <button
        type="button"
        disabled={!tieneDoc}
        className={cn(
          "w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-all mb-5",
          tieneDoc
            ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm shadow-blue-200 hover:opacity-90"
            : "bg-gray-100 text-gray-400 cursor-not-allowed",
        )}>
        <Sparkles className="w-4 h-4" />
        {tieneDoc ? "Extraer datos con IA" : "Sube un documento para usar IA"}
      </button>

      {/* Proveedor / Cliente + Orden de compra */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <FormField
          control={form.control}
          name="material_proveedor_cliente"
          render={({ field }) => (
            <FormItem>
              <FieldLabel ia>Proveedor / Cliente</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Extraído del documento..."
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
          name="material_orden_compra"
          render={({ field }) => (
            <FormItem>
              <FieldLabel ia>Orden de compra</FieldLabel>
              <FormControl>
                <Input
                  placeholder="Extraído del documento..."
                  className="rounded-xl border-gray-200 bg-gray-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Tabla de contenedores / materiales */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          Contenedores / Materiales
          <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5" /> IA
          </span>
        </p>
        <div className="rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {(
                  [
                    "Contenedor",
                    "Sello",
                    "Tipo",
                    "Cantidad",
                    "Peso",
                    "Volumen",
                  ] as const
                ).map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {materialItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 last:border-0 group">
                  {(
                    [
                      { field: "contenedor", placeholder: "CRLU1357272" },
                      { field: "sello", placeholder: "1905481" },
                      { field: "tipo", placeholder: "40HR" },
                      { field: "cantidad", placeholder: "1,980 cartones" },
                      { field: "peso", placeholder: "25,140.5 kg" },
                      { field: "volumen", placeholder: "44.65 m³" },
                    ] as {
                      field: keyof Omit<MaterialItem, "id">;
                      placeholder: string;
                    }[]
                  ).map(({ field, placeholder }) => (
                    <td key={field} className="px-3 py-2">
                      <input
                        value={item[field]}
                        onChange={(e) =>
                          onChangeMaterialItem(item.id, field, e.target.value)
                        }
                        placeholder={placeholder}
                        className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-300 outline-none min-w-[80px]"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    {materialItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveMaterialItem(item.id)}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={onAddMaterialItem}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-200 text-xs font-medium text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all">
          <Plus className="w-3.5 h-3.5" />
          Agregar fila
        </button>
      </div>
    </Section>
  );
}

function SeccionLugarRecoleccion({
  form,
  defaultCountry = "MX",
  proveedores = [],
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  defaultCountry?: string;
  proveedores?: { nombre: string; direccion: string }[];
}) {
  const lugarSeleccionado = form.watch("lugar_reco_lugar");
  const esNuevo = form.watch("lugar_reco_es_nuevo") ?? false;

  React.useEffect(() => {
    const proveedor = proveedores.find((p) => p.nombre === lugarSeleccionado);
    if (proveedor) {
      form.setValue("lugar_reco_direccion", proveedor.direccion);
    } else if (!lugarSeleccionado) {
      form.setValue("lugar_reco_direccion", "");
    }
  }, [lugarSeleccionado, proveedores, form]);

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
          <FormField
            control={form.control}
            name="lugar_reco_lugar"
            render={({ field }) => (
              <FormItem>
                <FieldLabel required>Lugar</FieldLabel>
                <FormControl>
                  <CreatableComboboxField
                    value={field.value ?? ""}
                    isNuevo={esNuevo}
                    onSelect={(v, isNuevo) => {
                      field.onChange(v);
                      form.setValue("lugar_reco_es_nuevo", isNuevo);
                    }}
                    options={proveedores.map((p) => p.nombre)}
                    placeholder="Buscar o escribir proveedor..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lugar_reco_direccion"
            render={({ field }) => (
              <FormItem>
                <FieldLabel required>Dirección</FieldLabel>
                <FormControl>
                  <Input
                    placeholder="Calle, ciudad, estado"
                    className="rounded-xl border-gray-200 bg-gray-50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fecha, horario, andén */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="lugar_reco_fecha"
            render={({ field }) => (
              <FormItem>
                <FieldLabel required>Fecha</FieldLabel>
                <FormControl>
                  <FechaEsInput
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lugar_reco_horario"
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Horario</FieldLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {HORARIOS_SIMPLES.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
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
            name="lugar_reco_anden"
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Andén</FieldLabel>
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

        {/* Proveedor de transporte */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Proveedor de transporte{" "}
            <span className="text-gray-400 lowercase font-normal">
              (recibirá el pase)
            </span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="transporte_responsable"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel required>Responsable</FieldLabel>
                  <FormControl>
                    <Input
                      placeholder="Contacto en transportista"
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
              name="transporte_email"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel required>Email</FieldLabel>
                  <FormControl>
                    <Input
                      placeholder="transportista@empresa.com"
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
              name="transporte_telefono"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>Teléfono</FieldLabel>
                  <FormControl>
                    <PhoneInput
                      {...field}
                      onChange={(v) => field.onChange(v ?? "")}
                      placeholder="Teléfono"
                      defaultCountry={defaultCountry as any}
                      containerComponentProps={{
                        className:
                          "flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-3 py-0 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 md:text-sm",
                      }}
                      numberInputProps={{ className: "pl-3 bg-transparent" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function ComboboxField({
  value,
  onChange,
  options,
  placeholder = "Buscar...",
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtrados = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const limpiar = () => {
    onChange("");
    setQuery("");
  };

  return value ? (
    <div className="flex items-center justify-between gap-2 h-10 px-3 rounded-xl border border-blue-200 bg-blue-50 text-sm">
      <span className="truncate text-gray-700 font-medium">{value}</span>
      <button
        type="button"
        onClick={limpiar}
        className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  ) : (
    <div className="relative">
      <div
        className={cn(
          "flex items-center gap-2 px-3 h-10 rounded-xl border border-gray-200 bg-gray-50 transition-all",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-200",
        )}>
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={
            disabled ? "Selecciona una ubicación primero" : placeholder
          }
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none disabled:cursor-not-allowed"
        />
      </div>
      {open && !disabled && filtrados.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtrados.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onMouseDown={() => {
                    onChange(o);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors truncate">
                  {o}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CreatableComboboxField({
  value,
  isNuevo,
  onSelect,
  options,
  placeholder = "Buscar o escribir...",
}: {
  value: string;
  isNuevo: boolean;
  onSelect: (value: string, isNuevo: boolean) => void;
  options: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtrados = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const exactMatch = options.some(
    (o) => o.toLowerCase() === query.trim().toLowerCase(),
  );

  const limpiar = () => {
    onSelect("", false);
    setQuery("");
  };

  return value ? (
    <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-blue-200 bg-blue-50 text-sm">
      <span className="truncate text-gray-700 font-medium flex-1">{value}</span>
      {isNuevo && (
        <span className="shrink-0 text-[9px] font-bold bg-amber-100 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
          Nuevo
        </span>
      )}
      <button
        type="button"
        onClick={limpiar}
        className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  ) : (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-200 transition-all">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtrados.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onMouseDown={() => { onSelect(o, false); setQuery(""); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors truncate">
                  {o}
                </button>
              </li>
            ))}
            {query.trim() && !exactMatch && (
              <li>
                <button
                  type="button"
                  onMouseDown={() => { onSelect(query.trim(), true); setQuery(""); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  Agregar &ldquo;{query.trim()}&rdquo;
                </button>
              </li>
            )}
            {filtrados.length === 0 && !query.trim() && (
              <li className="px-3 py-2 text-xs text-gray-400 italic">Sin opciones</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function FechaEsInput({
  value,
  onChange,
  onDayChange,
  minValue,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  onDayChange?: (dayIndex: number) => void;
  minValue?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  const date = value ? new Date(value + "T12:00:00") : undefined;
  const minDate = minValue ? new Date(minValue + "T12:00:00") : undefined;

  const displayLabel = date
    ? (() => {
        const f = format(date, "MMMM d, yyyy", { locale: es });
        return f.charAt(0).toUpperCase() + f.slice(1);
      })()
    : (label ?? "Selecciona una fecha");

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    onChange(format(day, "yyyy-MM-dd"));
    if (onDayChange) {
      // JS: 0=Dom → API 6, JS 1=Lun → API 0, etc.
      onDayChange((day.getDay() + 6) % 7);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm transition-colors hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 text-left",
            date ? "text-gray-700" : "text-gray-400",
          )}>
          <CalendarDays className="w-4 h-4 shrink-0 text-gray-400" />
          <span className="truncate">{displayLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
        align="start"
        sideOffset={6}>
        <DayPicker
          mode="single"
          selected={date}
          onSelect={handleSelect}
          locale={es}
          disabled={minDate ? { before: minDate } : undefined}
          classNames={{
            months: "flex flex-col",
            month: "space-y-2",
            caption: "flex justify-center items-center relative px-7 mb-1 pt-3",
            caption_label: "text-xs font-semibold text-slate-700 capitalize",
            nav: "flex items-center gap-1",
            nav_button: cn(
              "h-6 w-6 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors",
            ),
            nav_button_previous: "absolute left-2",
            nav_button_next: "absolute right-2",
            table: "w-full border-collapse px-3 pb-3",
            head_row: "flex",
            head_cell:
              "text-slate-400 text-[10px] font-medium w-8 text-center pb-1",
            row: "flex mt-0.5",
            cell: "relative p-0 text-center text-xs w-8 h-8 focus-within:relative focus-within:z-20",
            day: "h-8 w-8 rounded-full font-normal text-xs flex items-center justify-center hover:bg-blue-50 hover:text-blue-700 transition-colors",
            day_selected:
              "bg-blue-600 text-white hover:bg-blue-700 hover:text-white font-semibold",
            day_today: "border-2 border-blue-400 font-semibold text-blue-600",
            day_disabled:
              "text-slate-200 cursor-not-allowed hover:bg-transparent hover:text-slate-200",
            day_outside: "text-slate-300",
          }}
        />
      </PopoverContent>
    </Popover>
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

function SeccionProgramacion({
  form,
  title = "Lugar de entrega / recepción",
  andenLabel = "Andén (OPCIONAL)",
  horarios = [],
  diaIndex = 0,
  onDiaChange,
  isLoadingHorarios = false,
  andenes = [],
  isLoadingAndenes = false,
  locations = [],
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
  locations?: string[];
}) {
  const [usarRango, setUsarRango] = useState(false);
  const [usarHorario, setUsarHorario] = useState(false);

  const ubicacion = form.watch("ubicacion");

  const { data: locationData, isFetching: isFetchingLocation } = useQuery({
    queryKey: ["getLocationData", ubicacion],
    queryFn: () => getLocationData(ubicacion!),
    enabled: !!ubicacion,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 30,
  });

  React.useEffect(() => {
    if (!ubicacion) {
      form.setValue("direccion_lugar", "");
      form.setValue("area", "");
    }
  }, [ubicacion, form]);

  React.useEffect(() => {
    if (!locationData?.response?.data) return;
    const d = locationData.response.data;
    if (d.direccion) form.setValue("direccion_lugar", d.direccion);
    form.setValue("area", "");
  }, [locationData, form]);

  const locationAreas: string[] = locationData?.response?.data?.areas ?? [];
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
        {/* Ubicación, dirección y área */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="ubicacion"
            render={({ field }) => (
              <FormItem>
                <FieldLabel required>Ubicación</FieldLabel>
                <FormControl>
                  <ComboboxField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    options={locations}
                    placeholder="Buscar ubicación..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="direccion_lugar"
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Dirección</FieldLabel>
                <FormControl>
                  <Input
                    placeholder={
                      isFetchingLocation
                        ? "Buscando..."
                        : "Av. Industrial 420, Monterrey"
                    }
                    disabled={isFetchingLocation}
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
            name="area"
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Área</FieldLabel>
                <FormControl>
                  <ComboboxField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    options={locationAreas}
                    placeholder={
                      isFetchingLocation ? "Buscando..." : "Buscar área..."
                    }
                    disabled={isFetchingLocation || locationAreas.length === 0}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fecha con toggle */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Fecha
            </p>
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <span>Rango de fechas</span>
              <Switch
                checked={usarRango}
                onCheckedChange={(c) => {
                  setUsarRango(c);
                  if (!c) form.setValue("fecha_pase_transportista_hasta", "");
                }}
                className="data-[state=checked]:bg-blue-600"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fecha_pase_transportista_desde"
              render={({ field }) => (
                <FormItem>
                  {usarRango && <FieldLabel required>Desde</FieldLabel>}
                  <FormControl>
                    <FechaEsInput
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onDayChange={onDiaChange}
                      label="Selecciona una fecha"
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
                      <FechaEsInput
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        minValue={form.watch("fecha_pase_transportista_desde")}
                        label="Selecciona una fecha"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Horario con toggle */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Horario
            </p>
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <span>Habilitar horario</span>
              <Switch
                checked={usarHorario}
                onCheckedChange={(c) => {
                  setUsarHorario(c);
                  if (!c) form.setValue("horario", "");
                }}
                className="data-[state=checked]:bg-blue-600"
              />
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
                  <HorariosConcurrenciaChart
                    horarios={horarios}
                    diaIndex={diaIndex}
                    onDiaChange={onDiaChange ?? (() => {})}
                    isLoading={isLoadingHorarios}
                    slots={slots}
                    selectedSlot={form.watch("horario") ?? ""}
                    onSlotSelect={(slot) => form.setValue("horario", slot)}
                  />
                )}
              </div>
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

        {/* Andén */}
        <FormField
          control={form.control}
          name="anden"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>{andenLabel}</FieldLabel>
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
                    {andenes.map((a) => (
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
    </div>
  );
}

function SeccionGenerarPase({
  tipo,
  onEnviar,
  isPending,
}: {
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
        {config.botones.map(({ label, primary }) =>
          label === "Vista previa" ? (
            <Button
              key={label}
              type="button"
              variant="outline"
              className="rounded-full border-gray-200 text-gray-600 gap-2">
              <Eye className="w-4 h-4" /> {label}
            </Button>
          ) : primary ? (
            <Button
              key={label}
              type="button"
              disabled={isPending}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={onEnviar}>
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> {label}
                </>
              )}
            </Button>
          ) : (
            <Button
              key={label}
              type="button"
              variant="outline"
              className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 gap-2">
              <Send className="w-4 h-4" /> {label}
            </Button>
          ),
        )}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

const PaseEntradaTransportistaPage = () => {
  const { uploadImageMutation } = useUploadImage();
  const { mutate: crearPase, isPending } = useCreatePaseTransportista();
  const [modalPayload, setModalPayload] = useState<Record<string, any> | null>(
    null,
  );
  const [successData, setSuccessData] = useState<{
    id: string;
    folio: string;
  } | null>(null);
  const [diaIndex, setDiaIndex] = useState(0);

  const emptyDoc = (): Documento => ({
    id: crypto.randomUUID(),
    tipo: "",
    no_doc: "",
    archivo: null,
    file_name: "",
    file_url: "",
    uploading: false,
  });
  const [documentos, setDocumentos] = useState<Documento[]>([emptyDoc()]);

  const handleChangeDocField = (id: string, field: "tipo" | "no_doc", value: string) =>
    setDocumentos((p) => p.map((d) => (d.id === id ? { ...d, [field]: value } : d)));

  const emptyMaterialItem = (): MaterialItem => ({
    id: crypto.randomUUID(),
    contenedor: "",
    sello: "",
    tipo: "",
    cantidad: "",
    peso: "",
    volumen: "",
  });
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([
    emptyMaterialItem(),
  ]);
  const handleAddMaterialItem = () =>
    setMaterialItems((p) => [...p, emptyMaterialItem()]);
  const handleRemoveMaterialItem = (id: string) =>
    setMaterialItems((p) => p.filter((m) => m.id !== id));
  const handleChangeMaterialItem = (
    id: string,
    field: keyof Omit<MaterialItem, "id">,
    value: string,
  ) =>
    setMaterialItems((p) =>
      p.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );

  const handleRemoveDoc = (id: string) =>
    setDocumentos((p) => p.filter((d) => d.id !== id));
  const handleArchivoDoc = async (id: string, file: File) => {
    setDocumentos((p) =>
      p.map((d) =>
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
      setDocumentos((p) =>
        p.map((d) =>
          d.id === id
            ? {
                ...d,
                file_name: (result?.file_name ?? file.name).replace(/ /g, "_"),
                file_url: result?.file_url ?? "",
                uploading: false,
              }
            : d,
        ),
      );
    } catch {
      setDocumentos((p) =>
        p.map((d) => (d.id === id ? { ...d, uploading: false } : d)),
      );
    }
  };

  const { locations, fetchLocations } = useAreasLocationStore();
  React.useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const { selectedLocations } = useSelectedLocationsStore();
  const primeraLocation = selectedLocations[0] ?? "";

  const { grupoRequisitos } = useMenuStore();
  const grupoReq = grupoRequisitos.find((g) => g.ubicacion === primeraLocation);
  const defaultCountry = prefijoToCountry(grupoReq?.prefijo_telefonico);

  const { data: usersData } = useQuery({
    queryKey: ["getUsersDataTransportista", primeraLocation],
    queryFn: () => getUsersDataTransportista(primeraLocation || undefined),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  });

  const empleados: {
    nombre: string;
    email: string | null;
    telefono: string | null;
  }[] = usersData?.response?.data ?? [];

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

  const { data: proveedoresData } = useQuery({
    queryKey: ["getProveedoresTransportista"],
    queryFn: getProveedoresTransportista,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 30,
  });
  const proveedores: { nombre: string; direccion: string }[] =
    proveedoresData?.response?.data ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_operacion: "entrega_materia_prima",
      crea_el_pase_nombre: "",
      crea_el_pase_email: "",
      crea_el_pase_telefono: "",
      recibe_el_pase_nombre: "",
      recibe_el_pase_email: "",
      recibe_el_pase_telefono: "",
      material_proveedor_cliente: "",
      material_orden_compra: "",
      ubicacion: "",
      direccion_lugar: "",
      fecha_pase_transportista_desde: "",
      fecha_pase_transportista_hasta: "",
      horario: "",
      anden: "",
      area: "",
      lugar_reco_lugar: "",
      lugar_reco_es_nuevo: false,
      lugar_reco_direccion: "",
      lugar_reco_fecha: "",
      lugar_reco_horario: "",
      lugar_reco_anden: "",
      transporte_responsable: "",
      transporte_email: "",
      transporte_telefono: "",
      metodo_embarque: "",
      incoterm: "",
    },
  });

  const tipoOperacion = form.watch("tipo_operacion");
  const tieneRecoleccion = [
    "recoleccion_materia_prima",
    "entrega_producto_terminado",
  ].includes(tipoOperacion);

  React.useEffect(() => {
    if (primeraLocation && !form.getValues("ubicacion")) {
      form.setValue("ubicacion", primeraLocation);
    }
  }, [primeraLocation, form]);

  const buildPayload = (data: FormValues) => ({
    tipo_de_operacion: TIPO_OPERACION_LABEL[data.tipo_operacion],
    creado_desde: "pase_de_entrada_web",
    dominio: typeof window !== "undefined" ? window.location.origin : "",
    crea_el_pase: {
      nombre: data.crea_el_pase_nombre,
      email: data.crea_el_pase_email,
      telefono: data.crea_el_pase_telefono || null,
      es_nuevo: data.crea_el_pase_es_nuevo ?? false,
    },
    recibe_el_pase: {
      nombre: data.recibe_el_pase_nombre || null,
      email: data.recibe_el_pase_email || null,
      telefono: data.recibe_el_pase_telefono || null,
    },
    material: {
      proveedor_cliente: data.material_proveedor_cliente || null,
      orden_compra: data.material_orden_compra || null,
      items: materialItems
        .filter(
          (m) =>
            m.contenedor ||
            m.sello ||
            m.tipo ||
            m.cantidad ||
            m.peso ||
            m.volumen,
        )
        .map((m) => ({
          contenedor: m.contenedor || null,
          sello: m.sello || null,
          tipo: m.tipo || null,
          cantidad: m.cantidad || null,
          peso: m.peso || null,
          volumen: m.volumen || null,
        })),
      documentos: documentos
        .filter((d) => d.file_url)
        .map((d) => ({ file_name: d.file_name, file_url: d.file_url })),
    },
    lugar_entrega_recepcion: {
      ubicacion: data.ubicacion || null,
      direccion: data.direccion_lugar || null,
      fecha_pase_transportista_desde:
        data.fecha_pase_transportista_desde || null,
      ...(data.fecha_pase_transportista_hasta && {
        fecha_pase_transportista_hasta: data.fecha_pase_transportista_hasta,
      }),
      horario_disponible: data.horario || null,
      anden: data.anden || null,
      area: data.area || null,
    },
    ...(tieneRecoleccion && {
      lugar_recoleccion: {
        lugar: data.lugar_reco_lugar || null,
        es_nuevo: data.lugar_reco_es_nuevo ?? false,
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

  const programacionProps = {
    form,
    horarios,
    diaIndex,
    onDiaChange: setDiaIndex,
    isLoadingHorarios,
    andenes,
    isLoadingAndenes,
    locations,
  };

  return (
    <div className="min-h-screen bg-gray-100 py-5 px-4">
      <ConfirmPaseTransportistaModal
        open={!!modalPayload}
        onClose={() => setModalPayload(null)}
        onConfirm={() => {
          crearPase(modalPayload, {
            onSuccess: (result) => {
              setModalPayload(null);
              if (result?.id)
                setSuccessData({ id: result.id, folio: result.folio });
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
              <h1 className="font-bold text-2xl text-gray-800">
                Pase de entrada — Transportista
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Registra el ingreso de un vehículo de carga
              </p>
            </div>

            {/* Tipo de operación */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Tipo de operación
              </p>
              <FormField
                control={form.control}
                name="tipo_operacion"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 gap-2">
                      {TIPOS_OPERACION.map(
                        ({ value, label, description, icon: Icon, tags }) => {
                          const isSelected = field.value === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => field.onChange(value)}
                              className={cn(
                                "text-left p-4 rounded-xl border-2 transition-all duration-150",
                                isSelected
                                  ? "border-teal-500 bg-teal-50/50"
                                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                              )}>
                              <div className="flex items-start gap-3">
                                <Icon
                                  className={cn(
                                    "w-5 h-5 mt-0.5 shrink-0",
                                    isSelected
                                      ? "text-teal-600"
                                      : "text-gray-400",
                                  )}
                                />
                                <div className="min-w-0">
                                  <p
                                    className={cn(
                                      "font-semibold text-sm leading-snug",
                                      isSelected
                                        ? "text-teal-700"
                                        : "text-gray-700",
                                    )}>
                                    {label}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                                    {description}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
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

            {/* Quien recibe */}
            <SeccionQuienRecibe form={form} empleados={empleados} defaultCountry={defaultCountry} />

            {/* Segunda persona */}
            <SeccionSegundaPersona form={form} tipo={tipoOperacion} defaultCountry={defaultCountry} />

            {/* Material */}
            <SeccionMaterial
              form={form}
              documentos={documentos}
              onRemoveDoc={handleRemoveDoc}
              onArchivoDoc={handleArchivoDoc}
              onAddDoc={() => setDocumentos((p) => [...p, emptyDoc()])}
              onChangeDocField={handleChangeDocField}
              materialItems={materialItems}
              onAddMaterialItem={handleAddMaterialItem}
              onRemoveMaterialItem={handleRemoveMaterialItem}
              onChangeMaterialItem={handleChangeMaterialItem}
            />

            {/* Lugar de recolección (tipos 2 y 3) */}
            {tieneRecoleccion && <SeccionLugarRecoleccion form={form} defaultCountry={defaultCountry} proveedores={proveedores} />}

            {/* Lugar de entrega / recepción */}
            <SeccionProgramacion {...programacionProps} />

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
