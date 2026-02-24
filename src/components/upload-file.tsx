"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useUploadImage } from "@/hooks/useUploadImage";
import { Trash2, UploadCloud } from "lucide-react";
import {  reemplazarGuionMinuscula } from "@/lib/utils";
import { Imagen } from "./upload-Image";

interface CalendarDaysProps {
  id: string;
  titulo: string;
  setDocs: Dispatch<SetStateAction<Imagen[]>>;
  docArray: Imagen[];
  limit: number;
}

const LoadFile: React.FC<CalendarDaysProps> = ({ id, titulo, setDocs, docArray, limit }) => {
  const { uploadImageMutation, isLoading } = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: any) {
    const files: File[] = Array.from(event.target.files || []);
  
    const results = await Promise.all(
      files.map((file) => {
        const nuevoArchivo = new File(
          [file],
          reemplazarGuionMinuscula(id + " " + file.name),
          { type: file.type }
        );
        return uploadImageMutation.mutateAsync({ img: nuevoArchivo });
      })
    );
  
    const nuevos = results.filter(
      (r) => r?.file_url && !docArray.some((d) => d.file_url === r.file_url)
    );
    if (nuevos.length > 0) {
      setDocs((prev) => [...prev, ...nuevos]);
    }
  }
  function cleanPhoto() {
    setDocs([]);
  }

  useEffect(()=>{
    console.log("docArray",docArray)
  },[docArray])

  function removeFile(indexToRemove: number) {
    setDocs((prevDocs) => prevDocs.filter((_, index) => index !== indexToRemove));
  }

  const handleButtonClick = () => fileInputRef.current?.click();
  const isEmpty = !docArray || docArray.length === 0;

  const Spinner = () => (
    <svg aria-hidden="true" className="w-4 h-4 animate-spin text-gray-200 fill-blue-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
    </svg>
  );

  return (
    <div className="w-full">

      <div className="flex items-center justify-between mb-1">
        <Label>{titulo}</Label>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={cleanPhoto}
            title="Limpiar"
            className="bg-yellow-400 hover:bg-yellow-500 text-white w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm"
          >
            <Trash2 size={13} />
          </button>

          {docArray.length < limit && (
            <>
              <Input
                type="file"
                multiple
                accept={`
                  application/pdf,
                  application/msword,
                  application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                  application/vnd.ms-excel,
                  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
                  text/plain,
                  text/csv,
                  application/zip,
                  application/json,
                  application/xml,
                  application/vnd.oasis.opendocument.text,
                  application/vnd.oasis.opendocument.spreadsheet
                `}
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleButtonClick}
                title="Subir archivo"
                className="bg-violet-500 hover:bg-violet-600 text-white w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm"
              >
                <UploadCloud size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-2" />

      {isLoading ? (
        <div className="flex items-center gap-2 py-1">
          <Spinner />
          <span className="text-xs text-gray-400">Subiendo...</span>
        </div>
      ) : (
        <>
        

          {!isEmpty && (
            <ul className="space-y-1.5 max-h-[8.5rem] overflow-y-auto pr-1">
              {docArray.map((file, index) => (
                <li key={index} className="flex items-center justify-between gap-2 group">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-600 hover:underline truncate max-w-[180px]"
                    title={file.file_name}
                  >
                    {file.file_name}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="bg-black/40 hover:bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0 transition-colors"
                    title="Eliminar archivo"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default LoadFile;