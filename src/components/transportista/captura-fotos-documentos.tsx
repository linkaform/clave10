"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Webcam from "react-webcam";
import { FileText, IdCard, Truck, Upload, X, type LucideIcon } from "lucide-react";
import { WebcamErrorBoundary } from "@/components/webcam-error-boundary";
import { VisorFotosModal } from "@/components/transportista/visor-fotos-modal";
import { cn, base64ToFile } from "@/lib/utils";

// Qué es cada foto (2610-1382, junta 16 oct): solo 3 categorías, que bastan
// para la IA. Se elige antes de disparar (obligatorio). `tipo` es el valor que
// se guarda (vocabulario de config/documentos-transportista.ts); si `fijo` es
// false la IA puede afinarlo (p. ej. carga → carta porte). `hint` va a la IA.
export interface OpcionFoto {
  value: string;
  label: string;
  corto: string;
  tipo: string;
  fijo: boolean;
  hint: string;
  icon: LucideIcon;
}
export const TIPOS_FOTO_DOCUMENTO: OpcionFoto[] = [
  { value: "conductor", label: "Documento del conductor", corto: "Conductor", icon: IdCard,
    tipo: "licencia", fijo: true,
    hint: "Documento del conductor: licencia de conducir o identificación" },
  { value: "vehiculo", label: "Documento del vehículo", corto: "Vehículo", icon: Truck,
    tipo: "tarjeta_circulacion_vehiculo", fijo: false,
    hint: "Documento del vehículo: tarjeta de circulación del tracto o del remolque" },
  { value: "carga", label: "Documento de carga", corto: "Carga", icon: FileText,
    tipo: "factura_orden_compra", fijo: false,
    hint: "Documento de carga: factura, orden de compra, carta porte o BL" },
];

export const opcionFoto = (value?: string | null): OpcionFoto =>
  TIPOS_FOTO_DOCUMENTO.find((t) => t.value === value) ?? TIPOS_FOTO_DOCUMENTO[2];

// Categoría de una foto ya guardada: la que se eligió, o la que corresponde a
// su tipo (si la IA lo cambió, p. ej. a carta porte).
const opcionDeFoto = (f: Pick<FotoDocumento, "opcion" | "tipo">) => {
  if (f.opcion) return f.opcion;
  if (f.tipo === "licencia" || f.tipo === "identificacion_chofer") return "conductor";
  if (f.tipo?.startsWith("tarjeta_circulacion")) return "vehiculo";
  return "carga";
};

export const etiquetaDeFoto = (f: Pick<FotoDocumento, "opcion" | "tipo">) => opcionFoto(opcionDeFoto(f)).label;

export interface FotoDocumento {
  id: string;
  preview: string | null;
  tipo?: string;
  opcion?: string;
  uploading: boolean;
}

interface Props {
  fotos: FotoDocumento[];
  onCapturar: (file: File, opcion: OpcionFoto) => void;
  onQuitar: (id: string) => void;
  onCambiarTipo: (id: string, opcion: OpcionFoto) => void;
  // true = la cámara crece para llenar el alto del contenedor (layout de dos columnas).
  llenarAlto?: boolean;
}

export function CapturaFotosDocumentos({ fotos, onCapturar, onQuitar, onCambiarTipo, llenarAlto }: Props) {
  const webcamRef = useRef<Webcam | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [camaraLista, setCamaraLista] = useState(false);
  const [sinCamara, setSinCamara] = useState(false);
  // Tipo elegido antes de disparar (obligatorio): la foto se guarda con él y
  // se queda seleccionado para seguir tomando fotos del mismo tipo.
  const [preTipo, setPreTipo] = useState<string | null>(null);
  const [visor, setVisor] = useState<number | null>(null);

  const stopStream = () => {
    try {
      const video = webcamRef.current?.video;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }
    } catch {
      // ignorar errores de limpieza
    }
  };

  useEffect(() => () => stopStream(), []);

  const disparar = () => {
    if (!preTipo) return;
    if (sinCamara) { fileRef.current?.click(); return; }
    const src = webcamRef.current?.getScreenshot();
    if (src) recibir(base64ToFile(src, `documento_${Date.now()}`));
  };

  const recibir = (file: File) => {
    if (!preTipo) return;
    onCapturar(file, opcionFoto(preTipo));
  };

  return (
    <div className={cn(llenarAlto ? "h-full flex flex-col gap-3" : "space-y-3")}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) recibir(f);
        }}
      />

      <div className={cn("relative w-full rounded-xl overflow-hidden bg-gray-900", llenarAlto ? "flex-1 min-h-[280px]" : "h-[min(44vh,360px)]")}>
        {!sinCamara && (
          <WebcamErrorBoundary onError={() => setSinCamara(true)}>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.9}
              videoConstraints={{ facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } }}
              onUserMedia={() => setCamaraLista(true)}
              onUserMediaError={() => setSinCamara(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </WebcamErrorBoundary>
        )}

        <>
          <div className="absolute top-3 inset-x-3 z-10 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_FOTO_DOCUMENTO.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPreTipo(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-semibold transition-all backdrop-blur-sm",
                    preTipo === t.value ? "bg-white text-blue-700" : "bg-black/45 text-white border border-white/20 hover:bg-black/60",
                  )}>
                  <t.icon className="w-5 h-5" />
                  {t.label}
                </button>
              ))}
            </div>
            {!preTipo && (
              <p className="text-xs text-amber-200 bg-black/50 rounded-lg px-2.5 py-1.5 inline-block">
                Elige qué vas a fotografiar para poder tomar la foto.
              </p>
            )}
          </div>
          {sinCamara && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-300 pb-16 px-6 text-center pointer-events-none">
              No hay cámara disponible: usa el botón para subir la foto.
            </div>
          )}
          {!sinCamara && !camaraLista && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 pointer-events-none">
              Abriendo cámara…
            </div>
          )}
          <div className="absolute bottom-3 inset-x-0 flex justify-center z-10">
            <button
              type="button"
              onClick={disparar}
              disabled={!preTipo || (!sinCamara && !camaraLista)}
              aria-label={sinCamara ? "Subir foto" : "Tomar foto"}
              className={cn(
                "w-14 h-14 rounded-full border-4 border-white flex items-center justify-center transition-all",
                !preTipo || (!sinCamara && !camaraLista) ? "opacity-40 cursor-not-allowed" : "bg-white/25 hover:bg-white/40 active:scale-95",
              )}>
              {sinCamara && <Upload className="w-5 h-5 text-white" />}
            </button>
          </div>
          <span className="absolute bottom-5 right-4 text-xs font-medium text-white/90 z-10">
            {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
          </span>
        </>
      </div>

      {fotos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {fotos.map((f, i) => (
            <div key={f.id} className="w-24 space-y-1">
              <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <button type="button" onClick={() => setVisor(i)} aria-label="Ver foto en grande" className="absolute inset-0">
                  {f.preview && <Image src={f.preview} fill className="object-cover" alt="" unoptimized />}
                </button>
                {f.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onQuitar(f.id)}
                  aria-label="Quitar foto"
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <select
                value={opcionDeFoto(f)}
                onChange={(e) => onCambiarTipo(f.id, opcionFoto(e.target.value))}
                className="w-full h-7 rounded-md border border-gray-200 px-1 text-[11px] bg-white focus:outline-none focus:border-blue-400">
                {TIPOS_FOTO_DOCUMENTO.map((t) => (
                  <option key={t.value} value={t.value}>{t.corto}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <VisorFotosModal
        fotos={fotos.map((f) => ({ id: f.id, src: f.preview, etiqueta: etiquetaDeFoto(f) }))}
        indice={visor}
        onIndice={setVisor}
      />
    </div>
  );
}
