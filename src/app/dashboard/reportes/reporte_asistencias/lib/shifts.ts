// Turnos por caseta que regresa get_report (group_by=locations)
export type ShiftGuard = {
  employee_id: number;
  nombre: string;
  status: string;
  fecha_inicio: string;
  fecha_cierre?: string | null;
  horas_trabajadas?: number | null;
  tolerancia_retardo?: number | null;
  cierre_automatico?: string | null;
};

export type ShiftDay = {
  fecha: string;
  status: string;
  guardias: ShiftGuard[];
};

export type ShiftRow = {
  ubicacion: string;
  caseta: string;
  horario: string;
  hora_entrada: string;
  hora_salida: string;
  dias: ShiftDay[];
  resumen: {
    programados: number;
    a_tiempo: number;
    tarde: number;
    sin_abrir: number;
    sin_cierre: number;
    en_curso: number;
  };
};

export type ShiftSelection = { row: ShiftRow; day: ShiftDay };

export const OPENED = ["a_tiempo", "tarde", "en_curso", "sin_cierre"];

const hhmm = (value?: string) => value?.substring(0, 5) ?? "";

export const turnoLabel = (row: ShiftRow) =>
  row.hora_entrada ? `${row.horario} ${hhmm(row.hora_entrada)}–${hhmm(row.hora_salida)}` : row.horario;

export const initials = (nombre: string) =>
  nombre.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

// Minutos entre la hora de entrada del horario y el inicio real del turno
export const minutosDiferencia = (row: ShiftRow, guard?: ShiftGuard) => {
  if (!guard?.fecha_inicio || !row.hora_entrada) return null;
  const [h, m] = row.hora_entrada.split(":").map(Number);
  const [gh, gm] = guard.fecha_inicio.substring(11, 16).split(":").map(Number);
  return gh * 60 + gm - (h * 60 + m);
};

export const diffText = (min: number | null) =>
  min == null ? "" : min < 0 ? `${-min} min antes` : min === 0 ? "en punto" : `${min} min tarde`;

export const turnoText = (row: ShiftRow, day: ShiftDay) => {
  const g = day.guardias[0];
  const hora = g?.fecha_inicio.substring(11, 16);
  switch (day.status) {
    case "a_tiempo":
      return `Abrió ${g.nombre} · ${hora}`;
    case "tarde":
      return `Abrió ${g.nombre} · ${hora} (${diffText(minutosDiferencia(row, g))})`;
    case "en_curso":
      return `Abrió ${g.nombre} · ${hora} · en turno`;
    case "sin_cierre":
      return `Abrió ${g.nombre} · ${hora} · nadie lo cerró`;
    case "sin_abrir":
      return "Nadie abrió el turno";
    case "por_abrir":
      return `Abre a las ${hhmm(row.hora_entrada)}`;
    case "descanso":
      return "Día no laboral";
    default:
      return "Pendiente";
  }
};

export type ShiftGroup = { ubicacion: string; casetas: { caseta: string; rows: ShiftRow[] }[] };

export const groupShifts = (rows: ShiftRow[]): ShiftGroup[] => {
  const groups: ShiftGroup[] = [];
  rows.forEach(row => {
    let g = groups.find(x => x.ubicacion === row.ubicacion);
    if (!g) groups.push((g = { ubicacion: row.ubicacion, casetas: [] }));
    let c = g.casetas.find(x => x.caseta === row.caseta);
    if (!c) g.casetas.push((c = { caseta: row.caseta, rows: [] }));
    c.rows.push(row);
  });
  return groups;
};

export const filterShifts = (rows: ShiftRow[], search: string) => {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(row => {
    const guards = row.dias.flatMap(d => d.guardias.map(g => g.nombre)).join(" ");
    return `${row.ubicacion} ${row.caseta} ${row.horario} ${guards}`.toLowerCase().includes(q);
  });
};

// Siguiente check-in del mismo guardia en este turno (para detectar cierres automáticos)
export const siguienteInicio = (row: ShiftRow, guard: ShiftGuard) => {
  const fecha = guard.fecha_cierre?.substring(0, 10);
  if (!fecha) return null;
  return row.dias.find(d => d.fecha === fecha)?.guardias.find(g => g.employee_id === guard.employee_id)?.fecha_inicio ?? null;
};
