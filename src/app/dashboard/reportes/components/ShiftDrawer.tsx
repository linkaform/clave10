import React, { useEffect, useState } from "react";
import { ShiftStatusIcon, getShiftConfig } from "./attendanceStatus";
import { AutoCloseMark, Card, CloseButton, EvidencePhotos, Field, Fields, Warn } from "./drawerParts";
import { useAttendanceDayDetail } from "../hooks/useAsistenciasReport";
import { OPENED, ShiftGuard, ShiftSelection, diffText, initials, minutosDiferencia, siguienteInicio, turnoLabel } from "../reporte_asistencias/lib/shifts";
import { DIAS, MESES, fromISO } from "../reporte_asistencias/lib/period";
import { tipoCierre, formatHoras, horaSalida, horasTrabajadas } from "../reporte_asistencias/lib/employees";
import { useNow } from "../reporte_asistencias/lib/useNow";

interface ShiftDrawerProps {
  selection: ShiftSelection | null;
  onClose: () => void;
}

const hora = (value?: string | null) => value?.substring(11, 16);
const firstPhoto = (value?: { file_url?: string }[] | { file_url?: string }) => (Array.isArray(value) ? value[0] : value)?.file_url;

// Estatus de cada guardia dentro del turno
const guardStatus = (g: ShiftGuard, esHoy: boolean) => {
  if (!g.fecha_cierre) return esHoy ? "en_curso" : "sin_cierre";
  return g.status === "retardo" || g.status === "falta_por_retardo" ? "tarde" : "a_tiempo";
};

// Panel lateral con el detalle de un turno de caseta en un día
export const ShiftDrawer: React.FC<ShiftDrawerProps> = ({ selection, onClose }) => {
  const opener = selection && OPENED.includes(selection.day.status) ? selection.day.guardias[0] : undefined;
  // Guardia cuya evidencia se muestra (por defecto, quien abrió)
  const [guardId, setGuardId] = useState<number | undefined>(opener?.employee_id);
  useEffect(() => setGuardId(opener?.employee_id), [selection, opener?.employee_id]);
  const guard = selection?.day.guardias.find(g => g.employee_id === guardId) ?? opener;
  const { dayDetail, isLoadingDayDetail } = useAttendanceDayDetail(guard?.employee_id, selection?.day.fecha);
  const now = useNow();

  useEffect(() => {
    if (!selection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, onClose]);

  if (!selection) return null;

  const { row, day } = selection;
  const config = getShiftConfig(day.status);
  const d = fromISO(day.fecha);
  const diff = minutosDiferencia(row, opener);
  const cierre = opener?.fecha_cierre;
  const automatica = opener ? tipoCierre(opener.fecha_inicio, cierre, siguienteInicio(row, opener), opener.cierre_automatico) : null;
  const registro = `${row.ubicacion} · ${row.caseta}`;
  const esHoy = day.status === "en_curso" || day.status === "por_abrir" || fromISO(day.fecha).toDateString() === now.toDateString();
  const varios = day.guardias.length > 1;
  const eventos: string[] = [];
  day.guardias.forEach((g, i) => {
    eventos.push(`${hora(g.fecha_inicio)} · ${g.nombre} ${i === 0 ? "inició turno" : "también hizo check-in"}`);
  });
  day.guardias.forEach(g => {
    if (!g.fecha_cierre) return;
    const auto = tipoCierre(g.fecha_inicio, g.fecha_cierre, siguienteInicio(row, g), g.cierre_automatico);
    const cuando = horaSalida({ fecha: day.fecha, dia: 0, status: day.status, fecha_cierre: g.fecha_cierre });
    eventos.push(`${cuando} · ${auto?.label === "Automática" ? `el sistema cerró el turno de ${g.nombre}` : auto ? `${g.nombre} cerró su turno hasta el día siguiente` : `${g.nombre} cerró turno`}`);
  });
  if (day.status === "sin_cierre") eventos.push("No se registró el cierre del turno");

  return (
    <>
      <div className="fixed inset-0 z-[55] bg-white/70" onClick={onClose} />
      <aside role="dialog" aria-labelledby="shift-title" className="fixed bottom-0 right-0 top-0 z-[60] flex w-[min(420px,100%)] flex-col border-l border-[#E2E8F0] bg-white shadow-[0_10px_30px_rgba(15,23,42,.12)]">
        <header className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] px-5 pb-3 pt-5">
          <div>
            <h2 id="shift-title" className="m-0 text-lg font-bold text-[#0F172A]">{row.caseta}</h2>
            <div className="text-xs text-[#64748B]">
              {row.ubicacion} · {DIAS[d.getDay()]} {d.getDate()} de {MESES[d.getMonth()]} · {turnoLabel(row)}
            </div>
          </div>
          <CloseButton onClick={onClose} />
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-auto bg-[#F8FAFC] px-5 py-4">
          <div>
            <span className="inline-flex items-center gap-1.5">
              <ShiftStatusIcon status={day.status} size={22} />
              <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>{config.label}</span>
            </span>
          </div>

          {day.status === "sin_abrir" && (
            <Warn>
              Nadie inició este turno. La caseta quedó sin guardia registrado de {row.hora_entrada.substring(0, 5)} a {row.hora_salida.substring(0, 5)}.
            </Warn>
          )}
          {day.status === "sin_cierre" && <Warn>Se inició el turno pero nadie lo cerró.</Warn>}
          {automatica && <Warn>{automatica.texto}</Warn>}

          <Fields>
            <Field label="Inició turno:" value={opener?.nombre} />
            <Field label="Hora de inicio:" value={opener ? `${hora(opener.fecha_inicio)}${diff != null ? ` · ${diffText(diff)}` : ""}` : undefined} />
            <Field label="Cerró turno:" value={cierre ? opener?.nombre : undefined} />
            <Field
              label="Hora de cierre:"
              value={cierre
                ? <>{horaSalida({ fecha: day.fecha, dia: 0, status: day.status, fecha_cierre: cierre })}{automatica && <AutoCloseMark text={automatica.texto} label={automatica.label} />}</>
                : day.status === "en_curso" ? "En turno" : undefined}
            />
            <Field label="Horas cubiertas:" value={formatHoras(horasTrabajadas(opener?.fecha_inicio, cierre, day.status === "en_curso", now), " h")} />
            <Field label="Tolerancia:" value={opener?.tolerancia_retardo != null ? `${opener.tolerancia_retardo} min` : undefined} />
          </Fields>

          {varios && (
            <Card title={`Guardias en el turno (${day.guardias.length})`}>
              <div className="flex flex-col gap-1.5">
                {day.guardias.map(g => {
                  const gs = guardStatus(g, esHoy);
                  const gDiff = minutosDiferencia(row, g);
                  const selected = g.employee_id === guard?.employee_id;
                  const salidaG = g.fecha_cierre
                    ? horaSalida({ fecha: day.fecha, dia: 0, status: gs, fecha_cierre: g.fecha_cierre })
                    : gs === "en_curso" ? "en turno" : "sin salida";
                  const horasG = formatHoras(horasTrabajadas(g.fecha_inicio, g.fecha_cierre, gs === "en_curso", now), " h");
                  return (
                    <button
                      key={g.employee_id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setGuardId(g.employee_id)}
                      title="Ver su evidencia"
                      className={`flex items-center gap-3 rounded-lg border p-2 text-left ${selected ? "border-[#2F80ED] bg-[#EFF6FF]" : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]"}`}
                    >
                      <span className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-[7px] border border-transparent text-[11px] font-bold ${getShiftConfig(gs).className}`}>
                        {initials(g.nombre)}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <b className="truncate text-[13px] text-[#0F172A]">
                          {g.nombre}
                          {g.employee_id === opener?.employee_id && <span className="ml-1.5 text-[11px] font-semibold text-[#64748B]">abrió</span>}
                        </b>
                        <span className="text-xs tabular-nums text-[#475569]">
                          {hora(g.fecha_inicio)}{gDiff != null && gDiff > 0 ? ` (+${gDiff} min)` : ""} → {salidaG}{horasG ? ` · ${horasG}` : ""}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {guard && (
            <Card title={varios ? `Evidencia · ${guard.nombre}` : "Evidencia"}>
              <EvidencePhotos
                fecha={day.fecha}
                person={guard.nombre}
                registro={registro}
                loading={isLoadingDayDetail}
                photos={[
                  {
                    label: "Inicio de turno",
                    stamp: "ENTRADA",
                    url: firstPhoto(dayDetail.foto_inicio),
                    time: hora(guard.fecha_inicio),
                    emptyText: "Inicio sin foto",
                  },
                  {
                    label: "Cierre de turno",
                    stamp: "SALIDA",
                    url: firstPhoto(dayDetail.foto_cierre),
                    time: hora(guard.fecha_cierre),
                    emptyText: guard.fecha_cierre ? "Cierre sin foto" : guardStatus(guard, esHoy) === "en_curso" ? "Turno en curso" : "No se cerró el turno",
                  },
                ]}
              />
            </Card>
          )}

          <Card title="Bitácora del turno">
            {eventos.length ? (
              <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[#475569]">{eventos.map((e, i) => <li key={i}>{e}</li>)}</ul>
            ) : (
              <span className="text-[#64748B]">{day.status === "por_abrir" ? `El turno abre a las ${row.hora_entrada.substring(0, 5)}.` : "Sin movimientos"}</span>
            )}
          </Card>
        </div>
      </aside>
    </>
  );
};
