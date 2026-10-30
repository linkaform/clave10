import React from "react";
import { StatusIcon, getStatusConfig } from "./attendanceStatus";
import { EmployeeAttendance, employeeSub, horasSolicitud, permisoParcial } from "../reporte_asistencias/lib/employees";
import { DIAS, DIAS_CORTOS, sameDay, toISO } from "../reporte_asistencias/lib/period";

interface EmployeeAttendanceGridProps {
  employees: EmployeeAttendance[];
  days: Date[];
  onOpenDay: (employee: EmployeeAttendance, fecha: string) => void;
}

// Calendario de íconos para Semana, Quincena y Mes
export const EmployeeAttendanceGrid: React.FC<EmployeeAttendanceGridProps> = ({ employees, days, onOpenDay }) => {
  const today = new Date();
  const iconSize = days.length > 7 ? 26 : 32;

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-[1] min-w-[180px] whitespace-nowrap bg-[#DBEAFE] px-3 py-2.5 text-left text-xs font-bold tracking-[.03em] text-[#192A4E]">
              EMPLEADO
            </th>
            {days.map(d => {
              const isToday = sameDay(d, today);
              return (
                <th
                  key={toISO(d)}
                  className={`min-w-[30px] px-0.5 py-1.5 text-center text-[11px] font-bold ${isToday ? "bg-[#2F80ED] text-white" : "bg-[#DBEAFE] text-[#192A4E]"}`}
                >
                  {String(d.getDate()).padStart(2, "0")}
                  <small className="block font-normal">{DIAS_CORTOS[d.getDay()]}</small>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.employee_id} className="group">
              <td className="sticky left-0 z-[1] whitespace-nowrap border-t border-[#E2E8F0] bg-white px-3 py-2 group-hover:bg-[#F8FAFC]">
                <div className="font-bold text-[#0F172A]">{emp.nombre}</div>
                <div className="text-xs text-[#64748B]">{employeeSub(emp)}</div>
              </td>
              {days.map(d => {
                const fecha = toISO(d);
                const day = emp.dias[fecha];
                const parcial = permisoParcial(day);
                const label = `${getStatusConfig(day?.status).label}${parcial ? ` · permiso ${horasSolicitud(parcial)}` : ""}`;
                return (
                  <td key={fecha} className="border-t border-[#E2E8F0] px-0.5 py-1.5 text-center group-hover:bg-[#F8FAFC]">
                    <button
                      type="button"
                      onClick={() => onOpenDay(emp, fecha)}
                      className="relative inline-flex rounded-[7px] border-none bg-transparent p-0 hover:outline hover:outline-2 hover:outline-offset-1 hover:outline-[#2F80ED]"
                      title={label}
                      aria-label={`${emp.nombre}, ${DIAS[d.getDay()]} ${d.getDate()}: ${label}`}
                    >
                      <StatusIcon status={day?.status} size={iconSize} />
                      {parcial && <i className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-[#DB2777]" />}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
