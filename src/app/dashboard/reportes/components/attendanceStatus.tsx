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

type StatusConfig = { label: string; className: string; path: React.ReactNode };

export const attendanceStatusConfig: Record<AttendanceStatus, StatusConfig> = {
  presente: {
    label: "Asistencia",
    className: "bg-[#DCFCE7] text-[#166534]",
    path: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  },
  retardo: {
    label: "Retardo",
    className: "bg-[#FEF3C7] text-[#92400E]",
    path: (<><circle cx="12" cy="12" r="7" /><path d="M12 8.5V12l2.5 1.5" /></>),
  },
  falta: {
    label: "Falta",
    className: "bg-[#DC2626] text-white",
    path: <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />,
  },
  sin_salida: {
    label: "Sin salida",
    className: "bg-[#FFEDD5] text-[#9A3412]",
    path: <path d="M4 12h9M10 8.5l3.5 3.5-3.5 3.5M18 6v12" />,
  },
  en_turno: {
    label: "En turno",
    className: "bg-[#F0FDF4] text-[#15803D] border-[#15803D]",
    path: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  },
  por_llegar: {
    label: "Por llegar",
    className: "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]",
    path: <path d="M8 12h.01M12 12h.01M16 12h.01" />,
  },
  dia_libre: {
    label: "Descanso",
    className: "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]",
    path: <path d="M7 12h10" />,
  },
  vacaciones: {
    label: "Vacaciones",
    className: "bg-[#DBEAFE] text-[#1E40AF]",
    path: (<><circle cx="12" cy="12" r="3.5" /><path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.6 6.6l1.4 1.4M16 16l1.4 1.4M6.6 17.4 8 16M16 8l1.4-1.4" /></>),
  },
  incapacidad: {
    label: "Incapacidad",
    className: "bg-[#EDE9FE] text-[#5B21B6]",
    path: <path d="M12 6.5v11M6.5 12h11" />,
  },
  permiso: {
    label: "Permiso",
    className: "bg-[#FCE7F3] text-[#9D174D]",
    path: <path d="M8 4.5h6l3.5 3.5v11.5H8zM14 4.5V8h3.5" />,
  },
  home_office: {
    label: "Home office",
    className: "bg-[#CCFBF1] text-[#0F766E]",
    path: <path d="M4 11.5 12 5l8 6.5M6.5 10v8.5h11V10M10 18.5v-5h4v5" />,
  },
  trabajo_fuera: {
    label: "Trabajo fuera de oficina",
    className: "bg-[#E0F2FE] text-[#0369A1]",
    path: (<><path d="M12 20s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z" /><circle cx="12" cy="10" r="2.2" /></>),
  },
  sin_registro: {
    label: "Pendiente",
    className: "bg-transparent text-[#94A3B8] border-dashed border-[#CBD5E1]",
    path: null,
  },
};

export const getStatusConfig = (status?: string) =>
  attendanceStatusConfig[status as AttendanceStatus] || attendanceStatusConfig.sin_registro;

export const StatusIcon = ({ status, size = 26 }: { status?: string; size?: number }) => (
  <IconBox config={getStatusConfig(status)} size={size} />
);

const IconBox = ({ config, size }: { config: StatusConfig; size: number }) => {
  const svg = Math.round(size * 0.62);
  return (
    <span
      title={config.label}
      className={`inline-flex flex-none items-center justify-center rounded-[7px] border border-transparent ${config.className}`}
      style={{ width: size, height: size }}
    >
      <svg width={svg} height={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {config.path}
      </svg>
    </span>
  );
};

// Estatus de la leyenda (vista por empleados)
export const legendStatuses: AttendanceStatus[] = [
  "presente",
  "retardo",
  "sin_salida",
  "falta",
  "dia_libre",
  "vacaciones",
  "incapacidad",
  "permiso",
  "home_office",
  "trabajo_fuera",
];

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
};

export const buildResumen = (dias: { status: string }[]): AttendanceResumen => {
  const resumen: AttendanceResumen = { asistencias: 0, retardos: 0, faltas: 0, sin_salida: 0, vacaciones: 0, incapacidades: 0, permisos: 0, fuera_oficina: 0 };
  dias.forEach(d => {
    const key = statusToResumen[d.status as AttendanceStatus];
    if (key) resumen[key]++;
  });
  return resumen;
};

// Estatus de turnos por caseta (get_report, group_by=locations)
export type ShiftStatus = "a_tiempo" | "tarde" | "en_curso" | "sin_abrir" | "sin_cierre" | "por_abrir" | "descanso" | "pendiente";

export const shiftStatusConfig: Record<ShiftStatus, StatusConfig> = {
  a_tiempo: { label: "Abierto a tiempo", className: attendanceStatusConfig.presente.className, path: attendanceStatusConfig.presente.path },
  tarde: { label: "Abierto tarde", className: attendanceStatusConfig.retardo.className, path: attendanceStatusConfig.retardo.path },
  en_curso: {
    label: "En curso",
    className: "bg-[#CCFBF1] text-[#0F766E] border-[#0F766E]",
    path: (<><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="2.6" fill="currentColor" /></>),
  },
  sin_abrir: { label: "Sin abrir", className: attendanceStatusConfig.falta.className, path: attendanceStatusConfig.falta.path },
  sin_cierre: { label: "Sin cierre", className: attendanceStatusConfig.sin_salida.className, path: attendanceStatusConfig.sin_salida.path },
  por_abrir: { label: "Por abrir", className: attendanceStatusConfig.por_llegar.className, path: attendanceStatusConfig.por_llegar.path },
  descanso: { label: "Descanso", className: attendanceStatusConfig.dia_libre.className, path: attendanceStatusConfig.dia_libre.path },
  pendiente: { label: "Pendiente", className: attendanceStatusConfig.sin_registro.className, path: null },
};

export const getShiftConfig = (status?: string) =>
  shiftStatusConfig[status as ShiftStatus] || shiftStatusConfig.pendiente;

export const ShiftStatusIcon = ({ status, size = 26 }: { status?: string; size?: number }) => (
  <IconBox config={getShiftConfig(status)} size={size} />
);

export const shiftLegendStatuses: ShiftStatus[] = ["a_tiempo", "tarde", "en_curso", "sin_abrir", "sin_cierre", "por_abrir", "descanso"];
