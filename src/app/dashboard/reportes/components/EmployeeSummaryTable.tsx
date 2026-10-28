import React from "react";
import { AttendanceResumen, AttendanceStatus, StatusIcon } from "./attendanceStatus";
import { EmployeeAttendance, employeeSub, jornadaLabel } from "../reporte_asistencias/lib/employees";

interface EmployeeSummaryTableProps {
  employees: EmployeeAttendance[];
  showReview?: boolean;
  onSelectEmployee: (nombre: string) => void;
}

const columns: { key: keyof AttendanceResumen; status: AttendanceStatus; label: string; className?: string }[] = [
  { key: "asistencias", status: "presente", label: "ASIST." },
  { key: "retardos", status: "retardo", label: "RET.", className: "text-[#92400E]" },
  { key: "faltas", status: "falta", label: "FALTAS" },
  { key: "sin_salida", status: "sin_salida", label: "SIN SALIDA" },
  { key: "vacaciones", status: "vacaciones", label: "VACAC.", className: "text-[#1E40AF]" },
  { key: "incapacidades", status: "incapacidad", label: "INCAP.", className: "text-[#5B21B6]" },
  { key: "permisos", status: "permiso", label: "PERMISOS", className: "text-[#9D174D]" },
  { key: "fuera_oficina", status: "home_office", label: "FUERA OF.", className: "text-[#0F766E]" },
];

// Por revisar: tiene faltas o registros sin salida en el periodo
export const needsReview = (emp: EmployeeAttendance) => emp.resumen.faltas > 0 || emp.resumen.sin_salida > 0;

const cellClass = (key: keyof AttendanceResumen, value: number, base?: string) => {
  if (!value) return "";
  if (key === "faltas") return "font-bold text-[#DC2626]";
  if (key === "sin_salida") return "font-bold text-[#9A3412]";
  return base ?? "";
};

const th = "whitespace-nowrap bg-[#DBEAFE] px-3 py-2.5 text-xs font-bold tracking-[.03em] text-[#192A4E]";
const td = "whitespace-nowrap border-t border-[#E2E8F0] px-3 py-[9px] group-hover:bg-[#F8FAFC]";

// Tabla resumen para Semana, Quincena y Mes
export const EmployeeSummaryTable: React.FC<EmployeeSummaryTableProps> = ({ employees, showReview = false, onSelectEmployee }) => (
  <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className={`${th} text-left`}>EMPLEADO</th>
          {columns.map(col => (
            <th key={col.key} className={`${th} text-right`}>
              <span className="inline-flex items-center gap-1.5">
                <StatusIcon status={col.status} size={18} />
                {col.label}
              </span>
            </th>
          ))}
          {showReview && <th className={`${th} text-left`}>REVISIÓN</th>}
        </tr>
      </thead>
      <tbody>
        {employees.map(emp => {
          const review = needsReview(emp);
          return (
            <tr key={emp.employee_id} className="group">
              <td className={td}>
                <button type="button" title="Ver sus días" onClick={() => onSelectEmployee(emp.nombre)} className="group/name border-none bg-transparent p-0 text-left">
                  <div className="font-bold text-[#0F172A] group-hover/name:text-[#2F80ED] group-hover/name:underline">{emp.nombre}</div>
                  <div className="text-xs text-[#64748B]">{jornadaLabel(emp.jornada) || employeeSub(emp)}</div>
                </button>
              </td>
              {columns.map(col => {
                const value = emp.resumen[col.key];
                return (
                  <td key={col.key} className={`${td} text-right tabular-nums ${cellClass(col.key, value, col.className)}`}>
                    {value || "—"}
                  </td>
                );
              })}
              {showReview && (
                <td className={td}>
                  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${review ? "bg-[#FFEDD5] text-[#9A3412]" : "bg-[#DCFCE7] text-[#166534]"}`}>
                    {review ? "Revisar" : "Listo"}
                  </span>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
