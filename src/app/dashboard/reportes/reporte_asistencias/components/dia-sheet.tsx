"use client";

import { useQuery } from "@tanstack/react-query";
import { Camera, LogIn, LogOut, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getReporteDia, type Foto } from "@/lib/asistencia-sdk";
import { Cargando } from "./hoy-view";
import { estilo, hhmm, horas } from "./estados";

const FECHA = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

// Detalle de un día de una persona: lo que le tocaba (turno) y lo que hizo (jornada y Check In).
export function DiaSheet({
  sel,
  onClose,
}: {
  sel: { userId: number; fecha: string } | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["reporteDia", sel?.userId, sel?.fecha],
    queryFn: () => getReporteDia(sel!.userId, sel!.fecha),
    enabled: !!sel,
  });
  const s = data ? estilo(data.estado) : null;

  return (
    <Sheet open={!!sel} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{data?.nombre || "Detalle del día"}</SheetTitle>
          <SheetDescription>
            {sel ? FECHA.format(new Date(`${sel.fecha}T00:00:00Z`)) : ""}
          </SheetDescription>
        </SheetHeader>

        {isLoading || !data ? (
          <Cargando />
        ) : (
          <div className="flex flex-col gap-5 px-4 pb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Dato label="Horario" value={data.horario || "Sin horario"} />
              <Dato label="Turno" value={data.turno ? `${data.turno.entrada}–${data.turno.salida}` : "Sin turno"} />
              <Dato label="Llegó" value={hhmm(data.jornada?.inicio)} />
              <Dato label="Salió" value={data.jornada?.cierre ? hhmm(data.jornada.cierre) : data.jornada ? "En jornada" : "—"} />
              <Dato label="Horas" value={horas(data.jornada?.horas)} />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[.04em] text-slate-500">Estado</div>
                {s && <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.pill}`}>{s.label}</span>}
              </div>
            </div>
            {data.jornada?.tipo_cierre === "automatico" && (
              <div className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-[13px] text-[#1E6FDB]">
                La jornada se cerró sola: no pasó a Ausente.
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[.04em] text-slate-500">
                Check In ({data.checkins.length})
              </div>
              {data.checkins.length === 0 && <div className="text-sm text-slate-400">No hizo Check In este día.</div>}
              {data.checkins.map((c) => (
                <div key={c.folio} className="rounded-xl border border-slate-200 p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {[c.ubicacion, c.caseta].filter(Boolean).join(" · ") || "Sin lugar"}
                    </div>
                    {c.rol && <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-xs font-semibold text-[#2F80ED]">{c.rol}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-[13px] text-slate-600 tabular-nums">
                    <span className="flex items-center gap-1"><LogIn className="h-3.5 w-3.5" />{hhmm(c.desde)}</span>
                    <span className="flex items-center gap-1"><LogOut className="h-3.5 w-3.5" />{c.hasta ? hhmm(c.hasta) : "Abierto"}</span>
                    {c.horas != null && <span>{horas(c.horas)}</span>}
                    {c.tipo_out === "automatico" && <span className="text-slate-400">Cierre automático</span>}
                  </div>
                  {c.suplente && <div className="text-[13px] text-violet-700">Suplente: {c.suplente}</div>}
                  {c.comentario && <div className="text-[13px] text-slate-500">{c.comentario}</div>}
                  <div className="grid grid-cols-2 gap-2">
                    <FotoBox label="Entrada" fotos={c.foto_in} />
                    <FotoBox label="Salida" fotos={c.foto_out} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[.04em] text-slate-500">{label}</div>
      <div className="mt-0.5 text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}

function FotoBox({ label, fotos }: { label: string; fotos: Foto[] }) {
  const url = fotos?.[0]?.file_url;
  return (
    <a
      href={url || undefined}
      target="_blank"
      rel="noreferrer"
      className={`relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center ${url ? "" : "pointer-events-none"}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`Foto de ${label.toLowerCase()}`} className="h-full w-full object-cover" />
      ) : (
        <Camera className="h-5 w-5 text-slate-300" />
      )}
      <span className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 text-[11px] text-slate-600">{label}</span>
    </a>
  );
}
