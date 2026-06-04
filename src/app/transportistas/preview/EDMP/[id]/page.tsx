"use client";

import { use, useState } from "react";
import { FileText, Download, Share2, Send, Clock, QrCode, Copy, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getPassTransportista, generateSubmitTokenTransportista } from "@/services/endpoints";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  pendiente:  { label: "Pendiente",  className: "text-amber-600 bg-amber-50 border-amber-200" },
  confirmado: { label: "Confirmado", className: "text-green-600 bg-green-50 border-green-200" },
  rechazado:  { label: "Rechazado",  className: "text-red-600 bg-red-50 border-red-200" },
  en_camino:  { label: "En camino",  className: "text-blue-600 bg-blue-50 border-blue-200" },
};

const TIPO_LABEL: Record<string, string> = {
  entrega_de_materia_prima:          "Entrega de materia prima",
  recoleccion_de_materia_prima:      "Recolección de materia prima",
  entrega_de_producto_terminado:     "Entrega de producto terminado",
  recoleccion_de_producto_terminado: "Recolección de producto terminado",
};

function formatFecha(desde?: string, hasta?: string) {
  if (!desde) return null;
  const fmt = (s: string) =>
    new Date(s + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  return hasta ? `${fmt(desde)} – ${fmt(hasta)}` : fmt(desde);
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0 gap-4">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-xs text-gray-700 text-right font-medium">{value}</span>
    </div>
  );
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

  const [reenviarOpen, setReenviarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitToken, setSubmitToken] = useState<string | null>(null);

  const d = rawData?.response?.data;

  const { mutate: generarToken, isPending: generandoToken } = useMutation({
    mutationFn: () => generateSubmitTokenTransportista(d?._id),
    onSuccess: (res) => {
      const token = res?.response?.data?.token;
      if (token) setSubmitToken(token);
    },
  });

  const submitUrl = submitToken && typeof window !== "undefined"
    ? `${window.location.origin}/transportistas/submit/EDMP/${submitToken}`
    : null;

  const handleOpenReenviar = () => {
    setReenviarOpen(true);
    if (!submitToken) generarToken();
  };

  const handleCopy = async () => {
    if (!submitUrl) return;
    await navigator.clipboard.writeText(submitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!d) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-sm text-gray-400">No se encontró el pase.</p>
    </div>
  );

  const qrUrl = d.qr?.[0]?.file_url ?? null;
  const tipoLabel = TIPO_LABEL[d.tipo_de_operacion] ?? d.tipo_de_operacion;
  const fecha = formatFecha(d.fecha_desde, d.fecha_hasta);
  const documentos: { file_name: string; file_url: string }[] = d.documentos ?? [];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-[500px] space-y-3">

        {/* Cabecera de marca */}
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

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Tipo de operación */}
          <div className="px-5 pt-5 pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">{tipoLabel}</span>
          </div>

          {/* Info + QR */}
          <div className="flex gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <InfoRow label="Planta"    value={d.ubicacion} />
              <InfoRow label="Material"  value={d.material} />
              <InfoRow label="Cantidad"  value={d.cantidad} />
              <InfoRow label="Fecha"     value={fecha} />
              <InfoRow label="Horario"   value={d.hora_inicial && d.hora_final ? `${d.hora_inicial.slice(0,5)} – ${d.hora_final.slice(0,5)}` : null} />
              <InfoRow label="Andén"     value={d.anden} />
              <InfoRow label="Dirección" value={d.direccion} />
            </div>

            {/* QR */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-28 h-28 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="QR pase" className="w-full h-full object-cover" />
                ) : (
                  <QrCode className="w-14 h-14 text-gray-300" />
                )}
              </div>
              <span className="text-[10px] text-gray-400 font-mono">{d.folio}</span>
            </div>
          </div>

          {/* Estado transportista */}
          {d.estado_transportista && (() => {
            const estado = ESTADO_CONFIG[d.estado_transportista] ?? { label: d.estado_transportista, className: "text-gray-600 bg-gray-50 border-gray-200" };
            return (
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
                <span className="text-xs text-gray-400">Estado del transportista</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border px-2.5 py-1 rounded-full ${estado.className}`}>
                  <Clock className="w-3 h-3" />
                  {estado.label}
                </span>
              </div>
            );
          })()}
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

        {/* Documentos adjuntos */}
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <Send className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">Reenviar al transportista</p>
              </div>
              <button onClick={() => setReenviarOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Comparte este enlace con el transportista para que complete sus datos de conductor y vehículo.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 min-h-[80px] flex flex-col justify-center">
              {generandoToken ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-xs text-gray-400">Generando enlace...</span>
                </div>
              ) : submitUrl ? (
                <>
                  <p className="text-xs text-gray-500 font-mono break-all leading-relaxed mb-3">{submitUrl}</p>
                  <button type="button" onClick={handleCopy}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-semibold border transition-all",
                      copied ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                    )}>
                    {copied
                      ? <><Check className="w-3.5 h-3.5" /> Enlace copiado</>
                      : <><Copy className="w-3.5 h-3.5" /> Copiar enlace</>
                    }
                  </button>
                </>
              ) : (
                <p className="text-xs text-red-400 text-center">No se pudo generar el enlace.</p>
              )}
            </div>

            <p className="text-[10px] text-gray-300 text-center">
              El transportista podrá acceder a este formulario desde cualquier dispositivo.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
