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

  // Descarga una plantilla Excel con las columnas correctas y una fila de ejemplo
  const handleDescargarPlantilla = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["nombre", "email", "telefono"],
      ["Juan Pérez", "juan@ejemplo.com", "5512345678"],
    ]);

    // Ancho de columnas
    ws["!cols"] = [{ wch: 30 }, { wch: 35 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, "Miembros");
    XLSX.writeFile(wb, "plantilla_miembros.xlsx");
  };

  const parsearArchivo = (file: File): Promise<Miembro[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];

          // Intentar con encabezados primero
          const rowsWithHeaders: any[] = XLSX.utils.sheet_to_json(sheet);

          // Detectar si tiene encabezados reconocibles
          const primeraFila = rowsWithHeaders[0] || {};
          const tieneHeaders =
            "nombre" in primeraFila || "Nombre" in primeraFila ||
            "email" in primeraFila || "Email" in primeraFila ||
            "telefono" in primeraFila || "Teléfono" in primeraFila || "Telefono" in primeraFila;

          let miembros: Miembro[] = [];

          if (tieneHeaders) {
            // Parsear por nombre de columna
            miembros = rowsWithHeaders
              .filter((row) => row["nombre"] || row["Nombre"])
              .map((row) => ({
                id: crypto.randomUUID(),
                nombre: String(row["nombre"] || row["Nombre"] || "").trim(),
                email: String(row["email"] || row["Email"] || "").trim(),
                telefono: String(row["telefono"] || row["Teléfono"] || row["Telefono"] || "").trim(),
              }));
          } else {
            // Parsear por posición: col 0 = nombre, col 1 = email, col 2 = telefono
            const rowsByPos: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            miembros = rowsByPos
              .filter((row) => row.length > 0 && row[0]) // ignorar filas vacías
              .map((row) => ({
                id: crypto.randomUUID(),
                nombre: String(row[0] || "").trim(),
                email: String(row[1] || "").trim(),
                telefono: String(row[2] || "").trim(),
              }))
              .filter((m) => m.nombre); // solo si tiene nombre
          }

          if (!miembros.length) {
            reject(new Error("No se encontraron registros válidos en el archivo."));
            return;
          }

          resolve(miembros);
        } catch {
          reject(new Error("No se pudo leer el archivo. Verifica que sea un formato válido."));
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
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + 10;
      });
    }, 150);

    try {
      const miembros = await parsearArchivo(file);
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
      setUploadProgress(0);
      setError(err.message);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files[0] || null);
  };

  const ext = archivoSubido?.name.split(".").pop()?.toUpperCase() || "XLSX";

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
          <p className="text-xs text-gray-300 mt-1">Formatos: xlsx, xls, ods, csv</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.ods,.csv"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
        </div>

        {/* Texto informativo de columnas */}
        <p className="text-xs text-gray-400 mt-3 text-center leading-relaxed">
          El archivo debe tener columnas <span className="font-medium text-gray-500">nombre</span>,{" "}
          <span className="font-medium text-gray-500">email</span> y{" "}
          <span className="font-medium text-gray-500">telefono</span>. Si no tiene encabezados,
          se usa la posición: col 1 = nombre, col 2 = email, col 3 = teléfono.
        </p>

        {/* Botón descargar plantilla — siempre activo */}
        <button
          type="button"
          onClick={handleDescargarPlantilla}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mt-3 mx-auto transition-colors"
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
                <div className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">{ext}</div>
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