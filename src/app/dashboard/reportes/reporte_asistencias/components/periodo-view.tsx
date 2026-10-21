"use client";

import type { ReportePeriodo } from "@/lib/asistencia-sdk";
import { Tooltip } from "@/components/ui/tooltip";
import { Cargando } from "./hoy-view";
import { LEYENDA_PERIODO, estilo, horas } from "./estados";

const DIA = new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {LEYENDA_PERIODO.map((e) => (
          <span key={e} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-[3px] ${estilo(e).dot}`} />
            {estilo(e).label}
          </span>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-[#DBEAFE] text-left text-xs font-semibold uppercase tracking-[.05em] text-[#475569]">
              <th className="px-4 py-2.5">Empleado</th>
              <th className="px-4 py-2.5">Días</th>
              <th className="px-4 py-2.5 text-right">Retardos</th>
              <th className="px-4 py-2.5 text-right">Faltas</th>
              <th className="px-4 py-2.5 text-right">Horas</th>
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
            {data.empleados.map((e) => (
              <tr key={e.user_id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-slate-900">{e.nombre}</div>
                  <div className="text-xs text-slate-400">{e.horario || "Sin horario"}</div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-[3px]">
                    {e.dias.map((d) => {
                      const s = estilo(d.estado);
                      return (
                        <Tooltip
                          key={d.fecha}
                          content={`${DIA.format(new Date(`${d.fecha}T00:00:00Z`))} · ${s.label}`}>
                          <button
                            type="button"
                            aria-label={`${d.fecha}: ${s.label}`}
                            onClick={() => onSelect(e.user_id, d.fecha)}
                            className={`block h-3.5 w-3.5 rounded-[3px] ${s.dot} hover:ring-2 hover:ring-[#2F80ED]/40`}
                          />
                        </Tooltip>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{e.resumen.retardos}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{e.resumen.faltas}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                  {horas(e.resumen.horas_trabajadas)}
                  <span className="text-slate-400"> / {horas(e.resumen.horas_programadas)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
