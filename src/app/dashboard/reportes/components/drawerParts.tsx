import React, { useEffect, useState } from "react";
import { MESES, fromISO } from "../reporte_asistencias/lib/period";
import { Skeleton } from "@/components/ui/skeleton";

// Piezas comunes de los paneles de detalle (día de empleado y turno de caseta)

export const CloseButton = ({ onClick, label = "Cerrar" }: { onClick: () => void; label?: string }) => (
  <button type="button" aria-label={label} onClick={onClick} className="h-9 w-9 flex-none rounded-lg border-none bg-c10-sunken text-lg text-c10-secondary hover:bg-c10-line">
    ×
  </button>
);

export const Fields = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-3 rounded-xl border border-c10-line bg-white p-3.5">{children}</div>
);

export const Field = ({ label, value, full, loading }: { label: string; value?: React.ReactNode; full?: boolean; loading?: boolean }) => (
  <div className={full ? "col-span-2" : ""}>
    <span className="block text-xs text-c10-meta">{label}</span>
    {loading ? <Skeleton className="mt-1 h-4 w-24" /> : <b className="tabular-nums text-c10-title">{value || "---"}</b>}
  </div>
);

export const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2.5 rounded-xl border border-c10-line bg-white p-3.5">
    <h3 className="m-0 text-sm font-bold text-c10-title">{title}</h3>
    {children}
  </div>
);

export const Warn = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg bg-orange-100 px-2.5 py-2 text-[13px] text-orange-800">{children}</div>
);

export type EvidencePhoto = {
  label: string;          // "Check in" / "Inicio de turno"
  stamp: "ENTRADA" | "SALIDA";
  url?: string;
  time?: string;          // HH:MM
  emptyText: string;      // texto cuando no hay foto
};

interface EvidencePhotosProps {
  photos: EvidencePhoto[];
  fecha: string;          // YYYY-MM-DD
  person?: string;
  registro?: string;      // ubicación · caseta
  loading?: boolean;
}

const fechaCorta = (fecha: string) => {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
};

// Foto con la franja de sello (ENTRADA HH:MM / fecha) como en la app
const StampedPhoto = ({ photo, fecha }: { photo: EvidencePhoto; fecha: string }) => (
  <span className="relative block h-full w-full">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={photo.url} alt={`Foto de ${photo.label.toLowerCase()}`} className="block h-full w-full object-cover" />
    <span className="absolute inset-x-0 bottom-0 flex flex-col bg-black/60 px-3 py-2 text-left text-white">
      <b className="text-[15px] leading-tight">{photo.stamp} {photo.time}</b>
      <span className="text-xs">{fechaCorta(fecha)}</span>
    </span>
  </span>
);

export const EvidencePhotos: React.FC<EvidencePhotosProps> = ({ photos, fecha, person, registro, loading }) => {
  const [open, setOpen] = useState<EvidencePhoto | null>(null);
  const d = fromISO(fecha);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      setOpen(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {photos.map(photo => (
          <figure key={photo.label} className="m-0 flex flex-col gap-1.5">
            {photo.url ? (
              <button
                type="button"
                aria-label={`Ampliar foto de ${photo.label.toLowerCase()}`}
                onClick={() => setOpen(photo)}
                className="block aspect-[4/5] w-full overflow-hidden rounded-[10px] border border-c10-line bg-c10-sunken p-0 hover:outline hover:outline-2 hover:outline-offset-1 hover:outline-[#2F80ED]"
              >
                <StampedPhoto photo={photo} fecha={fecha} />
              </button>
            ) : loading ? (
              <Skeleton className="aspect-[4/5] w-full rounded-[10px]" />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-[10px] border border-dashed border-c10-line-strong p-3 text-center text-xs text-c10-meta">
                {photo.emptyText}
              </div>
            )}
            <figcaption className="text-[13px] text-c10-secondary">
              <b className="text-c10-title">{photo.label}</b>
              {photo.url && photo.time ? ` · ${photo.time}` : ""}
              <br />
              {photo.url && registro ? registro : " "}
            </figcaption>
          </figure>
        ))}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto del registro"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(15,23,42,.8)] p-6"
          onClick={() => setOpen(null)}
        >
          <figure className="m-0 flex w-[min(380px,100%)] flex-col gap-2.5 rounded-[14px] bg-white p-3.5" onClick={e => e.stopPropagation()}>
            <div className="aspect-[4/5] overflow-hidden rounded-[10px]">
              <StampedPhoto photo={open} fecha={fecha} />
            </div>
            <figcaption className="flex items-start justify-between gap-3 text-[13px] text-c10-secondary">
              <div>
                <b className="text-sm text-c10-title">{open.label} · {open.time}</b>
                <br />
                {person ? `${person} · ` : ""}{d.getDate()} de {MESES[d.getMonth()]}
                {registro && (<><br />{registro}</>)}
              </div>
              <CloseButton onClick={() => setOpen(null)} label="Cerrar foto" />
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
};

// Marca para turnos que se cerraron solos con el siguiente check-in
export const AutoCloseMark = ({ text, label }: { text: string; label: string }) => (
  <span title={text} className="ml-1.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 3 2 21h20L12 3z" /><path d="M12 10v5M12 18v.5" /></svg>
    {label}
  </span>
);

// Permiso por horas dentro de un día trabajado
export const PartialPermitMark = ({ horas }: { horas: string }) => (
  <span className="ml-1.5 inline-flex whitespace-nowrap rounded-full bg-[#FCE7F3] px-2 py-0.5 text-[11px] font-semibold text-[#9D174D]">
    Permiso {horas}
  </span>
);
