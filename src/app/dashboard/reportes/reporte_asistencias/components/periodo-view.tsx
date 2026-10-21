"use client";

import type { EstadoDia, ReportePeriodo } from "@/lib/asistencia-sdk";
import { Cargando } from "./hoy-view";
import { LEYENDA_PERIODO, estilo, hhmm, horas } from "./estados";

const INICIAL = ["D", "L", "M", "M", "J", "V", "S"];
const DIA = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

// Lo que se lee dentro de la celda: la hora de llegada si hubo jornada, o una letra.
const textoCelda = (estado: EstadoDia, llegada: string | null) => {
  if (llegada) return hhmm(llegada);
  if (estado === "falta") return "F";
  if (estado === "descanso") return "D";
  if (estado === "sin_registro" || estado === "sin_horario") return "";
  return "P"; // permisos (vacaciones, enfermedad…)
};

export function PeriodoView({
  data,
  isLoading,
  onSelect,
}: {
  data?: ReportePeriodo;
  isLoading: boolean;
  onSelect: (userId: number, fecha: string) => void;
}) {
  if (isLoading) return <Cargando />;
  if (!data) return null;
  const fechas = data.empleados[0]?.dias.map((d) => d.fecha) ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {LEYENDA_PERIODO.map((e) => (
          <span key={e} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-[3px] ${estilo(e).dot}`} />
            {estilo(e).label}
          </span>
        ))}
        <span className="text-slate-400">· La celda muestra la hora de llegada (F falta, D descanso, P permiso)</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="text-sm border-separate border-spacing-0">
          <thead>
            <tr className="text-xs text-[#475569]">
              <th className="sticky left-0 z-10 bg-[#DBEAFE] px-4 py-2 text-left font-semibold uppercase tracking-[.05em] min-w-[180px]">
                Empleado
              </th>
              {fechas.map((f) => {
                const d = new Date(`${f}T00:00:00Z`);
                const finde = d.getUTCDay() === 0 || d.getUTCDay() === 6;
                return (
                  <th key={f} className={`px-0.5 py-2 text-center font-medium ${finde ? "bg-[#C7DBF8]" : "bg-[#DBEAFE]"}`}>
                    <div className="tabular-nums">{d.getUTCDate()}</div>
                    <div className="text-[10px] text-slate-500">{INICIAL[d.getUTCDay()]}</div>
                  </th>
                );
              })}
              <th className="bg-[#DBEAFE] px-3 py-2 text-right font-semibold uppercase tracking-[.05em]">Ret.</th>
              <th className="bg-[#DBEAFE] px-3 py-2 text-right font-semibold uppercase tracking-[.05em]">Faltas</th>
              <th className="bg-[#DBEAFE] px-4 py-2 text-right font-semibold uppercase tracking-[.05em] whitespace-nowrap">Horas</th>
              <th className="bg-[#DBEAFE] px-4 py-2 text-right font-semibold uppercase tracking-[.05em]">Extra</th>
            </tr>
          </thead>
          <tbody>
            {data.empleados.length === 0 && (
              <tr>
                <td colSpan={fechas.length + 5} className="px-4 py-10 text-center text-slate-500">
                  No hay empleados para las ubicaciones elegidas.
                </td>
              </tr>
            )}
            {data.empleados.map((e) => (
              <tr key={e.user_id}>
                <td className="sticky left-0 z-10 bg-white border-t border-slate-100 px-4 py-2">
                  <div className="font-medium text-slate-900 whitespace-nowrap">{e.nombre}</div>
                  <div className="text-xs text-slate-400 whitespace-nowrap">{e.horario || "Sin horario"}</div>
                </td>
                {e.dias.map((d) => {
                  const s = estilo(d.estado);
                  const texto = textoCelda(d.estado, d.llegada);
                  return (
                    <td key={d.fecha} className="border-t border-slate-100 px-0.5 py-1.5">
                      <button
                        type="button"
                        title={`${DIA.format(new Date(`${d.fecha}T00:00:00Z`))} · ${s.label}${d.llegada ? ` · llegó ${hhmm(d.llegada)}` : ""}`}
                        onClick={() => onSelect(e.user_id, d.fecha)}
                        className={`h-8 w-11 rounded-md text-[11px] font-medium tabular-nums transition-shadow hover:ring-2 hover:ring-[#2F80ED]/40 ${
                          texto ? s.pill : "bg-slate-50 text-slate-300"
                        }`}>
                        {texto}
                      </button>
                    </td>
                  );
                })}
                <td className="border-t border-slate-100 px-3 py-2 text-right tabular-nums">{e.resumen.retardos}</td>
                <td className="border-t border-slate-100 px-3 py-2 text-right tabular-nums">{e.resumen.faltas}</td>
                <td className="border-t border-slate-100 px-4 py-2 text-right tabular-nums text-slate-600 whitespace-nowrap">
                  {horas(e.resumen.horas_trabajadas)}
                  <span className="text-slate-400"> / {horas(e.resumen.horas_programadas)}</span>
                </td>
                <td className="border-t border-slate-100 px-4 py-2 text-right tabular-nums whitespace-nowrap">
                  {e.resumen.horas_extra ? (
                    <span className="font-medium text-violet-700">{horas(e.resumen.horas_extra)}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
