import React from "react";

// Estatus que regresa asistencia_report.py (get_report, group_by=employees)
export type AttendanceStatus =
  | "presente"
  | "retardo"
  | "falta"
  | "sin_salida"
  | "en_turno"
  | "por_llegar"
  | "dia_libre"
  | "vacaciones"
  | "incapacidad"
  | "permiso"
  | "home_office"
  | "trabajo_fuera"
  | "sin_registro";

// chip: fondo + texto del chip y del cuadro de ícono; icon: color del trazo; bar: color sólido en gráficas
type StatusConfig = { label: string; chip: string; icon: string; bar: string; path: React.ReactNode };

// Un solo ícono por estatus en todo el reporte (íconos de lucide, trazo 2)
const P = {
  check: <path d="M20 6 9 17l-5-5" />,
  clock: (<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>),
  exit: <path d="M4 12h9M10 8.5l3.5 3.5-3.5 3.5M18 6v12" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  palm: <path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14" />,
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7ZM3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />,
  fileCheck: <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4M9 15l2 2 4-4" />,
  house: <path d="M4 11.5 12 5l8 6.5M6.5 10v8.5h11V10M10 18.5v-5h4v5" />,
  pin: (<><path d="M12 20s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z" /><circle cx="12" cy="10" r="2.2" /></>),
  calClock: (<><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5M16 2v4M8 2v4M3 10h5M17.5 17.5 16 16.3V14" /><circle cx="16" cy="16" r="6" /></>),
  dash: <path d="M9 12h6" />,
};

export const attendanceStatusConfig: Record<AttendanceStatus, StatusConfig> = {
  presente: { label: "Asistencia", chip: "bg-green-100 text-green-700", icon: "text-green-600", bar: "bg-green-600", path: P.check },
  en_turno: { label: "Asistencia", chip: "bg-green-100 text-green-700", icon: "text-green-600", bar: "bg-green-600", path: P.check },
  retardo: { label: "Retardo", chip: "bg-amber-100 text-amber-700", icon: "text-amber-700", bar: "bg-amber-600", path: P.clock },
  sin_salida: { label: "Sin salida", chip: "bg-orange-100 text-orange-700", icon: "text-orange-600", bar: "bg-orange-500", path: P.exit },
  falta: { label: "Falta", chip: "bg-red-100 text-red-700", icon: "text-red-600", bar: "bg-red-600", path: P.x },
  dia_libre: { label: "Descanso", chip: "bg-slate-100 text-slate-600", icon: "text-slate-500", bar: "bg-slate-400", path: P.moon },
  vacaciones: { label: "Vacaciones", chip: "bg-blue-100 text-blue-700", icon: "text-blue-600", bar: "bg-blue-500", path: P.palm },
  incapacidad: { label: "Incapacidad", chip: "bg-purple-100 text-purple-700", icon: "text-purple-700", bar: "bg-purple-600", path: P.heart },
  permiso: { label: "Permiso", chip: "bg-teal-100 text-teal-700", icon: "text-teal-700", bar: "bg-teal-600", path: P.fileCheck },
  home_office: { label: "Home office", chip: "bg-cyan-100 text-cyan-700", icon: "text-cyan-700", bar: "bg-cyan-600", path: P.house },
  trabajo_fuera: { label: "Trabajo fuera de oficina", chip: "bg-sky-100 text-sky-700", icon: "text-sky-700", bar: "bg-sky-600", path: P.pin },
  por_llegar: { label: "Por llegar", chip: "bg-slate-100 text-slate-600", icon: "text-slate-400", bar: "bg-slate-300", path: P.calClock },
  sin_registro: { label: "Pendiente", chip: "bg-transparent text-c10-meta", icon: "text-slate-300", bar: "bg-slate-200", path: P.dash },
};

export const getStatusConfig = (status?: string) =>
  attendanceStatusConfig[status as AttendanceStatus] || attendanceStatusConfig.sin_registro;

const svgOf = (config: StatusConfig, size: number) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {config.path}
  </svg>
);

// Cuadro de ícono (celdas del calendario, columnas de tabla)
const IconBox = ({ config, size }: { config: StatusConfig; size: number }) => (
  <span
    title={config.label}
    className={`inline-flex flex-none items-center justify-center rounded-md ${config.chip.split(" ")[0]} ${config.icon}`}
    style={{ width: size, height: size }}
  >
    {svgOf(config, Math.round(size * 0.58))}
  </span>
);

// Chip de dato: 22px, pill, ícono + texto 11/600
const Chip = ({ config, label }: { config: StatusConfig; label?: string }) => (
  <span className={`inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full px-[9px] text-[11px] font-semibold ${config.chip}`}>
    <span className={config.icon}>{svgOf(config, 12)}</span>
    {label ?? config.label}
  </span>
);

export const StatusIcon = ({ status, size = 26 }: { status?: string; size?: number }) => (
  <IconBox config={getStatusConfig(status)} size={size} />
);

export const StatusChip = ({ status, label }: { status?: string; label?: string }) => (
  <Chip config={getStatusConfig(status)} label={label} />
);

// Tipos de FORMATO_VACACIONES que llegan en tipo_dia_libre
export const tipoDiaLibreLabel: Record<string, string> = {
  vacaciones: "Vacaciones",
  enfermedad: "Enfermedad",
  accidente: "Accidente",
  días_personales: "Días personales",
  vuelta_personal: "Vuelta personal",
  home_office: "Home office",
  trabajo_fuera_de_oficina: "Trabajo fuera de oficina",
};

export type AttendanceResumen = {
  asistencias: number;
  retardos: number;
  faltas: number;
  sin_salida: number;
  vacaciones: number;
  incapacidades: number;
  permisos: number;
  fuera_oficina: number;
  descansos: number;
};

const statusToResumen: Partial<Record<AttendanceStatus, keyof AttendanceResumen>> = {
  presente: "asistencias",
  en_turno: "asistencias",
  retardo: "retardos",
  falta: "faltas",
  sin_salida: "sin_salida",
  vacaciones: "vacaciones",
  incapacidad: "incapacidades",
  permiso: "permisos",
  home_office: "fuera_oficina",
  trabajo_fuera: "fuera_oficina",
  dia_libre: "descansos",
};

export const buildResumen = (dias: { status: string }[]): AttendanceResumen => {
  const resumen: AttendanceResumen = { asistencias: 0, retardos: 0, faltas: 0, sin_salida: 0, vacaciones: 0, incapacidades: 0, permisos: 0, fuera_oficina: 0, descansos: 0 };
  dias.forEach(d => {
    const key = statusToResumen[d.status as AttendanceStatus];
    if (key) resumen[key]++;
  });
  return resumen;
};

// Filtros rápidos de empleados: mismo nombre que el estatus
export const EMPLOYEE_QUICK: { key: string; label: string; status: AttendanceStatus; match: string[] }[] = [
  { key: "presente", label: "Asistencia", status: "presente", match: ["presente", "en_turno"] },
  { key: "retardo", label: "Retardo", status: "retardo", match: ["retardo"] },
  { key: "falta", label: "Falta", status: "falta", match: ["falta"] },
  { key: "sin_salida", label: "Sin salida", status: "sin_salida", match: ["sin_salida"] },
  { key: "vacaciones", label: "Vacaciones", status: "vacaciones", match: ["vacaciones"] },
  { key: "incapacidad", label: "Incapacidad", status: "incapacidad", match: ["incapacidad"] },
  { key: "permiso", label: "Permiso", status: "permiso", match: ["permiso"] },
  { key: "home_office", label: "Home office", status: "home_office", match: ["home_office"] },
  { key: "trabajo_fuera", label: "Trabajo fuera de oficina", status: "trabajo_fuera", match: ["trabajo_fuera"] },
  { key: "dia_libre", label: "Descanso", status: "dia_libre", match: ["dia_libre"] },
  { key: "por_llegar", label: "Por llegar", status: "por_llegar", match: ["por_llegar"] },
];

// Estatus de turnos por caseta (get_report, group_by=locations)
export type ShiftStatus = "a_tiempo" | "tarde" | "en_curso" | "sin_abrir" | "sin_cierre" | "por_abrir" | "descanso" | "pendiente";

const A = attendanceStatusConfig;
export const shiftStatusConfig: Record<ShiftStatus, StatusConfig> = {
  a_tiempo: { ...A.presente, label: "Abierto a tiempo" },
  tarde: { ...A.retardo, label: "Abierto tarde" },
  en_curso: { ...A.presente, label: "En curso" },
  sin_abrir: { ...A.falta, label: "Sin abrir" },
  sin_cierre: { ...A.sin_salida, label: "Sin cierre" },
  por_abrir: { ...A.por_llegar, label: "Programado" },
  descanso: { ...A.dia_libre, label: "Descanso" },
  pendiente: { ...A.sin_registro, label: "Pendiente" },
};

export const getShiftConfig = (status?: string) =>
  shiftStatusConfig[status as ShiftStatus] || shiftStatusConfig.pendiente;

export const ShiftStatusIcon = ({ status, size = 26 }: { status?: string; size?: number }) => (
  <IconBox config={getShiftConfig(status)} size={size} />
);

export const ShiftStatusChip = ({ status, label }: { status?: string; label?: string }) => (
  <Chip config={getShiftConfig(status)} label={label} />
);

// Filtros rápidos de ubicaciones. "En curso" cuenta como abierto a tiempo o tarde según su entrada.
export const SHIFT_QUICK: { key: string; label: string; status: ShiftStatus }[] = [
  { key: "a_tiempo", label: "Abierto a tiempo", status: "a_tiempo" },
  { key: "tarde", label: "Abierto tarde", status: "tarde" },
  { key: "sin_abrir", label: "Sin abrir", status: "sin_abrir" },
  { key: "sin_cierre", label: "Sin cierre", status: "sin_cierre" },
  { key: "por_abrir", label: "Programado", status: "por_abrir" },
];
