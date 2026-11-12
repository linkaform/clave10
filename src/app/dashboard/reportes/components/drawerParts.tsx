import React, { useEffect, useState } from "react";
import { MESES, fromISO } from "../reporte_asistencias/lib/period";
import { Skeleton } from "@/components/ui/skeleton";

// Piezas comunes de los paneles de detalle (día de empleado y turno de caseta)

export const CloseButton = ({ onClick, label = "Cerrar" }: { onClick: () => void; label?: string }) => (
  <button type="button" aria-label={label} title={label} onClick={onClick} className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-c10-sunken text-c10-secondary transition-colors hover:bg-c10-blue-light hover:text-button-primary">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
  </button>
);

const WIDTH_KEY = "c10-detail-w";
const readWidth = () => {
  try {
    const w = Number(localStorage.getItem(WIDTH_KEY));
    return w >= 480 && w <= 1440 ? w : 640;
  } catch {
    return 640;
  }
};

// Panel lateral derecho: entra deslizándose, ancho ajustable arrastrando el borde izquierdo (480–1440 px)
export const DrawerShell = ({ title, subtitle, chips, onClose, children, labelledBy }: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  chips?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy: string;
}) => {
  const [width, setWidth] = useState(640);
  useEffect(() => setWidth(readWidth()), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const drag = (e: React.MouseEvent) => {
    e.preventDefault();
    let last = width;
    const mv = (ev: MouseEvent) => {
      last = Math.max(480, Math.min(1440, window.innerWidth - ev.clientX));
      setWidth(last);
    };
    const up = () => {
      window.removeEventListener("mousemove", mv);
      window.removeEventListener("mouseup", up);
      try { localStorage.setItem(WIDTH_KEY, String(last)); } catch { /* sin almacenamiento */ }
    };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
  };
  return (
    <>
      <div className="fixed inset-0 z-[55] animate-in fade-in bg-slate-900/20 duration-200" onClick={onClose} />
      <aside
        role="dialog"
        aria-labelledby={labelledBy}
        style={{ width: `min(${width}px, 100%)` }}
        className="fixed bottom-0 right-0 top-0 z-[60] flex animate-in slide-in-from-right flex-col bg-c10-surface shadow-[0_20px_40px_rgba(15,23,42,.25)] duration-[250ms]"
      >
        <span onMouseDown={drag} aria-hidden="true" className="absolute -left-1 bottom-0 top-0 w-2 cursor-col-resize hover:bg-c10-blue-light/60 max-md:hidden" />
        <header className="flex items-start justify-between gap-3 border-b border-c10-line px-6 pb-4 pt-5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 id={labelledBy} className="m-0 text-xl font-semibold tracking-[-.02em] text-c10-title">{title}</h2>
            {subtitle && <div className="text-[13px] text-c10-secondary">{subtitle}</div>}
            {chips && <div className="flex flex-wrap items-center gap-1.5">{chips}</div>}
          </div>
          <CloseButton onClick={onClose} />
        </header>
        <div className="flex flex-1 flex-col gap-3 overflow-auto bg-c10-panel px-6 py-5">{children}</div>
      </aside>
    </>
  );
};

export const Fields = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 rounded-xl bg-c10-surface p-5 shadow-[0_0_0_1px_var(--c10-line-card)]">{children}</div>
);

export const Field = ({ label, value, full, loading }: { label: string; value?: React.ReactNode; full?: boolean; loading?: boolean }) => (
  <div className={full ? "col-span-full" : ""}>
    <span className="block text-[11px] font-medium uppercase tracking-[.05em] text-c10-faint">{label.replace(/:$/, "")}</span>
    {loading ? <Skeleton className="mt-1 h-4 w-24" /> : <span className="mt-0.5 block text-sm font-medium tabular-nums text-c10-title">{value || "---"}</span>}
  </div>
);

export const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-3 rounded-xl bg-c10-surface p-5 shadow-[0_0_0_1px_var(--c10-line-card)]">
    <h3 className="m-0 text-base font-semibold text-c10-title">{title}</h3>
    {children}
  </div>
);

export const Warn = ({ children }: { children: React.ReactNode }) => (
  <div className="w-fit rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[13px] text-orange-700">{children}</div>
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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,200px))] gap-3">
        {photos.map(photo => (
          <figure key={photo.label} className="m-0 flex flex-col gap-1.5">
            {photo.url ? (
              <button
                type="button"
                aria-label={`Ampliar foto de ${photo.label.toLowerCase()}`}
                onClick={() => setOpen(photo)}
                className="block aspect-[4/5] w-full overflow-hidden rounded-[10px] border border-c10-line bg-c10-sunken p-0 hover:outline hover:outline-2 hover:outline-offset-1 hover:outline-button-primary"
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-6"
          onClick={() => setOpen(null)}
        >
          <figure className="m-0 flex w-[min(380px,100%)] flex-col gap-2.5 rounded-[14px] bg-c10-surface p-3.5" onClick={e => e.stopPropagation()}>
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
  <span className="ml-1.5 inline-flex whitespace-nowrap rounded-full bg-pink-100 px-2 py-0.5 text-[11px] font-semibold text-pink-700">
    Permiso {horas}
  </span>
);
