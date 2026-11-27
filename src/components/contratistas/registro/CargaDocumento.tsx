"use client";
// RG-02 · Piezas de los pasos con documento (REPSE y CSF): zona para arrastrar o elegir
// el PDF, "Leyendo tu documento..." y la fila del archivo con Ver / Cambiar.
// Diseño: registro.dc.html 102–133 y 205–213.
import { useId, useRef, useState, type ReactNode } from "react";
import { Check, FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Boton } from "../ui";
import { DOCUMENTO_VACIO, MAX_PDF_MB, errorPdf } from "./documentos";
import type { DatosRegistro } from "./pasos";
import type { PasoProps } from "./PasosTipo";

/** Zona punteada: clic para elegir o arrastrar un PDF. Valida en el paso, no aquí. */
export function ZonaCarga({ titulo, onArchivo, error }: { titulo: string; onArchivo: (f: File) => void; error?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);
  const idError = useId();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => {
          e.preventDefault();
          setEncima(false);
          const f = e.dataTransfer.files[0];
          if (f) onArchivo(f);
        }}
        aria-describedby={error ? idError : undefined}
        className={cn(
          "flex w-full flex-col items-center gap-2.5 rounded-xl border-2 border-dashed px-6 py-12 text-center outline-none transition-colors duration-150",
          "focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,.15)]",
          error ? "border-red-300 bg-c10-red-subtle" : encima ? "border-c10-acc bg-c10-acc-subtle" : "border-c10-acc-border bg-c10-acc-subtle hover:border-c10-acc",
        )}
      >
        <span aria-hidden className="mb-1 flex size-[60px] items-center justify-center rounded-xl bg-c10-acc-l text-c10-acc">
          <Upload className="size-[26px]" />
        </span>
        <span className="text-base font-bold text-c10-title">{titulo}</span>
        <span className="text-sm text-c10-secondary">o haz clic para seleccionar archivo</span>
        <span className="text-xs text-c10-faint">PDF · Máximo {MAX_PDF_MB} MB</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = ""; // permite volver a elegir el mismo archivo
          if (f) onArchivo(f);
        }}
      />
      {error && (
        <span id={idError} role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}

/** Hoja con renglones y una línea que la recorre, mientras se extraen los datos. */
export function LeyendoDocumento() {
  return (
    <div role="status" className="flex flex-col items-center gap-4 rounded-xl border-2 border-c10-acc-border bg-c10-acc-subtle px-6 py-11">
      <span aria-hidden className="relative block h-28 w-[88px] overflow-hidden rounded-lg bg-c10-surface shadow-[0_0_0_1px_var(--c10-line),0_1px_2px_rgba(15,23,42,.06)]">
        {[16, 32, 22, 40, 28].map((derecha, i) => (
          <span key={i} className="absolute left-3.5 h-1.5 rounded-full bg-c10-line" style={{ right: derecha, top: 18 + i * 16 }} />
        ))}
        <span
          className="absolute inset-x-0 h-0.5 bg-c10-acc shadow-[0_0_10px_2px_rgba(47,128,237,.5)]"
          style={{ animation: "c10-escaneo 1400ms ease-in-out infinite" }}
        />
      </span>
      <span className="text-base font-bold text-c10-title">Leyendo tu documento...</span>
      <span aria-hidden className="relative h-1 w-48 overflow-hidden rounded-full bg-c10-acc-l">
        <span className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-c10-acc" style={{ animation: "shimmer 1.2s ease-in-out infinite" }} />
      </span>
    </div>
  );
}

/** Archivo subido: nombre, "Ver documento" (abre el PDF) y "Cambiar archivo". */
export function ArchivoSubido({ archivo, onCambiar }: { archivo: File; onCambiar: () => void }) {
  const ver = () => {
    const u = URL.createObjectURL(archivo);
    window.open(u, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(u), 60_000);
  };
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-c10-panel px-4 py-3">
      <span className="flex min-w-0 flex-1 items-center gap-2.5">
        <FileText className="size-[18px] shrink-0 text-red-600" aria-hidden />
        <span className="truncate text-sm font-medium text-c10-title" title={archivo.name}>
          {archivo.name}
        </span>
      </span>
      <Boton variante="texto" onClick={ver}>
        Ver documento
      </Boton>
      <Boton variante="texto" onClick={onCambiar} className="font-medium">
        Cambiar archivo
      </Boton>
    </div>
  );
}

/** "Omitir por ahora", centrado bajo la zona de carga. */
export function Omitir({ onClick }: { onClick: () => void }) {
  return (
    <Boton variante="texto" onClick={onClick} className="self-center">
      Omitir por ahora
    </Boton>
  );
}

/** Encabezado verde "Datos extraídos" (o "Confirma tus datos") con su instrucción. */
export function DatosExtraidos({ titulo = "Datos extraídos", children }: { titulo?: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
        <Check className="size-[18px]" strokeWidth={2.5} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold text-c10-title">{titulo}</span>
        <span className="text-[13px] text-c10-meta">
          {children ?? "Verifica que la información sea correcta. Si algo no coincide, puedes editarlo."}
        </span>
      </span>
    </div>
  );
}

/**
 * Valida el PDF, pone el paso en "leyendo", lee y deja los datos en "listo". Si mientras
 * leía cambiaron el archivo, descarta el resultado; si falla, regresa a vacío con el error.
 */
export async function subirDocumento<K extends "repse" | "csf">(
  clave: K,
  archivo: File,
  leer: (f: File) => Promise<NonNullable<DatosRegistro[K]["datos"]>>,
  set: PasoProps["set"],
) {
  const error = errorPdf(archivo);
  if (error) return set({ [clave]: { ...DOCUMENTO_VACIO, error } });
  set({ [clave]: { ...DOCUMENTO_VACIO, estado: "leyendo", archivo } });
  try {
    const datos = await leer(archivo);
    set((d) => (d[clave].archivo === archivo ? { [clave]: { estado: "listo", archivo, datos, omitido: false } } : {}));
  } catch {
    set((d) => (d[clave].archivo === archivo ? { [clave]: { ...DOCUMENTO_VACIO, error: "No se pudo leer el documento. Intenta de nuevo." } } : {}));
  }
}
