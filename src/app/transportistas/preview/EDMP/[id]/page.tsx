"use client";

import { use, useState } from "react";
import { FileText, Download, Share2, Send, Clock, QrCode, Copy, Check, X, Loader2 } from "lucide-react";
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

function formatFecha(desde?: string, hasta?: string) {
  if (!desde) return null;
  const fmt = (s: string) =>
    new Date(s + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  return hasta && hasta !== desde ? `${fmt(desde)} – ${fmt(hasta)}` : fmt(desde);
}

// ── Componente ─────────────────────────────────────────────────────────────────

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

  const [reenviarOpen, setReenviarOpen] = useState(false);
  const [copiedMsg, setCopiedMsg]       = useState(false);
  const [submitToken, setSubmitToken]   = useState<string | null>(null);

  // Campos de envío
  const [envioNombre,   setEnvioNombre]   = useState("");
  const [envioCorreo,   setEnvioCorreo]   = useState("");
  const [envioTelefono, setEnvioTelefono] = useState<string | undefined>(undefined);

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

  const handleOpenReenviar = () => {
    setReenviarOpen(true);
    if (!submitToken) generarToken();
  };

  const handleCopyMsg = async () => {
    if (!submitMessage) return;
    await navigator.clipboard.writeText(submitMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  // TODO: conectar con endpoint de envío cuando esté disponible
  const handleEnviarCorreo = () => { /* stub */ };
  const handleEnviarSms    = () => { /* stub */ };

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
  const fecha     = formatFecha(d.fecha_desde, d.fecha_hasta);
  const horario   = d.hora_inicial && d.hora_final
    ? `${d.hora_inicial.slice(0, 5)} – ${d.hora_final.slice(0, 5)}`
    : null;
  const documentos: { file_name: string; file_url: string }[] = d.documentos ?? [];
  const materiales: Record<string, any>[]                     = d.materiales ?? [];

  const MATERIAL_COLS: { key: string; label: string }[] = [
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-[700px] space-y-3">

        {/* Marca */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">K</div>
          <span className="text-sm text-gray-500">Clave10 <span className="text-gray-300">·</span> Pase de entrada</span>
        </div>

        {/* Título */}
        <div className="px-1">
          <h1 className="text-xl font-bold text-gray-800">Tienes un nuevo pase de entrada</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {d.ubicacion} te ha generado un pase para la siguiente visita.
          </p>
        </div>

        {/* ── Card principal ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Header: tipo | fecha+horario */}
          <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-800">{tipoLabel}</span>
            {(fecha || horario) && (
              <div className="text-right shrink-0">
                {fecha   && <p className="text-xs font-semibold text-gray-600">{fecha}</p>}
                {horario && <p className="text-xs text-blue-500 font-medium">{horario}</p>}
              </div>
            )}
          </div>

          {/* Body: info + QR */}
          <div className="flex gap-5 px-5 py-5">

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-3">
              {[
                { label: "LUGAR",     value: d.ubicacion },
                { label: "ANDÉN",     value: d.anden },
                { label: "DIRECCIÓN", value: d.direccion },
                { label: "MATERIAL",  value: d.material },
                { label: "CANTIDAD",  value: d.cantidad },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{value}</p>
                  </div>
                ) : null,
              )}
            </div>

            {/* QR */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-28 h-28 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="QR pase" className="w-full h-full object-cover" />
                ) : (
                  <QrCode className="w-12 h-12 text-gray-200" />
                )}
              </div>
              <span className="text-[10px] text-gray-400 font-mono tracking-wide">{d.folio}</span>
            </div>
          </div>

          {/* Tabla de materiales */}
          {colsConDatos.length > 0 && materiales.length > 0 && (
            <div className="border-t border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      {colsConDatos.map((c) => (
                        <th key={c.key} className="text-left px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {materiales.map((row, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        {colsConDatos.map((c) => (
                          <td key={c.key} className="px-5 py-2.5 text-gray-700 font-medium whitespace-nowrap">
                            {row[c.key] ?? <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Estado */}
          {estadoConfig && (
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
              <span className="text-xs text-gray-400">Estado del transportista</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border px-2.5 py-1 rounded-full ${estadoConfig.className}`}>
                <Clock className="w-3 h-3" />
                {estadoConfig.label}
              </span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="space-y-2">
          <Button variant="outline" onClick={handleOpenReenviar}
            className="w-full rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 h-11">
            <Send className="w-4 h-4" /> Reenviar al transportista
          </Button>
          <Button disabled variant="outline" className="w-full rounded-xl border-gray-200 text-gray-400 gap-2 h-11 cursor-not-allowed">
            <Download className="w-4 h-4" /> Descargar pase (PDF)
          </Button>
          <Button disabled variant="outline" className="w-full rounded-xl border-gray-200 text-gray-400 gap-2 h-11 cursor-not-allowed">
            <Share2 className="w-4 h-4" /> Compartir QR
          </Button>
        </div>

        {/* Documentos */}
        {documentos.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
              Documentos adjuntos
            </p>
            <div className="space-y-2">
              {documentos.map((doc, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-xs text-gray-600 truncate font-mono">{doc.file_name}</span>
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="ml-3 text-blue-500 hover:text-blue-600 shrink-0 transition-colors">
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-300 pb-4">
          Clave10 · Pase #{id.slice(-8).toUpperCase()}
        </p>

      </div>

      {/* Modal reenviar */}
      {reenviarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReenviarOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <Send className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">Reenviar al transportista</p>
              </div>
              <button onClick={() => setReenviarOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mensaje copiable */}
            {generandoToken ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-xs text-gray-400">Generando enlace...</span>
              </div>
            ) : submitMessage ? (
              <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 p-4 space-y-3">
                {/* Intro */}
                <p className="text-[12px] text-white/95 leading-relaxed font-medium">
                  👋 Hola, te comparto tu pase de entrada.<br />
                  <span className="text-white/70 text-[11px]">Abre el enlace e ingresa tu código cuando te lo soliciten.</span>
                </p>

                {/* Enlace */}
                <div className="space-y-1">
                  <p className="text-[10px] text-blue-100/80 uppercase font-bold tracking-widest">🔗 Enlace de acceso</p>
                  <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2">
                    <p className="text-[11px] text-white/90 font-mono break-all leading-relaxed">{submitUrl}</p>
                  </div>
                </div>

                {/* Token — fondo blanco para máximo contraste */}
                <div className="space-y-1">
                  <p className="text-[10px] text-blue-100/80 uppercase font-bold tracking-widest">🔑 Tu código de acceso</p>
                  <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-center shadow-sm overflow-hidden">
                    <p className="text-xs text-indigo-600 font-mono font-bold tracking-[0.08em] break-all text-center leading-relaxed">{submitToken}</p>
                  </div>
                </div>

                {/* Botón copiar */}
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

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] text-gray-300 font-medium uppercase tracking-widest">o enviar directamente</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Campos de envío */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Nombre del transportista</label>
                <input
                  value={envioNombre}
                  onChange={(e) => setEnvioNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-300 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={envioCorreo}
                  onChange={(e) => setEnvioCorreo(e.target.value)}
                  placeholder="juan@ejemplo.com"
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-300 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Teléfono</label>
                <PhoneInput
                  value={envioTelefono}
                  onChange={setEnvioTelefono}
                  defaultCountry={defaultCountry as any}
                  containerComponentProps={{
                    className: "flex h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-3 text-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition",
                  }}
                  numberInputProps={{ className: "pl-2 bg-transparent text-sm placeholder:text-gray-300 outline-none w-full" }}
                />
              </div>
            </div>

            {/* Botones de envío */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={handleEnviarCorreo}
                disabled={!envioCorreo || !envioNombre}
                className="flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <Send className="w-3.5 h-3.5" /> Enviar por correo
              </button>
              <button type="button" onClick={handleEnviarSms}
                disabled={!envioTelefono || !envioNombre}
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
