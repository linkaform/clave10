"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useUploadImage } from "@/hooks/useUploadImage";
import { Camera, Trash2, UploadCloud } from "lucide-react";
import Webcam from "react-webcam";
import { base64ToFile, quitarAcentosYMinusculasYEspacios } from "@/lib/utils";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";

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
  limit?: number; // ← opcional, default 50
}

const LoadImage: React.FC<CalendarDaysProps> = ({
  id,
  titulo,
  setImg,
  showWebcamOption,
  facingMode,
  imgArray,
  limit = 50, // ← default 50
}) => {
  const [loadingWebcam, setLoadingWebcam] = useState(false);
  const [hideWebcam, setHideWebcam] = useState(true);
  const [hideButtonWebcam, setHideButtonWebcam] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const { uploadImageMutation, isLoading } = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const webcamRef = useRef<Webcam | null>(null);
  const videoConstraints = { width: 320, height: 240, facingMode };

  const reachedLimit = (imgArray?.length ?? 0) >= limit;

  async function handleFileChange(event: any) {
    const files: File[] = Array.from(event.target.files || []);
    if (!files.length) return;

    const espaciosDisponibles = limit - (imgArray?.length ?? 0);
    const filesToUpload = files.slice(0, espaciosDisponibles);

    const results = await Promise.all(
      filesToUpload.map((file) => {
        const tipoMime = file.type;
        const extension = tipoMime.split("/")[1];
        const nuevoNombre = `${quitarAcentosYMinusculasYEspacios(id)}.${extension}`;
        const nuevoArchivo = new File([file], nuevoNombre, { type: file.type });
        return uploadImageMutation.mutateAsync({ img: nuevoArchivo });
      })
    );

    const nuevos = results.filter(
      (r) => r?.file_url && !imgArray?.some((i: Imagen) => i.file_url === r.file_url)
    );
    if (nuevos.length > 0) setImg([...(imgArray ?? []), ...nuevos]);

    setHideWebcam(true);
    setHideButtonWebcam(false);

    // limpiar input para permitir subir el mismo archivo de nuevo
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function cleanPhoto() {
    setImg([]);
    setHideWebcam(true);
    setHideButtonWebcam(false);
    setWebcamReady(false);
  }

  function removeImage(indexToRemove: number) {
    const newArray = imgArray.filter((_: any, index: number) => index !== indexToRemove);
    setImg(newArray);
    if (newArray.length === 0) cleanPhoto();
  }

  function handleOpenCamera() {
    setWebcamReady(false);
    setLoadingWebcam(true);
    setHideWebcam(false);
  }

  function handleUserMedia() {
    setTimeout(() => {
      setLoadingWebcam(false);
      setWebcamReady(true);
    }, 1000);
  }

  async function takeAndSavePhoto() {
    if (reachedLimit) return;

    const imageSrc = webcamRef.current?.getScreenshot() || "";
    const base64 = base64ToFile(imageSrc, quitarAcentosYMinusculasYEspacios(id));
    const tipoMime = base64.type;
    const extension = tipoMime.split("/")[1];
    const nuevoNombre = `${quitarAcentosYMinusculasYEspacios(id)}.${extension}`;
    const nuevoArchivo = new File([base64], nuevoNombre, { type: base64.type });

    const result = await uploadImageMutation.mutateAsync({ img: nuevoArchivo });
    if (result?.file_url) setImg([...(imgArray ?? []), result]);

    setHideWebcam(true);
    setHideButtonWebcam(false);
    setWebcamReady(false);
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
          <Label>{titulo}</Label>
          {/* <span className={`text-xs font-medium ${reachedLimit ? "text-red-400" : "text-gray-400"}`}>
            {imgArray?.length ?? 0}/{limit}
          </span> */}
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

          {showWebcamOption && !hideButtonWebcam && !reachedLimit && (
            <>
              {hideWebcam && (
                <button
                  type="button"
                  title="Abrir cámara"
                  className="bg-blue-500 hover:bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                  onClick={handleOpenCamera}
                >
                  <Camera size={13} />
                </button>
              )}

              {!hideWebcam && !loadingWebcam && webcamReady && (
                <button
                  type="button"
                  onClick={takeAndSavePhoto}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 h-7 rounded-lg transition-colors shadow-sm"
                >
                  Tomar foto
                </button>
              )}
            </>
          )}

          <Input
            type="file"
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
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

      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-2" />

      {isLoading ? (
        <div className="flex items-center gap-2 py-1">
          <Spinner />
          <span className="text-xs text-gray-400">Subiendo...</span>
        </div>
      ) : (
        <>
          {!hideWebcam && (
            <div className="mt-1 w-48">
              {loadingWebcam && (
                <div className="w-48 h-36 rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-2">
                  <Spinner />
                  <span className="text-xs text-gray-400">Iniciando cámara...</span>
                </div>
              )}

              <div className={loadingWebcam ? "hidden" : "block"}>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  height={180}
                  width={192}
                  className="w-48 h-36 object-cover rounded-xl"
                  screenshotFormat="image/jpeg"
                  mirrored={facingMode === "user"}
                  videoConstraints={videoConstraints}
                  onUserMediaError={handleUserMedia}
                  onUserMedia={handleUserMedia}
                />
              </div>
            </div>
          )}

          {hideWebcam && imgArray?.length > 0 && (
            <div className="w-full flex justify-center mt-1">
              <Carousel className="w-52">
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
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LoadImage;