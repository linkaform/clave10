"use client";

import { Clock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAsistencia } from "@/hooks/useAsistencia";

// Pasada la salida de su turno, pregunta si sigue trabajando: si sí, la jornada
// queda en tiempo extra; si no, pasa a Ausente. Si no contesta, el cierre
// automático la cierra a la hora de su salida.
export function ExtraPrompt() {
  const { asistencia, setEstatus, isSaving, confirmarExtra, isConfirmandoExtra } = useAsistencia();
  const pregunta = asistencia?.estatus === "disponible" ? asistencia.pregunta_extra : null;
  const ocupado = isSaving || isConfirmandoExtra;

  return (
    <Dialog open={!!pregunta}>
      <DialogContent className="max-w-[420px] rounded-[20px] [&>button:last-child]:hidden">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2F80ED]">
            <Clock className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-lg font-semibold text-slate-900">¿Sigues trabajando?</DialogTitle>
            <DialogDescription className="text-[13px] text-slate-500">
              Tu turno terminó a las {pregunta?.salida}. Si sigues, el tiempo de más cuenta como horas extra.
            </DialogDescription>
          </div>
        </div>
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
            disabled={ocupado}
            onClick={() => confirmarExtra()}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#2F80ED] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1E6FDB] disabled:opacity-50">
            {isConfirmandoExtra && <Loader2 className="h-4 w-4 animate-spin" />}
            Sí, sigo trabajando
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
