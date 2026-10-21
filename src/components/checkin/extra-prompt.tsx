"use client";

import { useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAsistencia } from "@/hooks/useAsistencia";
import { cn } from "@/lib/utils";

// Pasada la salida de su turno, pregunta si sigue trabajando: si sí, la jornada
// queda en tiempo extra (y, si la política lo pide, con motivo y por autorizar);
// si no, pasa a Ausente. Si no contesta, el cierre automático la cierra a la hora de su salida.
export function ExtraPrompt() {
  const { asistencia, setEstatus, isSaving, confirmarExtra, isConfirmandoExtra } = useAsistencia();
  const pregunta = asistencia?.estatus === "disponible" ? asistencia.pregunta_extra : null;
  const [motivo, setMotivo] = useState("");
  const [otro, setOtro] = useState("");
  const ocupado = isSaving || isConfirmandoExtra;
  const motivos = pregunta?.motivos ?? [];
  const esOtro = motivo === "Otro";
  const texto = esOtro ? otro.trim() : motivo;
  const faltaMotivo = !!pregunta?.motivo_obligatorio && !texto;

  return (
    <Dialog open={!!pregunta}>
      <DialogContent className="max-w-[440px] rounded-[20px] [&>button:last-child]:hidden">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2F80ED]">
            <Clock className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-lg font-semibold text-slate-900">¿Sigues trabajando?</DialogTitle>
            <DialogDescription className="text-[13px] text-slate-500">
              Tu turno terminó a las {pregunta?.salida}. Si sigues, el tiempo de más cuenta como horas extra
              {pregunta?.requiere_autorizacion ? " y tu supervisor tendrá que autorizarlo." : "."}
            </DialogDescription>
          </div>
        </div>

        {motivos.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[.04em] text-slate-700">
              Motivo {pregunta?.motivo_obligatorio ? "" : <span className="font-normal normal-case text-slate-400">(opcional)</span>}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {motivos.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivo(m)}
                  className={cn(
                    "h-8 rounded-full border px-3 text-[13px] transition-colors",
                    motivo === m
                      ? "border-[#2F80ED] bg-[#EFF6FF] font-semibold text-[#2F80ED]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50",
                  )}>
                  {m}
                </button>
              ))}
            </div>
            {esOtro && (
              <input
                value={otro}
                onChange={(e) => setOtro(e.target.value)}
                placeholder="Cuéntanos por qué"
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#2F80ED]"
              />
            )}
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            disabled={ocupado}
            onClick={() => setEstatus("ausente")}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">
            Ya terminé
          </button>
          <button
            type="button"
            disabled={ocupado || faltaMotivo}
            onClick={() => confirmarExtra(texto || undefined)}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#2F80ED] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1E6FDB] disabled:opacity-50">
            {isConfirmandoExtra && <Loader2 className="h-4 w-4 animate-spin" />}
            Sí, sigo trabajando
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
