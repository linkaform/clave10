import React from "react";
import { StatusChip, tipoDiaLibreLabel } from "./attendanceStatus";
import { AutoCloseMark, Card, DrawerShell, EvidencePhotos, Field, Fields, Warn } from "./drawerParts";
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

const SIN_FOTOS = ["falta", "vacaciones", "incapacidad", "permiso", "por_llegar", "sin_registro"];

// Panel lateral con el detalle de un empleado en un día
export const AttendanceDayDrawer: React.FC<AttendanceDayDrawerProps> = ({ selection, onClose }) => {
  const day: AttendanceDay | undefined = selection ? selection.employee.dias[selection.fecha] : undefined;
  const hasRecord = !!day?.fecha_inicio;
  const now = useNow();
  const { dayDetail, isLoadingDayDetail } = useAttendanceDayDetail(
    hasRecord ? selection?.employee.employee_id : undefined,
    selection?.fecha
  );

  if (!selection) return null;

  const { employee, fecha } = selection;
  const status = day?.status;
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
  const esperadas = horasDia(employee, day, false, now).esperadas;
  const comentarios = [dayDetail.comentario_inicio, dayDetail.comentario_cierre].filter(Boolean);
  const registroTxt =
    status === "dia_libre" && !hasRecord ? "Día no laboral"
    : status === "falta" ? "Sin registro"
    : status === "por_llegar" ? (employee.jornada?.hora_entrada ? `Entrada a las ${hora(employee.jornada.hora_entrada)}` : undefined)
    : ["vacaciones", "incapacidad", "permiso", "home_office", "trabajo_fuera"].includes(status ?? "") ? "Justificado"
    : status === "dia_libre" ? `Trabajó en día de descanso${registro ? ` · ${registro}` : ""}`
    : registro;

  return (
    <DrawerShell
      labelledBy="attendance-day-title"
      onClose={onClose}
      title={employee.nombre}
      subtitle={`${fechaLarga(fecha)}${ubicacion ? ` · ${ubicacion}` : ""}`}
      chips={<StatusChip status={status} />}
    >
      {automatica && <Warn>{automatica.texto}</Warn>}
      {status === "sin_salida" && <Warn>Hay entrada sin salida. Corrige el registro para que sume horas y se pueda cerrar la quincena.</Warn>}
      {status === "dia_libre" && !hasRecord && <Warn>Día no laboral. No cuenta como falta ni suma horas esperadas.</Warn>}

      <Fields>
        <Field label="Departamento" value={employee.departamento} />
        <Field label="Jornada" value={horario} loading={hasRecord && isLoadingDayDetail} />
        <Field label="Tolerancia" loading={hasRecord && isLoadingDayDetail} value={jornada?.tolerancia_retardo != null ? `${jornada.tolerancia_retardo} min` : undefined} />
        <Field label="Entrada" value={hora(day?.fecha_inicio)} />
        <Field label="Salida" value={salida} />
        <Field label="Horas trabajadas" value={formatHoras(horasTrabajadas(day?.fecha_inicio, day?.fecha_cierre, enTurno, now), " h")} />
        <Field label="Horas esperadas" value={esperadas != null ? `${esperadas.toFixed(1)} h` : undefined} />
        <Field label="Registro" value={registroTxt} loading={hasRecord && isLoadingDayDetail} full />
      </Fields>

      {hasRecord && !SIN_FOTOS.includes(status ?? "") && (
        <Card title="Evidencia">
          <EvidencePhotos
            fecha={fecha}
            person={employee.nombre}
            registro={registro}
            loading={isLoadingDayDetail}
            photos={[
              { label: "Check in", stamp: "ENTRADA", url: firstPhoto(dayDetail.foto_inicio), time: hora(day?.fecha_inicio), emptyText: "Entrada sin foto" },
              {
                label: "Check out",
                stamp: "SALIDA",
                url: firstPhoto(dayDetail.foto_cierre),
                time: hora(day?.fecha_cierre),
                emptyText: enTurno ? "Aún no registra salida" : day?.fecha_cierre ? "Salida sin foto" : "No registró salida",
              },
            ]}
          />
        </Card>
      )}

      {day?.solicitud && (
        <Card title={day.solicitud.parcial && hasRecord ? "Permiso por horas" : "Solicitud autorizada"}>
          <Fields>
            <Field label="Tipo" value={day.solicitud.tipo ? tipoDiaLibreLabel[day.solicitud.tipo] || day.solicitud.tipo : undefined} />
            <Field label="Folio" value={day.solicitud.folio} />
            <Field
              label="Periodo"
              value={day.solicitud.fecha_inicio === day.solicitud.fecha_fin
                ? fechaCorta(day.solicitud.fecha_inicio)
                : `${fechaCorta(day.solicitud.fecha_inicio)} al ${fechaCorta(day.solicitud.fecha_fin)}`}
            />
            {day.solicitud.parcial
              ? <Field label="Horas" value={horasSolicitud(day.solicitud)} />
              : <Field label="Días" value={day.solicitud.dias != null ? String(day.solicitud.dias) : undefined} />}
            {day.solicitud.comentario && <Field label="Comentario" value={day.solicitud.comentario} full />}
          </Fields>
        </Card>
      )}

      {comentarios.length > 0 && (
        <Card title="Comentarios">
          <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-sm text-c10-label">
            {comentarios.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </Card>
      )}

      {status !== "dia_libre" && (
        <Card title="Justificar o corregir">
          <fieldset disabled title="Pendiente" className="flex flex-col gap-3 opacity-50">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase text-c10-label">Acción</span>
              <select className="h-10 cursor-not-allowed rounded-lg border border-c10-line bg-c10-surface px-3 text-sm text-c10-faint">
                <option>Selecciona una acción</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase text-c10-label">Motivo</span>
              <textarea rows={2} placeholder="Ej. olvidó checar salida" className="cursor-not-allowed resize-none rounded-xl border border-c10-line bg-c10-surface px-3 py-2 text-sm" />
            </label>
            <button type="button" className="h-10 cursor-not-allowed rounded-lg bg-button-primary px-[18px] text-sm font-semibold text-white">Guardar Cambio</button>
          </fieldset>
        </Card>
      )}
    </DrawerShell>
  );
};
