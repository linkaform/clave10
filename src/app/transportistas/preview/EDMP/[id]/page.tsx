"use client";

import { use, useState } from "react";
import {
  FileText, Download, Share2, Send, Clock, QrCode, Copy, Check, X,
  Loader2, MapPin, Building2, User, Truck, Package, Camera, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getPassTransportista, generateSubmitTokenTransportista } from "@/services/endpoints";
import { cn } from "@/lib/utils";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useMenuStore } from "@/store/useGetMenuStore";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  pendiente:  { label: "Pendiente",  className: "text-amber-600 bg-amber-50 border-amber-200" },
  confirmado: { label: "Confirmado", className: "text-green-600 bg-green-50 border-green-200" },
  rechazado:  { label: "Rechazado",  className: "text-red-600 bg-red-50 border-red-200" },
  en_camino:  { label: "En camino",  className: "text-blue-600 bg-blue-50 border-blue-200" },
};

const TIPO_LABEL: Record<string, string> = {
  entrega_de_materia_prima:          "Entrega de material",
  recoleccion_de_materia_prima:      "Recolección de material",
  entrega_de_producto_terminado:     "Entrega de producto terminado",
  recoleccion_de_producto_terminado: "Recolección de producto terminado",
};

const SEGUNDA_PERSONA_TITULO: Record<string, string> = {
  entrega_de_materia_prima:          "Quien envía",
  recoleccion_de_materia_prima:      "Proveedor origen",
  entrega_de_producto_terminado:     "Cliente destino",
  recoleccion_de_producto_terminado: "Cliente",
};

function formatFecha(desde?: string, hasta?: string) {
  if (!desde) return null;
  const fmt = (s: string) =>
    new Date(s + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  return hasta && hasta !== desde ? `${fmt(desde)} – ${fmt(hasta)}` : fmt(desde);
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{label}</span>
      <span className={value ? "text-xs font-semibold text-gray-800 leading-snug" : "text-xs text-blue-300 italic"}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function InfoCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0">
          <Icon className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{title}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">{children}</div>
    </div>
  );
}

function IaBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
      <Sparkles className="w-2.5 h-2.5" /> IA
    </span>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text", ia }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  ia?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
        {label}{ia && <IaBadge />}
      </p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-300 transition"
      />
    </div>
  );
}

function PhotoField({ label, required, ia }: { label: string; required?: boolean; ia?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
        {required && <span className="text-red-400 mr-0.5">*</span>}{label}{ia && <IaBadge />}
      </p>
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
        <Camera className="w-4 h-4" />
        Tomar foto o subir imagen
      </button>
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function PaseEntradaPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["getPassTransportista", id],
    queryFn: () => getPassTransportista(id),
    refetchOnWindowFocus: false,
    enabled: !!id,
  });

  const { grupoRequisitos } = useMenuStore();
  const { selectedLocations } = useSelectedLocationsStore();

  const PHONE_PREFIX_TO_COUNTRY: Record<number, string> = { 1: "US", 52: "MX", 34: "ES", 57: "CO", 55: "BR", 54: "AR", 56: "CL" };
  const primeraLocation = selectedLocations?.[0];
  const grupoReq        = grupoRequisitos.find((g) => g.ubicacion === primeraLocation);
  const defaultCountry  = (grupoReq?.prefijo_telefonico != null && PHONE_PREFIX_TO_COUNTRY[grupoReq.prefijo_telefonico]) || "MX";

  // Modal reenviar
  const [reenviarOpen, setReenviarOpen] = useState(false);
  const [copiedMsg, setCopiedMsg]       = useState(false);
  const [submitToken, setSubmitToken]   = useState<string | null>(null);
  const [envioNombre,   setEnvioNombre]   = useState("");
  const [envioCorreo,   setEnvioCorreo]   = useState("");
  const [envioTelefono, setEnvioTelefono] = useState<string | undefined>(undefined);

  // Form de complementación
  const [form, setForm] = useState({
    // Conductor
    conductorNombre:    "",
    conductorLicencia:  "",
    conductorExpedicion: "",
    conductorVigencia:  "",
    // Vehículo
    vehiculoLinea:     "",
    vehiculoTipo:      "",
    vehiculoMarca:     "",
    vehiculoModelo:    "",
    vehiculoAño:       "",
    vehiculoPlacas:    "",
    vehiculoEconomico: "",
    vehiculoNIV:       "",
    // Contenedor (pendiente de back)
    contenedorNumero: "",
    contenedorSello:  "",
    contenedorTipo:   "",
  });
  const setField = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const d = rawData?.response?.data;

  const { mutate: generarToken, isPending: generandoToken } = useMutation({
    mutationFn: () => generateSubmitTokenTransportista(d?._id),
    onSuccess: (res) => {
      const token = res?.response?.data?.token;
      if (token) setSubmitToken(token);
    },
  });

  const submitUrl = (d?._id && typeof window !== "undefined")
    ? `${window.location.origin}/transportistas/submit/EDMP/${d._id}`
    : null;

  const submitMessage = submitUrl && submitToken
    ? `👋 Hola, te comparto tu pase de entrada.\n\n🔗 Enlace de acceso:\n${submitUrl}\n\n🔑 Tu código de acceso:\n${submitToken}\n\n✅ Abre el enlace e ingresa el código cuando te lo soliciten.`
    : null;

  const handleOpenReenviar = () => { setReenviarOpen(true); if (!submitToken) generarToken(); };
  const handleCopyMsg = async () => {
    if (!submitMessage) return;
    await navigator.clipboard.writeText(submitMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };
  const handleEnviarCorreo = () => { /* TODO: conectar endpoint */ };
  const handleEnviarSms    = () => { /* TODO: conectar endpoint */ };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!d) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-400">No se encontró el pase.</p>
    </div>
  );

  const qrUrl     = d.qr?.[0]?.file_url ?? null;
  const tipoLabel = TIPO_LABEL[d.tipo_de_operacion] ?? d.tipo_de_operacion;
  const horario   = d.hora_inicial && d.hora_final
    ? `${d.hora_inicial.slice(0, 5)} – ${d.hora_final.slice(0, 5)}`
    : null;
  const horarioRecoleccion = d.hora_inicial_recoleccion && d.hora_final_recoleccion
    ? `${d.hora_inicial_recoleccion.slice(0, 5)} – ${d.hora_final_recoleccion.slice(0, 5)}`
    : null;

  const documentos: { file_name: string; file_url: string }[] = d.documentos ?? [];
  const materiales: Record<string, any>[]                     = d.materiales ?? [];

  const MATERIAL_COLS = [
    { key: "contenedor", label: "Contenedor" },
    { key: "sello",      label: "Sello" },
    { key: "tipo",       label: "Tipo" },
    { key: "cantidad",   label: "Cantidad" },
    { key: "peso",       label: "Peso" },
    { key: "volumen",    label: "Volumen" },
  ];
  const colsConDatos = MATERIAL_COLS.filter((c) =>
    materiales.some((row) => row[c.key] != null && row[c.key] !== ""),
  );

  const estadoConfig = d.estado_transportista
    ? (ESTADO_CONFIG[d.estado_transportista] ?? { label: d.estado_transportista, className: "text-gray-600 bg-gray-50 border-gray-200" })
    : null;

  const segundaPersonaLabel = SEGUNDA_PERSONA_TITULO[d.tipo_de_operacion] ?? "Contacto";

  const fechaEntrega = formatFecha(d.fecha_desde, d.fecha_hasta);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="w-full max-w-4xl mx-auto space-y-5">

        {/* Marca + título */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">K</div>
          <span className="text-sm text-gray-500">Clave10 <span className="text-gray-300">·</span> Pase de entrada</span>
          {estadoConfig && (
            <span className={`ml-auto inline-flex items-center gap-1.5 text-xs font-semibold border px-2.5 py-1 rounded-full ${estadoConfig.className}`}>
              <Clock className="w-3 h-3" />
              {estadoConfig.label}
            </span>
          )}
        </div>

        <div className="px-1">
          <h1 className="text-xl font-bold text-gray-800">{tipoLabel}</h1>
          {(d.ubicacion || horario) && (
            <p className="text-sm text-gray-400 mt-0.5">
              {d.ubicacion}{horario ? ` · ${horario}` : ""}
            </p>
          )}
        </div>

        {/* ── Layout principal: info + sidebar ── */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">

          {/* Columna izquierda: cards de info */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* 2x2 info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Lugar de recolección */}
              <InfoCard title="Lugar de recolección" icon={Truck}>
                <InfoRow label="Lugar"       value={d.lugar_recoleccion} />
                <InfoRow label="Dirección"   value={d.direccion_recoleccion} />
                <InfoRow label="Fecha"       value={d.fecha_recoleccion} />
                <InfoRow label="Horario"     value={horarioRecoleccion} />
                <InfoRow label="Andén"       value={d.anden_recoleccion} />
                <InfoRow label="Responsable" value={d.responsable} />
              </InfoCard>

              {/* Lugar de entrega / recepción */}
              <InfoCard title="Lugar de entrega / recepción" icon={MapPin}>
                <InfoRow label="Ubicación"   value={d.ubicacion} />
                <InfoRow label="Dirección"   value={d.direccion} />
                <InfoRow label="Fecha"       value={fechaEntrega} />
                <InfoRow label="Horario"     value={horario} />
                <InfoRow label="Andén"       value={d.anden} />
              </InfoCard>

              {/* Segunda persona (proveedor / cliente) */}
              <InfoCard title={segundaPersonaLabel} icon={Building2}>
                <InfoRow label="Nombre"   value={d.proveedor} />
                <InfoRow label="Email"    value={d.proveedor_email} />
                <InfoRow label="Teléfono" value={d.proveedor_telefono} />
              </InfoCard>

              {/* Quien recibe */}
              <InfoCard title="Quien recibe" icon={User}>
                <InfoRow label="Nombre"   value={d.nombre_crea_el_pase} />
                <InfoRow label="Email"    value={d.email_crea_el_pase} />
                <InfoRow label="Teléfono" value={d.telefono_crea_el_pase} />
              </InfoCard>
            </div>

            {/* Tabla de materiales */}
            {colsConDatos.length > 0 && materiales.length > 0 && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">
                  Materiales
                  {d.proveedor_cliente_material && (
                    <span className="ml-2 normal-case font-normal text-blue-400">— {d.proveedor_cliente_material}</span>
                  )}
                  {d.orden_de_compra && (
                    <span className="ml-2 normal-case font-normal text-blue-400">OC {d.orden_de_compra}</span>
                  )}
                </p>
                <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-blue-50 bg-blue-50/80">
                        {colsConDatos.map((c) => (
                          <th key={c.key} className="text-left px-3 py-2 text-[10px] font-bold text-blue-400 uppercase tracking-wide whitespace-nowrap">
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {materiales.map((row, i) => (
                        <tr key={i} className="border-b border-blue-50/60 last:border-0">
                          {colsConDatos.map((c) => (
                            <td key={c.key} className="px-3 py-2 text-gray-700 font-medium whitespace-nowrap">
                              {row[c.key] ?? <span className="text-gray-300">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Documentos dentro del card de materiales */}
                {documentos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {documentos.map((doc, i) => (
                      <a key={i} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-white border border-blue-100 rounded-lg px-2.5 py-1.5 hover:border-blue-300 transition-colors">
                        <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="text-[11px] text-gray-600 truncate max-w-[160px]">{doc.file_name}</span>
                        <Download className="w-3 h-3 text-blue-300 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: QR + acciones */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-4 h-full">

              {/* Datos del pase */}
              <div className="w-full space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Datos del pase</p>
                {[
                  { label: "Fecha creación", value: d.created_at ?? null },
                  { label: "Folio",          value: d.folio ?? null },
                  { label: "Planta",         value: d.ubicacion ?? null },
                  { label: "Destino",        value: d.direccion ?? null },
                  { label: "Fecha",          value: fechaEntrega ? `${fechaEntrega}${horario ? `, ${horario}` : ""}` : (horario ?? null) },
                  { label: "Andén",          value: d.anden ?? null },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-baseline justify-between gap-2 py-1 border-b border-gray-50 last:border-0">
                    <span className="text-[11px] text-gray-400 shrink-0">{label}</span>
                    <span className={cn("text-[11px] font-semibold text-right", value ? "text-gray-700" : "text-gray-300 italic")}>
                      {value ?? "—"}
                    </span>
                  </div>
                ))}
              </div>

              {/* QR */}
              <div className="w-44 h-44 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="QR pase" className="w-full h-full object-cover" />
                ) : (
                  <QrCode className="w-16 h-16 text-gray-200" />
                )}
              </div>

              {/* Acciones */}
              <div className="w-full space-y-2">
                <button type="button" onClick={handleOpenReenviar}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-blue-200 text-blue-600 text-xs font-semibold hover:bg-blue-50 transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> Compartir
                </button>
                <button type="button" disabled
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-gray-200 text-gray-400 text-xs font-semibold cursor-not-allowed">
                  <Download className="w-3.5 h-3.5" /> Descargar pase
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sección de complementación ── */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
            Complementar información
          </p>
          {/* Fila 1: Conductor + Contenedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Conductor */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">Conductor</p>
              </div>
              <PhotoField label="Foto de licencia" required />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Nombre" value={form.conductorNombre} onChange={(v) => setField("conductorNombre", v)} placeholder="Extraído de licencia..." ia />
                <FormField label="No. de licencia" value={form.conductorLicencia} onChange={(v) => setField("conductorLicencia", v)} placeholder="Extraído de licencia..." ia />
                <FormField label="Lugar de expedición" value={form.conductorExpedicion} onChange={(v) => setField("conductorExpedicion", v)} placeholder="Extraído de licencia..." ia />
                <FormField label="Vigencia" type="date" value={form.conductorVigencia} onChange={(v) => setField("conductorVigencia", v)} ia />
              </div>
            </div>

            {/* Contenedor */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <Package className="w-4 h-4 text-amber-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">Contenedor</p>
              </div>
              <PhotoField label="Foto del contenedor" />
              <div className="grid grid-cols-2 gap-3">
                {/* TODO: confirmar con back qué campos van aquí */}
                <FormField label="No. contenedor" value={form.contenedorNumero} onChange={(v) => setField("contenedorNumero", v)} placeholder="TODO: confirmar campo" ia />
                <FormField label="Sello" value={form.contenedorSello} onChange={(v) => setField("contenedorSello", v)} placeholder="TODO: confirmar campo" ia />
                <FormField label="Tipo" value={form.contenedorTipo} onChange={(v) => setField("contenedorTipo", v)} placeholder="TODO: confirmar campo" ia />
              </div>
            </div>
          </div>

          {/* Fila 2: Vehículo (ancho completo) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 rounded-xl">
                <Truck className="w-4 h-4 text-teal-600" />
              </div>
              <p className="font-semibold text-gray-800 text-sm">Vehículo</p>
            </div>
            <PhotoField label="Tarjeta de circulación" required />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField label="Línea" value={form.vehiculoLinea} onChange={(v) => setField("vehiculoLinea", v)} placeholder="Extraído de tarjeta..." ia />
              <FormField label="Tipo de unidad" value={form.vehiculoTipo} onChange={(v) => setField("vehiculoTipo", v)} placeholder="Extraído de tarjeta..." ia />
              <FormField label="Marca" value={form.vehiculoMarca} onChange={(v) => setField("vehiculoMarca", v)} placeholder="Extraído de tarjeta..." ia />
              <FormField label="Modelo" value={form.vehiculoModelo} onChange={(v) => setField("vehiculoModelo", v)} placeholder="Extraído de tarjeta..." ia />
              <FormField label="Año" value={form.vehiculoAño} onChange={(v) => setField("vehiculoAño", v)} placeholder="Extraído de tarjeta..." ia />
              <FormField label="Placas" value={form.vehiculoPlacas} onChange={(v) => setField("vehiculoPlacas", v)} placeholder="Extraído de tarjeta..." ia />
              <FormField label="No. económico" value={form.vehiculoEconomico} onChange={(v) => setField("vehiculoEconomico", v)} placeholder="Extraído de tarjeta..." ia />
              <FormField label="NIV" value={form.vehiculoNIV} onChange={(v) => setField("vehiculoNIV", v)} placeholder="Extraído de tarjeta..." ia />
            </div>
          </div>

          {/* Botón guardar (stub) */}
          <div className="mt-4 flex justify-end">
            <Button disabled className="rounded-xl bg-blue-600 text-white px-6 cursor-not-allowed opacity-50">
              Guardar información {/* TODO: conectar endpoint de guardado */}
            </Button>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-300 pb-4">
          Clave10 · Pase #{id.slice(-8).toUpperCase()}
        </p>
      </div>

      {/* ── Modal reenviar ── */}
      {reenviarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReenviarOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <Send className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">Compartir pase</p>
              </div>
              <button onClick={() => setReenviarOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {generandoToken ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-xs text-gray-400">Generando enlace...</span>
              </div>
            ) : submitMessage ? (
              <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 p-4 space-y-3">
                <p className="text-[12px] text-white/95 leading-relaxed font-medium">
                  👋 Hola, te comparto tu pase de entrada.<br />
                  <span className="text-white/70 text-[11px]">Abre el enlace e ingresa tu código cuando te lo soliciten.</span>
                </p>
                <div className="space-y-1">
                  <p className="text-[10px] text-blue-100/80 uppercase font-bold tracking-widest">🔗 Enlace de acceso</p>
                  <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2">
                    <p className="text-[11px] text-white/90 font-mono break-all leading-relaxed">{submitUrl}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-blue-100/80 uppercase font-bold tracking-widest">🔑 Tu código de acceso</p>
                  <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-center shadow-sm overflow-hidden">
                    <p className="text-xs text-indigo-600 font-mono font-bold tracking-[0.08em] break-all text-center leading-relaxed">{submitToken}</p>
                  </div>
                </div>
                <button type="button" onClick={handleCopyMsg}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold transition-all",
                    copiedMsg
                      ? "bg-green-400/25 text-green-200 border border-green-400/40"
                      : "bg-white/15 text-white border border-white/20 hover:bg-white/25"
                  )}>
                  {copiedMsg ? <><Check className="w-3.5 h-3.5" /> ✅ Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar mensaje</>}
                </button>
              </div>
            ) : (
              <p className="text-xs text-red-400 text-center py-4">No se pudo generar el enlace.</p>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] text-gray-300 font-medium uppercase tracking-widest">o enviar directamente</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Nombre del transportista</label>
                <input value={envioNombre} onChange={(e) => setEnvioNombre(e.target.value)} placeholder="Ej. Juan Pérez"
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-300 transition" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Correo electrónico</label>
                <input type="email" value={envioCorreo} onChange={(e) => setEnvioCorreo(e.target.value)} placeholder="juan@ejemplo.com"
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-300 transition" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Teléfono</label>
                <PhoneInput value={envioTelefono} onChange={setEnvioTelefono} defaultCountry={defaultCountry as any}
                  containerComponentProps={{ className: "flex h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-3 text-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition" }}
                  numberInputProps={{ className: "pl-2 bg-transparent text-sm placeholder:text-gray-300 outline-none w-full" }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={handleEnviarCorreo} disabled={!envioCorreo || !envioNombre}
                className="flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <Send className="w-3.5 h-3.5" /> Enviar por correo
              </button>
              <button type="button" onClick={handleEnviarSms} disabled={!envioTelefono || !envioNombre}
                className="flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <Send className="w-3.5 h-3.5" /> Enviar por SMS
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
