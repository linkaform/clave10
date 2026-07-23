"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import { useGetInspeccionRecord, InspeccionSection, FieldValue, EvidenciaFile } from "@/hooks/useGetInspeccionRecord";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { cn } from "@/lib/utils";

function tipoLabel(tipo: string): string {
  const base = tipo.replace(/^salida_/, "").replace(/_\d+$/, "");
  const unit = tipo.match(/_(\d+)$/)?.[1];
  const suffix = unit ? ` · Unidad ${unit}` : "";
  const isSalida = tipo.startsWith("salida_");
  const prefix = isSalida ? "Inspección de salida" : "Inspección de entrada";
  if (base === "tractor") return `${prefix} · Tractor / Cabezal`;
  if (base === "remolque") return `${prefix} · Remolque${suffix}`;
  if (base === "contenedor") return `${prefix} · Contenedor${suffix}`;
  if (base === "sello") return "Inspección de sello";
  return tipo;
}

// Contenido reusable de una inspección — se usa tanto en el modal flotante
// (InspeccionRecordModal) como incrustado directamente en un tab que ya
// muestra "Inspección ya realizada", sin necesidad de abrir nada aparte.
export function InspeccionRecordContent({ url, tipo }: { url: string; tipo: string }) {
  const { data, isLoading, error } = useGetInspeccionRecord(url, tipo);

  return (
    <div className="space-y-5">
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <span className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-semibold">Error al cargar la inspección</p>
        </div>
      )}
      {!isLoading && !error && data && data.secciones.map((sec) => (
        <SectionBlock key={sec.titulo} section={sec} />
      ))}
    </div>
  );
}

export function InspeccionRecordModal({
  url,
  tipo,
  onClose,
}: {
  url: string;
  tipo: string;
  onClose: () => void;
}) {
  const { data } = useGetInspeccionRecord(url, tipo);
  useBodyScrollLock(true);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{tipoLabel(tipo)}</p>
              {data?.folio && (
                <p className="text-[10px] text-gray-400 mt-0.5">Folio {data.folio} · {data.createdAt?.split(" ")[0] ?? ""}</p>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <InspeccionRecordContent url={url} tipo={tipo} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose}
            className="w-full h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SectionBlock({ section }: { section: InspeccionSection }) {
  const isMedidas = section.titulo === "Medidas interiores";
  const isEvidencia = section.titulo === "Evidencia fotográfica" || section.titulo === "Fotos y documentos";

  if (isMedidas) return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{section.titulo}</p>
      <div className="flex items-center bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
        {section.campos.map((c, i) => (
          <div key={c.key} className={cn(
            "flex-1 px-4 py-2.5 text-center",
            i < section.campos.length - 1 ? "border-r border-gray-200" : ""
          )}>
            <p className="text-[10px] text-gray-400 mb-0.5">{c.label}</p>
            <p className="text-sm font-bold text-gray-800">
              {c.value.kind === "text" ? (c.value.value || "—") : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  if (isEvidencia) return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{section.titulo}</p>
      <div className="grid grid-cols-2 gap-3">
        {section.campos.map((c) => (
          <PhotoCard key={c.key} label={c.label} value={c.value} />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{section.titulo}</p>
      <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
        {section.campos.map((c) => (
          <FieldRow key={c.key} label={c.label} value={c.value} />
        ))}
      </div>
    </div>
  );
}

function PhotoCard({ label, value }: { label: string; value: FieldValue }) {
  const files: EvidenciaFile[] = value.kind === "photos" ? value.files : [];
  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
      {files.length > 0 ? (
        <a href={files[0].file_url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition-opacity relative w-full h-36">
          <Image src={files[0].file_url} alt={label} fill className="object-cover" unoptimized />
        </a>
      ) : (
        <div className="w-full h-36 flex items-center justify-center bg-gray-100">
          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
      )}
      <p className="text-[10px] font-semibold text-gray-500 px-3 py-2">{label}</p>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: FieldValue }) {
  const comment = (value.kind === "bool" || value.kind === "array") ? value.comment : undefined;
  const evidencia = (value.kind === "bool" || value.kind === "array") ? value.evidencia : undefined;
  const hasExtra = !!comment || (evidencia && evidencia.length > 0);
  return (
    <div className="px-4 py-2.5 bg-white space-y-2">
      <div className="flex items-start gap-3">
        <span className="text-xs text-gray-600 flex-1 leading-relaxed">{label}</span>
        <FieldBadge value={value} />
      </div>
      {hasExtra && (
        <div className="pl-1 space-y-1.5">
          {comment && (
            <p className="text-[11px] text-gray-500 italic leading-relaxed">&ldquo;{comment}&rdquo;</p>
          )}
          {evidencia && evidencia.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {evidencia.map((f: EvidenciaFile, i: number) => (
                <a key={i} href={f.file_url} target="_blank" rel="noopener noreferrer"
                  className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 block hover:opacity-80 transition-opacity">
                  <Image src={f.file_url} alt={f.file_name} fill className="object-cover" unoptimized />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldBadge({ value }: { value: FieldValue }) {
  if (value.kind === "bool") {
    const isSi = value.value;
    return (
      <div className="flex items-center gap-1 shrink-0">
        <span className={cn(
          "text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all",
          isSi
            ? "bg-green-500 border-green-500 text-white"
            : "bg-white border-gray-200 text-gray-300",
        )}>Sí</span>
        <span className={cn(
          "text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all",
          !isSi
            ? "bg-red-500 border-red-500 text-white"
            : "bg-white border-gray-200 text-gray-300",
        )}>No</span>
      </div>
    );
  }

  if (value.kind === "array") {
    if (value.items.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 shrink-0">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          Sin hallazgos
        </span>
      );
    }
    return (
      <div className="flex flex-wrap gap-1 justify-end">
        {value.items.map((item) => (
          <span key={item} className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize",
            "bg-amber-50 border-amber-200 text-amber-700"
          )}>
            {item}
          </span>
        ))}
      </div>
    );
  }

  if (value.kind === "photos") return null;
  return <span className="text-xs text-gray-700 font-semibold shrink-0">{value.value || "—"}</span>;
}
