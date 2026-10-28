import React, { useMemo, useState } from "react";
import { ShiftStatus, ShiftStatusIcon, getShiftConfig } from "./attendanceStatus";
import { ShiftDay, ShiftRow, ShiftSelection, groupShifts, siguienteInicio, minutosDiferencia, turnoLabel, turnoText } from "../reporte_asistencias/lib/shifts";
import { sameDay, toISO } from "../reporte_asistencias/lib/period";
import { tipoCierre, formatHoras, horaSalida, horasTrabajadas } from "../reporte_asistencias/lib/employees";
import { AutoCloseMark } from "./drawerParts";
import { useNow } from "../reporte_asistencias/lib/useNow";

interface LocationDayViewProps {
  rows: ShiftRow[];
  date: Date;
  mode: "cal" | "table";
  onOpenShift: (selection: ShiftSelection) => void;
}

const groups: [string, string, ShiftStatus][] = [
  ["a_tiempo", "Abiertos a tiempo", "a_tiempo"],
  ["tarde", "Abiertos tarde", "tarde"],
  ["en_curso", "En curso", "en_curso"],
  ["sin_abrir", "Sin abrir", "sin_abrir"],
  ["sin_cierre", "Sin cierre", "sin_cierre"],
  ["por_abrir", "Por abrir", "por_abrir"],
];

const th = "whitespace-nowrap bg-[#DBEAFE] px-3 py-2.5 text-left text-xs font-bold tracking-[.03em] text-[#192A4E]";
const td = "whitespace-nowrap border-t border-[#E2E8F0] px-3 py-[9px] group-hover:bg-[#F8FAFC]";

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
);

export const LocationDayView: React.FC<LocationDayViewProps> = ({ rows, date, mode, onOpenShift }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const clock = useNow();
  const fecha = toISO(date);
  const live = sameDay(date, new Date());
  // Hora de la última carga: se recalcula cuando llegan datos nuevos
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date().toTimeString().slice(0, 5), [rows]);

  const recs = rows
    .map(row => ({ row, day: row.dias.find(d => d.fecha === fecha) }))
    .filter((x): x is { row: ShiftRow; day: ShiftDay } => !!x.day);
  const shown = selected.length ? recs.filter(x => selected.includes(x.day.status)) : recs;

  // Casetas con turno abierto ahora (solo hoy)
  const casetas = Array.from(new Set(recs.map(x => `${x.row.ubicacion}|${x.row.caseta}`)));
  const casetaEnCurso = (key: string) => recs.some(x => `${x.row.ubicacion}|${x.row.caseta}` === key && x.day.status === "en_curso");
  const casetaSinAbrir = (key: string) => recs.find(x => `${x.row.ubicacion}|${x.row.caseta}` === key && x.day.status === "sin_abrir");
  const abiertas = casetas.filter(casetaEnCurso);
  const sinTurno = casetas.filter(k => !casetaEnCurso(k) && casetaSinAbrir(k));

  const toggle = (key: string) =>
    setSelected(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  return (
    <div className="flex flex-col gap-3.5">
      {live && casetas.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5">
          <div className="flex flex-[1_1_320px] flex-col gap-0.5">
            <strong className="text-[#0F172A]">
              Ahora, {now} ·{" "}
              {mode === "cal"
                ? sinTurno.length ? "Hay casetas sin turno abierto" : "Todas las casetas tienen turno abierto"
                : `${abiertas.length} de ${casetas.length} ${casetas.length === 1 ? "caseta" : "casetas"} con turno abierto`}
            </strong>
            <span className="text-[#475569]">
              {sinTurno.length
                ? `${sinTurno.length === 1 ? "Una caseta no tiene" : `${sinTurno.length} casetas no tienen`} turno abierto.`
                : "Todas las casetas con turno en curso están cubiertas."}
            </span>
          </div>
          {sinTurno.map(key => {
            const x = casetaSinAbrir(key)!;
            return (
              <button key={key} type="button" onClick={() => onOpenShift(x)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DC2626] bg-white px-4 font-semibold text-[#DC2626]">
                <ShiftStatusIcon status="sin_abrir" size={20} />
                {x.row.ubicacion} · {x.row.caseta}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-[#475569]">{live ? `Actualizado hoy a las ${now}` : "Día cerrado"}</span>
        {groups.map(([key, label, icon]) => {
          const n = recs.filter(x => x.day.status === key).length;
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
              <ShiftStatusIcon status={icon} size={20} />
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
        <div className="rounded-xl border border-dashed border-[#CBD5E1] p-7 text-center text-[#64748B]">Ningún turno coincide con ese filtro</div>
      ) : mode === "cal" ? (
        <div className="flex flex-col gap-[22px]">
          {groupShifts(shown.map(x => x.row)).map(g => (
            <section key={g.ubicacion}>
              <h3 className="mb-2.5 mt-0 flex items-baseline gap-2 text-base font-bold text-[#0F172A]">
                {g.ubicacion}
                <span className="text-xs font-normal text-[#64748B]">{g.casetas.length} {g.casetas.length === 1 ? "caseta" : "casetas"}</span>
              </h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
                {g.casetas.map(c => {
                  const key = `${g.ubicacion}|${c.caseta}`;
                  const enCurso = casetaEnCurso(key);
                  const sinAbrir = !!casetaSinAbrir(key);
                  return (
                    <div key={c.caseta} className={`flex flex-col gap-2 rounded-xl border bg-white p-3.5 ${live && !enCurso && sinAbrir ? "border-[#DC2626]" : "border-[#E2E8F0]"}`}>
                      <h4 className="m-0 flex items-start justify-between gap-2 font-bold text-[#0F172A]">
                        <span>{c.caseta}</span>
                        {live && (
                          <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${enCurso ? "bg-[#CCFBF1] text-[#0F766E]" : sinAbrir ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#F1F5F9] text-[#475569]"}`}>
                            {enCurso ? "Turno abierto" : sinAbrir ? "Sin turno abierto" : "Sin turno ahora"}
                          </span>
                        )}
                      </h4>
                      {c.rows.map(row => {
                        const day = row.dias.find(d => d.fecha === fecha)!;
                        return (
                          <button
                            key={turnoLabel(row)}
                            type="button"
                            onClick={() => onOpenShift({ row, day })}
                            aria-label={`${c.caseta}, ${turnoLabel(row)}: ${getShiftConfig(day.status).label}`}
                            className="flex items-center gap-3 rounded-lg border border-transparent p-1.5 text-left hover:border-[#E2E8F0] hover:bg-[#F8FAFC]"
                          >
                            <ShiftStatusIcon status={day.status} size={30} />
                            <span className="flex min-w-0 flex-col">
                              <b className="text-[13px] text-[#0F172A]">{turnoLabel(row)}</b>
                              <span className="truncate text-xs text-[#475569]">{turnoText(row, day)}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["OPCIONES", "UBICACIÓN", "CASETA", "TURNO", "ESTATUS", "INICIÓ TURNO", "HORA INICIO", "CERRÓ TURNO", "HORA CIERRE"].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
                <th className={`${th} text-right`}>HORAS</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ row, day }) => {
                const g = day.guardias[0];
                const config = getShiftConfig(day.status);
                const diff = minutosDiferencia(row, g);
                const automatica = g ? tipoCierre(g.fecha_inicio, g.fecha_cierre, siguienteInicio(row, g), g.cierre_automatico) : null;
                return (
                  <tr key={`${row.ubicacion}|${row.caseta}|${turnoLabel(row)}`} className="group">
                    <td className={td}>
                      <button type="button" aria-label="Ver detalle del turno" onClick={() => onOpenShift({ row, day })} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#475569] hover:bg-[#DBEAFE] hover:text-[#2F80ED]">
                        <EyeIcon />
                      </button>
                    </td>
                    <td className={td}>{row.ubicacion}</td>
                    <td className={`${td} font-bold text-[#0F172A]`}>{row.caseta}</td>
                    <td className={`${td} tabular-nums`}>{turnoLabel(row)}</td>
                    <td className={td}>
                      <span className="inline-flex items-center gap-1.5"><ShiftStatusIcon status={day.status} size={22} />{config.label}</span>
                    </td>
                    <td className={td}>{g?.nombre ?? "—"}</td>
                    <td className={`${td} font-bold tabular-nums`}>
                      {g ? g.fecha_inicio.substring(11, 16) : "—"}
                      {g && diff != null && diff > 0 && day.status === "tarde" && <span className="ml-1 text-xs font-normal text-[#92400E]">+{diff} min</span>}
                    </td>
                    <td className={td}>{g?.fecha_cierre ? g.nombre : "—"}</td>
                    <td className={`${td} tabular-nums`}>
                      {g?.fecha_cierre ? horaSalida({ fecha: day.fecha, dia: 0, status: day.status, fecha_cierre: g.fecha_cierre }) : day.status === "en_curso" ? "En turno" : "—"}
                      {automatica && <AutoCloseMark text={automatica.texto} label={automatica.label} />}
                    </td>
                    <td className={`${td} text-right tabular-nums ${automatica ? "font-bold text-[#92400E]" : ""}`} title={automatica?.texto}>{formatHoras(horasTrabajadas(g?.fecha_inicio, g?.fecha_cierre, day.status === "en_curso", clock)) ?? "—"}</td>
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
