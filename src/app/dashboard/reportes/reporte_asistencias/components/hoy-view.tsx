"use client";

import { Loader2 } from "lucide-react";
import type { ReporteHoy } from "@/lib/asistencia-sdk";
import { estilo, hhmm, minutos } from "./estados";

export function HoyView({
  data,
  isLoading,
  onSelect,
}: {
  data?: ReporteHoy;
  isLoading: boolean;
  onSelect: (userId: number, fecha: string) => void;
}) {
  if (isLoading) return <Cargando />;
  if (!data) return null;
  const r = data.resumen;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Metrica label="Programados" value={r.programados} />
        <Metrica label="A tiempo" value={r.a_tiempo} className="text-green-700" />
        <Metrica label="Con retardo" value={r.retardo} className="text-amber-700" />
        <Metrica label="No han llegado" value={r.no_ha_llegado} className="text-red-700" />
        <Metrica label="Fuera de horario" value={r.fuera_de_horario} className="text-violet-700" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-[#DBEAFE] text-left text-xs font-semibold uppercase tracking-[.05em] text-[#475569]">
              <th className="px-4 py-2.5">Empleado</th>
              <th className="px-4 py-2.5">Turno</th>
              <th className="px-4 py-2.5">Llegó</th>
              <th className="px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5">Dónde está</th>
            </tr>
          </thead>
          <tbody>
            {data.empleados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No hay empleados para las ubicaciones elegidas.
                </td>
              </tr>
            )}
            {data.empleados.map((e) => {
              const s = estilo(e.estado);
              return (
                <tr
                  key={e.user_id}
                  onClick={() => onSelect(e.user_id, data.fecha)}
                  className="border-t border-slate-100 cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{e.nombre}</td>
                  <td className="px-4 py-2.5 text-slate-600 tabular-nums">
                    {e.turno ? `${e.turno.entrada}–${e.turno.salida}` : e.horario ? "Descansa" : "Sin horario"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 tabular-nums">{hhmm(e.llegada)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.pill}`}>
                      {s.label}
                      {e.retraso_min ? ` · ${minutos(e.retraso_min)}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {e.lugar ? (
                      <>
                        {e.lugar}
                        {e.rol && <span className="text-slate-400"> · {e.rol}</span>}
                      </>
                    ) : (
                      <span className="text-slate-400">{e.jornada_abierta ? "Sin Check In" : "—"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metrica({ label, value, className = "" }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${className}`}>{value}</div>
    </div>
  );
}

export function Cargando() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
