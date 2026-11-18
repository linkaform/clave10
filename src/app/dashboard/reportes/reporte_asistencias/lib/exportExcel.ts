import * as XLSX from "xlsx";
import { getStatusConfig, tipoDiaLibreLabel } from "../../components/attendanceStatus";
import { EmployeeAttendance, hora, horaSalida, horasDia, jornadaLabel } from "./employees";
import { EmployeeMetrics } from "./metrics";
import { DIAS, fromISO } from "./period";

const h1 = (n: number | null | undefined) => (n == null ? "" : Math.round(n * 10) / 10);

// Una fila por empleado: lo que necesita nómina para el periodo
const resumenRows = (employees: EmployeeAttendance[], metrics: Map<number, EmployeeMetrics>) =>
  employees.map(e => {
    const m = metrics.get(e.employee_id);
    const r = m?.resumen;
    return {
      "Empleado": e.nombre,
      "Departamento": e.departamento,
      "Puesto": e.puesto,
      "Jornada": jornadaLabel(e.jornada),
      "Días laborales": m?.laborales ?? "",
      "Asistencias": r?.asistencias ?? 0,
      "Retardos": r?.retardos ?? 0,
      "Faltas": r?.faltas ?? 0,
      "Sin salida": r?.sin_salida ?? 0,
      "Vacaciones": r?.vacaciones ?? 0,
      "Incapacidades": r?.incapacidades ?? 0,
      "Permisos": r?.permisos ?? 0,
      "Fuera de oficina": r?.fuera_oficina ?? 0,
      "Descansos y asuetos": r?.descansos ?? 0,
      "Horas trabajadas": h1(m?.horas),
      "Horas esperadas": h1(m?.esperadas),
      "% horas": m?.pct != null ? Math.round(m.pct) : "",
      "Horas extra": h1(m?.extra),
      "Días con extra": (m?.extraDias ?? []).map(d => `${d.fecha} (+${h1(d.horas)} h)`).join(", "),
      "Extra triple": h1(m?.triple),
      "Días a pagar": m?.aPagar ?? "",
      "Alertas de ley": (m?.alerts ?? []).map(a => `${a.week}: ${a.text}`).join(" | "),
      "Revisión": m?.revisar ? "Revisar" : "Listo",
    };
  });

// Una fila por empleado y día
const detalleRows = (employees: EmployeeAttendance[], fechas: string[]) =>
  employees.flatMap(e =>
    fechas.map(f => {
      const day = e.dias[f];
      const d = fromISO(f);
      const h = horasDia(e, day, false);
      const nota = day?.asueto
        ? `Asueto: ${day.asueto}`
        : day?.solicitud
          ? `${tipoDiaLibreLabel[day.solicitud.tipo ?? ""] || day.solicitud.tipo || "Solicitud"}${day.solicitud.folio ? ` · ${day.solicitud.folio}` : ""}`
          : day?.cierre_automatico || "";
      return {
        "Empleado": e.nombre,
        "Departamento": e.departamento,
        "Fecha": f,
        "Día": DIAS[d.getDay()],
        "Estatus": day ? getStatusConfig(day.status).label : "",
        "Entrada": hora(day?.fecha_inicio) ?? "",
        "Salida": horaSalida(day) ?? "",
        "Horas trabajadas": h1(h.trabajadas),
        "Horas esperadas": h1(h.esperadas),
        "Ubicación": day?.ubicacion && day.ubicacion !== "Sin ubicación" ? day.ubicacion : "",
        "Roles": (day?.roles ?? []).join(", "),
        "Nota": nota,
      };
    })
  );

const save = (sheets: [string, Record<string, unknown>[]][], file: string) => {
  const wb = XLSX.utils.book_new();
  sheets.forEach(([name, rows]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name));
  XLSX.writeFile(wb, file);
};

// Nómina: resumen por empleado + detalle por día
export const exportNomina = (employees: EmployeeAttendance[], metrics: Map<number, EmployeeMetrics>, fechas: string[], periodo: string) =>
  save([["Nómina", resumenRows(employees, metrics)], ["Detalle por día", detalleRows(employees, fechas)]], `Nómina asistencia ${periodo}.xlsx`);

// Registros: solo el detalle por día
export const exportRegistros = (employees: EmployeeAttendance[], fechas: string[], periodo: string) =>
  save([["Registros", detalleRows(employees, fechas)]], `Registros asistencia ${periodo}.xlsx`);
