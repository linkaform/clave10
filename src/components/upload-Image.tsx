"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useUploadImage } from "@/hooks/useUploadImage";
import { Camera, SwitchCamera, Trash2, UploadCloud } from "lucide-react";
import Webcam from "react-webcam";
import { WebcamErrorBoundary } from "./webcam-error-boundary";
import { base64ToFile, quitarAcentosYMinusculasYEspacios } from "@/lib/utils";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { useOcr } from "@/hooks/ocr/useOcr";

export type Imagen = {
  file_url?: string;
  file_name?: string;
};

interface CalendarDaysProps {
  id: string;
  titulo: string;
  setImg: Dispatch<SetStateAction<Imagen[]>>;
  showWebcamOption: boolean;
  facingMode: string;
  imgArray: any;
  limit?: number;
  showImage?:boolean;
  /** Callback que notifica al padre cuando este componente está subiendo imágenes */
  onLoadingChange?: (isLoading: boolean) => void;
  onOcrResult?: (result: any) => void; 
  tipoOcr?: "id" | "paquete" | "truck" | "vehiculo"  | "equipo" | "persona";
  showPlaceholder?: boolean;
  ocrResultChildren?: React.ReactNode;
  onClear?: () => void;
  accountId?: number;
}

const LoadImage: React.FC<CalendarDaysProps> = ({
  id,
  titulo,
  setImg,
  showWebcamOption,
  facingMode,
  imgArray,
  limit = 15,
  onLoadingChange,
  onOcrResult,
  tipoOcr = "id",
  showPlaceholder=false,
  ocrResultChildren,
  showImage=true,
  onClear,
  accountId,
}) => {

  const [loadingWebcam, setLoadingWebcam] = useState(false);
  const [hideWebcam, setHideWebcam] = useState(true);
  const [hideButtonWebcam, setHideButtonWebcam] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [cameraOptions, setCameraOptions] = useState<MediaDeviceInfo[]>([]);
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const { uploadImageMutation, isLoading } = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam | null>(null);
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const cameraStorageKey = `clave10-camara-${quitarAcentosYMinusculasYEspacios(id)}`;

  function stopWebcamStream() {
    try {
      const video = webcamRef.current?.video;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }
    } catch {
      // ignorar errores de limpieza
    }
  }

  useEffect(() => {
    return () => {
      stopWebcamStream();
    };
  }, []);
  const videoConstraints = selectedDeviceId
    ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
    : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode };
  const reachedLimit = (imgArray?.length ?? 0) >= limit;
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const { ocrIdMutation, ocrPaqueteMutation, ocrTruckMutation , ocrVehiculoMutation, ocrEquipoMutation, ocrPersonaMutation} = useOcr(accountId);

  const ocrMutation = tipoOcr === "paquete"
    ? ocrPaqueteMutation
    : tipoOcr === "truck"
    ? ocrTruckMutation
    : tipoOcr === "vehiculo"
    ? ocrVehiculoMutation
    : tipoOcr === "equipo"
    ? ocrEquipoMutation
    : tipoOcr === "persona"
    ? ocrPersonaMutation
    : ocrIdMutation;

  // const handleAnalizar = async () => {
  //   if (!imgArray?.length) return;
  //   const urls = imgArray.map((i: Imagen) => i.file_url).filter(Boolean);
  //   const result = await ocrMutation.mutateAsync(urls);
  //   onOcrResult?.(result);
  // };
  // Notificar al padre cuando cambia isLoading
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (carouselApi) {
      carouselApi.on("select", () => {
        setActiveIndex(carouselApi.selectedScrollSnap());
      });
    }
  }, [carouselApi]);

  async function handleFileChange(event: any) {
    const files: File[] = Array.from(event.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter((file) => {
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      const maxSize = 50 * 1024 * 1024;
      if (!validTypes.includes(file.type)) {
        alert(`El archivo "${file.name}" no es un formato válido. Solo se permiten jpg, jpeg o png.`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`El archivo "${file.name}" supera los 50MB permitidos.`);
        return false;
      }
      return true;
    });

    if (!validFiles.length) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const espaciosDisponibles = limit - (imgArray?.length ?? 0);
    const filesToUpload = validFiles.slice(0, espaciosDisponibles);

    const results = await Promise.all(
      filesToUpload.map((file) => {
        const tipoMime = file.type;
        const extension = tipoMime.split("/")[1];
        const nuevoNombre = `${quitarAcentosYMinusculasYEspacios(id)}.${extension}`;
        const nuevoArchivo = new File([file], nuevoNombre, { type: file.type });
        return uploadImageMutation.mutateAsync({ img: nuevoArchivo });
      })
    );

    console.log('results upload=', JSON.stringify(results)); 

    const nuevos = results.filter(
      (r) => r?.file_url && !imgArray?.some((i: Imagen) => i.file_url === r.file_url)
    );
    if (nuevos.length > 0) {
      const updatedImgs = [...(imgArray ?? []), ...nuevos];
      setImg(updatedImgs);
      if (onOcrResult) {
        try {
          const urls = updatedImgs
            .map((i: Imagen) => i.file_url)
            .filter((url): url is string => Boolean(url));
          const result = await ocrMutation.mutateAsync(urls);
          onOcrResult?.(result);
        } catch {
          onOcrResult?.({});
        }
      }
    }
    stopWebcamStream();
    setHideWebcam(true);
    setHideButtonWebcam(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function cleanPhoto() {
    stopWebcamStream();
    setImg([]);
    setHideWebcam(true);
    setHideButtonWebcam(false);
    setWebcamReady(false);
    onClear?.();
  }

  function removeImage(indexToRemove: number) {
    const newArray = imgArray.filter((_: any, index: number) => index !== indexToRemove);
    setImg(newArray);
    if (newArray.length === 0) cleanPhoto();
    else onClear?.();
  }

  async function handleOpenCamera() {
    if (isMobile) {
      cameraInputRef.current?.click();
      return;
    }

    setWebcamReady(false);
    setLoadingWebcam(true);
    setCameraError(null);

    try {
      // enumerateDevices() no inicializa hardware (no es un getUserMedia),
      // así que consultarlo en cada apertura es prácticamente gratis.
      let videoInputs = (await navigator.mediaDevices.enumerateDevices()).filter(
        (d) => d.kind === "videoinput"
      );

      // Si los "label" vienen vacíos es porque el navegador todavía no
      // otorgó permiso de cámara en este origen: se pide un stream
      // genérico solo para desbloquearlos y se libera de inmediato.
      if (videoInputs.length > 0 && videoInputs.every((d) => !d.label)) {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach((t) => t.stop());
        videoInputs = (await navigator.mediaDevices.enumerateDevices()).filter(
          (d) => d.kind === "videoinput"
        );
      }

      setCameraOptions(videoInputs);

      // La cámara elegida antes en esta sesión pudo haberse desconectado
      // (otro cable USB, otro equipo, etc.): se valida que siga presente
      // antes de reusarla directo con deviceId "exact".
      const stored = sessionStorage.getItem(cameraStorageKey);
      const storedIsValid = !!stored && videoInputs.some((d) => d.deviceId === stored);
      if (stored && !storedIsValid) sessionStorage.removeItem(cameraStorageKey);

      if (storedIsValid) {
        setSelectedDeviceId(stored);
        setHideWebcam(false);
        return;
      }

      if (videoInputs.length > 1) {
        setLoadingWebcam(false);
        setShowCameraSelector(true);
        return;
      }

      setSelectedDeviceId(videoInputs[0]?.deviceId ?? null);
      setHideWebcam(false);
    } catch {
      // Sin permisos o sin soporte para enumerar dispositivos: se cae al
      // comportamiento previo, dejando que facingMode elija la cámara.
      setSelectedDeviceId(null);
      setHideWebcam(false);
    }
  }

  function handleSelectCamera(deviceId: string) {
    sessionStorage.setItem(cameraStorageKey, deviceId);
    setSelectedDeviceId(deviceId);
    setShowCameraSelector(false);
    setLoadingWebcam(true);
    setHideWebcam(false);
  }

  function handleChangeCamera() {
    sessionStorage.removeItem(cameraStorageKey);
    stopWebcamStream();
    setHideWebcam(true);
    setWebcamReady(false);
    setShowCameraSelector(true);
  }

  function handleUserMedia() {
    // onUserMedia se dispara apenas se asigna el stream al <video>, antes
    // de que llegue el primer frame decodificado (video.videoWidth sigue
    // en 0). getScreenshot() falla mientras eso no pase, así que en vez de
    // adivinar un tiempo fijo se sondea la condición real, con un tope de
    // seguridad por si el video nunca reporta dimensiones.
    const start = Date.now();
    const checkReady = () => {
      const video = webcamRef.current?.video;
      const hasFrame = !!video && video.videoWidth > 0 && video.videoHeight > 0;
      if (hasFrame || Date.now() - start > 4000) {
        setLoadingWebcam(false);
        setWebcamReady(true);
        return;
      }
      requestAnimationFrame(checkReady);
    };
    requestAnimationFrame(checkReady);
  }

  function handleUserMediaError() {
    // La cámara guardada puede ya no ser válida (desconectada, en uso por
    // otra app, permiso revocado): se limpia para no volver a fallar en
    // silencio la próxima vez, y se avisa en vez de dejar "Tomar foto"
    // habilitado con un stream que nunca llegó.
    stopWebcamStream();
    setHideWebcam(true);
    setHideButtonWebcam(false);
    setWebcamReady(false);
    setLoadingWebcam(false);
    sessionStorage.removeItem(cameraStorageKey);
    setSelectedDeviceId(null);
    setCameraError("No se pudo acceder a la cámara. Intenta de nuevo o elige otra.");
  }

  async function takeAndSavePhoto() {
    if (reachedLimit) return;

    const imageSrc = webcamRef.current?.getScreenshot() || "";
    const base64 = base64ToFile(imageSrc, quitarAcentosYMinusculasYEspacios(id));
    const tipoMime = base64.type;
    const extension = tipoMime.split("/")[1];
    const nuevoNombre = `${quitarAcentosYMinusculasYEspacios(id)}.${extension}`;
    const nuevoArchivo = new File([base64], nuevoNombre, { type: base64.type });

    // Se suelta la cámara de inmediato, antes de los awaits de subida/OCR —
    // dejarla montada y con el stream activo durante ese tiempo (antes se
    // liberaba hasta el final) deja una ventana donde un desmonte externo
    // (cerrar el diálogo, navegar, un re-render del padre) puede toparse con
    // el <video> todavía streameando y producir un "Failed to execute
    // 'removeChild'" al desmontarlo.
    stopWebcamStream();
    setHideWebcam(true);
    setHideButtonWebcam(false);
    setWebcamReady(false);

    const result = await uploadImageMutation.mutateAsync({ img: nuevoArchivo });
    if (result?.file_url) {
      const updatedImgs = [...(imgArray ?? []), result];
      setImg(updatedImgs);
      // Auto-analizar si tiene onOcrResult
      if (onOcrResult) {
        try {
          const urls = updatedImgs
            .map((i: Imagen) => i.file_url)
            .filter((url): url is string => Boolean(url));
          const result = await ocrMutation.mutateAsync(urls);
          onOcrResult?.(result);
        } catch {
          onOcrResult?.({});
        }
      }
    }
  }

  const handleButtonClick = () => {
    if (reachedLimit) return;
    fileInputRef.current?.click();
  };

  const Spinner = () => (
    <svg aria-hidden="true" className="w-4 h-4 animate-spin text-gray-200 fill-blue-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
    </svg>
  );

  return (
    <div className="w-full">

      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
        {!showPlaceholder && <Label>{titulo}</Label>}
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          <button
            type="button"
            onClick={cleanPhoto}
            title="Limpiar"
            className="bg-yellow-400 hover:bg-yellow-500 text-white w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm"
          >
            <Trash2 size={13} />
          </button>

          {showWebcamOption && !hideButtonWebcam && !reachedLimit && !isLoading && !ocrMutation.isPending && (
            <>
              {hideWebcam && !showCameraSelector && (
                <button
                  type="button"
                  title="Abrir cámara"
                  disabled={loadingWebcam}
                  className="bg-blue-500 hover:bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleOpenCamera}
                >
                  {loadingWebcam ? (
                    <svg className="w-3 h-3 animate-spin text-white" viewBox="0 0 100 101" fill="none">
                      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" opacity="0.3"/>
                      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                    </svg>
                  ) : (
                    <Camera size={13} />
                  )}
                </button>
              )}

              {!hideWebcam && !loadingWebcam && webcamReady && (
                <button
                  type="button"
                  onClick={takeAndSavePhoto}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 h-8 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-3 h-3 animate-spin text-white" viewBox="0 0 100 101" fill="none">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" opacity="0.3"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                      </svg>
                      Subiendo...
                    </>
                  ) : "Tomar foto"}
                </button>
              )}

              {!hideWebcam && !loadingWebcam && webcamReady && cameraOptions.length > 1 && (
                <button
                  type="button"
                  title="Cambiar cámara"
                  onClick={handleChangeCamera}
                  className="bg-slate-400 hover:bg-slate-500 text-white w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                >
                  <SwitchCamera size={13} />
                </button>
              )}
            </>
          )}

          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            capture={facingMode === "user" ? "user" : "environment"}
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleButtonClick}
            disabled={reachedLimit}
            title={reachedLimit ? `Límite de ${limit} archivos alcanzado` : "Subir archivo"}
            className="bg-violet-500 hover:bg-violet-600 text-white w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadCloud size={13} />
          </button>
        </div>
      </div>

      {reachedLimit && (
        <p className="text-red-400 text-xs mb-1">
          Límite de {limit} {limit === 1 ? "archivo" : "archivos"} alcanzado
        </p>
      )}

      {cameraError && (
        <p className="text-red-500 text-xs mb-1">{cameraError}</p>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-2" />
      {showPlaceholder && imgArray?.length === 0 && !isLoading && hideWebcam && (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl h-40 flex flex-col items-center justify-center gap-2 bg-slate-50">
          <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
            <Camera className="w-5 h-5 text-slate-400" />
          </div>
          {titulo && <p className="text-xs text-slate-400">{titulo}</p>}
        </div>
      )}
      {isLoading || ocrMutation.isPending ? (
      <div className="flex items-center gap-2 py-1">
        <Spinner />
        <span className="text-xs text-gray-400">
          {ocrMutation.isPending ? "Analizando imagen..." : "Subiendo..."}
        </span>
      </div>
    ) : (
        <>
          {showCameraSelector && (
            <div className="mt-1 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-600 mb-2">
                Selecciona la cámara para {titulo || "esta foto"}
              </p>
              <div className="flex flex-col gap-1.5">
                {cameraOptions.map((device, index) => (
                  <button
                    key={device.deviceId}
                    type="button"
                    onClick={() => handleSelectCamera(device.deviceId)}
                    className="text-left text-xs px-2 py-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border border-gray-100 transition-colors"
                  >
                    {device.label || `Cámara ${index + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!hideWebcam && (
            <div className="mt-1 w-48">
              {loadingWebcam && (
                <div className="w-48 h-36 rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-2">
                  <Spinner />
                  <span className="text-xs text-gray-400">Iniciando cámara...</span>
                </div>
              )}

              <div className={loadingWebcam ? "hidden" : "block"}>
                <WebcamErrorBoundary onError={() => {
                  stopWebcamStream();
                  setHideWebcam(true);
                  setHideButtonWebcam(false);
                  setWebcamReady(false);
                  setLoadingWebcam(false);
                }}>
                  <Webcam
                    key={selectedDeviceId ?? "default"}
                    ref={webcamRef}
                    audio={false}
                    height={180}
                    width={192}
                    className="w-48 h-36 object-cover rounded-xl"
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.92}
                    forceScreenshotSourceSize
                    mirrored={!selectedDeviceId && facingMode === "user"}
                    videoConstraints={videoConstraints}
                    onUserMediaError={handleUserMediaError}
                    onUserMedia={handleUserMedia}
                  />
                </WebcamErrorBoundary>
              </div>
            </div>
          )}
          {hideWebcam && imgArray?.length > 0  && showImage && (
            <div className="w-full flex flex-col items-center mt-1 gap-2">
              <Carousel className="w-52" setApi={setCarouselApi}>
                <CarouselContent>
                  {imgArray.map((a: Imagen, index: number) => {
                    const isVideo = a.file_url?.match(/\.(mp4|webm|ogg|mov|avi)$/i);
                    return (
                      <CarouselItem key={index}>
                        <div className="p-1 relative">
                          {isVideo ? (
                            <video controls className="w-full h-40 object-cover rounded-xl">
                              <source src={a.file_url} type="video/mp4" />
                            </video>
                          ) : (
                            <Image
                              height={160}
                              width={160}
                              src={a.file_url || "/nouser.svg"}
                              alt="Imagen"
                              className="w-full h-40 object-cover rounded-xl"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white text-xs rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                            title="Eliminar"
                          >
                            ×
                          </button>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                {imgArray.length > 1 && (
                  <>
                    <CarouselPrevious type="button" />
                    <CarouselNext type="button" />
                  </>
                )}
              </Carousel>
             
              {imgArray.length > 1 && (
                <div className="w-52 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                  <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
                    {imgArray.map((a: Imagen, index: number) => {
                      const isVideo = a.file_url?.match(/\.(mp4|webm|ogg|mov|avi)$/i);
                      const isActive = activeIndex === index;
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            setActiveIndex(index);
                            carouselApi?.scrollTo(index);
                          }}
                          onMouseEnter={() => {
                            setActiveIndex(index);
                            carouselApi?.scrollTo(index);
                          }}
                          className={`relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                            isActive ? "border-blue-500 scale-105" : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          {isVideo ? (
                            <video className="w-full h-full object-cover">
                              <source src={a.file_url} type="video/mp4" />
                            </video>
                          ) : (
                            <Image
                              height={48}
                              width={48}
                              src={a.file_url || "/nouser.svg"}
                              alt={`miniatura-${index}`}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {ocrResultChildren && (
        <div className="mt-2">
          {ocrResultChildren}
        </div>
      )}
    </div>
  );
};

export default LoadImage;