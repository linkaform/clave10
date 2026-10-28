import React, { useEffect } from "react";
import { StatusIcon, getStatusConfig, tipoDiaLibreLabel } from "./attendanceStatus";
import { AutoCloseMark, Card, CloseButton, EvidencePhotos, Field, Fields, Warn } from "./drawerParts";
import { useAttendanceDayDetail } from "../hooks/useAsistenciasReport";
import { AttendanceDay, EmployeeAttendance, cierreDia, formatHoras, horaSalida, horasDia, horasSolicitud, horasTrabajadas } from "../reporte_asistencias/lib/employees";
import { useNow } from "../reporte_asistencias/lib/useNow";
import { DIAS, MESES, fromISO } from "../reporte_asistencias/lib/period";

export type DaySelection = { employee: EmployeeAttendance; fecha: string };

interface AttendanceDayDrawerProps {
  selection: DaySelection | null;
  onClose: () => void;
}

type Photo = { file_url?: string; file_name?: string };

const hora = (value?: string) => value?.substring(11, 16) || value?.substring(0, 5);
const fechaLarga = (fecha: string) => {
  const d = fromISO(fecha);
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
};
const fechaCorta = (fecha: string) => {
  const d = fromISO(fecha);
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
};
const firstPhoto = (value?: Photo[] | Photo) => (Array.isArray(value) ? value[0] : value)?.file_url;

// Panel lateral con el detalle de un empleado en un día
export const AttendanceDayDrawer: React.FC<AttendanceDayDrawerProps> = ({ selection, onClose }) => {
  const day: AttendanceDay | undefined = selection ? selection.employee.dias[selection.fecha] : undefined;
  const hasRecord = !!day?.fecha_inicio;
  const now = useNow();
  const { dayDetail, isLoadingDayDetail } = useAttendanceDayDetail(
    hasRecord ? selection?.employee.employee_id : undefined,
    selection?.fecha
  );

  useEffect(() => {
    if (!selection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, onClose]);

  if (!selection) return null;

  const { employee, fecha } = selection;
  const status = day?.status;
  const config = getStatusConfig(status);
  const ubicacion = dayDetail.ubicacion || (day?.ubicacion !== "Sin ubicación" ? day?.ubicacion : "") || employee.ubicaciones.join(", ");
  const registro = [dayDetail.ubicacion, dayDetail.area].filter(Boolean).join(" · ") || undefined;
  const jornada = dayDetail.nombre_horario
    ? { nombre: dayDetail.nombre_horario, hora_entrada: dayDetail.hora_entrada, hora_salida: dayDetail.hora_salida, tolerancia_retardo: dayDetail.tolerancia_retardo }
    : employee.jornada;
  const horario = jornada
    ? `${jornada.nombre}${jornada.hora_entrada ? ` · ${hora(jornada.hora_entrada)}–${hora(jornada.hora_salida)}` : ""}`
    : undefined;
  const enTurno = hasRecord && !day?.closed && (status === "en_turno" || status === "retardo");
  const automatica = cierreDia(selection.employee, day);
  const salida = day?.fecha_cierre
    ? <>{horaSalida(day)}{automatica && <AutoCloseMark text={automatica.texto} label={automatica.label} />}</>
    : enTurno ? "En turno" : undefined;
  const fotoSalida = firstPhoto(dayDetail.foto_cierre);
  const comentarios = [dayDetail.comentario_inicio, dayDetail.comentario_cierre].filter(Boolean);

  return (
    <>
      <div className="fixed inset-0 z-[55] bg-white/70" onClick={onClose} />
      <aside
        role="dialog"
        aria-labelledby="attendance-day-title"
        className="fixed bottom-0 right-0 top-0 z-[60] flex w-[min(420px,100%)] flex-col border-l border-[#E2E8F0] bg-white shadow-[0_10px_30px_rgba(15,23,42,.12)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] px-5 pb-3 pt-5">
          <div>
            <h2 id="attendance-day-title" className="m-0 text-lg font-bold text-[#0F172A]">{employee.nombre}</h2>
            <div className="text-xs text-[#64748B]">
              {fechaLarga(fecha)}{employee.departamento ? ` · ${employee.departamento}` : ""}{ubicacion ? ` · ${ubicacion}` : ""}
            </div>
          </div>
          <CloseButton onClick={onClose} />
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-auto bg-[#F8FAFC] px-5 py-4">
          <div>
            <span className="inline-flex items-center gap-1.5">
              <StatusIcon status={status} size={22} />
              <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>{config.label}</span>
            </span>
          </div>

          {automatica && <Warn>{automatica.texto}</Warn>}

          <Fields>
            <Field label="Jornada:" value={horario} loading={hasRecord && isLoadingDayDetail} />
            <Field label="Tolerancia:" loading={hasRecord && isLoadingDayDetail} value={jornada?.tolerancia_retardo != null ? `${jornada.tolerancia_retardo} min` : undefined} />
            <Field label="Entrada:" value={hora(day?.fecha_inicio)} />
            <Field label="Salida:" value={salida} />
            <Field label="Horas trabajadas:" value={formatHoras(horasTrabajadas(day?.fecha_inicio, day?.fecha_cierre, enTurno, now), " h")} />
            <Field label="Horas esperadas:" value={horasDia(employee, day, false, now).esperadas != null ? `${horasDia(employee, day, false, now).esperadas!.toFixed(1)} h` : undefined} />
            <Field label="Registro:" value={registro} loading={hasRecord && isLoadingDayDetail} full />
          </Fields>

          {hasRecord && (
            <Card title="Evidencia del registro">
              <EvidencePhotos
                fecha={fecha}
                person={employee.nombre}
                registro={registro}
                loading={isLoadingDayDetail}
                photos={[
                  {
                    label: "Check in",
                    stamp: "ENTRADA",
                    url: firstPhoto(dayDetail.foto_inicio),
                    time: hora(day?.fecha_inicio),
                    emptyText: "Entrada sin foto",
                  },
                  {
                    label: "Check out",
                    stamp: "SALIDA",
                    url: fotoSalida,
                    time: hora(day?.fecha_cierre),
                    emptyText: enTurno ? "Aún no registra salida" : day?.fecha_cierre ? "Salida sin foto" : "No registró salida",
                  },
                ]}
              />
            </Card>
          )}

          {status === "sin_salida" && <Warn>Hay entrada sin salida.</Warn>}

          {status === "dia_libre" && (
            <Card title="Día no laboral">
              <span className="text-[#475569]">Según sus días libres, este día es descanso. No cuenta como falta.</span>
            </Card>
          )}

          {day?.solicitud && (
            <Card title={day.solicitud.parcial && hasRecord ? "Permiso por horas" : "Solicitud autorizada"}>
              <Fields>
                <Field label="Tipo:" value={day.solicitud.tipo ? tipoDiaLibreLabel[day.solicitud.tipo] || day.solicitud.tipo : undefined} />
                <Field label="Folio:" value={day.solicitud.folio} />
                <Field
                  label="Periodo:"
                  value={day.solicitud.fecha_inicio === day.solicitud.fecha_fin
                    ? fechaCorta(day.solicitud.fecha_inicio)
                    : `${fechaCorta(day.solicitud.fecha_inicio)} al ${fechaCorta(day.solicitud.fecha_fin)}`}
                />
                {day.solicitud.parcial
                  ? <Field label="Horas:" value={horasSolicitud(day.solicitud)} />
                  : <Field label="Días:" value={day.solicitud.dias != null ? String(day.solicitud.dias) : undefined} />}
                {day.solicitud.comentario && <Field label="Comentario:" value={day.solicitud.comentario} full />}
              </Fields>
            </Card>
          )}

          {comentarios.length > 0 && (
            <Card title="Comentarios">
              <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[#475569]">
                {comentarios.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </Card>
          )}
        </div>
      </aside>
    </>
  );
};
