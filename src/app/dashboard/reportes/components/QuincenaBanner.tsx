import React from "react";
import { EmployeeAttendance } from "../reporte_asistencias/lib/employees";
import { MESES } from "../reporte_asistencias/lib/period";
import { needsReview } from "./EmployeeSummaryTable";

interface QuincenaBannerProps {
  employees: EmployeeAttendance[];
  from: Date;
  to: Date;
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export const QuincenaBanner: React.FC<QuincenaBannerProps> = ({ employees, from, to }) => {
  const enCurso = to >= new Date(new Date().setHours(0, 0, 0, 0));
  const porRevisar = employees.filter(needsReview).length;
  const sinSalida = employees.reduce((n, e) => n + e.resumen.sin_salida, 0);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5">
      <div className="flex flex-[1_1_320px] flex-col gap-0.5">
        <strong className="text-[#0F172A]">
          {enCurso ? "Quincena en curso" : "Quincena abierta"} · corte de nómina {from.getDate()} al {to.getDate()} de {MESES[from.getMonth()]}
        </strong>
        <span className="text-[#475569]">
          {plural(porRevisar, "empleado", "empleados")} por revisar · {plural(sinSalida, "registro", "registros")} sin salida
        </span>
      </div>
      <button type="button" disabled title="Pendiente" className="inline-flex h-10 items-center whitespace-nowrap rounded-lg border border-[#E2E8F0] bg-white px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50">
        Exportar Nómina
      </button>
      <button type="button" disabled title="Pendiente" className="inline-flex h-10 items-center whitespace-nowrap rounded-lg border border-[#2F80ED] bg-[#2F80ED] px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        Cerrar Quincena
      </button>
    </div>
  );
};
