"use client";

import * as React from "react";
import { Camera, Check, Loader2, RotateCcw } from "lucide-react";
import type { Imagen } from "@/components/upload-Image";
import { uploadImage } from "@/lib/get-upload-image";
import { base64ToFile } from "@/lib/utils";
import { toast } from "sonner";

type Estado = "cargando" | "lista" | "error";

// Foto de uniforme del Check In / Check Out: cámara frontal en vivo dentro del
// modal, como el diseño. Sin opción de subir archivo: la foto tiene que ser en vivo.
export function CheckInCamera({
  nombre,
  foto,
  onChange,
  onUploadingChange,
}: {
  nombre: string;
  foto: Imagen[];
  onChange: (foto: Imagen[]) => void;
  onUploadingChange: (subiendo: boolean) => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [estado, setEstado] = React.useState<Estado>("cargando");
  const [captura, setCaptura] = React.useState<string | null>(null);
  const [subiendo, setSubiendo] = React.useState(false);

  const detener = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const iniciar = React.useCallback(async () => {
    if (streamRef.current) return;
    setEstado("cargando");
    if (!navigator.mediaDevices?.getUserMedia) {
      setEstado("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setEstado("lista");
    } catch {
      setEstado("error");
    }
  }, []);

  React.useEffect(() => {
    iniciar();
    return detener;
  }, [iniciar, detener]);

  React.useEffect(() => onUploadingChange(subiendo), [subiendo, onUploadingChange]);

  const tomar = async () => {
    const video = videoRef.current;
    if (estado !== "lista" || !video?.videoWidth) return;
    // Se guarda sin espejo; el espejo es solo de la vista previa.
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCaptura(dataUrl);
    detener();

    setSubiendo(true);
    try {
      const res = await uploadImage(base64ToFile(dataUrl, `${nombre}-${Date.now()}`));
      if (!res?.file) throw new Error();
      onChange([{ file_name: res.file_name, file_url: res.file }]);
    } catch {
      toast.error("No se pudo subir la fotografía. Vuelve a tomarla.");
      setCaptura(null);
      onChange([]);
      iniciar();
    } finally {
      setSubiendo(false);
    }
  };

  const repetir = () => {
    setCaptura(null);
    onChange([]);
    iniciar();
  };

  const tomada = !!captura && foto.length > 0;
  const mensaje = captura
    ? ""
    : estado === "cargando"
      ? "Activando cámara..."
      : estado === "error"
        ? "No se pudo acceder a la cámara. Revisa los permisos del navegador."
        : "";

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative w-full aspect-[4/3] rounded-[14px] overflow-hidden bg-slate-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover -scale-x-100 transition-opacity"
          style={{ opacity: estado === "lista" && !captura ? 1 : 0 }}
        />
        {captura && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={captura} alt="Foto de uniforme" className="absolute inset-0 h-full w-full object-cover -scale-x-100" />
        )}
        {mensaje && (
          <div className="absolute inset-0 p-6 flex flex-col items-center justify-center gap-2.5 text-center text-[13px] leading-[1.45] text-slate-300">
            <Camera className="h-7 w-7" />
            {mensaje}
          </div>
        )}
        {subiendo && (
          <span className="absolute top-3 left-3 h-[26px] px-2.5 rounded-full bg-white/90 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Subiendo…
          </span>
        )}
        {tomada && (
          <span className="absolute top-3 left-3 h-[26px] px-2.5 rounded-full bg-white/90 text-xs font-semibold text-[#16A34A] flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Foto tomada
          </span>
        )}
      </div>
      <div className="flex justify-center">
        {captura ? (
          <button
            type="button"
            onClick={repetir}
            disabled={subiendo}
            className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm text-neutral-900 flex items-center gap-2 transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
            <RotateCcw className="h-4 w-4" />
            Volver a Tomar
          </button>
        ) : (
          <button
            type="button"
            onClick={tomar}
            disabled={estado !== "lista"}
            className="h-10 px-[18px] rounded-lg bg-[#2F80ED] text-sm font-semibold text-white flex items-center gap-2 transition-colors hover:bg-[#1E6FDB] disabled:opacity-50 disabled:cursor-not-allowed">
            <Camera className="h-4 w-4" />
            Tomar Fotografía
          </button>
        )}
      </div>
    </div>
  );
}
