"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Circle, FileText, Loader2, Mic, Square, Upload, Video, X } from "lucide-react";
import { toast } from "sonner";
import LoadImage, { Imagen } from "../upload-Image";
import LoadFile from "../upload-file";
import { useUploadImage } from "@/hooks/useUploadImage";
import { transcribirAudio } from "@/services/endpoints";

interface EvidenciaCapturaProps {
  /** Prefijo de los id de los inputs de archivo (únicos por modal). */
  id: string;
  evidencia: Imagen[];
  setEvidencia: Dispatch<SetStateAction<Imagen[]>>;
  documento: Imagen[];
  setDocumento: Dispatch<SetStateAction<Imagen[]>>;
  /**
   * Si se pasa, cada nota de voz grabada se transcribe al terminar y el texto
   * se entrega aquí (ej. para agregarlo a la descripción). El audio se queda
   * también como evidencia.
   */
  onTranscripcion?: (texto: string) => void;
}

const MAX_VIDEO_MB = 50;
const MAX_VIDEO_SEG = 60;
const MAX_AUDIO_SEG = 120;

// Videos y notas de voz se guardan en el campo de archivos (documento): el
// detalle los distingue por extensión al mostrarlos.
const EXT_VIDEO = ["mp4", "mov", "webm", "m4v"];
const EXT_AUDIO = ["mp3", "m4a", "wav", "ogg", "aac", "weba"];
// Extensión de un texto ("…/archivo.m4a?x=1" -> "m4a").
const ext = (t?: string) => {
  const limpio = (t || "").split("?")[0];
  return limpio.includes(".") ? limpio.split(".").pop()!.toLowerCase() : "";
};
// Se revisa la liga y el nombre: si la liga no trae extensión, la da el nombre.
const esTipo = (a: Imagen, lista: string[]) => lista.includes(ext(a.file_url)) || lista.includes(ext(a.file_name));
const esVideo = (a: Imagen) => esTipo(a, EXT_VIDEO);
const esAudio = (a: Imagen) => esTipo(a, EXT_AUDIO);

// El servicio de archivos de LinkaForm (cloud_upload) no acepta webm/ogg: solo
// se graba si el navegador sabe hacerlo en mp4 (Chrome, Safari). Firefox solo
// graba webm, así que ahí se ofrece únicamente "Subir video".
const primerFormato = (candidatos: string[]) =>
  typeof window !== "undefined" && typeof MediaRecorder !== "undefined"
    ? candidatos.find((t) => MediaRecorder.isTypeSupported(t)) ?? null
    : null;
const formatoVideo = () =>
  primerFormato(["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4;codecs=avc1", "video/mp4"]);
const formatoAudio = () => primerFormato(["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/aac"]);

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Duración del video (segundos) leyendo solo sus metadatos; null si no se pudo.
const duracionVideo = (archivo: File) =>
  new Promise<number | null>((resolve) => {
    const url = URL.createObjectURL(archivo);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(v.duration) ? v.duration : null);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    v.src = url;
  });

// Barra de evidencia de los modales de incidencias: Foto, Video, Documento y
// nota de voz (micrófono).
export const EvidenciaCaptura = ({ id, evidencia, setEvidencia, documento, setDocumento, onTranscripcion }: EvidenciaCapturaProps) => {
  const [panel, setPanel] = useState<"foto" | "video" | "documento" | null>(null);
  const { uploadImageMutation } = useUploadImage();
  const [subiendo, setSubiendo] = useState<"video" | "audio" | null>(null);
  const [analizando, setAnalizando] = useState(false);
  // El onstop del grabador se arma al empezar a grabar: con la ref usa siempre
  // el callback más reciente del modal.
  const onTranscripcionRef = useRef(onTranscripcion);
  onTranscripcionRef.current = onTranscripcion;
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Si el navegador puede grabar en un formato que acepte LinkaForm.
  const [puedeGrabarVideo, setPuedeGrabarVideo] = useState(true);
  const [puedeGrabarAudio, setPuedeGrabarAudio] = useState(true);
  useEffect(() => {
    setPuedeGrabarVideo(!!formatoVideo() && !!navigator.mediaDevices?.getUserMedia);
    setPuedeGrabarAudio(!!formatoAudio() && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  // Nota de voz
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const videos = (documento ?? []).filter(esVideo);
  const audios = (documento ?? []).filter(esAudio);
  const documentos = (documento ?? []).filter((a) => !esVideo(a) && !esAudio(a));
  const quitar = (a: Imagen) => setDocumento((prev) => (prev ?? []).filter((x) => x.file_url !== a.file_url));
  // La pestaña Documento solo ve/edita los documentos; videos y audios (que
  // viven en el mismo campo) se conservan aparte.
  const setSoloDocumentos: Dispatch<SetStateAction<Imagen[]>> = (upd) =>
    setDocumento((prev) => {
      const actual = prev ?? [];
      const medios = actual.filter((a) => esVideo(a) || esAudio(a));
      const docs = actual.filter((a) => !esVideo(a) && !esAudio(a));
      const nuevos = typeof upd === "function" ? upd(docs) : upd;
      return [...nuevos, ...medios];
    });

  // Regresa la liga del archivo subido (undefined si no se subió).
  const subir = async (archivo: File, tipo: "video" | "audio"): Promise<string | undefined> => {
    setSubiendo(tipo);
    try {
      const res = await uploadImageMutation.mutateAsync({ img: archivo });
      if (res?.file_url) setDocumento((prev) => [...(prev ?? []), { file_url: res.file_url, file_name: archivo.name }]);
      return res?.file_url;
    } finally {
      setSubiendo(null);
    }
  };

  const transcribir = async (fileUrl: string) => {
    const entregar = onTranscripcionRef.current;
    if (!entregar) return;
    setAnalizando(true);
    try {
      const texto = await transcribirAudio(fileUrl);
      if (texto) {
        entregar(texto);
        toast.success("Nota de voz transcrita a la descripción.");
      } else {
        toast.info("No se entendió lo que se dijo en la nota de voz.");
      }
    } catch (e) {
      toast.error(`No se pudo transcribir la nota de voz: ${e instanceof Error ? e.message : "error desconocido"}`);
    } finally {
      setAnalizando(false);
    }
  };

  const elegirVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (archivo.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`El video pesa más de ${MAX_VIDEO_MB} MB. Graba uno más corto.`);
      return;
    }
    const duracion = await duracionVideo(archivo);
    if (duracion && duracion > MAX_VIDEO_SEG + 0.5) {
      toast.error(`El video dura ${mmss(Math.round(duracion))}. El máximo es ${mmss(MAX_VIDEO_SEG)} minuto.`);
      return;
    }
    await subir(archivo, "video");
  };

  const limpiarGrabacion = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setGrabando(false);
  };

  const detenerGrabacion = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  };

  const iniciarGrabacion = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Este navegador no permite grabar audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Safari graba en mp4/aac; Chrome y Firefox en webm/opus.
      const tipo = formatoAudio();
      if (!tipo) {
        limpiarGrabacion();
        toast.error("Tu navegador no puede grabar notas de voz compatibles. Usa Chrome o Safari.");
        return;
      }
      const recorder = new MediaRecorder(stream, { mimeType: tipo });
      const partes: Blob[] = [];
      recorder.ondataavailable = (ev) => ev.data.size && partes.push(ev.data);
      recorder.onstop = async () => {
        limpiarGrabacion();
        const blob = new Blob(partes, { type: tipo });
        if (!blob.size) return;
        const ext = "m4a";
        const nombre = `nota-de-voz-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${ext}`;
        const fileUrl = await subir(new File([blob], nombre, { type: tipo }), "audio");
        if (fileUrl) await transcribir(fileUrl);
      };
      recorderRef.current = recorder;
      recorder.start();
      setSegundos(0);
      setGrabando(true);
      timerRef.current = setInterval(() => {
        setSegundos((s) => {
          if (s + 1 >= MAX_AUDIO_SEG) detenerGrabacion();
          return s + 1;
        });
      }, 1000);
    } catch {
      limpiarGrabacion();
      toast.error("No se pudo usar el micrófono. Revisa los permisos del navegador.");
    }
  };

  // Si el modal se cierra a media grabación, se suelta el micrófono.
  useEffect(() => () => limpiarGrabacion(), []);

  // ---- Grabar video con la cámara (webcam en computadora, cámara en celular)
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [grabandoVideo, setGrabandoVideo] = useState(false);
  const [segVideo, setSegVideo] = useState(0);
  const previewRef = useRef<HTMLVideoElement>(null);
  const carruselRef = useRef<HTMLDivElement>(null);
  const moverCarrusel = (dir: 1 | -1) =>
    carruselRef.current?.scrollBy({ left: dir * carruselRef.current.clientWidth * 0.8, behavior: "smooth" });
  const camStreamRef = useRef<MediaStream | null>(null);
  const camRecorderRef = useRef<MediaRecorder | null>(null);
  const camTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cerrarCamara = () => {
    if (camTimerRef.current) clearInterval(camTimerRef.current);
    camTimerRef.current = null;
    if (camRecorderRef.current && camRecorderRef.current.state !== "inactive") camRecorderRef.current.stop();
    camRecorderRef.current = null;
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
    setGrabandoVideo(false);
    setCamaraAbierta(false);
  };

  const abrirCamara = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Este navegador no permite grabar video.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
      camStreamRef.current = stream;
      setCamaraAbierta(true);
    } catch {
      toast.error("No se pudo usar la cámara. Revisa los permisos del navegador.");
    }
  };

  const detenerVideo = () => {
    if (camRecorderRef.current && camRecorderRef.current.state !== "inactive") camRecorderRef.current.stop();
  };

  const grabarVideo = () => {
    const stream = camStreamRef.current;
    if (!stream) return;
    // Safari graba mp4; Chrome y Firefox, webm.
    const tipo = formatoVideo();
    if (!tipo) {
      toast.error("Tu navegador no puede grabar video compatible. Usa Subir video.");
      cerrarCamara();
      return;
    }
    const recorder = new MediaRecorder(stream, { mimeType: tipo });
    const partes: Blob[] = [];
    recorder.ondataavailable = (ev) => ev.data.size && partes.push(ev.data);
    recorder.onstop = async () => {
      if (camTimerRef.current) clearInterval(camTimerRef.current);
      camTimerRef.current = null;
      setGrabandoVideo(false);
      const blob = new Blob(partes, { type: tipo });
      cerrarCamara();
      if (!blob.size) return;
      if (blob.size > MAX_VIDEO_MB * 1024 * 1024) {
        toast.error(`El video pesa más de ${MAX_VIDEO_MB} MB. Graba uno más corto.`);
        return;
      }
      const ext = "mp4";
      const nombre = `video-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${ext}`;
      await subir(new File([blob], nombre, { type: tipo }), "video");
    };
    camRecorderRef.current = recorder;
    recorder.start();
    setSegVideo(0);
    setGrabandoVideo(true);
    camTimerRef.current = setInterval(() => {
      setSegVideo((s) => {
        if (s + 1 >= MAX_VIDEO_SEG) detenerVideo();
        return s + 1;
      });
    }, 1000);
  };

  // La vista previa se conecta cuando su <video> ya está en pantalla.
  useEffect(() => {
    if (camaraAbierta && previewRef.current && camStreamRef.current) {
      previewRef.current.srcObject = camStreamRef.current;
      previewRef.current.play().catch(() => {});
    }
  }, [camaraAbierta]);

  // Al cerrar el modal o cambiar de pestaña se suelta la cámara.
  useEffect(() => () => cerrarCamara(), []);
  useEffect(() => {
    if (panel !== "video") cerrarCamara();
  }, [panel]);

  const chip = (activo: boolean) =>
    `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm ${
      activo ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 p-2">
        <button type="button" onClick={() => setPanel(panel === "foto" ? null : "foto")} className={chip(panel === "foto")}>
          <Camera className="h-4 w-4" />
          Foto{evidencia?.length > 0 && ` (${evidencia.length})`}
        </button>
        <button type="button" onClick={() => setPanel(panel === "video" ? null : "video")} className={chip(panel === "video")}>
          {subiendo === "video" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
          Video{videos.length > 0 && ` (${videos.length})`}
        </button>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/quicktime,.mp4,.mov,.m4v"
          className="hidden"
          onChange={elegirVideo}
        />
        <button
          type="button"
          onClick={() => setPanel(panel === "documento" ? null : "documento")}
          className={chip(panel === "documento")}>
          <FileText className="h-4 w-4" />
          Documento{documentos.length > 0 && ` (${documentos.length})`}
        </button>
        <span className="flex-1 px-2 text-sm text-gray-400">
          {grabando ? (
            <span className="flex items-center gap-2 font-medium text-red-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
              Grabando {mmss(segundos)} / {mmss(MAX_AUDIO_SEG)}
            </span>
          ) : subiendo === "audio" ? (
            "Subiendo nota de voz..."
          ) : analizando ? (
            <span className="flex items-center gap-2 font-medium text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analizando audio...
            </span>
          ) : (
            "Foto, video, audio o documento"
          )}
        </span>
        <button
          type="button"
          onClick={grabando ? detenerGrabacion : iniciarGrabacion}
          disabled={!!subiendo || analizando || (!puedeGrabarAudio && !grabando)}
          title={
            !puedeGrabarAudio
              ? "Tu navegador no puede grabar notas de voz compatibles. Usa Chrome o Safari."
              : grabando
                ? "Detener grabación"
                : "Grabar nota de voz"
          }
          aria-label={grabando ? "Detener grabación" : "Grabar nota de voz"}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            grabando ? "bg-red-600 hover:bg-red-700" : "bg-blue-500 hover:bg-blue-600"
          }`}>
          {subiendo === "audio" || analizando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : grabando ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Notas de voz (siempre visibles) */}
      {audios.length > 0 && (
        <div className="mt-3 space-y-2">
          {audios.map((a) => (
            <div key={a.file_url} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2">
              <Mic className="h-4 w-4 shrink-0 text-blue-600" />
              <audio controls src={a.file_url} className="h-9 min-w-0 flex-1" />
              <button type="button" onClick={() => quitar(a)} className="text-gray-400 hover:text-red-600" aria-label="Quitar">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {panel && (
        <div className="relative mt-3 rounded-xl border border-gray-100 p-4">
          <button
            type="button"
            onClick={() => setPanel(null)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
          {panel === "foto" ? (
            <LoadImage
              id={`${id}-foto`}
              titulo="Foto"
              setImg={setEvidencia}
              showWebcamOption={true}
              facingMode="environment"
              imgArray={evidencia ?? []}
              limit={10}
            />
          ) : panel === "video" ? (
            <div>
              <p className="text-sm font-medium text-gray-700">Video</p>
              <p className="text-xs text-gray-400">
                Máximo {MAX_VIDEO_SEG / 60} minuto y {MAX_VIDEO_MB} MB por video.
              </p>
              {!puedeGrabarVideo && (
                <p className="mt-1 text-xs text-amber-600">
                  Este navegador no puede grabar video en un formato compatible. Sube un video, o grábalo desde Chrome o Safari.
                </p>
              )}
              {camaraAbierta ? (
                <div className="mt-3 w-1/2 sm:w-1/3">
                  <div className="relative overflow-hidden rounded-lg bg-black">
                    <video ref={previewRef} autoPlay muted playsInline className="aspect-video w-full object-contain" />
                    {grabandoVideo && (
                      <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        {mmss(segVideo)} / {mmss(MAX_VIDEO_SEG)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {grabandoVideo ? (
                      <button
                        type="button"
                        onClick={detenerVideo}
                        className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                        <Square className="h-3.5 w-3.5 fill-current" /> Detener y guardar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={grabarVideo}
                        className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                        <Circle className="h-3.5 w-3.5 fill-current" /> Grabar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={cerrarCamara}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {/* Solo en navegadores que graban mp4 (Chrome, Safari). */}
                  {puedeGrabarVideo && (
                  <button
                    type="button"
                    onClick={abrirCamara}
                    disabled={!!subiendo || grabando}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60">
                    <Camera className="h-4 w-4" />
                    Grabar con cámara
                  </button>
                  )}
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={!!subiendo || grabando}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60">
                    {subiendo === "video" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {subiendo === "video" ? "Subiendo video..." : "Subir video"}
                  </button>
                </div>
              )}
              {videos.length > 0 && (
                <div className="relative mt-3">
                  <p className="mb-1.5 text-xs text-gray-500">
                    {videos.length} video{videos.length === 1 ? "" : "s"}
                  </p>
                  {/* Carrusel: se recorre con las flechas o deslizando */}
                  <div ref={carruselRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1">
                  {videos.map((a) => (
                    <div key={a.file_url} className="relative w-1/2 shrink-0 snap-start sm:w-1/3">
                      <video controls preload="metadata" src={a.file_url} className="aspect-video w-full rounded-lg bg-black object-contain" />
                      <button
                        type="button"
                        onClick={() => quitar(a)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:text-red-600"
                        aria-label="Quitar video">
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <p className="mt-1 truncate text-xs text-gray-500">{a.file_name || "Video"}</p>
                    </div>
                  ))}
                  </div>
                  {videos.length > 2 && (
                    <>
                      <button
                        type="button"
                        onClick={() => moverCarrusel(-1)}
                        className="absolute -left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow hover:text-blue-600"
                        aria-label="Anterior">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moverCarrusel(1)}
                        className="absolute -right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow hover:text-blue-600"
                        aria-label="Siguiente">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <LoadFile id={`${id}-documento`} titulo="Documento" setDocs={setSoloDocumentos} docArray={documentos} limit={10} />
          )}
        </div>
      )}
    </div>
  );
};
