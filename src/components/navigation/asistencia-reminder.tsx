"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { useAsistencia } from "@/hooks/useAsistencia";

const CLOSED_KEY = "asistencia-reminder-closed";

// Aviso del diseño bajo el avatar: mientras el usuario esté Ausente, una vez por sesión.
export function AsistenciaReminder() {
  const { asistencia, setEstatus, isSaving } = useAsistencia();
  const [closed, setClosed] = React.useState(true);

  React.useEffect(() => {
    try {
      setClosed(sessionStorage.getItem(CLOSED_KEY) === "1");
    } catch {
      setClosed(false);
    }
  }, []);

  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem(CLOSED_KEY, "1");
    } catch {}
  };

  if (closed || asistencia?.estatus !== "ausente") return null;

  return (
    <div
      role="status"
      className="fixed top-[72px] right-3 md:right-4 z-[60] w-[calc(100%-24px)] max-w-[300px] flex items-start gap-3 py-3.5 pl-4 pr-3.5 rounded-[14px] bg-white shadow-[0_12px_32px_rgba(15,23,42,.16)] animate-in fade-in slide-in-from-top-2 duration-300">
      <span className="absolute -top-1.5 right-10 h-3 w-3 rotate-45 rounded-[2px] bg-white" />
      <span className="h-8 w-8 flex-shrink-0 rounded-[10px] bg-[#EFF6FF] text-[#2F80ED] flex items-center justify-center">
        <Check className="h-4 w-4" />
      </span>
      <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
        <span className="text-sm font-semibold text-slate-900">Registra tu asistencia</span>
        <span className="text-[13px] leading-[1.45] text-slate-500">
          Tu estatus es Ausente. Cámbialo a Disponible para registrar tu asistencia.
        </span>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => setEstatus("disponible", { onSuccess: close })}
          className="mt-2 self-start h-8 px-3 rounded-lg bg-[#2F80ED] text-xs font-semibold text-white transition-colors hover:bg-[#1E6FDB] disabled:opacity-60">
          {isSaving ? "Registrando…" : "Registrar Asistencia"}
        </button>
      </span>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={close}
        className="h-6 w-6 flex-shrink-0 rounded-md flex items-center justify-center text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
