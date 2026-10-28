import React, { useMemo, useState } from "react";
import { AttendanceStatus, StatusIcon, getStatusConfig, tipoDiaLibreLabel } from "./attendanceStatus";
import { AttendanceDay, EmployeeAttendance, cierreDia, formatHoras, hora, horaSalida, horasTrabajadas, employeeSub, horasDia, horasSolicitud, permisoParcial } from "../reporte_asistencias/lib/employees";
import { AutoCloseMark, PartialPermitMark } from "./drawerParts";
import { useNow } from "../reporte_asistencias/lib/useNow";
import { sameDay, toISO } from "../reporte_asistencias/lib/period";

interface EmployeeDayViewProps {
  employees: EmployeeAttendance[];
  date: Date;
  mode: "cal" | "table";
  onOpenDay: (employee: EmployeeAttendance, fecha: string) => void;
}

// Grupos de filtro del día: [clave, etiqueta, ícono, estatus que incluye]
const groups: [string, string, AttendanceStatus, AttendanceStatus[]][] = [
  ["pres", "Asistencia", "presente", ["presente", "en_turno"]],
  ["ret", "Retardos", "retardo", ["retardo"]],
  ["fal", "Faltas", "falta", ["falta"]],
  ["ss", "Sin salida", "sin_salida", ["sin_salida"]],
  ["jus", "Ausencias justificadas", "vacaciones", ["vacaciones", "incapacidad", "permiso"]],
  ["fuera", "Fuera de oficina", "home_office", ["home_office", "trabajo_fuera"]],
  ["pl", "Por llegar", "por_llegar", ["por_llegar"]],
  ["des", "Descanso", "dia_libre", ["dia_libre"]],
];



const registroText = (emp: EmployeeAttendance, day?: AttendanceDay) => {
  switch (day?.status) {
    case "falta":
      return "Sin registro";
    case "vacaciones":
    case "incapacidad":
    case "permiso":
    case "home_office":
    case "trabajo_fuera":
      return day.tipo_dia_libre ? `Justificado · ${tipoDiaLibreLabel[day.tipo_dia_libre] || day.tipo_dia_libre}` : "Justificado";
    case "dia_libre":
      return "Día no laboral";
    case "por_llegar":
    case "sin_registro":
    case undefined:
      return "—";
    default:
      return day?.ubicacion && day.ubicacion !== "Sin ubicación" ? day.ubicacion : emp.ubicaciones.join(", ") || "—";
  }
};

const th = "whitespace-nowrap bg-[#DBEAFE] px-3 py-2.5 text-left text-xs font-bold tracking-[.03em] text-[#192A4E]";
const td = "whitespace-nowrap border-t border-[#E2E8F0] px-3 py-[9px] group-hover:bg-[#F8FAFC]";

export const EmployeeDayView: React.FC<EmployeeDayViewProps> = ({ employees, date, mode, onOpenDay }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const clock = useNow();
  const fecha = toISO(date);
  const isToday = sameDay(date, new Date());
  // Hora de la última carga: se recalcula cuando llegan datos nuevos
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updatedAt = useMemo(() => new Date().toTimeString().slice(0, 5), [employees]);

  const rows = employees.map(emp => ({ emp, day: emp.dias[fecha] }));
  const statusOf = (r: { day?: AttendanceDay }) => (r.day?.status || "sin_registro") as AttendanceStatus;
  const active = groups.filter(g => selected.includes(g[0]));
  const shown = active.length ? rows.filter(r => active.some(g => g[3].includes(statusOf(r)))) : rows;

  const toggle = (key: string) =>
    setSelected(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-[#475569]">{isToday ? `Actualizado hoy a las ${updatedAt}` : "Día cerrado"}</span>
        {groups.map(([key, label, icon, statuses]) => {
          const n = rows.filter(r => statuses.includes(statusOf(r))).length;
          const pressed = selected.includes(key);
          if (!n && !pressed) return null;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={pressed}
              onClick={() => toggle(key)}
              className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 ${pressed ? "border-[#2F80ED] bg-[#EFF6FF] text-[#2F80ED]" : "border-[#E2E8F0] bg-white text-[#475569]"}`}
            >
              <StatusIcon status={icon} size={20} />
              {label}
              {mode === "table" && <strong className="tabular-nums text-[#0F172A]">{n}</strong>}
            </button>
          );
        })}
        {selected.length > 0 && (
          <button type="button" onClick={() => setSelected([])} className="inline-flex h-9 items-center rounded-full border border-dashed border-[#E2E8F0] bg-white px-3.5 text-[#475569]">
            Mostrar todos ×
          </button>
        )}
      </div>

      {!shown.length ? (
        <div className="rounded-xl border border-dashed border-[#CBD5E1] p-7 text-center text-[#64748B]">
          No se encontraron empleados con ese filtro
        </div>
      ) : mode === "cal" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
          {shown.map(({ emp, day }) => (
            <button
              key={emp.employee_id}
              type="button"
              onClick={() => onOpenDay(emp, fecha)}
              aria-label={`${emp.nombre}: ${getStatusConfig(day?.status).label}`}
              className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3.5 text-left hover:border-[#2F80ED] hover:bg-[#F8FAFC]"
            >
              <StatusIcon status={day?.status} size={44} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-bold text-[#0F172A]">{emp.nombre}</span>
                <span className="truncate text-xs text-[#64748B]">{employeeSub(emp)}</span>
                <span className="text-[13px] tabular-nums text-[#475569]">
                  {getStatusConfig(day?.status).label}
                  {permisoParcial(day) && ` · permiso ${horasSolicitud(permisoParcial(day))}`}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>OPCIONES</th>
                <th className={th}>EMPLEADO</th>
                <th className={th}>ESTATUS</th>
                <th className={th}>ENTRADA</th>
                <th className={th}>SALIDA</th>
                <th className={`${th} text-right`}>HORAS</th>
                <th className={`${th} text-right`}>ESPERADAS</th>
                <th className={th}>REGISTRO</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ emp, day }) => {
                const config = getStatusConfig(day?.status);
                return (
                  <tr key={emp.employee_id} className="group">
                    <td className={td}>
                      <button
                        type="button"
                        aria-label={`Ver detalle de ${emp.nombre}`}
                        onClick={() => onOpenDay(emp, fecha)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#475569] hover:bg-[#DBEAFE] hover:text-[#2F80ED]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                    </td>
                    <td className={td}>
                      <div className="font-bold text-[#0F172A]">{emp.nombre}</div>
                      <div className="text-xs text-[#64748B]">{employeeSub(emp)}</div>
                    </td>
                    <td className={td}>
                      <span className="inline-flex items-center gap-1.5">
                        <StatusIcon status={day?.status} size={22} />
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>{config.label}</span>
                      </span>
                    </td>
                    <td className={`${td} font-bold tabular-nums`}>{hora(day?.fecha_inicio) || "—"}</td>
                    <td className={`${td} tabular-nums text-[#475569]`}>
                      {horaSalida(day) || "—"}
                      {cierreDia(emp, day) && <AutoCloseMark text={cierreDia(emp, day)!.texto} label={cierreDia(emp, day)!.label} />}
                    </td>
                    <td
                      className={`${td} text-right font-bold tabular-nums ${cierreDia(emp, day) ? "text-[#92400E]" : ""}`}
                      title={cierreDia(emp, day)?.texto}
                    >
                      {formatHoras(horasTrabajadas(day?.fecha_inicio, day?.fecha_cierre, isToday && !!day?.fecha_inicio && !day?.closed, clock)) ?? "—"}
                    </td>
                    <td className={`${td} text-right tabular-nums text-[#475569]`}>
                      {horasDia(emp, day, false, clock).esperadas?.toFixed(1) ?? "—"}
                    </td>
                    <td className={`${td} text-[#475569]`}>
                      {registroText(emp, day)}
                      {permisoParcial(day) && <PartialPermitMark horas={horasSolicitud(permisoParcial(day))} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
