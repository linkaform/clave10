'use client';

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { CloudUpload, Download, X } from "lucide-react";
import * as XLSX from "xlsx";

export interface Miembro {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
}

interface ImportarMiembrosModalProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  onImportar: (miembros: Miembro[]) => void;
}

const ImportarMiembrosModal: React.FC<ImportarMiembrosModalProps> = ({ open, setOpen, onImportar }) => {
  const [archivoSubido, setArchivoSubido] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setArchivoSubido(null);
    setUploadProgress(0);
    setUploading(false);
    setError(null);
  };

  const parsearXlsx = (file: File): Promise<Miembro[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet);

          const miembros: Miembro[] = rows
            .filter((row) => row["Nombre"] || row["nombre"])
            .map((row) => ({
              id: crypto.randomUUID(),
              nombre: String(row["Nombre"] || row["nombre"] || "").trim(),
              email: String(row["Email"] || row["email"] || "").trim(),
              telefono: String(row["Teléfono"] || row["Telefono"] || row["telefono"] || "").trim(),
            }));

          resolve(miembros);
        } catch {
          reject(new Error("No se pudo leer el archivo. Verifica que sea un xlsx válido."));
        }
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo."));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setArchivoSubido(file);
    setUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 10;
      });
    }, 150);

    try {
      const miembros = await parsearXlsx(file);
      clearInterval(interval);
      setUploadProgress(100);
      setUploading(false);

      setTimeout(() => {
        onImportar(miembros);
        reset();
        setOpen(false);
      }, 600);
    } catch (err: any) {
      clearInterval(interval);
      setUploading(false);
      setError(err.message);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files[0] || null);
  };

  const handleDescargarPlantilla = () => {
    if (!archivoSubido) return;
    const url = URL.createObjectURL(archivoSubido);
    const a = document.createElement("a");
    a.href = url;
    a.download = archivoSubido.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogContent className="max-w-sm rounded-2xl p-6 border-none" aria-describedby="">
        <DialogTitle className="text-lg font-bold text-gray-800 mb-4">Importar Miembros</DialogTitle>

        <div
          className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center py-10 px-4 bg-gray-50 cursor-pointer hover:border-blue-300 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudUpload className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400 text-center">Elige un archivo o arrástralo y suéltalo aquí</p>
          <p className="text-xs text-gray-300 mt-1">Formatos compatibles: xlsx</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
        </div>

        <button
          type="button"
          onClick={handleDescargarPlantilla}
          disabled={!archivoSubido}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mt-3 mx-auto transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Descargar plantilla
        </button>

        {error && (
          <p className="text-xs text-red-500 mt-3 text-center">{error}</p>
        )}

        {archivoSubido && (
          <div className="mt-4 border border-gray-100 rounded-xl p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">XLSX</div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">{archivoSubido.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {Math.round(archivoSubido.size / 1024)} KB
                    {uploading ? " · Leyendo..." : " · Completado"}
                  </p>
                </div>
              </div>
              <button type="button" onClick={reset} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <DialogClose asChild>
          <Button type="button" variant="outline" className="w-full rounded-xl border-gray-200 text-gray-600 mt-4">
            Cerrar
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default ImportarMiembrosModal;