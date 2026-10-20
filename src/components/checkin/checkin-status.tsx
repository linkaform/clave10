"use client";

import * as React from "react";
import { Clock, History, LogIn, LogOut } from "lucide-react";
import { useCheckIn, useCheckInAction } from "@/hooks/useCheckIn";
import { useAsistencia } from "@/hooks/useAsistencia";

const hhmm = (fecha?: string | null) => (fecha ? fecha.slice(11, 16) : "");

function formatCierre(fecha: string) {
  const d = new Date(fecha.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return fecha;
  const dia = d.toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short" });
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} a las ${hhmm(fecha)} h`;
}

// Línea bajo el saludo: rol + hora del Check In, o el último cierre de asistencia.
function Detail() {
  const { checkIn } = useCheckIn();
  const { asistencia } = useAsistencia();

  if (checkIn) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
        {checkIn.suplente && (
          <span className="h-[22px] px-[9px] rounded-full bg-violet-600/10 text-xs font-semibold text-violet-600 flex items-center">
            Suplente · {checkIn.suplente}
          </span>
        )}
        {checkIn.rol && (
          <span className="h-[22px] px-[9px] rounded-full bg-[#EFF6FF] text-xs font-semibold text-[#2F80ED] flex items-center">
            {checkIn.rol}
          </span>
        )}
        <span className="flex items-center gap-1.5 tabular-nums">
          <Clock className="h-3.5 w-3.5" />
          Check In a las {hhmm(checkIn.desde)} h
        </span>
      </div>
    );
  }
  if (asistencia?.estatus === "ausente" && asistencia.ultimo_cierre) {
    return (
      <div className="flex items-center gap-1.5 text-[13px] text-slate-500 tabular-nums">
        <History className="h-3.5 w-3.5" />
        Último cierre {formatCierre(asistencia.ultimo_cierre)}
      </div>
    );
  }
  return null;
}

// Píldora a la derecha del saludo: lugar actual + Check Out, o botón de Check In.
function Pill() {
  const { checkIn, run } = useCheckInAction();

  if (checkIn) {
    return (
      <div className="h-9 pl-3.5 pr-1 rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,.05)] flex items-center gap-2 text-[13px] font-medium text-slate-700 whitespace-nowrap">
        <span className="h-2 w-2 rounded-full bg-green-600" />
        <span className="max-w-[260px] truncate">
          {checkIn.ubicacion}
          <span className="mx-1 text-slate-300">/</span>
          {checkIn.caseta}
        </span>
        <button
          type="button"
          onClick={run}
          className="h-7 ml-1 px-3 rounded-full bg-[#DC2626] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors hover:bg-[#B91C1C]">
          <LogOut className="h-3.5 w-3.5" />
          Check Out
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={run}
      className="h-9 px-4 rounded-full bg-[#2F80ED] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors hover:bg-[#1E6FDB]">
      <LogIn className="h-3.5 w-3.5" />
      Check In
    </button>
  );
}

export const CheckInStatus = { Detail, Pill };
